"""Pydantic schemas for user profile data."""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.utils.helpers import validate_password_strength


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    profile_photo: Optional[str] = None
    notif_browser_enabled: bool
    notif_email_enabled: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserProfileUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    phone: Optional[str] = Field(default=None, max_length=30)
    date_of_birth: Optional[date] = None
    notif_browser_enabled: Optional[bool] = None
    notif_email_enabled: Optional[bool] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_new_password: str

    @field_validator("new_password")
    @classmethod
    def _check_strength(cls, v: str) -> str:
        return validate_password_strength(v)

    @field_validator("confirm_new_password")
    @classmethod
    def _check_match(cls, v: str, info):
        if "new_password" in info.data and v != info.data["new_password"]:
            raise ValueError("Passwords do not match")
        return v
