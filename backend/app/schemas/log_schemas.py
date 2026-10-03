"""Pydantic schemas for medication logs (dose occurrences)."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.models import LogStatus


class LogCreate(BaseModel):
    medication_id: int
    scheduled_time: datetime
    status: LogStatus = LogStatus.PENDING
    notes: Optional[str] = None


class LogUpdate(BaseModel):
    status: LogStatus
    notes: Optional[str] = None


class LogOut(BaseModel):
    id: int
    medication_id: int
    medication_name: str
    medication_type: str
    dosage: str
    instructions: str
    schedule_id: Optional[int] = None
    user_id: int
    scheduled_time: datetime
    action_time: Optional[datetime] = None
    status: LogStatus
    notes: Optional[str] = None
    created_at: datetime
