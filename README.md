# 💊 MediCare — Smart Medication Reminder & Health Management System

A full-stack medication reminder platform built as a **B.Tech CSE (AI) minor project**: React on the frontend, FastAPI on the backend, PostgreSQL (or SQLite for zero-config development) for storage, JWT authentication, a real background reminder scheduler, and an AI-ready module for natural-language medication entry.

> **Demo login:** `demo@medicare.app` / `Demo@1234` (seeded automatically on first run — see [Demo Data](#demo-data--credentials))

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [System Architecture](#system-architecture)
5. [Project Structure](#project-structure)
6. [Getting Started](#getting-started)
7. [Deploying to the Internet](#deploying-to-the-internet)
8. [Environment Variables](#environment-variables)
9. [Demo Data & Credentials](#demo-data--credentials)
10. [API Documentation](#api-documentation)
11. [Database Schema](#database-schema)
12. [Core User Flow](#core-user-flow)
13. [Security](#security)
14. [Accessibility](#accessibility)
15. [AI-Ready Architecture](#ai-ready-architecture)
16. [Screenshots](#screenshots)
17. [Developer Notes & Known Simplifications](#developer-notes--known-simplifications)
18. [Future Scope](#future-scope)

---

## Overview

MediCare helps a person manage their medicines, dosage schedules, reminders, and medication history from one dashboard. It's a genuine working application — a real FastAPI backend with a real database behind it, not a static mockup — sized and scoped to be presentable and explainable in a college project demo.

**What you can actually do in it:**
- Register/log in with a hashed-password + JWT-secured account
- Add a medicine with one or more reminder times, a frequency, and instructions
- See today's schedule on a dashboard, and mark each dose **Taken**, **Skipped**, or let it lapse to **Missed**
- Get a browser notification (and an in-app modal with Taken / Skip / Remind Later) when a dose is due
- Browse a calendar of past and upcoming doses, a filterable history log, and adherence charts
- Manage a profile, notification preferences, and active sessions

## Features

| Area | What's implemented |
|---|---|
| **Authentication** | Register, login, logout, "remember me", logout-from-all-sessions, JWT + bcrypt, protected routes |
| **Medications** | Full CRUD, multiple reminder times per medicine, pause/resume, search, filter (type/active), sort, pagination |
| **Reminders** | Background scheduler generates dose occurrences, fires "due soon" notifications, auto-marks overdue doses as missed |
| **Dashboard** | Greeting banner, animated stat cards, today's timeline, low-stock warning |
| **Calendar** | Month grid with per-day status dots, detailed day panel |
| **History** | Filterable table (date range / medicine / status) + adherence trend chart |
| **Statistics** | Weekly activity bar chart, status donut chart, adherence-rate gauge, daily trend line |
| **Notifications** | In-app bell + full Notification Center, mark read / mark all read / delete |
| **Profile** | Edit details, upload photo, change password, toggle notification channels, sign out everywhere |
| **AI-ready** | A working rule-based "describe it in plain English" parser for the Add Medication form, plus a documented, clearly-labeled `/api/ai/` surface for future ML modules |
| **UX polish** | Dark mode, skeleton loading, empty/error states, toasts, confirmation dialogs, 404 page, keyboard-accessible modals, reduced-motion support |

## Technology Stack

**Frontend** — React 18 · Vite · Tailwind CSS · React Router · Axios · Recharts · Framer Motion · Lucide icons
**Backend** — Python · FastAPI · Pydantic v2 · SQLAlchemy · PyJWT · Passlib (bcrypt) · APScheduler
**Database** — PostgreSQL (production) or SQLite (zero-config local dev), both via the same SQLAlchemy models
**Tooling** — Docker & Docker Compose, Swagger/OpenAPI auto-docs

## System Architecture

```mermaid
graph TB
    subgraph Client["Browser"]
        A["React SPA (Vite)<br/>Tailwind · Framer Motion · Recharts"]
    end

    subgraph Server["FastAPI Backend"]
        B["REST Routers<br/>auth · medications · schedules · logs · dashboard · notifications · ai"]
        C["JWT Auth Layer<br/>hashing, token issuing/verification, session revocation"]
        D["Service Layer<br/>business logic (medication_service, dashboard_service, ...)"]
        E["Reminder Scheduler<br/>APScheduler background job, runs every 60s"]
    end

    F[("PostgreSQL<br/>or SQLite")]

    A -- "HTTPS / JSON (Axios, JWT bearer)" --> B
    A -- "polls every 30s for due doses" --> B
    B --> C
    B --> D
    D --> F
    E --> D
    E -- "generates dose logs +<br/>reminder/missed notifications" --> F
```

The frontend never talks to the database directly — every read and write goes through the versioned REST API, which is what makes the whole system swappable (a mobile app or a second frontend could reuse the exact same backend unmodified).

## Project Structure

```
medicare/
├── frontend/                React + Vite + Tailwind SPA
│   ├── src/
│   │   ├── components/       Reusable UI, grouped by feature
│   │   ├── pages/             One file per route
│   │   ├── layouts/            Public / Auth / Dashboard shells
│   │   ├── context/             Auth + Theme/Toast providers
│   │   ├── hooks/                useReminderEngine (polling + browser notifications)
│   │   ├── services/              Axios wrappers, one per API resource
│   │   └── utils/                  Dates, validators, shared constants
│   └── README.md
│
├── backend/                  FastAPI application
│   ├── app/
│   │   ├── models/             SQLAlchemy ORM models
│   │   ├── schemas/              Pydantic request/response schemas
│   │   ├── routers/               API route handlers
│   │   ├── services/               Business logic
│   │   ├── auth/                    Hashing, JWT, current-user dependency
│   │   ├── scheduler/                Background reminder engine
│   │   └── utils/                     Pagination, rate limiting, date helpers
│   ├── seed.py                 Manual demo-data (re)seed script
│   └── README.md
│
├── database/
│   ├── schema.sql            Reference PostgreSQL schema (mirrors the ORM models)
│   └── seed.sql                Reference demo data (mirrors seed_service.py)
│
├── docker-compose.yml       Postgres + backend + frontend, one command
├── render.yaml              Render Blueprint — deploys backend + frontend to the internet
└── README.md                 You are here
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- Docker & Docker Compose (optional, only needed for the containerized path)

### Option A — Fastest: SQLite, no database install

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000

# Frontend, in a second terminal
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`. A `medicare.db` SQLite file and the demo account are created automatically on first run.

### Option B — Full stack with Docker Compose (PostgreSQL included)

```bash
docker-compose up --build
```

- Frontend → `http://localhost:3000`
- API + docs → `http://localhost:8000/docs`

### Option C — Manual PostgreSQL

1. Create a database and user (or run just the `db` service: `docker-compose up db`).
2. In `backend/.env`, set:
   ```
   DATABASE_URL=postgresql+psycopg2://medicare_user:medicare_pass@localhost:5432/medicare_db
   ```
3. Run the backend as in Option A — tables are created automatically on startup (`Base.metadata.create_all`). `database/schema.sql` and `database/seed.sql` are provided if you'd rather set the schema up by hand with `psql`.

## Deploying to the Internet

Everything below is genuinely free, requires no credit card, and gives you a real `https://...` link you can hand to anyone — no laptop left running. **You do this part yourself** (it needs your own accounts) — this section is the exact click-by-click path, chosen and verified against current (2026) provider docs rather than guessed.

> **Why not one click from here?** This app is a real Python backend + database, not a single static page — actually running it requires infrastructure (a server process, a database) that only exists once *you* create it on a hosting provider. There isn't a way to hand you a working link to a backend that doesn't exist yet anywhere.

**The stack** — chosen specifically to dodge two common traps: Render's own free Postgres **expires 30 days after creation**, which is a nasty surprise mid-semester; Railway no longer offers a perpetual free tier at all. Neon's free Postgres, by contrast, has no expiry and no card required.

| Piece | Service | Why |
|---|---|---|
| Database | **[Neon](https://neon.com)** | Permanent free tier (0.5 GB, scales to zero when idle, wakes in ~200ms) — no expiry, no card |
| Backend (FastAPI) | **[Render](https://render.com)** free Web Service | No card required; runs a real Python process |
| Frontend (React) | **[Render](https://render.com)** free Static Site | Same account as the backend — one dashboard, one login |

### Step-by-step

1. **Push this project to GitHub** (a public or private repo — Render deploys from Git). The repo needs `render.yaml` at its root, which is already included here.

2. **Create the database on Neon**
   - Sign up at [neon.com](https://neon.com) (no card needed) → *New Project*.
   - Copy the connection string it gives you (looks like `postgresql://user:pass@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require`). You can paste it in exactly as-is — the backend automatically normalizes `postgres://`/`postgresql://` into the `postgresql+psycopg2://` form SQLAlchemy needs, so there's nothing to hand-edit.

3. **Deploy the Blueprint on Render**
   - Sign up at [render.com](https://render.com) (no card needed for free services) → **New** → **Blueprint** → connect the GitHub repo.
   - Render reads `render.yaml` and shows two services: `medicare-backend` and `medicare-frontend`. Click **Apply**.
   - This first attempt will come up **incomplete** — expected, because three settings below don't have values yet. Continue to the next step.

4. **Wire the three cross-referencing settings** — once both services exist, each has a URL (Render Dashboard → the service → the URL under its name, e.g. `https://medicare-backend.onrender.com`). Open each service's **Environment** tab and fill in:

   | Service | Variable | Value |
   |---|---|---|
   | medicare-backend | `DATABASE_URL` | the Neon connection string from step 2 |
   | medicare-backend | `CORS_ORIGINS` | the `medicare-frontend` URL, e.g. `https://medicare-frontend.onrender.com` |
   | medicare-frontend | `VITE_API_BASE_URL` | the `medicare-backend` URL **+ `/api`**, e.g. `https://medicare-backend.onrender.com/api` |

   Saving a variable triggers an automatic redeploy of that service. Once both have redeployed, open the frontend URL — that's your link, and the demo login (`demo@medicare.app` / `Demo@1234`) works immediately since `ENABLE_DEMO_SEED=true` is already set in `render.yaml`.

### Two honest caveats about the free tier

- **The backend sleeps after 15 minutes with no traffic**, and takes about a minute to wake back up on the next request (Render shows a loading page while it does). Fine for a demo someone clicks into; not something to rely on for an always-instant link.
- **The reminder scheduler only ticks while the backend is awake.** While asleep, no new reminder/missed notifications are generated — they resume the moment a request wakes it up. For a live walkthrough this is invisible (using the site keeps it awake). If you want it to genuinely run in the background 24/7, add a free uptime monitor (e.g. [cron-job.org](https://cron-job.org) or UptimeRobot) that pings `https://<your-backend>.onrender.com/api/health` every 10 minutes — that alone keeps it from ever sleeping, within Render's 750 free instance-hours/month (comfortably enough for one always-on small service).

### Alternatives

- **Vercel or Netlify** instead of Render for the frontend — both are excellent, free, zero-config for a Vite build (`npm run build`, publish `dist/`) if you'd rather split accounts or already use one of them.
- **Docker Compose, on your own VPS** — `docker-compose.yml` at the project root is ready for this today (a $5–6/mo VPS from any provider, or your college's server if it offers one, running `docker-compose up --build -d`) — no sleep/cold-start behavior at all, at the cost of not being free.

## Environment Variables

**Backend** (`backend/.env`, see `backend/.env.example`)

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./medicare.db` | Swap for a PostgreSQL DSN to switch databases with no code changes |
| `SECRET_KEY` | *(dev placeholder)* | JWT signing key — **change this for any real deployment** |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `720` | Session length (default token); "Remember me" issues a 30-day token instead |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Comma-separated allowed frontend origins |
| `REMINDER_CHECK_INTERVAL_SECONDS` | `60` | How often the background scheduler ticks |
| `UPCOMING_NOTICE_MINUTES` | `10` | How far ahead a dose counts as "due soon" |
| `MISSED_DOSE_GRACE_MINUTES` | `30` | How overdue a dose can be before it's auto-marked missed |
| `ENABLE_DEMO_SEED` | `true` | Seed the demo account/medicines on startup |

**Frontend** (`frontend/.env`, see `frontend/.env.example`)

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000/api` | Where the SPA sends API requests |

## Demo Data & Credentials

On first startup (when `ENABLE_DEMO_SEED=true`, the default), the backend seeds one demo account so a presentation never depends on registering live:

- **Email:** `demo@medicare.app`
- **Password:** `Demo@1234`
- Pre-loaded with three medicines (Vitamin Tablet, Paracetamol, Cough Syrup) — the Login page has a "tap to autofill" banner for these credentials, and every seeded medicine is flagged `is_demo` and can be deleted freely.

Re-seed on demand anytime with `python backend/seed.py`.

## API Documentation

Full interactive docs (Swagger UI) are auto-generated by FastAPI at **`/docs`** whenever the backend is running, with the raw OpenAPI schema at `/openapi.json`. Summary of every endpoint:

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create an account (auto-logs in) |
| POST | `/api/auth/login` | Log in (`remember_me` issues a 30-day token) |
| POST | `/api/auth/logout` | Revoke the current session |
| GET | `/api/auth/me` | Current user |
| GET / PUT | `/api/users/profile` | Read / update profile |
| PUT | `/api/users/change-password` | Change password |
| POST | `/api/users/profile/photo` | Upload a profile photo |
| POST | `/api/users/logout-all` | Revoke every active session |
| GET | `/api/medications` | List (search, type/active filters, sort, pagination) |
| GET | `/api/medications/{id}` | One medication |
| POST | `/api/medications` | Create (with its reminder schedules) |
| PUT / DELETE | `/api/medications/{id}` | Update / delete |
| PUT | `/api/medications/{id}/pause`, `/resume` | Toggle active state |
| GET / POST | `/api/schedules` | List / add a standalone reminder time |
| PUT / DELETE | `/api/schedules/{id}` | Update / remove a reminder time |
| GET | `/api/logs` | Dose history (date range, medicine, status filters, pagination) |
| POST | `/api/logs` | Create a log entry directly |
| PUT | `/api/logs/{id}` | Record Taken / Skipped / etc. |
| GET | `/api/dashboard/summary` | Today's stats + timeline |
| GET | `/api/dashboard/statistics` | Chart data + adherence rate |
| GET | `/api/notifications` | List (optionally unread only) |
| PUT | `/api/notifications/{id}/read`, `/read-all` | Mark read |
| DELETE | `/api/notifications/{id}` | Remove |
| POST | `/api/ai/parse-medication-text` | **Working** rule-based text-to-form parser |
| GET | `/api/ai/status` | What's implemented vs. planned |
| POST | `/api/ai/schedule-optimization`, `/prescription-ocr`, `/medicine-info`; GET `/missed-dose-patterns` | Documented **501** stubs — see [AI-Ready Architecture](#ai-ready-architecture) |

All list endpoints return `{ items, total, page, page_size, total_pages }`. All endpoints except `/auth/register` and `/auth/login` require an `Authorization: Bearer <token>` header, and every resource is scoped to its owner (a 404, not a 403, is returned for another user's data — see [Security](#security)).

## Database Schema

Six relational tables (SQLAlchemy models in `backend/app/models/models.py`; SQL reference in `database/schema.sql`):

| Table | Purpose |
|---|---|
| `users` | Account + profile fields (see note below) |
| `medications` | A medicine a user is tracking |
| `medication_schedules` | One or more reminder times attached to a medication |
| `medication_logs` | One row per **dose occurrence** — pending → taken / skipped / missed |
| `notifications` | The in-app notification feed |
| `sessions` | Issued JWTs, so "Logout" and "Logout from all sessions" can actually revoke a token before it expires |

> **Note on the original 7-table sketch:** the brief's `UserProfiles` fields (phone, DOB, photo, notification prefs) live directly on `users` — a real 1:1 table would only add a join for no benefit — and `RefreshTokens`/`Sessions` were unified into the single `sessions` table above, which tracks each JWT's `jti` for revocation. Both are the kind of simplification worth mentioning out loud in a viva; the ER shape everywhere else matches the brief exactly.

`medication_logs` is the table nearly everything else reads from: the dashboard timeline, the calendar's dots, the history table, and the statistics charts are all just different views over these rows.

## Core User Flow

```mermaid
flowchart TD
    A[Landing Page] --> B[Register / Login]
    B --> C[Dashboard]
    C --> D[Add Medication]
    D --> E[Set Dosage + Schedule]
    E --> F[(Saved to Database)]
    F --> G[Reminder Scheduler]
    G --> H[Browser Notification +<br/>In-app Reminder Modal]
    H --> I{User Action}
    I -->|Taken| J[Medication Log Updated]
    I -->|Skip| J
    I -->|Remind Later| H
    F -.->|time passes,<br/>no response| K[Auto-marked Missed]
    J --> L[Dashboard Statistics Updated]
    K --> L
    L --> M[History Updated]
```

## Security

- Passwords hashed with bcrypt (Passlib), never logged or returned by any endpoint
- JWT auth (HS256) on every private route; each token's `jti` is tracked in `sessions` so it can be revoked before it naturally expires
- Every resource query is scoped to `user_id == current_user.id` — one user can never read or modify another's data, and a foreign ID that belongs to someone else 404s rather than 403s, so its existence isn't even confirmed
- Input validation via Pydantic on every request body; SQL injection isn't reachable since every query goes through the SQLAlchemy ORM, never raw string-built SQL
- CORS restricted to an explicit origin allowlist
- A basic in-memory rate limiter guards `/auth/register` and `/auth/login` against brute-forcing (documented upgrade path to Redis + `slowapi` for a multi-instance deployment — see `backend/app/utils/rate_limit.py`)
- Consistent, generic error messages (e.g. login never reveals whether the email or the password was wrong; 500s never leak a stack trace to the client)
- Secrets (DB credentials, JWT key) are environment variables only, never committed or hardcoded

## Accessibility

Semantic HTML and labelled form fields throughout; every icon-only button has an `aria-label`; modals use `role="dialog"`/`aria-modal`, trap Escape-to-close, and lock body scroll; focus is always visibly indicated (`:focus-visible` ring) without an outline appearing on mouse clicks; toasts use `aria-live="polite"`; color is never the only status signal (every status also has an icon + text label); `prefers-reduced-motion` is respected site-wide.

## AI-Ready Architecture

Since this is a CSE **(AI)** minor project, the backend has a dedicated, versioned `/api/ai/` surface (`backend/app/routers/ai.py`) built so real ML models can be dropped in later without touching any other router:

- ✅ **Implemented now:** `POST /api/ai/parse-medication-text` — a small rule-based (regex/keyword) parser wired directly into the Add Medication form's "describe it in plain English" box. It's explicitly labeled as a rule-based demo parser, not a trained model, and always leaves the parsed fields editable before saving — it never auto-submits.
- 🔜 **Documented, not implemented** (each returns a clear HTTP 501, never a silent failure or a fake result): personalized reminder-time suggestions, medication schedule optimization, OCR for prescriptions, a medicine-information assistant, and missed-dose pattern analysis. `GET /api/ai/status` lists exactly this split at runtime.

No unsupported medical claims or fabricated clinical statistics appear anywhere in the app — the Statistics page explicitly footnotes that its figures reflect only the user's own logged activity.

## Screenshots

_Add screenshots here before a submission/demo — e.g.:_

```markdown
![Dashboard](docs/screenshots/dashboard.png)
![Add Medication](docs/screenshots/add-medication.png)
![Statistics](docs/screenshots/statistics.png)
```

Run both servers (or `docker-compose up`), log in with the demo account, and capture the Dashboard, Medications, Calendar, History, Statistics, and Reminder Modal for a complete set.

## Developer Notes & Known Simplifications

Called out explicitly here so they're easy to explain rather than something to be caught out by:

- **`DATABASE_URL` is normalized automatically** (`backend/app/database.py`): a bare `postgres://` or `postgresql://` string — exactly what Neon, Supabase, and most managed Postgres dashboards hand you — is rewritten to `postgresql+psycopg2://` internally, so a connection string can always be pasted in unmodified.
- **Naive datetimes throughout.** The app treats the server's local/UTC time as the single source of truth end-to-end, rather than handling per-user timezones — a reasonable simplification for a single-region student deployment, noted in `backend/app/utils/helpers.py`.
- **Single-process scheduler.** APScheduler runs in-process with the API (no Celery/Redis). Fine for one instance; the README/docstrings note the upgrade path if this ever needed to scale horizontally.
- **Profile photos** are stored as a base64 data URL directly on the `users` row rather than in object storage — avoids standing up a file server/CDN for a single small avatar image.
- **Email delivery is stubbed, not faked.** `notification_service.send_email_notification()` logs what it *would* send and returns `False`; the Forgot Password and email-notification-preference UI are honest about this in the product copy rather than pretending mail goes out.
- **Rate limiting** is a simple in-memory per-process limiter, adequate for a demo; see the [Security](#security) section for the production upgrade path.

## Future Scope

- Wire up a real transactional email provider (SMTP/SendGrid/SES) behind the already-stubbed `send_email_notification`
- Push/SMS notifications (the `notifications` table and service already model a generic notification, not just in-app)
- The AI modules listed in [AI-Ready Architecture](#ai-ready-architecture): schedule optimization, prescription OCR, a medicine-info assistant, missed-dose pattern analysis
- Per-user timezone support
- A caregiver/family-sharing role that can view (not necessarily edit) another user's adherence
- Redis-backed distributed rate limiting and a persistent (Celery/RQ) job queue for the scheduler, for a multi-instance production deployment

---

Built for academic demonstration purposes. This application does not provide medical advice.
