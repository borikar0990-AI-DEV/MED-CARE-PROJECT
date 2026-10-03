"""Small, dependency-free helper functions shared across the app.

Kept free of FastAPI/SQLAlchemy imports on purpose so they are trivial
to unit test in isolation (see backend/tests/).
"""
import re
from datetime import date, datetime
from datetime import time as dt_time

LOW_STOCK_THRESHOLD = 5

_WEEKDAY_CODES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]


def validate_password_strength(password: str) -> str:
    """Raises ValueError with a user-friendly message if the password is too weak.

    Mirrors the rule shown by the password-strength meter on the frontend:
    at least 8 characters, with at least one letter and one digit.
    """
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long")
    if not re.search(r"[A-Za-z]", password):
        raise ValueError("Password must contain at least one letter")
    if not re.search(r"[0-9]", password):
        raise ValueError("Password must contain at least one number")
    return password


def weekday_code(d: date) -> str:
    """3-letter weekday code for a date, e.g. 'MON'."""
    return _WEEKDAY_CODES[d.weekday()]


def is_schedule_due_on(days_of_week: str, d: date) -> bool:
    """Whether a schedule's `days_of_week` (e.g. 'ALL' or 'MON,WED,FRI')
    covers the given date's weekday."""
    normalized = (days_of_week or "ALL").strip().upper()
    if normalized in ("ALL", ""):
        return True
    codes = {c.strip() for c in normalized.split(",") if c.strip()}
    return weekday_code(d) in codes


def combine(d: date, t: dt_time) -> datetime:
    """Combine a date and a time into a single naive datetime.

    The whole app deliberately uses naive datetimes (no timezone) end to
    end, treating the server's local/UTC time as the single source of
    truth. This avoids a large class of timezone bugs and is a reasonable
    simplification for a student project / single-region deployment.
    """
    return datetime.combine(d, t)


def paginate(query, page: int, page_size: int):
    """Applies offset/limit to a SQLAlchemy query and returns (items, total, total_pages).

    Centralized here so every list endpoint (medications, logs, ...) paginates
    the exact same way instead of re-deriving the math in each router.
    """
    page = max(page, 1)
    page_size = max(1, min(page_size, 100))  # hard ceiling protects the DB from huge scans
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    total_pages = max(1, -(-total // page_size))  # ceil division
    return items, total, total_pages
