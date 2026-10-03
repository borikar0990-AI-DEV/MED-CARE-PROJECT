"""
Notification center endpoints.

GET    /api/notifications            - list (optionally unread only)
PUT    /api/notifications/{id}/read  - mark one as read/unread
PUT    /api/notifications/read-all   - mark everything as read
DELETE /api/notifications/{id}       - remove a notification
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.models import Notification, User
from app.schemas.auth_schemas import MessageResponse
from app.schemas.notification_schemas import NotificationOut
from app.services import notification_service

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


def _get_owned(db: Session, notification_id: int, user_id: int) -> Notification:
    notification = (
        db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == user_id).first()
    )
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")
    return notification


@router.get("", response_model=List[NotificationOut])
def list_notifications(
    unread_only: bool = Query(default=False),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return notification_service.list_notifications(db, current_user.id, unread_only=unread_only, limit=limit)


@router.put("/read-all", response_model=MessageResponse)
def mark_all_read(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    updated = notification_service.mark_all_read(db, current_user.id)
    return MessageResponse(message=f"Marked {updated} notification(s) as read.")


@router.put("/{notification_id}/read", response_model=NotificationOut)
def mark_read(notification_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notification = _get_owned(db, notification_id, current_user.id)
    return notification_service.mark_read(db, notification, is_read=True)


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(notification_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notification = _get_owned(db, notification_id, current_user.id)
    notification_service.delete_notification(db, notification)
