"""
SQLAlchemy ORM models — one class per relational table.

Tables
------
users                  Registered users (auth + profile).
medications            A medicine a user is tracking.
medication_schedules   One or more reminder times attached to a medication.
medication_logs        One row per *scheduled dose occurrence*
                        (pending -> taken / skipped / missed).
notifications          In-app notification feed shown in the bell / panel.
sessions               Issued JWTs, so a user can revoke a single session
                        or "log out of all sessions" from the Profile page.
"""
import enum
import uuid
from datetime import datetime, date

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    Time,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.database import Base


def _new_jti() -> str:
    return uuid.uuid4().hex


# --------------------------------------------------------------------------- #
# Enums (stored as native strings so SQLite + PostgreSQL both work unchanged)
# --------------------------------------------------------------------------- #
class MedicationType(str, enum.Enum):
    TABLET = "tablet"
    CAPSULE = "capsule"
    SYRUP = "syrup"
    INJECTION = "injection"
    DROPS = "drops"
    OTHER = "other"


class Frequency(str, enum.Enum):
    ONCE_DAILY = "once_daily"
    TWICE_DAILY = "twice_daily"
    THRICE_DAILY = "thrice_daily"
    CUSTOM = "custom"


class Instruction(str, enum.Enum):
    BEFORE_FOOD = "before_food"
    AFTER_FOOD = "after_food"
    WITH_FOOD = "with_food"
    OTHER = "other"


class LogStatus(str, enum.Enum):
    PENDING = "pending"
    TAKEN = "taken"
    SKIPPED = "skipped"
    MISSED = "missed"


class NotificationType(str, enum.Enum):
    REMINDER = "reminder"
    UPCOMING = "upcoming"
    MISSED = "missed"
    SCHEDULE_UPDATE = "schedule_update"
    SYSTEM = "system"


# --------------------------------------------------------------------------- #
# Tables
# --------------------------------------------------------------------------- #
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(30), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    profile_photo = Column(Text, nullable=True)  # small base64 data URL, or null
    notif_browser_enabled = Column(Boolean, default=True, nullable=False)
    notif_email_enabled = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    medications = relationship("Medication", back_populates="owner", cascade="all, delete-orphan")
    logs = relationship("MedicationLog", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")


class Medication(Base):
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    name = Column(String(150), nullable=False)
    type = Column(Enum(MedicationType, native_enum=False, length=20), nullable=False, default=MedicationType.TABLET)
    dosage = Column(String(100), nullable=False)          # strength/amount per dose, e.g. "500 mg" or "1 tablet"
    quantity = Column(Integer, nullable=True)              # units remaining in stock (for refill alerts)
    frequency = Column(Enum(Frequency, native_enum=False, length=20), nullable=False, default=Frequency.ONCE_DAILY)
    instructions = Column(Enum(Instruction, native_enum=False, length=20), nullable=False, default=Instruction.AFTER_FOOD)
    notes = Column(Text, nullable=True)

    start_date = Column(Date, nullable=False, default=date.today)
    end_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)  # false == "paused"
    is_demo = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    owner = relationship("User", back_populates="medications")
    schedules = relationship("MedicationSchedule", back_populates="medication", cascade="all, delete-orphan")
    logs = relationship("MedicationLog", back_populates="medication", cascade="all, delete-orphan")

    __table_args__ = (Index("ix_medications_user_active", "user_id", "is_active"),)


class MedicationSchedule(Base):
    __tablename__ = "medication_schedules"

    id = Column(Integer, primary_key=True, index=True)
    medication_id = Column(Integer, ForeignKey("medications.id", ondelete="CASCADE"), nullable=False, index=True)

    time = Column(Time, nullable=False)
    # "ALL" (every day) or a comma separated subset, e.g. "MON,WED,FRI"
    days_of_week = Column(String(50), nullable=False, default="ALL")

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    medication = relationship("Medication", back_populates="schedules")
    logs = relationship("MedicationLog", back_populates="schedule")


class MedicationLog(Base):
    """One row per *dose occurrence*: a specific medication, at a specific
    scheduled datetime, that is pending / taken / skipped / missed."""

    __tablename__ = "medication_logs"

    id = Column(Integer, primary_key=True, index=True)
    medication_id = Column(Integer, ForeignKey("medications.id", ondelete="CASCADE"), nullable=False, index=True)
    schedule_id = Column(Integer, ForeignKey("medication_schedules.id", ondelete="SET NULL"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    scheduled_time = Column(DateTime, nullable=False, index=True)
    action_time = Column(DateTime, nullable=True)
    status = Column(Enum(LogStatus, native_enum=False, length=20), nullable=False, default=LogStatus.PENDING, index=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    medication = relationship("Medication", back_populates="logs")
    schedule = relationship("MedicationSchedule", back_populates="logs")
    user = relationship("User", back_populates="logs")

    __table_args__ = (
        # The scheduler must never create the same dose occurrence twice.
        UniqueConstraint("schedule_id", "scheduled_time", name="uq_schedule_occurrence"),
    )


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    medication_id = Column(Integer, ForeignKey("medications.id", ondelete="CASCADE"), nullable=True)

    title = Column(String(200), nullable=False)
    message = Column(String(500), nullable=False)
    notification_type = Column(Enum(NotificationType, native_enum=False, length=20), nullable=False, default=NotificationType.SYSTEM)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    scheduled_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="notifications")


class Session(Base):
    """Tracks every issued JWT so it can be individually or collectively revoked
    (this is what makes 'Logout' and 'Logout from all sessions' actually work,
    since JWTs otherwise can't be invalidated before they expire)."""

    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    jti = Column(String(64), unique=True, nullable=False, default=_new_jti, index=True)
    user_agent = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="sessions")
