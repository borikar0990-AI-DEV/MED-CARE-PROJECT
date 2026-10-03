import { AlertTriangle, CheckCircle2, ClipboardList, Clock3, Plus, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { MedicationTimeline, StatsCard } from "../components/dashboard/DashboardWidgets";
import { EmptyState, ErrorState, Skeleton } from "../components/common/Feedback";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/UIContext";
import { dashboardService, logService } from "../services/resourceServices";
import { extractErrorMessage } from "../services/api";
import { greeting } from "../utils/dateUtils";

export default function DashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await dashboardService.summary();
      setSummary(data);
    } catch (err) {
      setError(extractErrorMessage(err, "Could not load your dashboard."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAction = async (logId, status) => {
    // Optimistic update so the timeline feels instant.
    setSummary((prev) => {
      if (!prev) return prev;
      const today_timeline = prev.today_timeline.map((item) => (item.log_id === logId ? { ...item, status } : item));
      return { ...prev, today_timeline };
    });
    try {
      await logService.setStatus(logId, status);
      showToast(status === "taken" ? "Marked as taken." : "Marked as skipped.", status === "taken" ? "success" : "warning");
      load();
    } catch (err) {
      showToast(extractErrorMessage(err, "Could not update that dose."), "error");
      load();
    }
  };

  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            {greeting()}, {user?.name?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Here is your medication schedule for today — {todayLabel}.
          </p>
        </div>
        <Link to="/app/medications/new" className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-primary-600">
          <Plus size={16} /> Add Medication
        </Link>
      </div>

      {loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[86px]" />
          ))}
        </div>
      ) : error ? (
        <div className="mt-6">
          <ErrorState description={error} onRetry={load} />
        </div>
      ) : (
        <>
          {summary.low_stock.length > 0 && (
            <div className="mt-6 flex items-start gap-2.5 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <span>
                Running low: <strong className="font-semibold">{summary.low_stock.join(", ")}</strong>. Consider a refill soon.
              </span>
            </div>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard icon={ClipboardList} label="Today's Medicines" value={summary.today_total} accent="primary" index={0} />
            <StatsCard icon={CheckCircle2} label="Taken" value={summary.taken_count} accent="secondary" index={1} />
            <StatsCard icon={Clock3} label="Upcoming" value={summary.upcoming_count} accent="amber" index={2} />
            <StatsCard icon={XCircle} label="Missed" value={summary.missed_count} accent="danger" index={3} />
          </div>

          <div className="mt-8">
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Today's Medication Timeline</h2>

            {summary.today_timeline.length === 0 ? (
              <div className="mt-3 rounded-2xl bg-white shadow-card ring-1 ring-slate-100 dark:bg-surface-dark dark:ring-white/5">
                <EmptyState
                  icon="💊"
                  title="Nothing scheduled for today"
                  description="Add a medicine to start building your daily schedule."
                  action={
                    <Link to="/app/medications/new" className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600">
                      <Plus size={15} /> Add your first medicine
                    </Link>
                  }
                />
              </div>
            ) : (
              <div className="mt-4">
                <MedicationTimeline items={summary.today_timeline} onAction={handleAction} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
