"""
Centralized application configuration.

Every value here can be overridden with an environment variable (or a
`.env` file in the `backend/` folder — see `.env.example`). Keeping all
configuration in one typed object means the rest of the codebase never
reads `os.environ` directly, which is safer and easier to test.
"""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- General ---
    APP_NAME: str = "MediCare API"
    APP_VERSION: str = "1.0.0"
    ENV: str = "development"  # "development" | "production"

    # --- Database ---
    # Defaults to a local SQLite file so the project runs with zero setup.
    # Point this at a PostgreSQL DSN for production, e.g.:
    #   postgresql+psycopg2://medicare_user:medicare_pass@localhost:5432/medicare_db
    DATABASE_URL: str = "sqlite:///./medicare.db"

    # --- Security / JWT ---
    SECRET_KEY: str = "CHANGE_ME_super_secret_key_for_dev_only"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12  # 12 hours

    # --- CORS ---
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    # --- Reminder scheduler ---
    REMINDER_CHECK_INTERVAL_SECONDS: int = 60
    UPCOMING_NOTICE_MINUTES: int = 10
    MISSED_DOSE_GRACE_MINUTES: int = 30

    # --- Demo / seed data ---
    ENABLE_DEMO_SEED: bool = True

    # --- Uploads ---
    MAX_PROFILE_PHOTO_BYTES: int = 2 * 1024 * 1024  # 2 MB

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
