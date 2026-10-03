"""Pydantic schemas for medications and their nested reminder schedules."""
from datetime import date, datetime, time
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.models import Frequency, Instruction, MedicationType


class ScheduleIn(BaseModel):
    """One reminder time, as submitted from the Add/Edit Medication form."""
    time: time
    days_of_week: str = "ALL"  # "ALL" or comma separated e.g. "MON,WED,FRI"


class ScheduleOut(BaseModel):
    id: int
    time: time
    days_of_week: str

    model_config = ConfigDict(from_attributes=True)


class MedicationBase(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    type: MedicationType = MedicationType.TABLET
    dosage: str = Field(min_length=1, max_length=100)
    quantity: Optional[int] = Field(default=None, ge=0)
    frequency: Frequency = Frequency.ONCE_DAILY
    instructions: Instruction = Instruction.AFTER_FOOD
    notes: Optional[str] = Field(default=None, max_length=2000)
    start_date: date
    end_date: Optional[date] = None

    @model_validator(mode="after")
    def _check_dates(self):
        if self.end_date and self.end_date < self.start_date:
            raise ValueError("End date cannot be before start date")
        return self


class MedicationCreate(MedicationBase):
    schedules: List[ScheduleIn] = Field(min_length=1)


class MedicationUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    type: Optional[MedicationType] = None
    dosage: Optional[str] = Field(default=None, min_length=1, max_length=100)
    quantity: Optional[int] = Field(default=None, ge=0)
    frequency: Optional[Frequency] = None
    instructions: Optional[Instruction] = None
    notes: Optional[str] = Field(default=None, max_length=2000)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None
    schedules: Optional[List[ScheduleIn]] = Field(default=None, min_length=1)

    @model_validator(mode="after")
    def _check_dates(self):
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("End date cannot be before start date")
        return self


class MedicationOut(MedicationBase):
    id: int
    user_id: int
    is_active: bool
    is_demo: bool
    created_at: datetime
    updated_at: datetime
    schedules: List[ScheduleOut] = []

    model_config = ConfigDict(from_attributes=True)
