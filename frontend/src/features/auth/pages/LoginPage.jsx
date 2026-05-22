import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signInWithEmail, signUpWithEmail } from "../api/authApi";
import Logo from "../../../shared/ui/Logo";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false); 
  const [isSubmiting, setIsSubmiting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Lấy trang đích dự định từ state, nếu không có thì mặc định là "/map"
  const fromPage = location.state?.from?.pathname || "/map";

  useEffect(() => {
    if (!loading && user) {
      // Dùng replace: true để ghi đè trang "/login" trong lịch sử duyệt web
      // Giúp khi bấm Back ở trình duyệt sẽ quay lại trang trước đó (như Facebook)
      navigate(fromPage, { replace: true });
    }
  }, [user, loading, navigate, fromPage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmiting(true);
    setErrorMsg("");

    try {
      if (isRegister) {
        const { error } = await signUpWithEmail(email, password);
        if (error) throw error;
        alert("Sign up successful! Please sign in.");
        setIsRegister(false);
      } else {
        const { error } = await signInWithEmail(email, password);
        if (error) throw error;
      }
    } catch (err) {
      setErrorMsg(err.message || "An error occurred. Please try again.");
    } finally {
      setIsSubmiting(false);
    }
  };

  // NẾU ĐANG TẢI: Trả về trạng thái chờ, tránh chặn hoàn toàn tiến trình render
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#94AB71] text-white font-medium">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
          <p>Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Nếu đã xác thực thành công, useEffect ở trên sẽ tự động đẩy trang, tại đây trả về null để ẩn form ẩn.
  if (user) return null; 

  return (
    <div className='min-h-screen flex items-center justify-center bg-[#94AB71] px-4'>
      <div className="w-full max-w-[420px] rounded-[22px] bg-white px-10 py-10 shadow-2xl">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold">
            {isRegister ? "Create an account" : "Sign in to NetSuggest"}
          </h1>
          <p className="mb-6 text-sm text-[#5f6a60]">
            {isRegister ? "Sign up with your email" : "Use your email and password"}
          </p>
          
          {errorMsg && (
            <div className="mb-4 rounded-lg bg-red-50 p-2.5 text-left text-xs font-medium text-red-600">
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="text-xs font-semibold text-gray-600">Email Address</label>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="mt-1 h-11 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-[#355e1d] focus:outline-none transition" 
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Password</label>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 h-11 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-[#355e1d] focus:outline-none transition" 
              />
            </div>
            
            <button
              type="submit"
              disabled={isSubmiting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#355e1d] px-4 text-base font-medium text-white transition hover:bg-[#2d4f18] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmiting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing...
                </>
              ) : (
                isRegister ? "Sign Up" : "Sign In"
              )}
            </button>
          </form>
          
          <button 
            type="button"
            onClick={() => { setIsRegister(!isRegister); setErrorMsg(""); }}
            className="mt-6 text-xs font-semibold text-[#355e1d] hover:underline transition"
          >
            {isRegister ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </button>

          <p className="mt-6 text-xs text-[#6b746c]">
            Only authorized company users can access this platform.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;