import { useCallback, useEffect, useState } from "react";

import { AdherenceRateCard, AdherenceTrendChart, StatusDonutChart, WeeklyActivityChart } from "../components/charts/Charts";
import { ErrorState, Skeleton } from "../components/common/Feedback";
import { dashboardService } from "../services/resourceServices";
import { extractErrorMessage } from "../services/api";

const WINDOWS = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

export default function StatisticsPage() {
  const [days, setDays] = useState(7);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardService.statistics(days);
      setStats(data);
    } catch (err) {
      setError(extractErrorMessage(err, "Could not load statistics."));
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Statistics</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">How closely you've followed your schedule.</p>
        </div>
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-white/5">
          {WINDOWS.map((w) => (
            <button
              key={w.value}
              type="button"
              onClick={() => setDays(w.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold ${days === w.value ? "bg-white text-primary-600 shadow-sm dark:bg-surface-dark dark:text-primary-400" : "text-slate-500 dark:text-slate-400"}`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : error ? (
        <div className="mt-6"><ErrorState description={error} onRetry={load} /></div>
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <AdherenceRateCard rate={stats.adherence_rate} />
          <div className="lg:col-span-2">
            <StatusDonutChart breakdown={stats.status_breakdown} />
          </div>

          <div className="lg:col-span-3">
            <WeeklyActivityChart data={stats.weekly_activity} />
          </div>

          <div className="lg:col-span-3">
            <AdherenceTrendChart data={stats.weekly_activity} title="Daily Schedule" subtitle="Medication activity by day" />
          </div>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-slate-400">
        Figures reflect your own logged activity only — MediCare does not provide medical advice or clinical outcome data.
      </p>
    </div>
  );
}
