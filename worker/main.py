"""
Juno worker — catch-up cron + clustering.

Primary processing (embed + gap-score) is triggered on-demand by the API's
ingest endpoint via BackgroundTasks. This worker serves two purposes:

  1. Catch-up: re-process any conversations that slipped through (API restart,
     transient OpenAI error, etc.) — safe to run hourly.
  2. Clustering: UMAP + HDBSCAN is too expensive to run per-ingest, so it
     runs here on a schedule once enough new data has accumulated.

Usage:
    python main.py

Environment:
    DATABASE_URL — async postgres URL (postgresql+asyncpg://...)
    OPENAI_API_KEY
"""

import asyncio
import logging
import uuid
from datetime import datetime, timezone, timedelta

import numpy as np
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select, update, and_, func, text

from config import settings
from gap import score_gap
from cluster import run_clustering, label_cluster

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

engine = create_async_engine(settings.database_url, echo=False)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

openai = AsyncOpenAI(api_key=settings.openai_api_key)


# ── Embedding ─────────────────────────────────────────────────────────────────

async def embed_texts(texts: list[str]) -> list[list[float]]:
    """Batch embed up to 2048 texts. Splits into chunks if needed."""
    results = []
    chunk_size = 512
    for i in range(0, len(texts), chunk_size):
        chunk = texts[i : i + chunk_size]
        response = await openai.embeddings.create(model="text-embedding-3-small", input=chunk)
        results.extend([r.embedding for r in response.data])
    return results


# ── Processing ────────────────────────────────────────────────────────────────

async def process_conversations(db: AsyncSession):
    """Embed + gap-score all unprocessed conversations."""
    result = await db.execute(
        text("""
            SELECT id, turns, first_msg
            FROM conversations
            WHERE processed_at IS NULL
              AND first_msg IS NOT NULL
            ORDER BY created_at ASC
            LIMIT 500
        """)
    )
    rows = result.fetchall()

    if not rows:
        log.info("No unprocessed conversations")
        return

    log.info("Processing %d conversations", len(rows))

    # Batch embed
    texts = [row.first_msg for row in rows]
    embeddings = await embed_texts(texts)

    for row, embedding in zip(rows, embeddings):
        gap_flagged = score_gap(row.turns)
        await db.execute(
            text("""
                UPDATE conversations
                SET embedding = :embedding,
                    gap_flagged = :gap_flagged,
                    processed_at = :now
                WHERE id = :id
            """),
            {
                "embedding": embedding,
                "gap_flagged": gap_flagged,
                "now": datetime.now(timezone.utc),
                "id": row.id,
            },
        )

    await db.commit()
    log.info("Processed %d conversations", len(rows))


# ── Clustering ────────────────────────────────────────────────────────────────

async def cluster_workspace(db: AsyncSession, workspace_id: uuid.UUID, is_gap: bool = False):
    """Run HDBSCAN clustering for one workspace."""
    since = datetime.now(timezone.utc) - timedelta(days=30)

    base_query = """
        SELECT id, first_msg, embedding
        FROM conversations
        WHERE workspace_id = :wid
          AND processed_at IS NOT NULL
          AND embedding IS NOT NULL
          AND created_at >= :since
    """
    if is_gap:
        base_query += " AND gap_flagged = true"

    result = await db.execute(text(base_query), {"wid": workspace_id, "since": since})
    rows = result.fetchall()

    label_type = "gap" if is_gap else "intent"
    log.info("Workspace %s — clustering %d %s conversations", workspace_id, len(rows), label_type)

    if len(rows) < settings.min_conversations_to_cluster:
        log.info("Skipping — not enough data (%d < %d)", len(rows), settings.min_conversations_to_cluster)
        return

    conv_ids = [row.id for row in rows]
    first_msgs = [row.first_msg for row in rows]
    embeddings = np.array([row.embedding for row in rows], dtype=np.float32)

    labels = run_clustering(embeddings)

    unique_labels = set(labels)
    unique_labels.discard(-1)

    # Delete old clusters for this workspace + type, then recreate
    await db.execute(
        text("DELETE FROM clusters WHERE workspace_id = :wid AND is_gap = :is_gap"),
        {"wid": workspace_id, "is_gap": is_gap},
    )

    label_to_cluster_id: dict[int, uuid.UUID] = {}

    for cluster_label in unique_labels:
        indices = np.where(labels == cluster_label)[0]
        examples = [first_msgs[i] for i in indices[:8]]

        # Label with GPT-4o-mini
        try:
            cluster_name = await label_cluster(openai, examples)
        except Exception as e:
            log.warning("Failed to label cluster %d: %s", cluster_label, e)
            cluster_name = f"Cluster {cluster_label + 1}"

        cluster_id = uuid.uuid4()
        label_to_cluster_id[cluster_label] = cluster_id

        await db.execute(
            text("""
                INSERT INTO clusters (id, workspace_id, label, is_gap, count, created_at, updated_at)
                VALUES (:id, :wid, :label, :is_gap, :count, now(), now())
            """),
            {
                "id": cluster_id,
                "wid": workspace_id,
                "label": cluster_name,
                "is_gap": is_gap,
                "count": int(np.sum(labels == cluster_label)),
            },
        )

    # Assign cluster_id back to conversations
    for i, (conv_id, label) in enumerate(zip(conv_ids, labels)):
        cluster_id = label_to_cluster_id.get(int(label))
        await db.execute(
            text("UPDATE conversations SET cluster_id = :cid WHERE id = :id"),
            {"cid": cluster_id, "id": conv_id},
        )

    await db.commit()
    log.info("Clustering done for workspace %s (%s): %d clusters", workspace_id, label_type, len(unique_labels))


async def cluster_all_workspaces(db: AsyncSession):
    """Run clustering for every workspace that has enough processed conversations."""
    result = await db.execute(
        text("""
            SELECT DISTINCT workspace_id
            FROM conversations
            WHERE processed_at IS NOT NULL
              AND embedding IS NOT NULL
            GROUP BY workspace_id
            HAVING COUNT(*) >= :min
        """),
        {"min": settings.min_conversations_to_cluster},
    )
    workspace_ids = [row.workspace_id for row in result.fetchall()]
    log.info("Clustering %d workspaces", len(workspace_ids))

    for wid in workspace_ids:
        await cluster_workspace(db, wid, is_gap=False)
        await cluster_workspace(db, wid, is_gap=True)


# ── Entry point ───────────────────────────────────────────────────────────────

async def run():
    async with SessionLocal() as db:
        await process_conversations(db)
        await cluster_all_workspaces(db)
    log.info("Worker run complete")


if __name__ == "__main__":
    asyncio.run(run())
