"""
Password hashing and JWT helpers.

- Passwords are hashed with passlib's bcrypt scheme (adaptive cost,
  industry standard — never store or compare plain-text passwords).
- Access tokens are signed JWTs (HS256) carrying the user id (`sub`) and
  a unique token id (`jti`). The `jti` is also stored in the `sessions`
  table so a token can be revoked before it naturally expires — that's
  what makes "Logout" and "Logout from all sessions" actually work.
"""
import time
import uuid
from datetime import datetime
from typing import Optional, Tuple

import jwt
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    try:
        return pwd_context.verify(plain_password, password_hash)
    except Exception:
        # A malformed/legacy hash should never crash the request — it just fails auth.
        return False


def create_access_token(user_id: int, expires_minutes: Optional[int] = None) -> Tuple[str, str, datetime]:
    """Creates a signed JWT for `user_id`.

    Returns (token, jti, expires_at). The caller is expected to persist
    (jti, expires_at) in the `sessions` table.
    """
    minutes = expires_minutes if expires_minutes is not None else settings.ACCESS_TOKEN_EXPIRE_MINUTES
    now_epoch = int(time.time())
    exp_epoch = now_epoch + minutes * 60
    jti = uuid.uuid4().hex

    payload = {"sub": str(user_id), "jti": jti, "iat": now_epoch, "exp": exp_epoch}
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    expires_at = datetime.utcfromtimestamp(exp_epoch)
    return token, jti, expires_at


def decode_access_token(token: str) -> dict:
    """Decodes + validates a JWT. Raises jwt.PyJWTError (or a subclass,
    e.g. jwt.ExpiredSignatureError) if the token is invalid or expired."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
