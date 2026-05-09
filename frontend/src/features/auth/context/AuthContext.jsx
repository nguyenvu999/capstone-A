import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { logout } from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false); // Mặc định không load

  const finishLogin = useCallback((userData) => {
    setUser(userData);
  }, []);

  const logoutUser = useCallback(async () => {
    try {
      await logout();
    } finally {
      setUser(null);
      window.location.replace("/login");
    }
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    setLoading,
    finishLogin,
    logoutUser,
    isAuthenticated: !!user,
  }), [user, loading, finishLogin, logoutUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}