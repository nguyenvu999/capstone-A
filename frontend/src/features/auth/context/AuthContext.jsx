import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { supabase } from "../api/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logoutUser = async () => {
    setUser(null);
    localStorage.removeItem("session_expires_at");
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Supabase signout error:", err.message);
    }
    window.location.replace("/login");
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Kiểm tra xem URL hiện tại có chứa thông tin token từ Microsoft trả về không
        if (window.location.hash && (window.location.hash.includes("access_token") || window.location.hash.includes("error"))) {
          // Trì hoãn nhẹ 300ms để SDK Supabase xử lý đồng bộ chuỗi hash từ URL vào local storage
          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const currentTime = Math.floor(Date.now() / 1000);
          let expiresAt = localStorage.getItem("session_expires_at");

          if (!expiresAt) {
            expiresAt = (currentTime + 21600).toString();
            localStorage.setItem("session_expires_at", expiresAt);
          }

          const parsedExpiresAt = parseInt(expiresAt, 10);
          if (!isNaN(parsedExpiresAt) && currentTime >= parsedExpiresAt) {
            logoutUser();
            return;
          }
          
          setUser(session.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Error initializing session:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Lắng nghe sự kiện thay đổi trạng thái đăng nhập thời gian thực
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
        
        if (event === "SIGNED_IN") {
          const expiresAt = Math.floor(Date.now() / 1000) + 21600;
          localStorage.setItem("session_expires_at", expiresAt.toString());
          
          // Điều hướng trực tiếp bằng trình duyệt để đảm bảo sạch URL và vào thẳng trang Map
          if (window.location.pathname === "/login" || window.location.pathname === "/") {
            window.location.replace("/map");
          }
        }
      } else {
        setUser(null);
        localStorage.removeItem("session_expires_at");
      }
      setLoading(false);
    });

    const interval = setInterval(() => {
      const expiresAt = localStorage.getItem("session_expires_at");
      if (expiresAt) {
        const parsedExpiresAt = parseInt(expiresAt, 10);
        if (!isNaN(parsedExpiresAt) && Math.floor(Date.now() / 1000) >= parsedExpiresAt) {
          logoutUser();
        }
      }
    }, 60000);

    return () => {
      if (subscription) subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const value = useMemo(() => ({
    user, 
    loading, 
    logoutUser, 
    isAuthenticated: !!user
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);