import { Trash2 } from "lucide-react";

import { notificationService } from "../../services/resourceServices";
import { NOTIFICATION_TYPE_META } from "../../utils/constants";
import { EmptyState } from "../common/Feedback";

export function timeAgo(value) {
  const d = new Date(value);
  const seconds = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/**
 * Renders a list of notifications. Used both inside the navbar bell's
 * dropdown (`compact`) and on the full Notification Center page.
 * Talks to the API directly for read/delete so every consumer stays in
 * sync without threading state through several layers of props.
 */
export function NotificationList({ items, compact = false, onChanged }) {
  if (!items || items.length === 0) {
    return (
      <div className={compact ? "px-4 py-8" : "py-12"}>
        <EmptyState
          icon="🔔"
          title="You're all caught up"
          description="New reminders and updates will show up here."
        />
      </div>
    );
  }

  const patch = (id, changes) => {
    onChanged?.(items.map((n) => (n.id === id ? { ...n, ...changes } : n)));
  };

  const remove = (id) => {
    onChanged?.(items.filter((n) => n.id !== id));
  };

  const handleClick = async (item) => {
    if (item.is_read) return;
    patch(item.id, { is_read: true });
    try {
      await notificationService.markRead(item.id);
    } catch {
      patch(item.id, { is_read: false }); // roll back on failure
    }
  };

  const handleDelete = async (e, item) => {
    e.stopPropagation();
    remove(item.id);
    try {
      await notificationService.remove(item.id);
    } catch {
      onChanged?.([...items]); // best-effort — a manual refresh will reconcile
    }
  };

  return (
    <ul className="divide-y divide-slate-100 dark:divide-white/5">
      {items.map((item) => {
        const meta = NOTIFICATION_TYPE_META[item.notification_type] || NOTIFICATION_TYPE_META.system;
        const Icon = meta.icon;
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => handleClick(item)}
              className={`group flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/5 ${
                compact ? "px-2 py-2.5" : "px-2"
              }`}
            >
              <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.bgClass}`}>
                <Icon size={16} className={meta.textClass} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className={`truncate text-sm ${item.is_read ? "font-medium text-slate-600 dark:text-slate-300" : "font-semibold text-slate-900 dark:text-white"}`}>
                    {item.title}
                  </span>
                  {!item.is_read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" aria-label="Unread" />}
                </span>
                <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">{item.message}</span>
                <span className="mt-1 block text-[11px] text-slate-400">{timeAgo(item.created_at)}</span>
              </span>
              {!compact && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => handleDelete(e, item)}
                  onKeyDown={(e) => e.key === "Enter" && handleDelete(e, item)}
                  aria-label="Delete notification"
                  className="shrink-0 rounded-lg p-1.5 text-slate-300 opacity-0 hover:bg-danger-50 hover:text-danger-500 group-hover:opacity-100 dark:hover:bg-danger-900/20"
                >
                  <Trash2 size={15} />
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default NotificationList;
