from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db import get_db
from app.models import User, Workspace
from app.services.auth import hash_password, verify_password, generate_api_key, create_token

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    workspace_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    token: str
    workspace_id: str
    api_key: str | None = None  # only returned on register


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    raw_key, hashed_key, prefix = generate_api_key()

    workspace = Workspace(name=body.workspace_name, api_key_hash=hashed_key, api_key_prefix=prefix)
    db.add(workspace)
    await db.flush()  # get workspace.id

    user = User(workspace_id=workspace.id, email=body.email, password_hash=hash_password(body.password))
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_token(str(user.id), str(workspace.id))
    return AuthResponse(token=token, workspace_id=str(workspace.id), api_key=raw_key)


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(str(user.id), str(user.workspace_id))
    return AuthResponse(token=token, workspace_id=str(user.workspace_id))
