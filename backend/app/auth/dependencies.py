"""FastAPI dependencies for authentication & authorization."""
from datetime import datetime

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session as OrmSession

from app.auth.security import decode_access_token
from app.database import get_db
from app.models.models import Session as SessionModel
from app.models.models import User

bearer_scheme = HTTPBearer(auto_error=False)

_CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials. Please log in again.",
    headers={"WWW-Authenticate": "Bearer"},
)

_SESSION_EXPIRED_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Your session has expired. Please log in again.",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: OrmSession = Depends(get_db),
) -> User:
    """Resolves the current user from the `Authorization: Bearer <token>` header.

    Also checks the `sessions` table so a token that was explicitly logged
    out (or force-revoked via "logout all sessions") is rejected even
    though the JWT signature itself is still technically valid.
    """
    if credentials is None:
        raise _CREDENTIALS_EXCEPTION

    try:
        payload = decode_access_token(credentials.credentials)
        user_id = int(payload.get("sub"))
        jti = payload.get("jti")
    except jwt.ExpiredSignatureError:
        raise _SESSION_EXPIRED_EXCEPTION
    except (jwt.PyJWTError, TypeError, ValueError):
        raise _CREDENTIALS_EXCEPTION

    session = db.query(SessionModel).filter(SessionModel.jti == jti).first()
    if session is None or session.revoked:
        raise _SESSION_EXPIRED_EXCEPTION
    if session.expires_at < datetime.utcnow():
        raise _SESSION_EXPIRED_EXCEPTION

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise _CREDENTIALS_EXCEPTION
    return user
