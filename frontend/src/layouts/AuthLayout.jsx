import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Link, Outlet } from "react-router-dom";

const HIGHLIGHTS = [
  "Smart reminders for every dose",
  "One dashboard for schedules & history",
  "Your data stays private and encrypted",
];

export function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-white dark:bg-surface-darker">
      {/* Branding panel — hidden on small screens to keep the form front and center on mobile. */}
      <div className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-600 via-primary-500 to-accent-500 px-10 py-10 text-white lg:flex xl:px-14">
        <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-accent-400/30 blur-3xl" />

        <Link to="/" className="relative z-10 flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-xl backdrop-blur">💊</span>
          <span className="font-display text-xl font-bold">MediCare</span>
        </Link>

        <div className="relative z-10">
          <h2 className="font-display text-3xl font-bold leading-tight xl:text-4xl">
            Never miss your medication again.
          </h2>
          <ul className="mt-8 flex flex-col gap-3.5">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-center gap-3 text-primary-50">
                <CheckCircle2 size={19} className="shrink-0 text-white" />
                <span>{h}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex items-center gap-2.5 rounded-2xl bg-white/10 px-4 py-3 text-sm text-primary-50 backdrop-blur">
            <ShieldCheck size={18} className="shrink-0" />
            Passwords are hashed and every route is protected — only you can see your medications.
          </div>
        </div>

        <p className="relative z-10 text-xs text-primary-100">MediCare · B.Tech CSE (AI) minor project</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-12 lg:px-16 xl:px-24">
        <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500 text-lg">💊</span>
          <span className="font-display text-lg font-bold text-slate-900 dark:text-white">MediCare</span>
        </Link>
        <div className="mx-auto w-full max-w-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
