/** Small, dependency-free date helpers — kept framework-agnostic so they're
 * trivial to reason about and reuse across every page that shows a date. */

export function toISODate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export function formatTime(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "--:--";
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true });
}

export function formatDate(value, opts = {}) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric", ...opts });
}

export function formatDateLong(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function formatDayMonth(value) {
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** "Today" / "Tomorrow" / "Yesterday", falling back to a short date. */
export function formatRelativeDay(value) {
  const d = value instanceof Date ? value : new Date(value);
  const today = new Date();
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(d) - startOf(today)) / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  return formatDate(d);
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

/** Builds a 6-row x 7-col month grid (Mon-first) for the calendar page,
 * padding with the trailing days of the previous/next month so the grid
 * is always a full rectangle. */
export function getMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  // Convert JS's Sunday=0 to a Monday-first index (0=Mon ... 6=Sun).
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    return { date, isCurrentMonth: date.getMonth() === month, iso: toISODate(date) };
  });
}

export function isSameDay(a, b) {
  const da = a instanceof Date ? a : new Date(a);
  const db = b instanceof Date ? b : new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

export function addDays(date, days) {
  const d = date instanceof Date ? new Date(date) : new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function minutesUntil(value) {
  const d = value instanceof Date ? value : new Date(value);
  return Math.round((d.getTime() - Date.now()) / 60000);
}
