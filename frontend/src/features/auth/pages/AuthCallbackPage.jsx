import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getMe } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import PageLoader from "../../../shared/ui/PageLoader";
// IMPORT THÊM HÀM UTILS CỦA BẠN
import { consumeRedirectAfterLogin, navigateAfterLogin } from "../utils/redirectAfterLogin";

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
        const userData = response?.data || response;
        
        if (userData) {
          finishLogin(userData);
          
          // FIX TẠI ĐÂY: Lấy trang đích đã lưu trước đó (nếu có)
          const intendedPath = consumeRedirectAfterLogin();
          
          // Sử dụng hàm điều phối thông minh của bạn để đẩy dấu vết login khỏi History
          navigateAfterLogin(navigate, intendedPath);
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