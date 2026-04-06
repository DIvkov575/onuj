from datetime import datetime, timezone
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.db import get_db
from app.models import Workspace, Conversation, ApiKey
from app.services.auth import hash_api_key
from app.services.processing import process_workspace_conversations
from app.config import settings

router = APIRouter(tags=["ingest"])


async def resolve_workspace(request: Request, db: AsyncSession) -> Workspace:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing API key")

    raw_key = auth.removeprefix("Bearer ").strip()
    key_hash = hash_api_key(raw_key)

    # Always hit the DB so revocation is respected immediately.
    # key_hash has a unique index so this is one indexed lookup.
    result = await db.execute(
        select(ApiKey, Workspace)
        .join(Workspace, ApiKey.workspace_id == Workspace.id)
        .where(ApiKey.key_hash == key_hash, ApiKey.revoked_at.is_(None))
    )
    row = result.one_or_none()
    if not row:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")

    api_key, workspace = row
    api_key.last_used_at = datetime.now(timezone.utc)  # committed with the ingest transaction
    return workspace


class Turn(BaseModel):
    role: str  # user | assistant | system
    content: str
    token_count: int | None = None


class ConversationEvent(BaseModel):
    external_id: str
    turns: list[Turn]
    started_at: datetime | None = None
    ended_at: datetime | None = None
    metadata: dict | None = None


class IngestRequest(BaseModel):
    conversations: list[ConversationEvent]


class IngestResponse(BaseModel):
    accepted: int
    skipped: int  # duplicates


def extract_first_msg(turns: list[Turn]) -> str | None:
    """Return first user message with > 10 tokens (rough: > 40 chars)."""
    for t in turns:
        if t.role == "user" and len(t.content.strip()) > 40:
            return t.content.strip()
    return None


def check_plan_limit(workspace: Workspace) -> bool:
    limit = settings.free_tier_monthly_limit if workspace.plan == "free" else float("inf")
    return workspace.conv_count_month < limit


@router.post("/ingest", response_model=IngestResponse)
async def ingest(
    body: IngestRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    workspace = await resolve_workspace(request, db)

    if not check_plan_limit(workspace):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Monthly conversation limit reached ({settings.free_tier_monthly_limit}). Upgrade your plan.",
        )

    accepted = 0
    skipped = 0

    for event in body.conversations:
        turns_data = [t.model_dump() for t in event.turns]
        first_msg = extract_first_msg(event.turns)

        stmt = (
            pg_insert(Conversation)
            .values(
                workspace_id=workspace.id,
                external_id=event.external_id,
                turns=turns_data,
                first_msg=first_msg,
                created_at=event.started_at or datetime.now(timezone.utc),
            )
            .on_conflict_do_update(
                index_elements=["workspace_id", "external_id"],
                set_={
                    "turns": turns_data,
                    "first_msg": first_msg,
                },
            )
        )
        result = await db.execute(stmt)
        if result.rowcount > 0:
            accepted += 1
        else:
            skipped += 1

    # Increment monthly counter
    workspace.conv_count_month = (workspace.conv_count_month or 0) + accepted
    await db.commit()

    # Kick off embedding + gap scoring in the background — response returns immediately
    if accepted > 0:
        background_tasks.add_task(process_workspace_conversations, workspace.id)

    return IngestResponse(accepted=accepted, skipped=skipped)


@router.post("/backfill", response_model=IngestResponse)
async def backfill(
    body: IngestRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Same as /ingest — separate endpoint for clarity in SDK."""
    return await ingest(body, request, background_tasks, db)


@router.get("/status")
async def status_check(request: Request, db: AsyncSession = Depends(get_db)):
    workspace = await resolve_workspace(request, db)

    result = await db.execute(
        select(func.max(Conversation.created_at)).where(Conversation.workspace_id == workspace.id)
    )
    last_received = result.scalar_one_or_none()

    count_result = await db.execute(
        select(func.count()).where(Conversation.workspace_id == workspace.id)
    )
    total = count_result.scalar_one()

    return {
        "total_conversations": total,
        "monthly_count": workspace.conv_count_month,
        "last_received_at": last_received.isoformat() if last_received else None,
        "plan": workspace.plan,
        "monthly_limit": settings.free_tier_monthly_limit if workspace.plan == "free" else None,
    }
