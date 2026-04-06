import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from jose import jwt, JWTError

from app.config import settings


def generate_api_key() -> tuple[str, str, str]:
    """Returns (raw_key, key_hash, key_prefix). raw_key shown once — store only hash + prefix."""
    raw = "juno_sk_" + secrets.token_urlsafe(32)
    hashed = hashlib.sha256(raw.encode()).hexdigest()
    prefix = raw[:16]  # "juno_sk_XXXXXXXX"
    return raw, hashed, prefix


def hash_api_key(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def generate_magic_token() -> tuple[str, str]:
    """Returns (raw_token, token_hash). raw_token goes in the email link."""
    raw = secrets.token_urlsafe(32)
    hashed = hashlib.sha256(raw.encode()).hexdigest()
    return raw, hashed


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def create_token(user_id: str, workspace_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": user_id, "wid": workspace_id, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return {}
