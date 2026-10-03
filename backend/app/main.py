"""
MediCare API — FastAPI application entrypoint.

Run locally with:
    uvicorn app.main:app --reload --port 8000

Interactive API docs (Swagger UI) are then available at /docs, and the
machine-readable OpenAPI schema at /openapi.json.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import SessionLocal, init_db
from app.routers import ai, auth, dashboard, logs, medications, notifications, schedules, users
from app.scheduler.reminder_scheduler import start_scheduler, stop_scheduler
from app.services.seed_service import seed_demo_data

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("medicare.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- startup ---
    init_db()
    logger.info("Database ready (%s)", settings.DATABASE_URL.split("://")[0])

    if settings.ENABLE_DEMO_SEED:
        db = SessionLocal()
        try:
            seed_demo_data(db)
        finally:
            db.close()

    start_scheduler()
    logger.info("%s v%s is ready", settings.APP_NAME, settings.APP_VERSION)

    yield

    # --- shutdown ---
    stop_scheduler()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "REST API for MediCare — Smart Medication Reminder & Health Management System.\n\n"
        "A B.Tech CSE (AI) minor project. See /docs for interactive testing, "
        "or the project README for setup instructions and demo credentials."
    ),
    contact={"name": "MediCare Project"},
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------- #
# Consistent error responses — never leak stack traces / internals to clients.
# --------------------------------------------------------------------------- #
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = [
        {"field": ".".join(str(p) for p in err["loc"][1:]), "message": err["msg"]} for err in exc.errors()
    ]
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Validation failed.", "errors": errors},
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail}, headers=exc.headers)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred. Please try again."},
    )


# --------------------------------------------------------------------------- #
# Routers
# --------------------------------------------------------------------------- #
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(medications.router)
app.include_router(schedules.router)
app.include_router(logs.router)
app.include_router(dashboard.router)
app.include_router(notifications.router)
app.include_router(ai.router)


# --------------------------------------------------------------------------- #
# Misc
# --------------------------------------------------------------------------- #
@app.get("/", tags=["Health"])
def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/health", tags=["Health"])
def health():
    return {"status": "ok"}
