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
        // Lúc này mới gọi Backend để lấy thông tin từ Cookie đã set
        const response = await getMe();
        if (response.data) {
          finishLogin(response.data);
          navigate("/map", { replace: true });
        }
      } catch (error) {
        console.error("Auth failed");
        navigate("/login", { replace: true });
      }
    };

    finalize();
  }, [navigate, finishLogin]);

  return <PageLoader text="Verifying your Microsoft account..." />;
}

export default AuthCallbackPage;