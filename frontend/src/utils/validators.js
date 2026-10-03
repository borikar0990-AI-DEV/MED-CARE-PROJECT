const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value) {
  return EMAIL_RE.test(String(value || "").trim());
}

/**
 * Mirrors backend/app/utils/helpers.py:validate_password_strength() exactly
 * (>= 8 chars, at least one letter, at least one number) so the frontend
 * meter never promises a password the API will then reject, plus two
 * extra (non-blocking) checks — uppercase and symbol — purely to color the
 * strength meter with more granularity.
 */
export function getPasswordStrength(password = "") {
  const checks = {
    length: password.length >= 8,
    letter: /[A-Za-z]/.test(password),
    number: /[0-9]/.test(password),
    upper: /[A-Z]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
  const meetsMinimum = checks.length && checks.letter && checks.number;
  const score = Object.values(checks).filter(Boolean).length; // 0-5

  let label = "Very weak";
  if (!password) label = "";
  else if (score <= 1) label = "Very weak";
  else if (score === 2) label = "Weak";
  else if (score === 3) label = "Fair";
  else if (score === 4) label = "Good";
  else label = "Strong";

  return { checks, meetsMinimum, score, label };
}

export function required(value, message = "This field is required.") {
  if (value === null || value === undefined || String(value).trim() === "") return message;
  return null;
}

export function isDateRangeValid(startDate, endDate) {
  if (!startDate || !endDate) return true;
  return new Date(endDate) >= new Date(startDate);
}
