"""
AI-ready module — this is where the "AI" half of the CSE(AI) minor project
plugs in.

Only `POST /api/ai/parse-medication-text` is actually implemented, and it is
a small **rule-based** parser (regex/keyword matching), not a trained model.
It is here to (a) demonstrate the natural-language-input idea end to end and
(b) prove the architecture: this router, and only this router, would need to
change if a real NLP model were swapped in later.

Every other module below is a clearly-labeled placeholder that returns
HTTP 501, so the frontend/demo never implies functionality that doesn't
exist yet (see project README, "Future Scope").
"""
import re
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.auth.dependencies import get_current_user
from app.models.models import Frequency, Instruction, MedicationType, User

router = APIRouter(prefix="/api/ai", tags=["AI (future-ready)"])


class ParseTextRequest(BaseModel):
    text: str


class ParsedSchedule(BaseModel):
    time: str  # "HH:MM", 24h


class ParsedMedicationSuggestion(BaseModel):
    name: Optional[str] = None
    type: MedicationType = MedicationType.TABLET
    dosage: Optional[str] = None
    frequency: Frequency = Frequency.ONCE_DAILY
    instructions: Instruction = Instruction.AFTER_FOOD
    start_date: date
    schedules: List[ParsedSchedule] = []
    confidence: str  # "low" | "medium" | "high" — heuristic, not a calibrated probability
    note: str


_FREQUENCY_TIMES = {
    Frequency.ONCE_DAILY: ["08:00"],
    Frequency.TWICE_DAILY: ["08:00", "20:00"],
    Frequency.THRICE_DAILY: ["08:00", "14:00", "20:00"],
}

_TYPE_KEYWORDS = {
    MedicationType.TABLET: ["tablet", "tab", "pill"],
    MedicationType.CAPSULE: ["capsule", "cap"],
    MedicationType.SYRUP: ["syrup", "suspension"],
    MedicationType.INJECTION: ["injection", "shot", "inject"],
    MedicationType.DROPS: ["drop", "drops"],
}

_FREQUENCY_KEYWORDS = [
    (re.compile(r"\b(thrice|three times)\b", re.I), Frequency.THRICE_DAILY),
    (re.compile(r"\b(twice|two times)\b", re.I), Frequency.TWICE_DAILY),
    (re.compile(r"\b(once|one time)\b", re.I), Frequency.ONCE_DAILY),
]

_INSTRUCTION_KEYWORDS = [
    (re.compile(r"\bbefore food\b", re.I), Instruction.BEFORE_FOOD),
    (re.compile(r"\bwith food\b", re.I), Instruction.WITH_FOOD),
    (re.compile(r"\bafter food\b", re.I), Instruction.AFTER_FOOD),
]

_DOSAGE_RE = re.compile(r"\b(\d+(?:\.\d+)?\s?(?:mg|ml|mcg|g|iu))\b", re.I)


@router.post(
    "/parse-medication-text",
    response_model=ParsedMedicationSuggestion,
    summary="Best-effort rule-based parser for a free-text medicine description",
)
def parse_medication_text(payload: ParseTextRequest, current_user: User = Depends(get_current_user)):
    text = payload.text.strip()
    lower = text.lower()

    dosage_match = _DOSAGE_RE.search(text)
    dosage = dosage_match.group(1) if dosage_match else None

    med_type = MedicationType.TABLET
    for t, keywords in _TYPE_KEYWORDS.items():
        if any(k in lower for k in keywords):
            med_type = t
            break

    frequency = Frequency.ONCE_DAILY
    for pattern, freq in _FREQUENCY_KEYWORDS:
        if pattern.search(text):
            frequency = freq
            break

    instructions = Instruction.AFTER_FOOD
    for pattern, instr in _INSTRUCTION_KEYWORDS:
        if pattern.search(text):
            instructions = instr
            break

    # Name heuristic: the run of capitalized/alpha words before the dosage
    # number (or the first two words if no dosage was found at all).
    name = None
    if dosage_match:
        before = text[: dosage_match.start()].strip(" ,.-")
        words = before.split()
        name = " ".join(words[-3:]) if words else None
    if not name:
        words = re.findall(r"[A-Za-z][A-Za-z\-]*", text)
        name = " ".join(words[:2]) if words else None

    confidence = "medium" if (name and dosage_match) else "low"

    return ParsedMedicationSuggestion(
        name=name,
        type=med_type,
        dosage=dosage or "1 unit",
        frequency=frequency,
        instructions=instructions,
        start_date=date.today(),
        schedules=[ParsedSchedule(time=t) for t in _FREQUENCY_TIMES[frequency]],
        confidence=confidence,
        note="Rule-based demo parser — please review every field before saving.",
    )


@router.get("/status", summary="Lists every planned AI module and its current state")
def ai_status():
    return {
        "implemented": [
            {
                "id": "natural_language_input",
                "name": "Natural language medication input",
                "endpoint": "POST /api/ai/parse-medication-text",
                "method": "rule-based (regex/keyword matching)",
            }
        ],
        "planned": [
            {"id": "reminder_suggestions", "name": "Personalized reminder-time suggestions"},
            {"id": "schedule_optimization", "name": "Medication schedule optimization"},
            {"id": "prescription_ocr", "name": "OCR for prescription/document reading"},
            {"id": "medicine_info_assistant", "name": "Medicine information assistance"},
            {"id": "missed_dose_patterns", "name": "Missed-dose pattern analysis"},
        ],
    }


def _not_implemented(feature: str):
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail=f"'{feature}' is planned for a future release and is not implemented in this build.",
    )


@router.post("/schedule-optimization", include_in_schema=True, summary="[Future scope] Not implemented")
def schedule_optimization(current_user: User = Depends(get_current_user)):
    _not_implemented("Medication schedule optimization")


@router.post("/prescription-ocr", include_in_schema=True, summary="[Future scope] Not implemented")
def prescription_ocr(current_user: User = Depends(get_current_user)):
    _not_implemented("OCR for prescription/document reading")


@router.post("/medicine-info", include_in_schema=True, summary="[Future scope] Not implemented")
def medicine_info(current_user: User = Depends(get_current_user)):
    _not_implemented("Medicine information assistance")


@router.get("/missed-dose-patterns", include_in_schema=True, summary="[Future scope] Not implemented")
def missed_dose_patterns(current_user: User = Depends(get_current_user)):
    _not_implemented("Missed-dose pattern analysis")
