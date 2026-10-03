import { motion } from "framer-motion";
import {
  AlarmClock,
  ArrowRight,
  BellRing,
  CalendarClock,
  CalendarDays,
  Check,
  Clock,
  History,
  LineChart,
  Pill,
  PlusCircle,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { Link } from "react-router-dom";

const FEATURES = [
  { icon: AlarmClock, title: "Smart Medication Reminders", description: "Timed alerts for every dose, with Take / Skip / Remind Later right from the notification.", accent: "primary" },
  { icon: Pill, title: "Easy Medicine Management", description: "Add, edit, pause or remove medicines in seconds — tablets, syrups, injections and more.", accent: "secondary" },
  { icon: History, title: "Medication History", description: "A complete, filterable log of every dose — taken, skipped, or missed — with adherence trends.", accent: "accent" },
  { icon: CalendarDays, title: "Daily Schedule", description: "A calendar view of what's due today and every day ahead, at a glance.", accent: "amber" },
  { icon: BellRing, title: "Notification Alerts", description: "Browser notifications that reach you the moment a dose is due, even in another tab.", accent: "primary" },
  { icon: ShieldCheck, title: "Secure Data Storage", description: "Passwords are hashed, routes are protected, and only you can ever see your medications.", accent: "secondary" },
];

const STEPS = [
  { icon: PlusCircle, title: "Add Medicine", description: "Enter the name, dosage, and type — or just describe it in plain English." },
  { icon: CalendarClock, title: "Set Schedule", description: "Pick how often and what times. Custom schedules are supported too." },
  { icon: BellRing, title: "Receive Reminder", description: "Get notified right when a dose is due, wherever you're using MediCare." },
  { icon: LineChart, title: "Track Medication", description: "Mark it taken or skipped — your history and stats update instantly." },
];

const HIGHLIGHTS = [
  { icon: CalendarDays, label: "Easy scheduling" },
  { icon: Clock, label: "24/7 access" },
  { icon: ShieldCheck, label: "Secure storage" },
  { icon: Smartphone, label: "Responsive design" },
];

const ACCENT_STYLES = {
  primary: "bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300",
  secondary: "bg-secondary-50 text-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-300",
  accent: "bg-accent-50 text-accent-600 dark:bg-accent-900/30 dark:text-accent-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

function HeroMockup() {
  const rows = [
    { time: "8:00 AM", name: "Vitamin Tablet", dose: "1 tablet", state: "taken" },
    { time: "2:00 PM", name: "Paracetamol", dose: "500 mg", state: "now" },
    { time: "9:00 PM", name: "Cough Syrup", dose: "10 ml", state: "upcoming" },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="relative mx-auto w-full max-w-sm lg:mx-0"
    >
      <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-primary-100 via-secondary-50 to-accent-100 blur-2xl dark:from-primary-900/30 dark:via-secondary-900/20 dark:to-accent-900/30" />
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card dark:border-white/10 dark:bg-surface-dark">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Good Evening, Harsh 👋</p>
            <p className="font-display text-sm font-semibold text-slate-900 dark:text-white">Today's Schedule</p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-100 text-sm font-semibold text-accent-700 dark:bg-accent-900/50 dark:text-accent-300">H</span>
        </div>

        <div className="mt-4 flex flex-col gap-2.5">
          {rows.map((r) => (
            <div key={r.name} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm dark:bg-surface-darker">💊</div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-400">{r.time}</p>
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{r.name}</p>
                <p className="text-xs text-slate-400">{r.dose}</p>
              </div>
              {r.state === "taken" && (
                <span className="flex shrink-0 items-center gap-1 rounded-lg bg-secondary-100 px-2 py-1 text-[11px] font-semibold text-secondary-700 dark:bg-secondary-900/40 dark:text-secondary-300">
                  <Check size={12} /> Taken
                </span>
              )}
              {r.state === "now" && (
                <span className="shrink-0 rounded-lg bg-primary-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow-soft">Take Now</span>
              )}
              {r.state === "upcoming" && (
                <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-300">Upcoming</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, x: -10 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="absolute -left-6 -top-5 hidden items-center gap-2 rounded-2xl bg-white px-3.5 py-2.5 shadow-card ring-1 ring-slate-100 dark:bg-surface-dark dark:ring-white/10 sm:flex"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-white">
          <BellRing size={15} />
        </span>
        <div>
          <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-100">Reminder sent</p>
          <p className="text-[10px] text-slate-400">Just now</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 pb-16 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-2 lg:items-center lg:pb-24 lg:pt-24">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 dark:text-white sm:text-5xl"
            >
              Never Miss Your Medication Again.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-5 max-w-md text-base leading-relaxed text-slate-500 dark:text-slate-400"
            >
              Manage your medicines, schedules, reminders, and medication history from one simple and intelligent platform.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-soft hover:bg-primary-600">
                Get Started <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:text-slate-200 dark:ring-white/10 dark:hover:bg-white/5">
                Login
              </Link>
            </motion.div>

            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
              {HIGHLIGHTS.map((h) => (
                <span key={h.label} className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <h.icon size={16} className="text-primary-500" /> {h.label}
                </span>
              ))}
            </div>
          </div>

          <HeroMockup />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-slate-100 bg-surface-soft py-20 dark:border-white/5 dark:bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Everything you need to stay on schedule</h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400">Built around the parts of medication management people actually forget.</p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: (i % 3) * 0.06 }}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-card dark:border-white/5 dark:bg-surface-dark"
              >
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${ACCENT_STYLES[f.accent]}`}>
                  <f.icon size={20} />
                </span>
                <h3 className="mt-4 font-display text-base font-semibold text-slate-900 dark:text-white">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white">How it works</h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400">Four steps between you and a schedule you'll actually stick to.</p>
          </div>

          <div className="relative mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="absolute left-0 right-0 top-6 hidden h-px bg-slate-200 dark:bg-white/10 lg:block" aria-hidden="true" />
            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                className="relative flex flex-col items-start"
              >
                <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500 font-display text-sm font-bold text-white shadow-soft">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <step.icon size={20} className="mt-4 text-primary-500" />
                <h3 className="mt-2 font-display text-base font-semibold text-slate-900 dark:text-white">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-100 py-20 dark:border-white/5">
        <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
          <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Ready to take control of your medication schedule?</h2>
          <p className="mx-auto mt-3 max-w-md text-slate-500 dark:text-slate-400">Create a free account and add your first medicine in under a minute.</p>
          <Link to="/register" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary-500 px-7 py-3.5 text-sm font-semibold text-white shadow-soft hover:bg-primary-600">
            Get Started <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
