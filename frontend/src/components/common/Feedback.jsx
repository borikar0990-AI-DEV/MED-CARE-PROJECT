import { AlertCircle, RefreshCw } from "lucide-react";

export function LoadingSpinner({ size = 24, className = "", label = "Loading" }) {
  return (
    <span role="status" className={`inline-flex items-center justify-center ${className}`}>
      <span
        className="animate-spin rounded-full border-2 border-slate-200 border-t-primary-500 dark:border-white/10 dark:border-t-primary-400"
        style={{ width: size, height: size }}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function PageLoader({ label = "Loading…" }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-400">
      <LoadingSpinner size={28} />
      <p className="text-sm">{label}</p>
    </div>
  );
}

/** Skeleton block for card/list placeholders while data loads. */
export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/70 dark:bg-white/10 ${className}`} />;
}

export function EmptyState({ icon = "📭", title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl px-6 py-10 text-center">
      <span className="mb-3 text-4xl" aria-hidden="true">
        {icon}
      </span>
      <p className="font-display text-base font-semibold text-slate-800 dark:text-slate-100">{title}</p>
      {description && <p className="mt-1.5 max-w-xs text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", description, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-danger-100 bg-danger-50/60 px-6 py-10 text-center dark:border-danger-900/40 dark:bg-danger-900/10">
      <AlertCircle className="mb-3 text-danger-500" size={32} />
      <p className="font-display text-base font-semibold text-slate-800 dark:text-slate-100">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-soft ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-white/5 dark:text-slate-200 dark:ring-white/10"
        >
          <RefreshCw size={15} /> Try again
        </button>
      )}
    </div>
  );
}
