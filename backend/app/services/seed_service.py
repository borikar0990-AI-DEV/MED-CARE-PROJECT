"""
Optional demo data — a ready-made login for presentations/grading so nobody
has to register an account live during a demo.

Controlled by `ENABLE_DEMO_SEED` (see .env.example). Safe to call on every
startup: it only inserts the demo user once, and every medication it
creates is flagged `is_demo=True` so the frontend can label it clearly and
the user can delete it freely (see spec section 25, "Demo Data").
"""
import logging
from datetime import date, time as dt_time

from sqlalchemy.orm import Session

from app.auth.security import hash_password
from app.models.models import Frequency, Instruction, Medication, MedicationSchedule, MedicationType, User
from app.services.medication_service import ensure_logs_for_date

logger = logging.getLogger("medicare.seed")

DEMO_EMAIL = "demo@medicare.app"
DEMO_PASSWORD = "Demo@1234"

_DEMO_MEDICATIONS = [
    dict(
        name="Vitamin Tablet",
        type=MedicationType.TABLET,
        dosage="1 tablet",
        quantity=28,
        frequency=Frequency.ONCE_DAILY,
        instructions=Instruction.AFTER_FOOD,
        notes="General daily multivitamin.",
        times=["08:00"],
    ),
    dict(
        name="Paracetamol",
        type=MedicationType.TABLET,
        dosage="500 mg",
        quantity=15,
        frequency=Frequency.THRICE_DAILY,
        instructions=Instruction.AFTER_FOOD,
        notes="For fever/mild pain, as needed basis in real life — demo shows it as scheduled.",
        times=["08:00", "14:00", "20:00"],
    ),
    dict(
        name="Cough Syrup",
        type=MedicationType.SYRUP,
        dosage="10 ml",
        quantity=1,  # deliberately low, to demonstrate the low-stock signal
        frequency=Frequency.TWICE_DAILY,
        instructions=Instruction.WITH_FOOD,
        notes="Shake well before use.",
        times=["09:00", "21:00"],
    ),
]


def seed_demo_data(db: Session) -> None:
    existing = db.query(User).filter(User.email == DEMO_EMAIL).first()
    if existing:
        return

    user = User(name="Demo User", email=DEMO_EMAIL, password_hash=hash_password(DEMO_PASSWORD), phone="+91 90000 00000")
    db.add(user)
    db.flush()

    for med_data in _DEMO_MEDICATIONS:
        medication = Medication(
            user_id=user.id,
            name=med_data["name"],
            type=med_data["type"],
            dosage=med_data["dosage"],
            quantity=med_data["quantity"],
            frequency=med_data["frequency"],
            instructions=med_data["instructions"],
            notes=med_data["notes"],
            start_date=date.today(),
            is_demo=True,
        )
        db.add(medication)
        db.flush()

        for time_str in med_data["times"]:
            hh, mm = (int(p) for p in time_str.split(":"))
            db.add(MedicationSchedule(medication_id=medication.id, time=dt_time(hh, mm), days_of_week="ALL"))
        db.flush()

        ensure_logs_for_date(db, medication, date.today())

    db.commit()
    logger.info("Seeded demo account (%s)", DEMO_EMAIL)
