import { createContext, useCallback, useContext, useEffect, useState } from "react";

import authService from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while we check for an existing session on first load

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!authService.hasToken()) {
        setLoading(false);
        return;
      }
      try {
        const me = await authService.me();
        if (!cancelled) setUser(me);
      } catch {
        // Stored token is invalid/expired — fail silently into "logged out".
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    bootstrap();

    // Raised by services/api.js whenever a request comes back 401, so a
    // token that expires mid-session logs the user out everywhere at once.
    const handleExpired = () => setUser(null);
    window.addEventListener("medicare:session-expired", handleExpired);

    return () => {
      cancelled = true;
      window.removeEventListener("medicare:session-expired", handleExpired);
    };
  }, []);

  const login = useCallback(async (payload) => {
    const me = await authService.login(payload);
    setUser(me);
    return me;
  }, []);

  const register = useCallback(async (payload) => {
    const me = await authService.register(payload);
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout().catch(() => {});
    setUser(null);
  }, []);

  const logoutAllSessions = useCallback(async () => {
    await authService.logoutAllSessions().catch(() => {});
    setUser(null);
  }, []);

  const updateUser = useCallback((patch) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    logoutAllSessions,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
