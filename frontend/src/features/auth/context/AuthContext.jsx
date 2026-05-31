import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { supabase } from "../api/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hàm xử lý đăng xuất tập trung
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
    // Hàm phụ trợ: Ép SDK xử lý Token từ URL nếu có (Xử lý cho OAuth Microsoft)
    const handleOAuthCallback = async () => {
      // Nếu URL chứa access_token từ Microsoft trả về
      if (window.location.hash && window.location.hash.includes("access_token")) {
        try {
          // Chờ một chút để Supabase SDK tự động nhận diện hash fragment
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (e) {
          console.error(e);
        }
      }
    };

    // Hàm kiểm tra và khởi tạo Session ban đầu
    const initializeAuth = async () => {
      try {
        await handleOAuthCallback();

        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const currentTime = Math.floor(Date.now() / 1000);
          let expiresAt = localStorage.getItem("session_expires_at");

          if (!expiresAt) {
            // Mặc định session kéo dài 6 tiếng nếu chưa thiết lập
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

    // Lắng nghe realtime sự kiện thay đổi Auth (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
        
        if (event === "SIGNED_IN") {
          const expiresAt = Math.floor(Date.now() / 1000) + 21600;
          localStorage.setItem("session_expires_at", expiresAt.toString());
          
          // Nếu đăng nhập thành công mà đang ở trang login hoặc gốc, đẩy ngay vào /map
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

    // Vòng lặp kiểm tra token hết hạn định kỳ mỗi phút
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

  // Tối ưu hóa render bằng useMemo
  const value = useMemo(() => ({
    user, 
    loading, 
    logoutUser, 
    isAuthenticated: !!user
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);