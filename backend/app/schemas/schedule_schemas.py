"""Pydantic schemas for the standalone /api/schedules endpoints."""
from datetime import datetime, time
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ScheduleCreate(BaseModel):
    medication_id: int
    time: time
    days_of_week: str = "ALL"


class ScheduleUpdate(BaseModel):
    time: Optional[time] = None
    days_of_week: Optional[str] = None


class ScheduleOut(BaseModel):
    id: int
    medication_id: int
    time: time
    days_of_week: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
