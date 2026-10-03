import { CheckCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { ErrorState, Skeleton } from "../components/common/Feedback";
import { NotificationList } from "../components/notifications/NotificationPanel";
import { useToast } from "../context/UIContext";
import { extractErrorMessage } from "../services/api";
import { notificationService } from "../services/resourceServices";

export default function NotificationsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationService.list({ limit: 100 });
      setItems(data);
    } catch (err) {
      setError(extractErrorMessage(err, "Could not load notifications."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unreadCount = items.filter((i) => !i.is_read).length;

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationService.markAllRead();
      setItems((prev) => prev.map((i) => ({ ...i, is_read: true })));
      showToast("All notifications marked as read.", "success");
    } catch (err) {
      showToast(extractErrorMessage(err), "error");
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            disabled={markingAll}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-primary-600 ring-1 ring-primary-200 hover:bg-primary-50 disabled:opacity-60 dark:text-primary-400 dark:ring-primary-800 dark:hover:bg-primary-900/20"
          >
            <CheckCheck size={16} /> Mark all as read
          </button>
        )}
      </div>

      <div className="mt-6 rounded-2xl bg-white shadow-card ring-1 ring-slate-100 dark:bg-surface-dark dark:ring-white/5">
        {loading ? (
          <div className="flex flex-col gap-2 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : error ? (
          <div className="p-2"><ErrorState description={error} onRetry={load} /></div>
        ) : (
          <NotificationList items={items} onChanged={setItems} />
        )}
      </div>
    </div>
  );
}
