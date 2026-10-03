import {
  Pill,
  FlaskConical,
  Syringe,
  Droplet,
  HelpCircle,
  CheckCircle2,
  XCircle,
  SkipForward,
  Clock3,
  BellRing,
  AlertTriangle,
  CalendarDays,
  Info,
} from "lucide-react";

export const MEDICATION_TYPES = [
  { value: "tablet", label: "Tablet", icon: Pill },
  { value: "capsule", label: "Capsule", icon: Pill },
  { value: "syrup", label: "Syrup", icon: FlaskConical },
  { value: "injection", label: "Injection", icon: Syringe },
  { value: "drops", label: "Drops", icon: Droplet },
  { value: "other", label: "Other", icon: HelpCircle },
];

export const FREQUENCIES = [
  { value: "once_daily", label: "Once daily", defaultTimes: ["08:00"] },
  { value: "twice_daily", label: "Twice daily", defaultTimes: ["08:00", "20:00"] },
  { value: "thrice_daily", label: "Three times daily", defaultTimes: ["08:00", "14:00", "20:00"] },
  { value: "custom", label: "Custom", defaultTimes: ["08:00"] },
];

export const INSTRUCTIONS = [
  { value: "before_food", label: "Before food" },
  { value: "after_food", label: "After food" },
  { value: "with_food", label: "With food" },
  { value: "other", label: "Other" },
];

export const WEEKDAYS = [
  { code: "MON", label: "Mon" },
  { code: "TUE", label: "Tue" },
  { code: "WED", label: "Wed" },
  { code: "THU", label: "Thu" },
  { code: "FRI", label: "Fri" },
  { code: "SAT", label: "Sat" },
  { code: "SUN", label: "Sun" },
];

/** Visual language for a dose's status — used on the dashboard timeline,
 * medication cards, calendar, and history page so it's identical everywhere. */
export const LOG_STATUS_META = {
  taken: { label: "Taken", icon: CheckCircle2, color: "secondary", textClass: "text-secondary-600 dark:text-secondary-400", bgClass: "bg-secondary-50 dark:bg-secondary-900/30", dotClass: "bg-secondary-500" },
  pending: { label: "Upcoming", icon: Clock3, color: "primary", textClass: "text-primary-600 dark:text-primary-400", bgClass: "bg-primary-50 dark:bg-primary-900/30", dotClass: "bg-primary-500" },
  skipped: { label: "Skipped", icon: SkipForward, color: "amber", textClass: "text-amber-700 dark:text-amber-400", bgClass: "bg-amber-50 dark:bg-amber-900/30", dotClass: "bg-amber-500" },
  missed: { label: "Missed", icon: XCircle, color: "danger", textClass: "text-danger-600 dark:text-danger-400", bgClass: "bg-danger-50 dark:bg-danger-900/30", dotClass: "bg-danger-500" },
};

export const NOTIFICATION_TYPE_META = {
  reminder: { label: "Reminder", icon: BellRing, textClass: "text-primary-600 dark:text-primary-400", bgClass: "bg-primary-50 dark:bg-primary-900/30" },
  upcoming: { label: "Upcoming", icon: Clock3, textClass: "text-primary-600 dark:text-primary-400", bgClass: "bg-primary-50 dark:bg-primary-900/30" },
  missed: { label: "Missed", icon: AlertTriangle, textClass: "text-danger-600 dark:text-danger-400", bgClass: "bg-danger-50 dark:bg-danger-900/30" },
  schedule_update: { label: "Schedule update", icon: CalendarDays, textClass: "text-accent-600 dark:text-accent-400", bgClass: "bg-accent-50 dark:bg-accent-900/30" },
  system: { label: "System", icon: Info, textClass: "text-slate-600 dark:text-slate-300", bgClass: "bg-slate-100 dark:bg-slate-800" },
};

export function labelFor(list, value) {
  return list.find((i) => i.value === value)?.label || value;
}

export const LOW_STOCK_THRESHOLD = 5;
