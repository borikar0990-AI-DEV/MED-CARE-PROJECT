"""
Business logic for medications and the concrete dose occurrences
(`MedicationLog` rows) that the dashboard, calendar, history and
reminder system all read from.

Whenever a medication is created/updated/reactivated, this module makes
sure *today's* pending logs exist immediately — so the dashboard has
something to show right away instead of waiting for the next background
scheduler tick (see app/scheduler/reminder_scheduler.py for the tick
that keeps tomorrow's-and-beyond logs generated and evaluates
missed/upcoming reminders).
"""
from datetime import date, time as dt_time
from typing import List

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.models import LogStatus, Medication, MedicationLog, MedicationSchedule
from app.schemas.medication_schemas import MedicationCreate, MedicationUpdate, ScheduleIn
from app.utils.helpers import combine, is_schedule_due_on


def _replace_schedules(db: Session, medication: Medication, schedules: List[ScheduleIn]) -> None:
    for old in list(medication.schedules):
        db.delete(old)
    db.flush()
    for s in schedules:
        db.add(MedicationSchedule(medication_id=medication.id, time=s.time, days_of_week=s.days_of_week))
    db.flush()


def ensure_logs_for_date(db: Session, medication: Medication, target_date: date) -> List[MedicationLog]:
    """Idempotently creates `target_date`'s pending MedicationLog rows for
    every schedule attached to `medication`, skipping any that already
    exist. Safe to call as often as needed."""
    created: List[MedicationLog] = []
    if not medication.is_active:
        return created
    if medication.start_date > target_date:
        return created
    if medication.end_date and medication.end_date < target_date:
        return created

    for schedule in medication.schedules:
        if not is_schedule_due_on(schedule.days_of_week, target_date):
            continue

        occurrence_time = combine(target_date, schedule.time)
        exists = (
            db.query(MedicationLog)
            .filter(MedicationLog.schedule_id == schedule.id, MedicationLog.scheduled_time == occurrence_time)
            .first()
        )
        if exists:
            continue

        log = MedicationLog(
            medication_id=medication.id,
            schedule_id=schedule.id,
            user_id=medication.user_id,
            scheduled_time=occurrence_time,
            status=LogStatus.PENDING,
        )
        try:
            with db.begin_nested():
                db.add(log)
                db.flush()
        except IntegrityError:
            # A concurrent scheduler tick created the same occurrence first — fine, skip it.
            continue
        created.append(log)

    return created


def create_medication(db: Session, user_id: int, payload: MedicationCreate) -> Medication:
    medication = Medication(
        user_id=user_id,
        name=payload.name,
        type=payload.type,
        dosage=payload.dosage,
        quantity=payload.quantity,
        frequency=payload.frequency,
        instructions=payload.instructions,
        notes=payload.notes,
        start_date=payload.start_date,
        end_date=payload.end_date,
    )
    db.add(medication)
    db.flush()  # assigns medication.id

    _replace_schedules(db, medication, payload.schedules)
    db.commit()
    db.refresh(medication)

    ensure_logs_for_date(db, medication, date.today())
    db.commit()
    db.refresh(medication)
    return medication


def update_medication(db: Session, medication: Medication, payload: MedicationUpdate) -> Medication:
    data = payload.model_dump(exclude_unset=True, exclude={"schedules"})
    for field, value in data.items():
        setattr(medication, field, value)

    if payload.schedules is not None:
        _replace_schedules(db, medication, payload.schedules)
        # Drop not-yet-actioned logs from today onward so the timeline
        # reflects the new schedule instead of stale times.
        today_start = combine(date.today(), dt_time.min)
        db.query(MedicationLog).filter(
            MedicationLog.medication_id == medication.id,
            MedicationLog.status == LogStatus.PENDING,
            MedicationLog.scheduled_time >= today_start,
        ).delete(synchronize_session=False)

    db.commit()
    db.refresh(medication)

    if medication.is_active:
        ensure_logs_for_date(db, medication, date.today())
        db.commit()
        db.refresh(medication)
    return medication


def set_active(db: Session, medication: Medication, is_active: bool) -> Medication:
    medication.is_active = is_active
    db.commit()
    db.refresh(medication)
    if is_active:
        ensure_logs_for_date(db, medication, date.today())
        db.commit()
        db.refresh(medication)
    return medication


def delete_medication(db: Session, medication: Medication) -> None:
    db.delete(medication)
    db.commit()
