import { Check, Eye, EyeOff, Lock, Mail, Phone, User, UserPlus } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { extractErrorMessage } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/UIContext";
import { getPasswordStrength, isValidEmail, required } from "../../utils/validators";
import { LoadingSpinner } from "../../components/common/Feedback";

const STRENGTH_COLORS = ["bg-slate-200 dark:bg-white/10", "bg-danger-400", "bg-amber-400", "bg-amber-400", "bg-secondary-400", "bg-secondary-500"];

function PasswordStrengthMeter({ password }) {
  const { score, label, meetsMinimum } = getPasswordStrength(password);
  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i < score ? STRENGTH_COLORS[score] : "bg-slate-100 dark:bg-white/5"}`} />
        ))}
      </div>
      <p className={`mt-1 text-xs ${meetsMinimum ? "text-secondary-600 dark:text-secondary-400" : "text-slate-400"}`}>
        {label} {meetsMinimum && "· meets requirements"}
      </p>
    </div>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "", acceptTerms: false });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const validate = () => {
    const { meetsMinimum } = getPasswordStrength(form.password);
    const next = {
      name: required(form.name, "Full name is required."),
      email: !isValidEmail(form.email) ? "Enter a valid email address." : null,
      password: !meetsMinimum ? "Use at least 8 characters, with a letter and a number." : null,
      confirmPassword: form.confirmPassword !== form.password ? "Passwords do not match." : null,
      acceptTerms: !form.acceptTerms ? "Please accept the Terms to continue." : null,
    };
    Object.keys(next).forEach((k) => next[k] == null && delete next[k]);
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form);
      showToast("Account created — welcome to MediCare!", "success");
      navigate("/app/dashboard", { replace: true });
    } catch (err) {
      setApiError(extractErrorMessage(err, "Could not create your account. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (hasError) =>
    `w-full rounded-xl border bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 dark:bg-white/5 dark:text-white ${
      hasError
        ? "border-danger-300 focus:ring-danger-100"
        : "border-slate-200 focus:border-primary-400 focus:ring-primary-100 dark:border-white/10 dark:focus:ring-primary-900/40"
    }`;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Create your account</h1>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">It takes less than a minute — no credit card, ever.</p>

      {apiError && (
        <div className="mt-4 rounded-xl bg-danger-50 px-4 py-3 text-sm text-danger-700 dark:bg-danger-900/20 dark:text-danger-300" role="alert">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-4">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Full Name</label>
          <div className="relative">
            <User size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input id="name" type="text" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Jordan Smith" className={fieldClass(errors.name)} />
          </div>
          {errors.name && <p className="mt-1 text-xs text-danger-500">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
          <div className="relative">
            <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input id="email" type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} placeholder="you@example.com" className={fieldClass(errors.email)} />
          </div>
          {errors.email && <p className="mt-1 text-xs text-danger-500">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Phone Number <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <div className="relative">
            <Phone size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input id="phone" type="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+91 90000 00000" className={fieldClass(false)} />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Password</label>
          <div className="relative">
            <Lock size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => set({ password: e.target.value })}
              placeholder="At least 8 characters"
              className={`${fieldClass(errors.password)} pr-10`}
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          <PasswordStrengthMeter password={form.password} />
          {errors.password && <p className="mt-1 text-xs text-danger-500">{errors.password}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Confirm Password</label>
          <div className="relative">
            <Lock size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(e) => set({ confirmPassword: e.target.value })}
              placeholder="Re-enter your password"
              className={`${fieldClass(errors.confirmPassword)} pr-10`}
            />
            <button type="button" onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
            {form.confirmPassword && form.confirmPassword === form.password && (
              <Check size={17} className="absolute right-10 top-1/2 -translate-y-1/2 text-secondary-500" />
            )}
          </div>
          {errors.confirmPassword && <p className="mt-1 text-xs text-danger-500">{errors.confirmPassword}</p>}
        </div>

        <div>
          <label className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={form.acceptTerms}
              onChange={(e) => set({ acceptTerms: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-400"
            />
            <span>
              I agree to the <a href="#terms" className="font-medium text-primary-600 hover:underline dark:text-primary-400">Terms of Service</a> and{" "}
              <a href="#privacy" className="font-medium text-primary-600 hover:underline dark:text-primary-400">Privacy Policy</a>.
            </span>
          </label>
          {errors.acceptTerms && <p className="mt-1 text-xs text-danger-500">{errors.acceptTerms}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-primary-600 disabled:opacity-60"
        >
          {loading ? <LoadingSpinner size={16} /> : <UserPlus size={16} />} Create Account
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-primary-600 hover:underline dark:text-primary-400">
          Log in
        </Link>
      </p>
    </div>
  );
}
