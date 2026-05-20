import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getMe } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import PageLoader from "../../../shared/ui/PageLoader";

function AuthCallbackPage() {
  const navigate = useNavigate();
  const { finishLogin } = useAuth();
  const hasCalled = useRef(false);

  useEffect(() => {
    if (hasCalled.current) return;
    hasCalled.current = true;

    const finalize = async () => {
      try {
        const response = await getMe();
        // Lấy data và nạp vào Context ngay lập tức
        const userData = response?.data || response;
        
        if (userData) {
          finishLogin(userData);
          // Điều hướng thay thế trang callback trong lịch sử bằng trang map
          navigate("/map", { replace: true });
        } else {
          navigate("/login", { replace: true });
        }
      } catch (error) {
        console.error("Auth callback failed:", error);
        navigate("/login", { replace: true });
      }
    };

    finalize();
  }, [navigate, finishLogin]);

  return <PageLoader text="Finishing your secure login..." />;
}

export default AuthCallbackPage;