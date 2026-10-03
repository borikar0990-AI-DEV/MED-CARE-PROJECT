"""
Notification creation + delivery.

In-app notifications (stored in `notifications`, shown in the bell icon
and the Notification Center page) are fully implemented. Email delivery
is architected behind `send_email_notification` but intentionally not
wired up to a real provider in this student-project build — see the
root README's "Future Scope" section for how to plug one in (SMTP,
SendGrid, SES, ...) without touching any other file.
"""
import logging
from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.models import Notification, NotificationType, User

logger = logging.getLogger("medicare.notifications")


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: NotificationType,
    medication_id: Optional[int] = None,
    scheduled_at: Optional[datetime] = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        medication_id=medication_id,
        title=title,
        message=message,
        notification_type=notification_type,
        scheduled_at=scheduled_at,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)

    user = db.query(User).filter(User.id == user_id).first()
    if user and user.notif_email_enabled:
        send_email_notification(user, title, message)

    return notification


def send_email_notification(user: User, title: str, message: str) -> bool:
    """Future-scope stub — see module docstring. Returns False (not sent)."""
    logger.info("[email-stub] Would email %s: '%s' - %s", user.email, title, message)
    return False


def list_notifications(db: Session, user_id: int, unread_only: bool = False, limit: int = 100) -> List[Notification]:
    query = db.query(Notification).filter(Notification.user_id == user_id)
    if unread_only:
        query = query.filter(Notification.is_read.is_(False))
    return query.order_by(Notification.created_at.desc()).limit(limit).all()


def mark_read(db: Session, notification: Notification, is_read: bool = True) -> Notification:
    notification.is_read = is_read
    db.commit()
    db.refresh(notification)
    return notification


def mark_all_read(db: Session, user_id: int) -> int:
    updated = (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.is_read.is_(False))
        .update({"is_read": True}, synchronize_session=False)
    )
    db.commit()
    return updated


def delete_notification(db: Session, notification: Notification) -> None:
    db.delete(notification)
    db.commit()
