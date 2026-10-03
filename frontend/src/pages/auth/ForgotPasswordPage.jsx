import { ArrowLeft, Mail, MailCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { isValidEmail } from "../../utils/validators";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary-50 text-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-300">
          <MailCheck size={26} />
        </span>
        <h1 className="mt-4 font-display text-xl font-bold text-slate-900 dark:text-white">Check your email</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          If an account exists for <strong className="font-semibold text-slate-700 dark:text-slate-200">{email}</strong>, you'll receive a reset link shortly.
        </p>
        <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-left text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          <strong>Note for this demo build:</strong> outbound email isn't configured, so no email actually arrives. In production this would be wired to a real provider (SMTP/SendGrid/SES) — the reset-link flow itself is what's shown here.
        </div>
        <Link to="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:underline dark:text-primary-400">
          <ArrowLeft size={15} /> Back to login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/login" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
        <ArrowLeft size={15} /> Back
      </Link>
      <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Forgot your password?</h1>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Enter your email and we'll send you a link to reset it.</p>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
          <div className="relative">
            <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 dark:bg-white/5 dark:text-white ${
                error ? "border-danger-300 focus:ring-danger-100" : "border-slate-200 focus:border-primary-400 focus:ring-primary-100 dark:border-white/10 dark:focus:ring-primary-900/40"
              }`}
            />
          </div>
          {error && <p className="mt-1 text-xs text-danger-500">{error}</p>}
        </div>

        <button type="submit" className="rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-primary-600">
          Send Reset Link
        </button>
      </form>
    </div>
  );
}
