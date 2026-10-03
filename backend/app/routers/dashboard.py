"""
Dashboard aggregation endpoints — power the summary cards, today's timeline,
and the statistics charts. All heavy lifting lives in services/dashboard_service.py;
this router is intentionally thin.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.models import User
from app.schemas.dashboard_schemas import DashboardSummary, StatisticsOut
from app.services import dashboard_service

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return dashboard_service.get_summary(db, current_user.id)


@router.get("/statistics", response_model=StatisticsOut)
def get_statistics(
    days: int = Query(default=7, ge=7, le=90, description="Size of the trailing window, in days"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return dashboard_service.get_statistics(db, current_user.id, days=days)
