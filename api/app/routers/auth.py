from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db import get_db
from app.models import User, Workspace, MagicLinkToken
from app.services.auth import generate_magic_token, hash_token, create_token, decode_token

router = APIRouter(prefix="/auth", tags=["auth"])

TOKEN_TTL_MINUTES = 15


class MagicLinkRequest(BaseModel):
    email: EmailStr


class MagicLinkResponse(BaseModel):
    token: str        # raw token — Next.js sends this in the email link
    is_new_user: bool


class VerifyRequest(BaseModel):
    token: str


class VerifyResponse(BaseModel):
    jwt: str
    user_id: str
    workspace_id: str
    is_new_user: bool


class MeResponse(BaseModel):
    user_id: str
    workspace_id: str
    email: str


@router.post("/magic-link", response_model=MagicLinkResponse)
async def request_magic_link(body: MagicLinkRequest, db: AsyncSession = Depends(get_db)):
    """Generate a one-time magic link token for the given email.
    The caller (Next.js) is responsible for sending the email and building the link URL.
    """
    email = body.email.lower().strip()

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    is_new_user = user is None

    raw_token, token_hash = generate_magic_token()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_TTL_MINUTES)

    record = MagicLinkToken(email=email, token_hash=token_hash, expires_at=expires_at)
    db.add(record)
    await db.commit()

    return MagicLinkResponse(token=raw_token, is_new_user=is_new_user)


@router.post("/verify", response_model=VerifyResponse)
async def verify_magic_link(body: VerifyRequest, db: AsyncSession = Depends(get_db)):
    """Validate a magic link token. Creates user + workspace on first login."""
    token_hash = hash_token(body.token)
    now = datetime.now(timezone.utc)

    result = await db.execute(
        select(MagicLinkToken).where(MagicLinkToken.token_hash == token_hash)
    )
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired link")
    if record.used_at is not None:
        raise HTTPException(status_code=400, detail="Link already used")
    if record.expires_at.replace(tzinfo=timezone.utc) < now:
        raise HTTPException(status_code=400, detail="Link expired")

    # Mark used immediately
    record.used_at = now

    email = record.email
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    is_new_user = user is None

    if is_new_user:
        workspace = Workspace(name=email.split("@")[0])
        db.add(workspace)
        await db.flush()

        user = User(workspace_id=workspace.id, email=email)
        db.add(user)
        await db.flush()

    await db.commit()
    await db.refresh(user)

    jwt_token = create_token(str(user.id), str(user.workspace_id))
    return VerifyResponse(
        jwt=jwt_token,
        user_id=str(user.id),
        workspace_id=str(user.workspace_id),
        is_new_user=is_new_user,
    )


@router.get("/me", response_model=MeResponse)
async def me(token: str, db: AsyncSession = Depends(get_db)):
    """Decode JWT and return current user info. Pass token as query param."""
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    result = await db.execute(select(User).where(User.id == payload["sub"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return MeResponse(user_id=str(user.id), workspace_id=str(user.workspace_id), email=user.email)
