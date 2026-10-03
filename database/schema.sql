-- =============================================================================
-- MediCare — PostgreSQL schema
-- =============================================================================
-- This file is a reference / manual-setup companion to the SQLAlchemy models
-- in backend/app/models/models.py, which is the actual source of truth (the
-- backend calls Base.metadata.create_all() on startup and creates these
-- tables automatically — you do NOT need to run this file for the app to
-- work). Use this file if you want to inspect the schema without reading
-- Python, set up the database by hand, or seed a fresh instance manually.
--
-- Usage:
--   psql -U medicare_user -d medicare_db -f database/schema.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id                      SERIAL PRIMARY KEY,
    name                    VARCHAR(120)  NOT NULL,
    email                   VARCHAR(255)  NOT NULL UNIQUE,
    password_hash           VARCHAR(255)  NOT NULL,
    phone                   VARCHAR(30),
    date_of_birth           DATE,
    profile_photo           TEXT,                       -- base64 data URL, or NULL
    notif_browser_enabled   BOOLEAN       NOT NULL DEFAULT TRUE,
    notif_email_enabled     BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_users_email ON users (email);

-- ---------------------------------------------------------------------------
-- medications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medications (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name         VARCHAR(150) NOT NULL,
    type         VARCHAR(20)  NOT NULL DEFAULT 'tablet',   -- tablet|capsule|syrup|injection|drops|other
    dosage       VARCHAR(100) NOT NULL,
    quantity     INTEGER,                                  -- units remaining, for low-stock alerts
    frequency    VARCHAR(20)  NOT NULL DEFAULT 'once_daily',-- once_daily|twice_daily|thrice_daily|custom
    instructions VARCHAR(20)  NOT NULL DEFAULT 'after_food',-- before_food|after_food|with_food|other
    notes        TEXT,
    start_date   DATE         NOT NULL DEFAULT CURRENT_DATE,
    end_date     DATE,
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,        -- false == "paused"
    is_demo      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_medications_user_id ON medications (user_id);
CREATE INDEX IF NOT EXISTS ix_medications_user_active ON medications (user_id, is_active);

-- ---------------------------------------------------------------------------
-- medication_schedules  (one row per reminder time attached to a medication)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medication_schedules (
    id             SERIAL PRIMARY KEY,
    medication_id  INTEGER     NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
    time           TIME        NOT NULL,
    days_of_week   VARCHAR(50) NOT NULL DEFAULT 'ALL',      -- 'ALL' or e.g. 'MON,WED,FRI'
    created_at     TIMESTAMP   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_medication_schedules_medication_id ON medication_schedules (medication_id);

-- ---------------------------------------------------------------------------
-- medication_logs  (one row per scheduled DOSE OCCURRENCE: pending -> taken/skipped/missed)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medication_logs (
    id             SERIAL PRIMARY KEY,
    medication_id  INTEGER   NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
    schedule_id    INTEGER   REFERENCES medication_schedules(id) ON DELETE SET NULL,
    user_id        INTEGER   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scheduled_time TIMESTAMP NOT NULL,
    action_time    TIMESTAMP,
    status         VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending|taken|skipped|missed
    notes          TEXT,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_schedule_occurrence UNIQUE (schedule_id, scheduled_time)
);
CREATE INDEX IF NOT EXISTS ix_medication_logs_medication_id ON medication_logs (medication_id);
CREATE INDEX IF NOT EXISTS ix_medication_logs_user_id ON medication_logs (user_id);
CREATE INDEX IF NOT EXISTS ix_medication_logs_scheduled_time ON medication_logs (scheduled_time);
CREATE INDEX IF NOT EXISTS ix_medication_logs_status ON medication_logs (status);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id                  SERIAL PRIMARY KEY,
    user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    medication_id       INTEGER REFERENCES medications(id) ON DELETE CASCADE,
    title               VARCHAR(200) NOT NULL,
    message             VARCHAR(500) NOT NULL,
    notification_type   VARCHAR(20)  NOT NULL DEFAULT 'system', -- reminder|upcoming|missed|schedule_update|system
    is_read             BOOLEAN NOT NULL DEFAULT FALSE,
    scheduled_at        TIMESTAMP,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS ix_notifications_is_read ON notifications (is_read);
CREATE INDEX IF NOT EXISTS ix_notifications_created_at ON notifications (created_at);

-- ---------------------------------------------------------------------------
-- sessions  (tracks issued JWTs so they can be revoked — powers Logout /
--            "Logout from all sessions"; this doubles as the spec's
--            RefreshTokens/Sessions table)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    jti         VARCHAR(64) NOT NULL UNIQUE,
    user_agent  VARCHAR(255),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMP NOT NULL,
    revoked     BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS ix_sessions_user_id ON sessions (user_id);
CREATE INDEX IF NOT EXISTS ix_sessions_jti ON sessions (jti);
