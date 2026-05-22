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
    // Sử dụng replace để dọn dẹp lịch sử duyệt web, tránh lỗi bấm back quay lại trang cũ
    window.location.replace("/login");
  };

  useEffect(() => {
    // 1. Kiểm tra session hiện tại khi F5 hoặc mở tab mới
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session) {
          const currentTime = Math.floor(Date.now() / 1000);
          let expiresAt = localStorage.getItem("session_expires_at");

          if (!expiresAt) {
            // Thiết lập cứng phiên đăng nhập kết thúc sau đúng 6 tiếng (21600 giây)
            expiresAt = currentTime + 21600;
            localStorage.setItem("session_expires_at", expiresAt.toString());
          }

          // Nếu đã quá 6 tiếng, ép đăng xuất ngay lập tức
          if (currentTime >= parseInt(expiresAt, 10)) {
            logoutUser();
            return;
          }

          setUser(session.user);
        } else {
          setUser(null);
          localStorage.removeItem("session_expires_at");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching session:", err);
        setLoading(false); // Buộc phải tắt loading để tránh kẹt màn hình trống
      });

    // 2. Lắng nghe thay đổi trạng thái đăng nhập thời gian thực
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        if (event === "SIGNED_IN") {
          const expiresAt = Math.floor(Date.now() / 1000) + 21600;
          localStorage.setItem("session_expires_at", expiresAt.toString());
        }
        setUser(session.user);
      } else {
        setUser(null);
        localStorage.removeItem("session_expires_at");
      }
      setLoading(false);
    });

    // 3. Thiết lập vòng lặp chạy ngầm định kỳ kiểm tra mốc 6 tiếng
    const interval = setInterval(() => {
      const expiresAt = localStorage.getItem("session_expires_at");
      if (expiresAt && Math.floor(Date.now() / 1000) >= parseInt(expiresAt, 10)) {
        logoutUser();
      }
    }, 60000); // Kiểm tra mỗi phút một lần

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