import { Eye, EyeOff, Lock, LogIn, Mail } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { extractErrorMessage } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/UIContext";
import { LoadingSpinner } from "../../components/common/Feedback";

const DEMO_CREDENTIALS = { email: "demo@medicare.app", password: "Demo@1234" };

export default function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "", rememberMe: true });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const redirectTo = location.state?.from || "/app/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(form);
      showToast("Welcome back!", "success");
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, "Incorrect email or password."));
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => setForm((f) => ({ ...f, ...DEMO_CREDENTIALS }));

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h1>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Log in to keep your medication schedule on track.</p>

      <button
        type="button"
        onClick={fillDemo}
        className="mt-5 w-full rounded-xl border border-dashed border-primary-200 bg-primary-50/60 px-4 py-2.5 text-left text-xs text-primary-700 hover:bg-primary-50 dark:border-primary-900/50 dark:bg-primary-900/10 dark:text-primary-300"
      >
        <span className="font-semibold">Demo account:</span> demo@medicare.app / Demo@1234 — tap to autofill
      </button>

      {error && (
        <div className="mt-4 rounded-xl bg-danger-50 px-4 py-3 text-sm text-danger-700 dark:bg-danger-900/20 dark:text-danger-300" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
          <div className="relative">
            <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:ring-primary-900/40"
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Password</label>
            <Link to="/forgot-password" className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:ring-primary-900/40"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={form.rememberMe}
            onChange={(e) => setForm((f) => ({ ...f, rememberMe: e.target.checked }))}
            className="h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-400"
          />
          Remember me for 30 days
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-primary-600 disabled:opacity-60"
        >
          {loading ? <LoadingSpinner size={16} /> : <LogIn size={16} />} Log In
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Don't have an account?{" "}
        <Link to="/register" className="font-semibold text-primary-600 hover:underline dark:text-primary-400">
          Get started
        </Link>
      </p>
    </div>
  );
}
