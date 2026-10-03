import { useCallback, useEffect, useRef, useState } from "react";

import { dashboardService, logService } from "../services/resourceServices";
import { minutesUntil } from "../utils/dateUtils";
import { useToast } from "../context/UIContext";

const POLL_MS = 30_000;
const UPCOMING_WINDOW_MINUTES = 10; // mirrors backend UPCOMING_NOTICE_MINUTES

/**
 * Polls the dashboard summary for doses that are due, and turns them into:
 *   1. a native browser Notification (if permission was granted), and
 *   2. an in-app queue the <ReminderModal/> reads from (`activeReminder`),
 * so a reminder shows up whether or not the tab currently has focus.
 *
 * Mounted once, high in the tree (see layouts/DashboardLayout.jsx), so it
 * keeps running no matter which authenticated page the user is looking at.
 */
export function useReminderEngine({ enabled }) {
  const { showToast } = useToast();
  const [queue, setQueue] = useState([]);
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );
  const promptedRef = useRef(new Set());
  const timersRef = useRef({});

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return "unsupported";
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const notifyBrowser = useCallback(
    (item) => {
      if (permission !== "granted" || typeof Notification === "undefined") return;
      try {
        const n = new Notification("🔔 Medication Reminder", {
          body: `Time to take ${item.medication_name} — ${item.dosage}`,
          tag: `medicare-log-${item.log_id}`,
        });
        n.onclick = () => {
          window.focus();
          n.close();
        };
      } catch {
        // Some browsers (older mobile Safari, etc.) throw on `new Notification`
        // outside a service worker — the in-app modal still covers us.
      }
    },
    [permission]
  );

  const poll = useCallback(async () => {
    try {
      const summary = await dashboardService.summary();
      const due = (summary.today_timeline || []).filter(
        (item) => item.status === "pending" && minutesUntil(item.scheduled_time) <= UPCOMING_WINDOW_MINUTES
      );

      const fresh = due.filter((item) => !promptedRef.current.has(item.log_id));
      if (fresh.length === 0) return;

      fresh.forEach((item) => {
        promptedRef.current.add(item.log_id);
        notifyBrowser(item);
      });
      setQueue((prev) => [...prev, ...fresh]);
    } catch {
      // Silent by design: a missed poll (e.g. token refresh in flight) will
      // just be retried on the next tick, no need to surface a toast for it.
    }
  }, [notifyBrowser]);

  useEffect(() => {
    if (!enabled) return undefined;
    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => Object.values(timers).forEach(clearTimeout);
  }, []);

  const activeReminder = queue[0] || null;

  const popFront = useCallback(() => setQueue((prev) => prev.slice(1)), []);

  const act = useCallback(
    async (status) => {
      if (!activeReminder) return;
      const item = activeReminder;
      popFront();
      try {
        await logService.setStatus(item.log_id, status);
        showToast(
          status === "taken" ? `Marked ${item.medication_name} as taken.` : `Skipped ${item.medication_name}.`,
          status === "taken" ? "success" : "warning"
        );
      } catch {
        showToast("Could not update that dose. Please try from the dashboard.", "error");
      }
    },
    [activeReminder, popFront, showToast]
  );

  const markTaken = useCallback(() => act("taken"), [act]);
  const markSkipped = useCallback(() => act("skipped"), [act]);

  /** "Remind me later": hide the modal now, re-queue it in 10 minutes. */
  const snooze = useCallback(() => {
    if (!activeReminder) return;
    const item = activeReminder;
    popFront();
    const timerId = setTimeout(() => setQueue((prev) => [...prev, item]), 10 * 60 * 1000);
    timersRef.current[item.log_id] = timerId;
  }, [activeReminder, popFront]);

  return { activeReminder, queueLength: queue.length, markTaken, markSkipped, snooze, permission, requestPermission };
}

export default useReminderEngine;
