"""Aggregation logic behind the dashboard summary and statistics charts."""
from datetime import date, datetime, time as dt_time, timedelta
from typing import Dict

from sqlalchemy.orm import Session, joinedload

from app.models.models import LogStatus, Medication, MedicationLog
from app.schemas.dashboard_schemas import (
    DashboardSummary,
    StatisticsOut,
    StatusBreakdown,
    TodayItem,
    WeeklyActivityPoint,
)
from app.utils.helpers import LOW_STOCK_THRESHOLD, combine

_DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def _to_today_item(log: MedicationLog) -> TodayItem:
    med = log.medication
    return TodayItem(
        log_id=log.id,
        medication_id=med.id,
        medication_name=med.name,
        medication_type=med.type.value,
        dosage=med.dosage,
        quantity=med.quantity,
        instructions=med.instructions.value,
        scheduled_time=log.scheduled_time,
        status=log.status,
    )


def get_summary(db: Session, user_id: int) -> DashboardSummary:
    today = date.today()
    start = combine(today, dt_time.min)
    end = start + timedelta(days=1)

    logs = (
        db.query(MedicationLog)
        .options(joinedload(MedicationLog.medication))
        .filter(
            MedicationLog.user_id == user_id,
            MedicationLog.scheduled_time >= start,
            MedicationLog.scheduled_time < end,
        )
        .order_by(MedicationLog.scheduled_time.asc())
        .all()
    )

    taken = [l for l in logs if l.status == LogStatus.TAKEN]
    missed = [l for l in logs if l.status == LogStatus.MISSED]
    skipped = [l for l in logs if l.status == LogStatus.SKIPPED]
    pending = [l for l in logs if l.status == LogStatus.PENDING]

    now = datetime.utcnow()
    upcoming_pending = [l for l in pending if l.scheduled_time >= now]
    next_log = upcoming_pending[0] if upcoming_pending else (pending[0] if pending else None)

    low_stock_meds = (
        db.query(Medication)
        .filter(
            Medication.user_id == user_id,
            Medication.is_active.is_(True),
            Medication.quantity.isnot(None),
            Medication.quantity <= LOW_STOCK_THRESHOLD,
        )
        .all()
    )

    return DashboardSummary(
        today_total=len(logs),
        taken_count=len(taken),
        missed_count=len(missed),
        upcoming_count=len(pending),
        skipped_count=len(skipped),
        next_medication=_to_today_item(next_log) if next_log else None,
        today_timeline=[_to_today_item(l) for l in logs],
        low_stock=[m.name for m in low_stock_meds],
    )


def get_statistics(db: Session, user_id: int, days: int = 7) -> StatisticsOut:
    today = date.today()
    window_start_date = today - timedelta(days=days - 1)
    start = combine(window_start_date, dt_time.min)
    end = combine(today, dt_time.min) + timedelta(days=1)

    logs = (
        db.query(MedicationLog)
        .filter(
            MedicationLog.user_id == user_id,
            MedicationLog.scheduled_time >= start,
            MedicationLog.scheduled_time < end,
        )
        .all()
    )

    per_day: Dict[date, Dict[str, int]] = {
        window_start_date + timedelta(days=i): {"taken": 0, "skipped": 0, "missed": 0} for i in range(days)
    }
    breakdown = {"taken": 0, "skipped": 0, "missed": 0, "pending": 0}

    for log in logs:
        d = log.scheduled_time.date()
        status_key = log.status.value
        breakdown[status_key] = breakdown.get(status_key, 0) + 1
        if d in per_day and status_key in ("taken", "skipped", "missed"):
            per_day[d][status_key] += 1

    weekly_activity = [
        WeeklyActivityPoint(
            date=d.isoformat(),
            day_label=_DAY_LABELS[d.weekday()],
            taken=counts["taken"],
            skipped=counts["skipped"],
            missed=counts["missed"],
        )
        for d, counts in sorted(per_day.items())
    ]

    completed = breakdown["taken"] + breakdown["skipped"] + breakdown["missed"]
    adherence_rate = round((breakdown["taken"] / completed) * 100, 1) if completed > 0 else 0.0

    return StatisticsOut(
        weekly_activity=weekly_activity,
        status_breakdown=StatusBreakdown(**breakdown),
        adherence_rate=adherence_rate,
        total_logs=len(logs),
    )
