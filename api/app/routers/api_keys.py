from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db import get_db
from app.models import ApiKey
from app.services.auth import generate_api_key, decode_token
from app.middleware.workspace import get_current_workspace_id

import uuid

router = APIRouter(prefix="/api-keys", tags=["api-keys"])


class CreateKeyRequest(BaseModel):
    name: str


class ApiKeyPublic(BaseModel):
    id: str
    name: str
    key_prefix: str
    last_used_at: datetime | None
    created_at: datetime
    revoked_at: datetime | None


class CreateKeyResponse(BaseModel):
    id: str
    name: str
    key_prefix: str
    raw_key: str  # shown exactly once
    created_at: datetime


@router.get("", response_model=list[ApiKeyPublic])
async def list_keys(
    workspace_id: str = Depends(get_current_workspace_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ApiKey)
        .where(ApiKey.workspace_id == workspace_id)
        .order_by(ApiKey.created_at.desc())
    )
    keys = result.scalars().all()
    return [
        ApiKeyPublic(
            id=str(k.id),
            name=k.name,
            key_prefix=k.key_prefix,
            last_used_at=k.last_used_at,
            created_at=k.created_at,
            revoked_at=k.revoked_at,
        )
        for k in keys
    ]


@router.post("", response_model=CreateKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_key(
    body: CreateKeyRequest,
    workspace_id: str = Depends(get_current_workspace_id),
    db: AsyncSession = Depends(get_db),
):
    raw_key, key_hash, key_prefix = generate_api_key()
    key = ApiKey(
        workspace_id=workspace_id,
        name=body.name,
        key_hash=key_hash,
        key_prefix=key_prefix,
    )
    db.add(key)
    await db.commit()
    await db.refresh(key)

    return CreateKeyResponse(
        id=str(key.id),
        name=key.name,
        key_prefix=key.key_prefix,
        raw_key=raw_key,
        created_at=key.created_at,
    )


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_key(
    key_id: uuid.UUID,   # FastAPI validates UUID format; returns 422 on bad input
    workspace_id: str = Depends(get_current_workspace_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ApiKey).where(ApiKey.id == key_id, ApiKey.workspace_id == workspace_id)
    )
    key = result.scalar_one_or_none()
    if not key:
        raise HTTPException(status_code=404, detail="Key not found")
    if key.revoked_at:
        raise HTTPException(status_code=400, detail="Key already revoked")

    key.revoked_at = datetime.now(timezone.utc)
    await db.commit()
