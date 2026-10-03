import { motion } from "framer-motion";
import { CalendarRange, Eye, Pause, Pencil, Play, Trash2 } from "lucide-react";

import { FREQUENCIES, INSTRUCTIONS, MEDICATION_TYPES, labelFor } from "../../utils/constants";
import { formatDate } from "../../utils/dateUtils";

export function MedicationCard({ medication, onView, onEdit, onDelete, onTogglePause, index = 0 }) {
  const typeInfo = MEDICATION_TYPES.find((t) => t.value === medication.type) || MEDICATION_TYPES[0];
  const TypeIcon = typeInfo.icon;
  const times = [...medication.schedules].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index, 8) * 0.03 }}
      className={`flex flex-col rounded-2xl border bg-white p-5 shadow-card dark:bg-surface-dark ${
        medication.is_active ? "border-slate-100 dark:border-white/5" : "border-slate-100 opacity-70 dark:border-white/5"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300">
            <TypeIcon size={20} />
          </span>
          <div>
            <p className="font-display text-base font-semibold text-slate-900 dark:text-white">{medication.name}</p>
            <p className="text-xs text-slate-400">{typeInfo.label} · {medication.dosage}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              medication.is_active
                ? "bg-secondary-50 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300"
                : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400"
            }`}
          >
            {medication.is_active ? "Active" : "Paused"}
          </span>
          {medication.is_demo && (
            <span className="rounded-full bg-accent-50 px-2.5 py-1 text-[11px] font-semibold text-accent-600 dark:bg-accent-900/30 dark:text-accent-300">
              Demo
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {times.map((s) => (
          <span key={s.id} className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-white/5 dark:text-slate-300">
            {s.time.slice(0, 5)}
          </span>
        ))}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-y-2 text-xs">
        <dt className="text-slate-400">Frequency</dt>
        <dd className="text-right font-medium text-slate-600 dark:text-slate-300">{labelFor(FREQUENCIES, medication.frequency)}</dd>
        <dt className="text-slate-400">Instructions</dt>
        <dd className="text-right font-medium text-slate-600 dark:text-slate-300">{labelFor(INSTRUCTIONS, medication.instructions)}</dd>
        {medication.quantity !== null && medication.quantity !== undefined && (
          <>
            <dt className="text-slate-400">Remaining</dt>
            <dd className={`text-right font-medium ${medication.quantity <= 5 ? "text-danger-600 dark:text-danger-400" : "text-slate-600 dark:text-slate-300"}`}>
              {medication.quantity} unit{medication.quantity === 1 ? "" : "s"}
            </dd>
          </>
        )}
      </dl>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
        <CalendarRange size={13} />
        {formatDate(medication.start_date)} {medication.end_date ? `– ${formatDate(medication.end_date)}` : "· ongoing"}
      </p>

      <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 dark:border-white/5">
        <button type="button" onClick={() => onView(medication)} aria-label="View details" className="flex-1 rounded-lg py-1.5 text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5">
          <Eye size={16} className="mx-auto" />
        </button>
        <button type="button" onClick={() => onEdit(medication)} aria-label="Edit medication" className="flex-1 rounded-lg py-1.5 text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5">
          <Pencil size={16} className="mx-auto" />
        </button>
        <button
          type="button"
          onClick={() => onTogglePause(medication)}
          aria-label={medication.is_active ? "Pause medication" : "Resume medication"}
          className="flex-1 rounded-lg py-1.5 text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"
        >
          {medication.is_active ? <Pause size={16} className="mx-auto" /> : <Play size={16} className="mx-auto" />}
        </button>
        <button type="button" onClick={() => onDelete(medication)} aria-label="Delete medication" className="flex-1 rounded-lg py-1.5 text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20">
          <Trash2 size={16} className="mx-auto" />
        </button>
      </div>
    </motion.div>
  );
}

export default MedicationCard;
