import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AdherenceTrendChart } from "../components/charts/Charts";
import { EmptyState, ErrorState, Skeleton } from "../components/common/Feedback";
import { dashboardService, logService, medicationService } from "../services/resourceServices";
import { extractErrorMessage } from "../services/api";
import { LOG_STATUS_META } from "../utils/constants";
import { formatDate, formatTime } from "../utils/dateUtils";

const PAGE_SIZE = 15;
const TREND_WINDOWS = [7, 30, 90];

function StatusPill({ status }) {
  const meta = LOG_STATUS_META[status] || LOG_STATUS_META.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${meta.bgClass} ${meta.textClass}`}>
      <meta.icon size={12} /> {meta.label}
    </span>
  );
}

export default function HistoryPage() {
  const [medications, setMedications] = useState([]);
  const [filters, setFilters] = useState({ startDate: "", endDate: "", medicationId: "", status: "" });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [trendWindow, setTrendWindow] = useState(30);
  const [trend, setTrend] = useState(null);

  useEffect(() => {
    medicationService.list({ pageSize: 100 }).then((r) => setMedications(r.items)).catch(() => {});
  }, []);

  useEffect(() => {
    dashboardService.statistics(trendWindow).then(setTrend).catch(() => {});
  }, [trendWindow]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await logService.list({
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        medicationId: filters.medicationId || undefined,
        status: filters.status || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setResult(data);
    } catch (err) {
      setError(extractErrorMessage(err, "Could not load medication history."));
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    load();
  }, [load]);

  const setFilter = (patch) => {
    setPage(1);
    setFilters((f) => ({ ...f, ...patch }));
  };

  const resetFilters = () => {
    setPage(1);
    setFilters({ startDate: "", endDate: "", medicationId: "", status: "" });
  };

  const hasActiveFilters = filters.startDate || filters.endDate || filters.medicationId || filters.status;

  const selectClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white";

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Medication History</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Every dose, logged — filter it down or see the trend.</p>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Adherence Trend</p>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-white/5">
            {TREND_WINDOWS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setTrendWindow(w)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold ${trendWindow === w ? "bg-white text-primary-600 shadow-sm dark:bg-surface-dark dark:text-primary-400" : "text-slate-500 dark:text-slate-400"}`}
              >
                {w}d
              </button>
            ))}
          </div>
        </div>
        {trend ? (
          <AdherenceTrendChart data={trend.weekly_activity} title=" " subtitle={`Last ${trendWindow} days · ${trend.adherence_rate}% adherence`} />
        ) : (
          <Skeleton className="h-64" />
        )}
      </div>

      <div className="mt-8 grid gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-100 dark:bg-surface-dark dark:ring-white/5 sm:grid-cols-5">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">From</label>
          <input type="date" value={filters.startDate} onChange={(e) => setFilter({ startDate: e.target.value })} className={selectClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">To</label>
          <input type="date" value={filters.endDate} onChange={(e) => setFilter({ endDate: e.target.value })} className={selectClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Medicine</label>
          <select value={filters.medicationId} onChange={(e) => setFilter({ medicationId: e.target.value })} className={selectClass}>
            <option value="">All medicines</option>
            {medications.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Status</label>
          <select value={filters.status} onChange={(e) => setFilter({ status: e.target.value })} className={selectClass}>
            <option value="">All statuses</option>
            {Object.entries(LOG_STATUS_META).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <button type="button" onClick={resetFilters} disabled={!hasActiveFilters} className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-white/5">
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 flex flex-col gap-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : error ? (
        <div className="mt-6"><ErrorState description={error} onRetry={load} /></div>
      ) : result.items.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-white shadow-card ring-1 ring-slate-100 dark:bg-surface-dark dark:ring-white/5">
          <EmptyState icon="📜" title="No history yet" description={hasActiveFilters ? "No entries match these filters." : "Once you start taking your medicines, they'll show up here."} />
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-100 dark:bg-surface-dark dark:ring-white/5">
            <div className="scroll-thin overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400 dark:border-white/5">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Medicine</th>
                    <th className="px-4 py-3 font-medium">Scheduled Time</th>
                    <th className="px-4 py-3 font-medium">Action Taken</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {result.items.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.03]">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(log.scheduled_time)}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{log.medication_name}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">{formatTime(log.scheduled_time)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">{log.action_time ? formatTime(log.action_time) : "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3"><StatusPill status={log.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {result.total_pages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-white/5">
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-slate-500 dark:text-slate-400">Page {result.page} of {result.total_pages}</span>
              <button type="button" disabled={page >= result.total_pages} onClick={() => setPage((p) => p + 1)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-white/5">
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
