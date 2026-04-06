from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db import get_db
from app.models import Workspace
from app.middleware.workspace import get_current_workspace_id

router = APIRouter(prefix="/workspace", tags=["workspace"])


class WorkspacePatch(BaseModel):
    name: str


class WorkspaceOut(BaseModel):
    id: str
    name: str
    plan: str
    conv_count_month: int


@router.get("", response_model=WorkspaceOut)
async def get_workspace(
    workspace_id: str = Depends(get_current_workspace_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return WorkspaceOut(id=str(ws.id), name=ws.name, plan=ws.plan, conv_count_month=ws.conv_count_month)


@router.patch("", response_model=WorkspaceOut)
async def patch_workspace(
    body: WorkspacePatch,
    workspace_id: str = Depends(get_current_workspace_id),
    db: AsyncSession = Depends(get_db),
):
    name = body.name.strip()
    if not name or len(name) > 255:
        raise HTTPException(status_code=422, detail="Name must be 1–255 characters")

    result = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    ws.name = name
    await db.commit()
    return WorkspaceOut(id=str(ws.id), name=ws.name, plan=ws.plan, conv_count_month=ws.conv_count_month)
