import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageLoader from "../../../shared/ui/PageLoader";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader text="Verifying your secure session..." />;
  }

  if (!user) {
    // Lưu lại vị trí đang cố truy cập lỡ sau khi đăng nhập bắt quay về đúng chỗ cũ
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;