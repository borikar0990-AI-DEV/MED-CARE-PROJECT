"""
Medication log endpoints — these are the dose *occurrences* that power the
dashboard timeline, the calendar, and the history page, and are what the
reminder modal's Taken/Skip buttons ultimately update.

GET  /api/logs      - list, filterable by date range / medication / status (paginated)
POST /api/logs      - create a log entry directly (rarely needed — logs are
                       normally generated automatically, see medication_service)
PUT  /api/logs/{id} - record an action (Taken / Skipped), or edit notes
"""
from datetime import date, datetime, timedelta
from datetime import time as dt_time
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.models import LogStatus, Medication, MedicationLog, User
from app.schemas.common import PaginatedResponse
from app.schemas.log_schemas import LogCreate, LogOut, LogUpdate
from app.utils.helpers import combine, paginate

router = APIRouter(prefix="/api/logs", tags=["Medication Logs"])


def _to_log_out(log: MedicationLog) -> LogOut:
    med = log.medication
    return LogOut(
        id=log.id,
        medication_id=log.medication_id,
        medication_name=med.name,
        medication_type=med.type.value,
        dosage=med.dosage,
        instructions=med.instructions.value,
        schedule_id=log.schedule_id,
        user_id=log.user_id,
        scheduled_time=log.scheduled_time,
        action_time=log.action_time,
        status=log.status,
        notes=log.notes,
        created_at=log.created_at,
    )


@router.get("", response_model=PaginatedResponse[LogOut])
def list_logs(
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    medication_id: Optional[int] = Query(default=None),
    status_filter: Optional[LogStatus] = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(MedicationLog)
        .options(joinedload(MedicationLog.medication))
        .filter(MedicationLog.user_id == current_user.id)
    )

    if start_date:
        query = query.filter(MedicationLog.scheduled_time >= combine(start_date, dt_time.min))
    if end_date:
        query = query.filter(MedicationLog.scheduled_time < combine(end_date, dt_time.min) + timedelta(days=1))
    if medication_id:
        query = query.filter(MedicationLog.medication_id == medication_id)
    if status_filter:
        query = query.filter(MedicationLog.status == status_filter)

    query = query.order_by(MedicationLog.scheduled_time.desc())
    items, total, total_pages = paginate(query, page, page_size)
    return PaginatedResponse(
        items=[_to_log_out(i) for i in items], total=total, page=page, page_size=page_size, total_pages=total_pages
    )


@router.post("", response_model=LogOut, status_code=status.HTTP_201_CREATED)
def create_log(payload: LogCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    medication = db.query(Medication).filter(Medication.id == payload.medication_id, Medication.user_id == current_user.id).first()
    if not medication:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found.")

    log = MedicationLog(
        medication_id=medication.id,
        user_id=current_user.id,
        scheduled_time=payload.scheduled_time,
        status=payload.status,
        notes=payload.notes,
        action_time=datetime.utcnow() if payload.status != LogStatus.PENDING else None,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return _to_log_out(log)


@router.put("/{log_id}", response_model=LogOut)
def update_log(log_id: int, payload: LogUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    log = (
        db.query(MedicationLog)
        .options(joinedload(MedicationLog.medication))
        .filter(MedicationLog.id == log_id, MedicationLog.user_id == current_user.id)
        .first()
    )
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log entry not found.")

    log.status = payload.status
    if payload.notes is not None:
        log.notes = payload.notes
    log.action_time = datetime.utcnow() if payload.status != LogStatus.PENDING else None

    # Taking a dose draws down the tracked quantity, powering the low-stock signal on the dashboard.
    if payload.status == LogStatus.TAKEN and log.medication.quantity is not None and log.medication.quantity > 0:
        log.medication.quantity -= 1

    db.commit()
    db.refresh(log)
    return _to_log_out(log)
