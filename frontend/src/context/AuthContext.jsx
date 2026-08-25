import { createContext, useContext, useState, useCallback, useEffect } from "react";

const AuthContext = createContext(null);
const AUTH_STORAGE_KEY = "hv-auth";
const API_BASE = import.meta.env.VITE_API_URL || "/api";

function readAuthStore() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { isLoggedIn: false, user: null, authToken: null };
    const parsed = JSON.parse(raw);
    return {
      isLoggedIn: Boolean(parsed.isLoggedIn && parsed.authToken),
      user: parsed.user || null,
      authToken: parsed.authToken || null,
    };
  } catch {
    return { isLoggedIn: false, user: null, authToken: null };
  }
}

function writeAuthStore(auth) {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  } catch {
    console.error("Failed to persist auth to localStorage");
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readAuthStore);

  useEffect(() => {
    writeAuthStore(auth);
  }, [auth]);

  const setAuthState = useCallback((next) => {
    if (typeof next === "function") {
      setAuth((current) => next(current));
    } else {
      setAuth(next);
    }
  }, []);

  const requestJson = useCallback(
    async (path, options = {}) => {
      const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...(auth.authToken ? { Authorization: `Bearer ${auth.authToken}` } : {}),
      };

      const response = await fetch(`${API_BASE}${path}`, {
        headers,
        ...options,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          setAuthState({ isLoggedIn: false, user: null, authToken: null });
        }
        throw new Error(data.message || data.error || "Request failed");
      }

      return data;
    },
    [auth.authToken, setAuthState]
  );

  const login = useCallback(
    async (email, password) => {
      const data = await requestJson("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      setAuthState({
        isLoggedIn: true,
        user: data.user || null,
        authToken: data.token || null,
      });

      return data.user;
    },
    [requestJson, setAuthState]
  );

  const register = useCallback(
    async (payload) => {
      const data = await requestJson("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setAuthState({
        isLoggedIn: true,
        user: data.user || null,
        authToken: data.token || null,
      });

      return data.user;
    },
    [requestJson, setAuthState]
  );

  const logout = useCallback(() => {
    setAuthState({
      isLoggedIn: false,
      user: null,
      authToken: null,
    });
  }, [setAuthState]);

  const loginWithGoogle = useCallback(
    async (credential) => {
      const data = await requestJson("/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential }),
      });

      setAuthState({
        isLoggedIn: true,
        user: data.user || null,
        authToken: data.token || null,
      });

      return data.user;
    },
    [requestJson, setAuthState]
  );

  const requestPasswordReset = useCallback(
    async (email) => {
      return requestJson("/auth/request-password-reset", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },
    [requestJson]
  );

  const resetPassword = useCallback(
    async ({ email, token, newPassword }) => {
      return requestJson("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, token, newPassword }),
      });
    },
    [requestJson]
  );

  const value = {
    isLoggedIn: auth.isLoggedIn,
    user: auth.user,
    authToken: auth.authToken,
    login,
    register,
    logout,
    loginWithGoogle,
    requestPasswordReset,
    resetPassword,
    requestJson,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
