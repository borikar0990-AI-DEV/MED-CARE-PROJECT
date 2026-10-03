import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const TOKEN_KEY = "medicare_token";

/**
 * Token is kept in localStorage (persists across browser restarts, used
 * when "Remember me" is checked) or sessionStorage (cleared when the tab
 * closes, used otherwise). Never stores the password anywhere on the
 * client — only the signed JWT.
 */
export const tokenStorage = {
  get() {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  },
  set(token, remember) {
    this.clear();
    (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  },
};

const api = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// A single place to react to an expired/invalid session: clear the token
// and let the app redirect to /login (handled by AuthContext, which
// listens for this custom event so this file doesn't need router access).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      tokenStorage.clear();
      window.dispatchEvent(new CustomEvent("medicare:session-expired"));
    }
    return Promise.reject(error);
  }
);

/** Pulls FastAPI's error shape into a single friendly string. */
export function extractErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  const data = error?.response?.data;
  if (!data) return error?.message || fallback;
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.errors) && data.errors.length) {
    return data.errors.map((e) => e.message).join(" ");
  }
  return fallback;
}

export default api;
