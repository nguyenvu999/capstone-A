import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Trả về vòng xoay tải mượt mà thay vì màn hình trống trong lúc đang xác thực context
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#94AB71]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    // Lưu vết đường dẫn dự định (ví dụ: /map) vào state trước khi đá sang màn hình đăng nhập
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}