"""
SQLAlchemy engine / session setup.

The app talks to whatever `DATABASE_URL` points to. By default that's a
local SQLite file (so the project runs with zero configuration for a
student demo); setting `DATABASE_URL` to a PostgreSQL DSN switches the
whole app to Postgres with no code changes elsewhere.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings


def _normalize_database_url(url: str) -> str:
    """Managed Postgres providers (Neon, Supabase, Render, the old Heroku
    scheme, ...) all hand out a plain `postgres://` or `postgresql://`
    connection string. SQLAlchemy needs the driver spelled out
    (`postgresql+psycopg2://`) to unambiguously pick psycopg2. Rewriting it
    here means pasting a connection string straight from any provider's
    dashboard "just works", with no manual edits and no deploy-time surprises.
    """
    if url.startswith("postgres://"):
        return "postgresql+psycopg2://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        return "postgresql+psycopg2://" + url[len("postgresql://"):]
    return url


DATABASE_URL = _normalize_database_url(settings.DATABASE_URL)

# SQLite needs this flag to be safely used from multiple threads
# (FastAPI's threadpool + the background reminder scheduler).
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency: yields a request-scoped DB session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables if they don't exist yet. For production, prefer Alembic migrations."""
    from app.models import models  # noqa: F401  (registers models on Base.metadata)

    Base.metadata.create_all(bind=engine)
