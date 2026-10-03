"""
Medication CRUD endpoints, plus pause/resume.

GET    /api/medications           - list (search, filter, sort, paginate)
GET    /api/medications/{id}      - one medication
POST   /api/medications           - create (+ its reminder schedules)
PUT    /api/medications/{id}      - update
DELETE /api/medications/{id}      - delete
PUT    /api/medications/{id}/pause
PUT    /api/medications/{id}/resume
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import asc, desc
from sqlalchemy.orm import Session, joinedload

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.models import Medication, MedicationType, User
from app.schemas.common import PaginatedResponse
from app.schemas.medication_schemas import MedicationCreate, MedicationOut, MedicationUpdate
from app.services import medication_service
from app.utils.helpers import paginate

router = APIRouter(prefix="/api/medications", tags=["Medications"])

_SORTABLE_COLUMNS = {"name": Medication.name, "start_date": Medication.start_date, "created_at": Medication.created_at}


def _get_owned_medication(db: Session, medication_id: int, user_id: int) -> Medication:
    medication = (
        db.query(Medication)
        .options(joinedload(Medication.schedules))
        .filter(Medication.id == medication_id, Medication.user_id == user_id)
        .first()
    )
    if not medication:
        # 404, not 403 — never confirm to a caller that another user's medication ID exists.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found.")
    return medication


@router.get("", response_model=PaginatedResponse[MedicationOut])
def list_medications(
    search: Optional[str] = Query(default=None, description="Filter by medicine name"),
    type: Optional[MedicationType] = Query(default=None),
    is_active: Optional[bool] = Query(default=None),
    sort_by: str = Query(default="created_at", pattern="^(name|start_date|created_at)$"),
    sort_dir: str = Query(default="desc", pattern="^(asc|desc)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Medication).options(joinedload(Medication.schedules)).filter(Medication.user_id == current_user.id)

    if search:
        query = query.filter(Medication.name.ilike(f"%{search.strip()}%"))
    if type is not None:
        query = query.filter(Medication.type == type)
    if is_active is not None:
        query = query.filter(Medication.is_active == is_active)

    column = _SORTABLE_COLUMNS[sort_by]
    query = query.order_by(asc(column) if sort_dir == "asc" else desc(column))

    items, total, total_pages = paginate(query, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.get("/{medication_id}", response_model=MedicationOut)
def get_medication(medication_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return _get_owned_medication(db, medication_id, current_user.id)


@router.post("", response_model=MedicationOut, status_code=status.HTTP_201_CREATED)
def create_medication(
    payload: MedicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return medication_service.create_medication(db, current_user.id, payload)


@router.put("/{medication_id}", response_model=MedicationOut)
def update_medication(
    medication_id: int,
    payload: MedicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    medication = _get_owned_medication(db, medication_id, current_user.id)
    return medication_service.update_medication(db, medication, payload)


@router.delete("/{medication_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_medication(medication_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    medication = _get_owned_medication(db, medication_id, current_user.id)
    medication_service.delete_medication(db, medication)


@router.put("/{medication_id}/pause", response_model=MedicationOut)
def pause_medication(medication_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    medication = _get_owned_medication(db, medication_id, current_user.id)
    return medication_service.set_active(db, medication, is_active=False)


@router.put("/{medication_id}/resume", response_model=MedicationOut)
def resume_medication(medication_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    medication = _get_owned_medication(db, medication_id, current_user.id)
    return medication_service.set_active(db, medication, is_active=True)
