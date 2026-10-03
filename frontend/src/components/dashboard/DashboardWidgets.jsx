import { motion } from "framer-motion";
import { Check, SkipForward } from "lucide-react";
import { useEffect, useState } from "react";

import { LOG_STATUS_META, MEDICATION_TYPES } from "../../utils/constants";
import { formatTime, minutesUntil } from "../../utils/dateUtils";

function useCountUp(value, duration = 700) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const from = 0;
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) * (1 - progress); // ease-out
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return display;
}

const ACCENT_CLASSES = {
  primary: "bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300",
  secondary: "bg-secondary-50 text-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  danger: "bg-danger-50 text-danger-600 dark:bg-danger-900/30 dark:text-danger-300",
};

export function StatsCard({ icon: Icon, label, value, accent = "primary", index = 0 }) {
  const count = useCountUp(value);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 dark:bg-surface-dark dark:ring-white/5"
    >
      <div className="flex items-center gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${ACCENT_CLASSES[accent]}`}>
          <Icon size={20} />
        </span>
        <div>
          <p className="font-display text-2xl font-bold text-slate-900 dark:text-white">{count}</p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

function TimelineRow({ item, onAction, isLast }) {
  const meta = LOG_STATUS_META[item.status] || LOG_STATUS_META.pending;
  const TypeIcon = MEDICATION_TYPES.find((t) => t.value === item.medication_type)?.icon;
  const dueSoon = item.status === "pending" && minutesUntil(item.scheduled_time) <= 15;

  return (
    <div className="relative flex gap-4 pb-6">
      {!isLast && <span className="absolute left-[19px] top-10 h-[calc(100%-2rem)] w-px bg-slate-100 dark:bg-white/10" />}
      <div className="flex flex-col items-center">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 ring-white dark:ring-surface-darker ${meta.bgClass}`}>
          {TypeIcon ? <TypeIcon size={17} className={meta.textClass} /> : <span>💊</span>}
        </span>
      </div>

      <div className="flex-1 rounded-2xl border border-slate-100 bg-white p-4 dark:border-white/5 dark:bg-surface-dark">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{formatTime(item.scheduled_time)}</p>
            <p className="font-display text-base font-semibold text-slate-900 dark:text-white">{item.medication_name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{item.dosage}</p>
          </div>

          {item.status === "pending" ? (
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => onAction(item.log_id, "taken")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${
                  dueSoon ? "bg-primary-500 hover:bg-primary-600" : "bg-slate-800 hover:bg-slate-900 dark:bg-white/10 dark:hover:bg-white/20"
                }`}
              >
                <Check size={13} /> {dueSoon ? "Take Now" : "Mark Taken"}
              </button>
              <button
                type="button"
                onClick={() => onAction(item.log_id, "skipped")}
                aria-label="Skip this dose"
                className="inline-flex items-center rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50 dark:text-slate-300 dark:ring-white/10 dark:hover:bg-white/5"
              >
                <SkipForward size={14} />
              </button>
            </div>
          ) : (
            <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${meta.bgClass} ${meta.textClass}`}>
              <meta.icon size={13} /> {meta.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function MedicationTimeline({ items, onAction }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mt-1">
      {items.map((item, i) => (
        <TimelineRow key={item.log_id} item={item} onAction={onAction} isLast={i === items.length - 1} />
      ))}
    </div>
  );
}
