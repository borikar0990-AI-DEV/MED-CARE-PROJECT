"""Pydantic schemas for dashboard summary + statistics endpoints."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from app.models.models import LogStatus


class TodayItem(BaseModel):
    log_id: int
    medication_id: int
    medication_name: str
    medication_type: str
    dosage: str
    quantity: Optional[int] = None
    instructions: str
    scheduled_time: datetime
    status: LogStatus


class DashboardSummary(BaseModel):
    today_total: int
    taken_count: int
    missed_count: int
    upcoming_count: int
    skipped_count: int
    next_medication: Optional[TodayItem] = None
    today_timeline: List[TodayItem]
    low_stock: List[str] = []  # medication names running low on quantity


class WeeklyActivityPoint(BaseModel):
    date: str  # ISO date, e.g. "2026-09-15"
    day_label: str  # e.g. "Mon"
    taken: int
    skipped: int
    missed: int


class StatusBreakdown(BaseModel):
    taken: int
    skipped: int
    missed: int
    pending: int


class StatisticsOut(BaseModel):
    weekly_activity: List[WeeklyActivityPoint]
    status_breakdown: StatusBreakdown
    adherence_rate: float  # percentage, 0-100
    total_logs: int
