from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
import uuid

from app.db import get_db
from app.models import Conversation, Cluster, Workspace
from app.middleware.workspace import get_current_workspace
from app.config import settings

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


# ── Clusters ──────────────────────────────────────────────────────────────────

class ClusterOut(BaseModel):
    id: str
    label: str
    user_label: str | None
    count: int
    is_gap: bool
    hidden: bool
    updated_at: str


class ClustersResponse(BaseModel):
    clusters: list[ClusterOut]


@router.get("/clusters", response_model=ClustersResponse)
async def list_clusters(
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
    include_hidden: bool = False,
    gaps_only: bool = False,
):
    q = select(Cluster).where(Cluster.workspace_id == workspace.id)
    if not include_hidden:
        q = q.where(Cluster.hidden == False)
    if gaps_only:
        q = q.where(Cluster.is_gap == True)
    q = q.order_by(Cluster.count.desc())

    result = await db.execute(q)
    clusters = result.scalars().all()
    return ClustersResponse(clusters=[
        ClusterOut(
            id=str(c.id),
            label=c.label,
            user_label=c.user_label,
            count=c.count,
            is_gap=c.is_gap,
            hidden=c.hidden,
            updated_at=c.updated_at.isoformat(),
        )
        for c in clusters
    ])


class PatchCluster(BaseModel):
    user_label: str | None = None
    hidden: bool | None = None


@router.patch("/clusters/{cluster_id}")
async def patch_cluster(
    cluster_id: uuid.UUID,
    body: PatchCluster,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Cluster).where(and_(Cluster.id == cluster_id, Cluster.workspace_id == workspace.id))
    )
    cluster = result.scalar_one_or_none()
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")

    if body.user_label is not None:
        cluster.user_label = body.user_label
    if body.hidden is not None:
        cluster.hidden = body.hidden

    await db.commit()
    return {"ok": True}


# ── Conversations ─────────────────────────────────────────────────────────────

class ConversationOut(BaseModel):
    id: str
    external_id: str
    first_msg: str | None
    gap_flagged: bool
    cluster_id: str | None
    cluster_label: str | None
    turn_count: int
    created_at: str


class ConversationsResponse(BaseModel):
    conversations: list[ConversationOut]
    total: int


@router.get("/conversations", response_model=ConversationsResponse)
async def list_conversations(
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
    cluster_id: uuid.UUID | None = None,
    gap_flagged: bool = False,   # matches frontend param name
    q: str | None = Query(None, description="Search first_msg"),
    limit: int = Query(50, le=200),
    offset: int = 0,
):
    base = (
        select(Conversation, Cluster.user_label, Cluster.label)
        .outerjoin(Cluster, Conversation.cluster_id == Cluster.id)
        .where(Conversation.workspace_id == workspace.id)
    )
    if cluster_id:
        base = base.where(Conversation.cluster_id == cluster_id)
    if gap_flagged:
        base = base.where(Conversation.gap_flagged == True)
    if q:
        base = base.where(Conversation.first_msg.ilike(f"%{q}%"))

    count_result = await db.execute(select(func.count()).select_from(base.subquery()))
    total = count_result.scalar_one()

    result = await db.execute(base.order_by(Conversation.created_at.desc()).limit(limit).offset(offset))
    rows = result.all()

    return ConversationsResponse(
        total=total,
        conversations=[
            ConversationOut(
                id=str(row.Conversation.id),
                external_id=row.Conversation.external_id,
                first_msg=row.Conversation.first_msg,
                gap_flagged=row.Conversation.gap_flagged,
                cluster_id=str(row.Conversation.cluster_id) if row.Conversation.cluster_id else None,
                cluster_label=row.user_label or row.label,
                turn_count=len(row.Conversation.turns) if row.Conversation.turns else 0,
                created_at=row.Conversation.created_at.isoformat(),
            )
            for row in rows
        ],
    )


class ConversationDetail(BaseModel):
    id: str
    external_id: str
    turns: list[dict]
    gap_flagged: bool
    cluster_id: str | None
    cluster_label: str | None
    created_at: str


@router.get("/conversations/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(
    conversation_id: uuid.UUID,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation, Cluster.user_label, Cluster.label)
        .outerjoin(Cluster, Conversation.cluster_id == Cluster.id)
        .where(and_(Conversation.id == conversation_id, Conversation.workspace_id == workspace.id))
    )
    row = result.one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Conversation not found")

    c = row.Conversation
    return ConversationDetail(
        id=str(c.id),
        external_id=c.external_id,
        turns=c.turns,
        gap_flagged=c.gap_flagged,
        cluster_id=str(c.cluster_id) if c.cluster_id else None,
        cluster_label=row.user_label or row.label,
        created_at=c.created_at.isoformat(),
    )


# ── Overview ──────────────────────────────────────────────────────────────────

@router.get("/overview")
async def overview(
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    total_result = await db.execute(
        select(func.count()).where(Conversation.workspace_id == workspace.id)
    )
    total = total_result.scalar_one()

    gap_result = await db.execute(
        select(func.count()).where(
            and_(Conversation.workspace_id == workspace.id, Conversation.gap_flagged == True)
        )
    )
    gap_count = gap_result.scalar_one()

    cluster_result = await db.execute(
        select(func.count()).where(
            and_(Cluster.workspace_id == workspace.id, Cluster.hidden == False)
        )
    )
    cluster_count = cluster_result.scalar_one()

    last_result = await db.execute(
        select(func.max(Conversation.created_at)).where(Conversation.workspace_id == workspace.id)
    )
    last_received_at = last_result.scalar_one()

    return {
        "total_conversations": total,
        "monthly_count": workspace.conv_count_month,
        "monthly_limit": settings.free_tier_monthly_limit if workspace.plan == "free" else None,
        "plan": workspace.plan,
        "gap_rate": round(gap_count / total, 3) if total else 0,
        "cluster_count": cluster_count,
        "last_received_at": last_received_at.isoformat() if last_received_at else None,
    }
