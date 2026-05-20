import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // IMPORT AUTH CONTEXT
import Logo from "../../../shared/ui/Logo";
import MicrosoftSignInButton from "../components/MicrosoftSignInButton";
import { getMicrosoftSSOStartUrl } from "../api/authApi";

function LoginPage() {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { user, loading } = useAuth(); // Lấy thông tin user hiện tại
  const navigate = useNavigate();

  // FIX TẠI ĐÂY: Nếu user đã đăng nhập mà cố tình quay lại trang /login (nhấn Back)
  // Hệ thống lập tức đẩy đi bằng replace: true để xóa trang login khỏi lịch sử duyệt web
  useEffect(() => {
    if (!loading && user) {
      navigate("/map", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleMicrosoftSignIn = () => {
    setIsRedirecting(true);
    window.location.href = getMicrosoftSSOStartUrl();
  };

  // Nếu đang kiểm tra session thì tạm thời không hiện form đăng nhập để tránh nháy giao diện
  if (loading || user) {
    return null; 
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-[#94AB71] px-4'>
      <div className="w-full max-w-[420px] rounded-[22px] bg-white px-10 py-10 shadow-2xl">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold">Sign in to NetSuggest</h1>
          <p className="mb-8 text-sm text-[#5f6a60]">Use your Microsoft account</p>
          
          <MicrosoftSignInButton
            onClick={handleMicrosoftSignIn}
            isLoading={isRedirecting}
          />
          
          <p className="mt-6 text-xs text-[#6b746c]">
            Only authorized company users can access this platform.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;