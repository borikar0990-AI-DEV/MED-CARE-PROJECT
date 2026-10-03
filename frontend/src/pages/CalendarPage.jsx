import { Check, SkipForward } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { buildLogsByDate, MedicationCalendar } from "../components/calendar/MedicationCalendar";
import { EmptyState, ErrorState, Skeleton } from "../components/common/Feedback";
import { useToast } from "../context/UIContext";
import { extractErrorMessage } from "../services/api";
import { logService } from "../services/resourceServices";
import { LOG_STATUS_META, MEDICATION_TYPES } from "../utils/constants";
import { formatDateLong, formatTime, toISODate } from "../utils/dateUtils";

export default function CalendarPage() {
  const { showToast } = useToast();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState(toISODate(new Date()));
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    // Fetch a little outside the visible month so the leading/trailing
    // days shown in the grid (from adjacent months) still get their dots.
    const rangeStart = toISODate(new Date(cursor.year, cursor.month - 1, 25));
    const rangeEnd = toISODate(new Date(cursor.year, cursor.month + 2, 5));
    try {
      const data = await logService.list({ startDate: rangeStart, endDate: rangeEnd, pageSize: 200 });
      setLogs(data.items);
    } catch (err) {
      setError(extractErrorMessage(err, "Could not load your schedule."));
    } finally {
      setLoading(false);
    }
  }, [cursor]);

  useEffect(() => {
    load();
  }, [load]);

  const logsByDate = useMemo(() => buildLogsByDate(logs), [logs]);

  const selectedDayLogs = useMemo(
    () =>
      logs
        .filter((l) => toISODate(l.scheduled_time) === selectedDate)
        .sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time)),
    [logs, selectedDate]
  );

  const handleAction = async (logId, status) => {
    setLogs((prev) => prev.map((l) => (l.id === logId ? { ...l, status } : l)));
    try {
      await logService.setStatus(logId, status);
      showToast(status === "taken" ? "Marked as taken." : "Marked as skipped.", status === "taken" ? "success" : "warning");
    } catch (err) {
      showToast(extractErrorMessage(err), "error");
      load();
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Calendar & Schedule</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Pick a date to see what's scheduled.</p>

      {loading && logs.length === 0 ? (
        <Skeleton className="mt-6 h-96" />
      ) : error ? (
        <div className="mt-6"><ErrorState description={error} onRetry={load} /></div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <MedicationCalendar
            logsByDate={logsByDate}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onMonthChange={setCursor}
          />

          <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 dark:bg-surface-dark dark:ring-white/5">
            <p className="font-display text-base font-semibold text-slate-900 dark:text-white">{formatDateLong(selectedDate)}</p>

            {selectedDayLogs.length === 0 ? (
              <div className="mt-2">
                <EmptyState icon="🗓️" title="Nothing scheduled" description="No medications are scheduled for this day." />
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                {selectedDayLogs.map((log) => {
                  const meta = LOG_STATUS_META[log.status] || LOG_STATUS_META.pending;
                  const TypeIcon = MEDICATION_TYPES.find((t) => t.value === log.medication_type)?.icon;
                  return (
                    <div key={log.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 dark:border-white/5">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.bgClass}`}>
                        {TypeIcon ? <TypeIcon size={16} className={meta.textClass} /> : <span>💊</span>}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-400">{formatTime(log.scheduled_time)}</p>
                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{log.medication_name}</p>
                      </div>
                      {log.status === "pending" ? (
                        <div className="flex shrink-0 gap-1.5">
                          <button type="button" onClick={() => handleAction(log.id, "taken")} aria-label="Mark taken" className="rounded-lg bg-secondary-500 p-1.5 text-white hover:bg-secondary-600">
                            <Check size={14} />
                          </button>
                          <button type="button" onClick={() => handleAction(log.id, "skipped")} aria-label="Skip" className="rounded-lg p-1.5 text-slate-400 ring-1 ring-slate-200 hover:bg-slate-50 dark:ring-white/10">
                            <SkipForward size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold ${meta.bgClass} ${meta.textClass}`}>{meta.label}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
