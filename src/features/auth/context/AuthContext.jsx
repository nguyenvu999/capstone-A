import { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { logout, getMe } from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Khôi phục session khi F5 hoặc mở tab mới
  useEffect(() => {
    async function initializeAuth() {
      try {
        const userData = await getMe();
        // Nếu getMe trả về dữ liệu trực tiếp, dùng userData. Nếu bọc trong .data thì dùng userData.data
        const actualData = userData?.data || userData;
        if (actualData) setUser(actualData);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    initializeAuth();
  }, []);

  // 2. Hàm nạp dữ liệu tức thì sau khi Login thành công
  const finishLogin = useCallback((userData) => {
    const actualData = userData?.data || userData;
    if (actualData) {
      setUser(actualData);
      setLoading(false);
    }
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
    finishLogin, 
    logoutUser, 
    isAuthenticated: !!user
  }), [user, loading, finishLogin, logoutUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);