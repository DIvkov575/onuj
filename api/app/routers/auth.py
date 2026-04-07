import time
from collections import defaultdict
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.db import get_db
from app.models import User, Workspace, MagicLinkToken
from app.services.auth import generate_magic_token, hash_token, create_token

router = APIRouter(prefix="/auth", tags=["auth"])

TOKEN_TTL_MINUTES = 15

# ── Simple in-memory rate limiter ─────────────────────────────────────────────
# Per-email: max 5 requests per 10 minutes
# Per-IP:    max 20 requests per 10 minutes
_email_times: dict[str, list[float]] = defaultdict(list)
_ip_times:    dict[str, list[float]] = defaultdict(list)
_RL_WINDOW   = 600   # 10 minutes in seconds
_EMAIL_LIMIT = 5
_IP_LIMIT    = 20


def _check_rate_limit(email: str, ip: str):
    now = time.time()
    cutoff = now - _RL_WINDOW

    _email_times[email] = [t for t in _email_times[email] if t > cutoff]
    _ip_times[ip]       = [t for t in _ip_times[ip]       if t > cutoff]

    # Prune empty entries to prevent unbounded dict growth
    if not _email_times[email]:
        del _email_times[email]
    if not _ip_times[ip]:
        del _ip_times[ip]

    email_count = len(_email_times.get(email, []))
    ip_count    = len(_ip_times.get(ip, []))

    if email_count >= _EMAIL_LIMIT:
        raise HTTPException(status_code=429, detail="Too many requests for this email. Try again in 10 minutes.")
    if ip_count >= _IP_LIMIT:
        raise HTTPException(status_code=429, detail="Too many requests. Try again in 10 minutes.")

    _email_times[email].append(now)
    _ip_times[ip].append(now)


# ── Schemas ───────────────────────────────────────────────────────────────────

class MagicLinkRequest(BaseModel):
    email: EmailStr


class MagicLinkResponse(BaseModel):
    token: str        # raw token — caller sends this in the email link
    is_new_user: bool


class VerifyRequest(BaseModel):
    token: str


class VerifyResponse(BaseModel):
    jwt: str
    user_id: str
    workspace_id: str
    workspace_name: str
    is_new_user: bool


class MeResponse(BaseModel):
    user_id: str
    workspace_id: str
    workspace_name: str
    email: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/magic-link", response_model=MagicLinkResponse)
async def request_magic_link(
    body: MagicLinkRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    ip = request.client.host if request.client else "unknown"
    email = body.email.lower().strip()
    _check_rate_limit(email, ip)

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    is_new_user = user is None

    # Invalidate all previous unused tokens for this email
    await db.execute(
        update(MagicLinkToken)
        .where(
            MagicLinkToken.email == email,
            MagicLinkToken.used_at.is_(None),
        )
        .values(used_at=datetime.now(timezone.utc))
    )

    raw_token, token_hash = generate_magic_token()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_TTL_MINUTES)
    db.add(MagicLinkToken(email=email, token_hash=token_hash, expires_at=expires_at))
    await db.commit()

    return MagicLinkResponse(token=raw_token, is_new_user=is_new_user)


@router.post("/verify", response_model=VerifyResponse)
async def verify_magic_link(body: VerifyRequest, db: AsyncSession = Depends(get_db)):
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
    else:
        result = await db.execute(select(Workspace).where(Workspace.id == user.workspace_id))
        workspace = result.scalar_one()

    await db.commit()
    await db.refresh(user)

    jwt_token = create_token(str(user.id), str(user.workspace_id))
    return VerifyResponse(
        jwt=jwt_token,
        user_id=str(user.id),
        workspace_id=str(user.workspace_id),
        workspace_name=workspace.name,
        is_new_user=is_new_user,
    )


@router.get("/me", response_model=MeResponse)
async def me(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
    db: AsyncSession = Depends(get_db),
):
    from app.services.auth import decode_token
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    result = await db.execute(
        select(User, Workspace)
        .join(Workspace, User.workspace_id == Workspace.id)
        .where(User.id == payload["sub"])
    )
    row = result.one_or_none()
    if not row:
        raise HTTPException(status_code=401, detail="User not found")

    user, workspace = row
    return MeResponse(
        user_id=str(user.id),
        workspace_id=str(user.workspace_id),
        workspace_name=workspace.name,
        email=user.email,
    )
