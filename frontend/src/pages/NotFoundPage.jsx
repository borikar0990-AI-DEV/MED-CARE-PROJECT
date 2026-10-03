import { Home } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center dark:bg-surface-darker">
      <span className="font-display text-7xl font-bold text-primary-500">404</span>
      <h1 className="mt-3 font-display text-2xl font-bold text-slate-900 dark:text-white">This page took a dose and vanished.</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        The page you're looking for doesn't exist, or may have moved. Let's get you back on schedule.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-primary-600"
      >
        <Home size={16} /> Back to Home
      </Link>
    </div>
  );
}
