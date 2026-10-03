"""
User profile endpoints.

GET  /api/users/profile              - current user's profile
PUT  /api/users/profile               - update profile fields / notification prefs
PUT  /api/users/change-password       - change password (requires current password)
POST /api/users/profile/photo         - upload a new profile photo
POST /api/users/logout-all            - revoke every active session for this user
"""
import base64

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.security import hash_password, verify_password
from app.config import settings
from app.database import get_db
from app.models.models import Session as SessionModel
from app.models.models import User
from app.schemas.auth_schemas import MessageResponse
from app.schemas.user_schemas import ChangePasswordRequest, UserOut, UserProfileUpdate

router = APIRouter(prefix="/api/users", tags=["Users"])

_ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


@router.get("/profile", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/profile", response_model=UserOut)
def update_profile(
    payload: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/change-password", response_model=MessageResponse)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect.")

    current_user.password_hash = hash_password(payload.new_password)
    db.commit()
    return MessageResponse(message="Password updated successfully.")


@router.post("/profile/photo", response_model=UserOut)
async def upload_profile_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in _ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload a JPEG, PNG, WEBP, or GIF image.",
        )

    contents = await file.read()
    if len(contents) > settings.MAX_PROFILE_PHOTO_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image is too large (max {settings.MAX_PROFILE_PHOTO_BYTES // (1024 * 1024)} MB).",
        )

    # Stored as a data URL directly on the user row — avoids standing up
    # object storage / a static file server for a single small avatar,
    # which keeps the demo's moving parts to a minimum.
    encoded = base64.b64encode(contents).decode("ascii")
    current_user.profile_photo = f"data:{file.content_type};base64,{encoded}"
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/logout-all", response_model=MessageResponse)
def logout_all_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated = (
        db.query(SessionModel)
        .filter(SessionModel.user_id == current_user.id, SessionModel.revoked.is_(False))
        .update({"revoked": True}, synchronize_session=False)
    )
    db.commit()
    return MessageResponse(message=f"Logged out of {updated} active session(s).")
