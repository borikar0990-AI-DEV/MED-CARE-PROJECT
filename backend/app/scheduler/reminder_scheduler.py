"""
Background reminder engine.

Runs once every `REMINDER_CHECK_INTERVAL_SECONDS` (default 60s) via
APScheduler, inside the same process as the API. Each tick does three things:

1. GENERATE  - make sure every active medication has its pending
               MedicationLog rows for today and the next few days
               (idempotent — see services/medication_service.ensure_logs_for_date).
2. REMIND    - for any pending log whose scheduled time is now within
               `UPCOMING_NOTICE_MINUTES`, create a "reminder" notification
               (only once per log, tracked in-memory for this process's
               lifetime so restarting the server can at most re-notify,
               never silently drop a reminder).
3. SWEEP     - any pending log whose scheduled time is more than
               `MISSED_DOSE_GRACE_MINUTES` in the past is marked "missed"
               and a "missed" notification is created.

This is intentionally a single-process, in-memory-tracked scheduler — the
right choice for a student project. The docstring in main.py's startup
event, and the README's "Future Scope" section, note the upgrade path
(Celery + Redis / APScheduler with a persistent jobstore) for a real
multi-instance deployment.
"""
import logging
from datetime import date, datetime, timedelta

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session, joinedload

from app.config import settings
from app.database import SessionLocal
from app.models.models import LogStatus, Medication, MedicationLog, NotificationType
from app.services.medication_service import ensure_logs_for_date
from app.services.notification_service import create_notification

logger = logging.getLogger("medicare.scheduler")

_scheduler: BackgroundScheduler | None = None
_already_reminded: set[int] = set()  # log IDs we've already sent an "upcoming" notification for


def _generate_upcoming_logs(db: Session) -> None:
    """Keeps today's (and tomorrow's, so the calendar always has a day of
    lookahead) pending logs populated for every active medication."""
    medications = db.query(Medication).filter(Medication.is_active.is_(True)).all()
    for medication in medications:
        ensure_logs_for_date(db, medication, date.today())
        ensure_logs_for_date(db, medication, date.today() + timedelta(days=1))
    db.commit()


def _send_upcoming_reminders(db: Session) -> None:
    now = datetime.utcnow()
    horizon = now + timedelta(minutes=settings.UPCOMING_NOTICE_MINUTES)

    due_logs = (
        db.query(MedicationLog)
        .options(joinedload(MedicationLog.medication))
        .filter(
            MedicationLog.status == LogStatus.PENDING,
            MedicationLog.scheduled_time >= now - timedelta(minutes=1),
            MedicationLog.scheduled_time <= horizon,
        )
        .all()
    )

    for log in due_logs:
        if log.id in _already_reminded:
            continue
        med = log.medication
        create_notification(
            db,
            user_id=log.user_id,
            title="Medication Reminder",
            message=f"Time to take {med.name} ({med.dosage}) — {med.instructions.value.replace('_', ' ')}.",
            notification_type=NotificationType.REMINDER,
            medication_id=med.id,
            scheduled_at=log.scheduled_time,
        )
        _already_reminded.add(log.id)


def _sweep_missed_doses(db: Session) -> None:
    cutoff = datetime.utcnow() - timedelta(minutes=settings.MISSED_DOSE_GRACE_MINUTES)

    overdue_logs = (
        db.query(MedicationLog)
        .options(joinedload(MedicationLog.medication))
        .filter(MedicationLog.status == LogStatus.PENDING, MedicationLog.scheduled_time < cutoff)
        .all()
    )

    for log in overdue_logs:
        log.status = LogStatus.MISSED
        med = log.medication
        create_notification(
            db,
            user_id=log.user_id,
            title="Missed Medication",
            message=f"You missed your {log.scheduled_time.strftime('%I:%M %p')} dose of {med.name}.",
            notification_type=NotificationType.MISSED,
            medication_id=med.id,
            scheduled_at=log.scheduled_time,
        )
    db.commit()


def _tick() -> None:
    db = SessionLocal()
    try:
        _generate_upcoming_logs(db)
        _send_upcoming_reminders(db)
        _sweep_missed_doses(db)
    except Exception:
        logger.exception("Reminder scheduler tick failed")
        db.rollback()
    finally:
        db.close()


def start_scheduler() -> BackgroundScheduler:
    global _scheduler
    if _scheduler is not None:
        return _scheduler

    _scheduler = BackgroundScheduler(timezone="UTC")
    _scheduler.add_job(
        _tick,
        "interval",
        seconds=settings.REMINDER_CHECK_INTERVAL_SECONDS,
        id="reminder_tick",
        next_run_time=datetime.utcnow(),  # also run once immediately on startup
        max_instances=1,
        coalesce=True,
    )
    _scheduler.start()
    logger.info("Reminder scheduler started (interval=%ss)", settings.REMINDER_CHECK_INTERVAL_SECONDS)
    return _scheduler


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
