import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { getMonthGrid, isSameDay, toISODate } from "../../utils/dateUtils";

const MONTH_LABEL = (year, month) => new Date(year, month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Month-grid calendar. `logsByDate` is a map of ISO date -> { taken, skipped, missed, pending }
 * (the parent page owns fetching /api/logs and grouping them — this component
 * only renders the grid and reports which day is selected).
 */
export function MedicationCalendar({ logsByDate = {}, selectedDate, onSelectDate, onMonthChange }) {
  const initial = selectedDate ? new Date(selectedDate) : new Date();
  const [cursor, setCursor] = useState({ year: initial.getFullYear(), month: initial.getMonth() });

  const grid = useMemo(() => getMonthGrid(cursor.year, cursor.month), [cursor]);
  const today = new Date();

  const changeMonth = (delta) => {
    const next = new Date(cursor.year, cursor.month + delta, 1);
    const value = { year: next.getFullYear(), month: next.getMonth() };
    setCursor(value);
    onMonthChange?.(value);
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-100 dark:bg-surface-dark dark:ring-white/5 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-display text-base font-semibold text-slate-900 dark:text-white">{MONTH_LABEL(cursor.year, cursor.month)}</p>
        <div className="flex gap-1">
          <button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5">
            <ChevronLeft size={18} />
          </button>
          <button type="button" onClick={() => changeMonth(1)} aria-label="Next month" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {WEEKDAY_LABELS.map((d) => (
          <span key={d} className="py-1.5">{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {grid.map(({ date, isCurrentMonth, iso }) => {
          const summary = logsByDate[iso];
          const isToday = isSameDay(date, today);
          const isSelected = selectedDate && isSameDay(date, new Date(selectedDate));

          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDate?.(iso)}
              className={`relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl text-sm transition-colors ${
                !isCurrentMonth ? "text-slate-300 dark:text-slate-600" : "text-slate-700 dark:text-slate-200"
              } ${isSelected ? "bg-primary-500 text-white hover:bg-primary-600" : "hover:bg-slate-100 dark:hover:bg-white/5"} ${
                isToday && !isSelected ? "ring-1 ring-primary-300 dark:ring-primary-700" : ""
              }`}
            >
              <span className="font-medium">{date.getDate()}</span>
              {summary && (
                <span className="flex gap-0.5">
                  {summary.missed > 0 && <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-danger-500"}`} />}
                  {summary.taken > 0 && <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-secondary-500"}`} />}
                  {summary.pending > 0 && <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-primary-400"}`} />}
                  {summary.skipped > 0 && <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-amber-500"}`} />}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-white/5 dark:text-slate-400">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-secondary-500" /> Taken</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary-400" /> Upcoming</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Skipped</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-danger-500" /> Missed</span>
      </div>
    </div>
  );
}

export function buildLogsByDate(logs = []) {
  const map = {};
  for (const log of logs) {
    const iso = toISODate(log.scheduled_time);
    if (!map[iso]) map[iso] = { taken: 0, skipped: 0, missed: 0, pending: 0 };
    map[iso][log.status] = (map[iso][log.status] || 0) + 1;
  }
  return map;
}

export default MedicationCalendar;
