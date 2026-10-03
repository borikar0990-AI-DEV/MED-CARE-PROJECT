/**
 * Accessible toggle switch. Built on a real (visually hidden) checkbox so it
 * gets native keyboard support, checked-state semantics, and form behavior
 * for free — the visual track + thumb are purely CSS driven off the
 * checkbox's :checked state via Tailwind's peer-* utilities.
 */
export function Toggle({ checked, onChange, disabled = false, label }) {
  return (
    <label className={`relative inline-flex items-center ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="peer sr-only"
        aria-label={label}
      />
      <span
        className="h-6 w-11 rounded-full bg-slate-200 transition-colors duration-200 peer-checked:bg-primary-500 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-400 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface dark:bg-white/10 dark:peer-focus-visible:ring-offset-surface-dark"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 translate-x-0 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-5"
        aria-hidden="true"
      />
    </label>
  );
}

export default Toggle;
