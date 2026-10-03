"""
Standalone reminder-schedule endpoints.

Schedules are usually created as part of POST/PUT /api/medications (see
medication_schemas.MedicationCreate.schedules), but these routes let the
frontend manage an individual reminder time directly — e.g. adding one
more time slot to an existing medication without resending the whole form.

GET    /api/schedules?medication_id=   - list schedules (optionally for one medication)
POST   /api/schedules                  - add a reminder time to a medication
PUT    /api/schedules/{id}             - change a reminder time / its days
DELETE /api/schedules/{id}             - remove a reminder time
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.models import Medication, MedicationSchedule, User
from app.schemas.schedule_schemas import ScheduleCreate, ScheduleOut, ScheduleUpdate
from app.services.medication_service import ensure_logs_for_date
from datetime import date

router = APIRouter(prefix="/api/schedules", tags=["Schedules"])


def _get_owned_medication(db: Session, medication_id: int, user_id: int) -> Medication:
    medication = db.query(Medication).filter(Medication.id == medication_id, Medication.user_id == user_id).first()
    if not medication:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found.")
    return medication


def _get_owned_schedule(db: Session, schedule_id: int, user_id: int) -> MedicationSchedule:
    schedule = (
        db.query(MedicationSchedule)
        .join(Medication, MedicationSchedule.medication_id == Medication.id)
        .filter(MedicationSchedule.id == schedule_id, Medication.user_id == user_id)
        .first()
    )
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found.")
    return schedule


@router.get("", response_model=List[ScheduleOut])
def list_schedules(
    medication_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(MedicationSchedule)
        .join(Medication, MedicationSchedule.medication_id == Medication.id)
        .filter(Medication.user_id == current_user.id)
    )
    if medication_id is not None:
        query = query.filter(MedicationSchedule.medication_id == medication_id)
    return query.order_by(MedicationSchedule.time.asc()).all()


@router.post("", response_model=ScheduleOut, status_code=status.HTTP_201_CREATED)
def create_schedule(payload: ScheduleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    medication = _get_owned_medication(db, payload.medication_id, current_user.id)
    schedule = MedicationSchedule(medication_id=medication.id, time=payload.time, days_of_week=payload.days_of_week)
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    ensure_logs_for_date(db, medication, date.today())
    db.commit()
    return schedule


@router.put("/{schedule_id}", response_model=ScheduleOut)
def update_schedule(
    schedule_id: int,
    payload: ScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    schedule = _get_owned_schedule(db, schedule_id, current_user.id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(schedule, field, value)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule(schedule_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    schedule = _get_owned_schedule(db, schedule_id, current_user.id)
    db.delete(schedule)
    db.commit()
