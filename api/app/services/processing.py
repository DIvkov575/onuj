"""
On-demand conversation processing: embed + gap-score.

Called as a FastAPI BackgroundTask immediately after ingest so conversations
are ready for the dashboard without waiting for the hourly worker cron.
Clustering (UMAP + HDBSCAN) is still handled by the worker — it's too
expensive to run per-ingest and requires a minimum corpus size anyway.
"""

import logging
import re
import uuid
from datetime import datetime, timezone

from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import text

from app.config import settings

log = logging.getLogger(__name__)

# Shared OpenAI client — created once at import time
_openai = AsyncOpenAI(api_key=settings.openai_api_key)

# Separate engine for background tasks so they don't share the request's
# connection pool / session lifecycle
_engine = create_async_engine(settings.database_url, echo=False, pool_size=5, max_overflow=2)
_SessionLocal = async_sessionmaker(_engine, expire_on_commit=False, class_=AsyncSession)


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
    results = []
    for i in range(0, len(texts), 512):
        chunk = texts[i : i + 512]
        resp = await _openai.embeddings.create(model="text-embedding-3-small", input=chunk)
        results.extend([r.embedding for r in resp.data])
    return results


# ── Main entry point ─────────────────────────────────────────────────────────

async def process_workspace_conversations(workspace_id: uuid.UUID) -> None:
    """
    Embed + gap-score all unprocessed conversations for one workspace.
    Runs in a background task — never raises (logs errors instead).
    """
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

            log.info("[processing] workspace=%s — embedding %d conversations", workspace_id, len(rows))

            texts = [row.first_msg for row in rows]
            embeddings = await _embed_texts(texts)

            now = datetime.now(timezone.utc)
            for row, embedding in zip(rows, embeddings):
                gap_flagged = _score_gap(row.turns)
                await db.execute(
                    text("""
                        UPDATE conversations
                        SET embedding    = :embedding,
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
