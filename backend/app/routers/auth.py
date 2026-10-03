"""
Authentication endpoints.

POST /api/auth/register  - create an account, return an access token (auto-login)
POST /api/auth/login     - verify credentials, return an access token
POST /api/auth/logout    - revoke the current session's token
GET  /api/auth/me        - return the current user
"""
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.security import create_access_token, decode_access_token, hash_password, verify_password
from app.config import settings
from app.database import get_db
from app.models.models import Session as SessionModel
from app.models.models import User
from app.schemas.auth_schemas import LoginRequest, MessageResponse, RegisterRequest, TokenResponse
from app.schemas.user_schemas import UserOut
from app.utils.rate_limit import rate_limit

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# "Remember me" issues a token that lives much longer than the default session.
_REMEMBER_ME_MINUTES = 60 * 24 * 30  # 30 days


def _issue_token(db: Session, user: User, request: Request, expires_minutes: int) -> TokenResponse:
    token, jti, expires_at = create_access_token(user.id, expires_minutes=expires_minutes)
    db.add(
        SessionModel(
            user_id=user.id,
            jti=jti,
            user_agent=(request.headers.get("user-agent") or "unknown")[:255],
            expires_at=expires_at,
        )
    )
    db.commit()
    return TokenResponse(access_token=token, expires_at=expires_at, user=UserOut.model_validate(user))


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    request: Request,
    db: Session = Depends(get_db),
    _rl=Depends(rate_limit(max_requests=10, window_seconds=60)),
):
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists.")

    user = User(
        name=payload.name.strip(),
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        phone=payload.phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return _issue_token(db, user, request, settings.ACCESS_TOKEN_EXPIRE_MINUTES)


@router.post("/login", response_model=TokenResponse)
def login(
    payload: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
    _rl=Depends(rate_limit(max_requests=10, window_seconds=60)),
):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    # Deliberately identical error for "no such user" and "wrong password" —
    # never reveal which part of the credentials was wrong.
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password.")

    minutes = _REMEMBER_ME_MINUTES if payload.remember_me else settings.ACCESS_TOKEN_EXPIRE_MINUTES
    return _issue_token(db, user, request, minutes)


@router.post("/logout", response_model=MessageResponse)
def logout(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    auth_header = request.headers.get("authorization", "")
    token = auth_header.removeprefix("Bearer ").strip()
    try:
        jti = decode_access_token(token).get("jti")
        db.query(SessionModel).filter(SessionModel.jti == jti).update({"revoked": True})
        db.commit()
    except Exception:
        pass  # token already invalid/expired — logging out is a no-op, not an error
    return MessageResponse(message="Logged out successfully.")


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
