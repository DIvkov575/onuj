"""
On-demand conversation processing: embed + gap-score.

Called as a FastAPI BackgroundTask immediately after ingest so conversations
are ready for the dashboard without waiting for the hourly worker cron.
Clustering (UMAP + HDBSCAN) is still handled by the worker — it's too
expensive to run per-ingest and requires a minimum corpus size anyway.
"""

import asyncio
import logging
import re
import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import text

from app.config import settings

log = logging.getLogger(__name__)

_engine = create_async_engine(settings.database_url, echo=False, pool_size=5, max_overflow=2)
_SessionLocal = async_sessionmaker(_engine, expire_on_commit=False, class_=AsyncSession)

# Per-workspace lock — prevents two background tasks from embedding the same
# conversations simultaneously when multiple ingest calls arrive at once.
_workspace_locks: dict[uuid.UUID, asyncio.Lock] = {}
_locks_mutex = asyncio.Lock()


async def _get_workspace_lock(workspace_id: uuid.UUID) -> asyncio.Lock:
    async with _locks_mutex:
        if workspace_id not in _workspace_locks:
            _workspace_locks[workspace_id] = asyncio.Lock()
        return _workspace_locks[workspace_id]


# ── Gap detection (mirrors worker/gap.py) ────────────────────────────────────

_FALLBACK_PATTERNS = [
    r"i (don't|do not|can't|cannot) (help|answer|provide|access|assist with)",
    r"(outside|beyond) my (knowledge|scope|capabilities|training)",
    r"please (contact|reach out to|check with|consult) (support|us|our team|a human|an agent)",
    r"i('m| am) (not sure|uncertain|unable|afraid i can't|sorry,? (but )?i can't)",
    r"(i'd|i would) (recommend|suggest) (reaching out|contacting|speaking with|checking)",
    r"(my|based on my) (knowledge|training|information) (doesn't|does not|is limited|doesn't cover)",
    r"i don't have (access to|information (about|on)|that|those details)",
    r"(unfortunately|regrettably).{0,40}(can't|cannot|unable|don't|do not)",
    r"that('s| is) (outside|beyond|not something) (my|what i)",
    r"i('m| am) not (able|equipped|trained) to",
]
_compiled = [re.compile(p, re.IGNORECASE) for p in _FALLBACK_PATTERNS]


def _score_gap(turns: list[dict]) -> bool:
    for turn in turns:
        if turn.get("role") != "assistant":
            continue
        for pattern in _compiled:
            if pattern.search(turn.get("content", "")):
                return True
    return False


# ── Embedding ─────────────────────────────────────────────────────────────────

async def _embed_texts(texts: list[str]) -> list[list[float]]:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    results = []
    for i in range(0, len(texts), 512):
        chunk = texts[i : i + 512]
        resp = await client.embeddings.create(model="text-embedding-3-small", input=chunk)
        results.extend([r.embedding for r in resp.data])
    return results


# ── Main entry point ─────────────────────────────────────────────────────────

async def process_workspace_conversations(workspace_id: uuid.UUID) -> None:
    """
    Embed + gap-score all unprocessed conversations for one workspace.
    Runs in a background task — never raises (logs errors instead).
    Skips embedding if OPENAI_API_KEY is not configured (gap scoring still runs).
    """
    lock = await _get_workspace_lock(workspace_id)
    if lock.locked():
        # Another task is already processing this workspace — skip.
        log.debug("[processing] workspace=%s — already running, skipping", workspace_id)
        return

    async with lock:
        try:
            async with _SessionLocal() as db:
                result = await db.execute(
                    text("""
                        SELECT id, turns, first_msg
                        FROM conversations
                        WHERE workspace_id = :wid
                          AND processed_at IS NULL
                          AND first_msg IS NOT NULL
                        ORDER BY created_at ASC
                        LIMIT 500
                    """),
                    {"wid": workspace_id},
                )
                rows = result.fetchall()

                if not rows:
                    return

                log.info("[processing] workspace=%s — processing %d conversations", workspace_id, len(rows))

                # Embed only if OpenAI is configured
                embeddings: list[list[float] | None] = [None] * len(rows)
                if settings.openai_api_key:
                    try:
                        texts = [row.first_msg for row in rows]
                        embeddings = await _embed_texts(texts)  # type: ignore[assignment]
                    except Exception:
                        log.exception("[processing] workspace=%s — embedding failed, continuing without", workspace_id)

                now = datetime.now(timezone.utc)
                for row, embedding in zip(rows, embeddings):
                    gap_flagged = _score_gap(row.turns)
                    await db.execute(
                        text("""
                            UPDATE conversations
                            SET embedding    = COALESCE(:embedding, embedding),
                                gap_flagged  = :gap_flagged,
                                processed_at = :now
                            WHERE id = :id
                        """),
                        {
                            "embedding": embedding,
                            "gap_flagged": gap_flagged,
                            "now": now,
                            "id": row.id,
                        },
                    )

                await db.commit()
                log.info("[processing] workspace=%s — done (%d conversations)", workspace_id, len(rows))

        except Exception:
            log.exception("[processing] workspace=%s — unhandled error", workspace_id)
