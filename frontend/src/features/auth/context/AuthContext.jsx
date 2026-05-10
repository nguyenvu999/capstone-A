import { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { logout, getMe } from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const clearAuth = useCallback(() => {
    setUser(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => clearAuth();
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [clearAuth]);

  const finishLogin = useCallback((userData) => {
    setUser(userData);
    
    // Auto-logout sau 6 tiếng ở phía Client
    const SIX_HOURS = 6 * 60 * 60 * 1000;
    const timer = setTimeout(() => {
      logoutUser();
      alert("Phiên đăng nhập 6 tiếng đã hết hạn!");
    }, SIX_HOURS);

    return () => clearTimeout(timer);
  }, []);

  const logoutUser = useCallback(async () => {
    try {
      await logout();
    } finally {
      clearAuth();
      window.location.replace("/login");
    }
  }, [clearAuth]);

  const value = useMemo(() => ({
    user, loading, setLoading, finishLogin, logoutUser, isAuthenticated: !!user
  }), [user, loading, finishLogin, logoutUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);