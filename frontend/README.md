# MediCare Frontend (React + Vite + Tailwind)

The web app for the MediCare medication reminder system. See the [root README](../README.md) for the full project overview and architecture — this file covers just the frontend.

## Quick start

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`. The dev server expects the backend to be running at `http://localhost:8000` (see `../backend/README.md`) — change `VITE_API_BASE_URL` in `.env` if yours lives elsewhere.

## Scripts

| Command           | What it does                                  |
| ------------------ | ---------------------------------------------- |
| `npm run dev`       | Start the Vite dev server with hot reload      |
| `npm run build`     | Production build to `dist/`                    |
| `npm run preview`   | Serve the production build locally, to sanity-check it |

## Project layout

```
src/
├── main.jsx          Entry point — wraps <App/> in Router, Theme, Toast, Auth providers
├── App.jsx            All routes (React Router)
├── layouts/            PublicLayout (marketing), AuthLayout (login/register), DashboardLayout (the app shell)
├── pages/              One file per route/screen
├── components/         Reusable UI, grouped by feature area
├── context/            AuthContext (session) + UIContext (theme, toasts)
├── hooks/               useReminderEngine — polls for due doses, drives browser notifications + the reminder modal
├── services/            One thin wrapper per API resource, all built on services/api.js (the shared Axios instance)
└── utils/                Framework-agnostic helpers: dates, validators, shared constants (status colors, labels, icons)
```

## How the pieces fit together

- **Auth**: `authService` stores the JWT in `localStorage` (if "Remember me" was checked) or `sessionStorage` otherwise. `AuthContext` reads it on load and exposes `user` / `isAuthenticated` to the whole app. A 401 from any request triggers a `medicare:session-expired` event (see `services/api.js`) that logs the user out everywhere at once.
- **Reminders**: `useReminderEngine` (mounted once, in `DashboardLayout`) polls `/dashboard/summary` every 30s. A dose due within 10 minutes triggers a browser `Notification` (if permission was granted) and queues an in-app `<ReminderModal/>`. Taken/Skip/Snooze all call back into `logService`.
- **Design tokens**: colors, fonts, shadows and animation curves are all defined once in `tailwind.config.js` and reused everywhere — there's no per-component color literal.
- **Dark mode**: class-based (`darkMode: "class"` in the Tailwind config), toggled by `ThemeContext`, persisted to `localStorage`, and defaults to the OS preference on first visit.

## Building for production / Docker

```bash
npm run build       # outputs static files to dist/
```

The provided `Dockerfile` builds this and serves it with nginx (see `nginx.conf` for the SPA fallback routing); `../docker-compose.yml` wires it up alongside the backend and database automatically.
