"""Pydantic schemas for the notification feed."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.models import NotificationType


class NotificationOut(BaseModel):
    id: int
    medication_id: Optional[int] = None
    title: str
    message: str
    notification_type: NotificationType
    is_read: bool
    scheduled_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
