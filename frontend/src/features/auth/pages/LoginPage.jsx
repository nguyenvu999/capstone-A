import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MapPin } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { signInWithEmail, signUpWithEmail, signInWithMicrosoft } from "../api/authApi";
import Logo from "../../../shared/ui/Logo";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false); 
  const [isSubmiting, setIsSubmiting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showBlockedModal, setShowBlockedModal] = useState(false); // Access-denied modal shown after a redirect from AuthContext

  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Lấy trang đích dự định từ state, nếu không có thì mặc định điều hướng về "/map"
  const fromPage = location.state?.from?.pathname || "/map";

  useEffect(() => {
    if (!loading && user) {
      // Dùng replace: true để ghi đè trang "/login" trong lịch sử duyệt web
      // Giúp khi bấm Back ở trình duyệt không bị quay ngược lại trang login
      navigate(fromPage, { replace: true });
    }
  }, [user, loading, navigate, fromPage]);

  // Kiểm tra query param "blocked" — được AuthContext gắn vào URL khi một tài khoản
  // bị chặn (domain không hợp lệ, hoặc tài khoản bị deactivate) rồi redirect về đây.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const blockedReason = params.get("blocked");
    if (blockedReason === "domain" || blockedReason === "deactivated") {
      setShowBlockedModal(true);
      // Xóa query param khỏi URL để refresh trang không hiện lại modal
      navigate("/login", { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Xử lý submit form đăng nhập / đăng ký bằng email
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

  // Xử lý đăng nhập qua Microsoft OAuth
  const handleMicrosoftLogin = async () => {
    setIsSubmiting(true);
    setErrorMsg("");
    try {
      const { error } = await signInWithMicrosoft();
      if (error) throw error;
      // Lưu ý: signInWithOAuth sẽ tự động redirect trình duyệt sang trang đăng nhập của Microsoft,
      // sau khi thành công Microsoft sẽ redirect về callback URL của Supabase rồi trả về ứng dụng.
    } catch (err) {
      setErrorMsg(err.message || "Microsoft authentication failed.");
      setIsSubmiting(false);
    }
  };

  // Trả về trạng thái chờ kiểm tra session ban đầu, tránh chặn tiến trình render
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

  // Nếu đã xác thực thành công, useEffect sẽ điều hướng trang, tại đây ẩn form.
  if (user) return null; 

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#7fa05c] via-[#8fa870] to-[#a7bd8a] px-4">
      {/* Decorative background — floating rounded squares + dot grid, echoing Netcompany's square motif */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-16 -left-16 nc-float-slow">
          <div className="w-72 h-72 rounded-3xl bg-white/10 rotate-12" />
        </div>
        <div className="absolute top-1/3 -left-24 nc-float">
          <div className="w-40 h-40 rounded-2xl border-2 border-white/20 rotate-45" />
        </div>
        <div className="absolute bottom-10 left-10 nc-float-slow">
          <div className="w-24 h-24 rounded-xl bg-[#355e1d]/20 rotate-12" />
        </div>

        <div className="absolute -bottom-20 -right-16 nc-float-slow">
          <div className="w-80 h-80 rounded-3xl bg-white/10 -rotate-12" />
        </div>
        <div className="absolute top-20 -right-10 nc-float">
          <div className="w-32 h-32 rounded-2xl border-2 border-white/20 rotate-12" />
        </div>
        <div className="absolute bottom-1/3 right-16 nc-float">
          <div className="w-20 h-20 rounded-xl bg-[#355e1d]/20 -rotate-12" />
        </div>

        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Large watermark logo, sitting behind the card */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[7] opacity-[0.06]">
          <Logo />
        </div>

        {/* Soft glow directly behind the card for depth */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-white/25 blur-3xl" />

        {/* Floating map-pin icons — nods to NetSuggest being a place/map app */}
        <div className="absolute top-24 left-1/4 nc-float text-white/25">
          <MapPin size={40} strokeWidth={1.5} />
        </div>
        <div className="absolute bottom-16 left-1/3 nc-float-slow text-white/20">
          <MapPin size={28} strokeWidth={1.5} />
        </div>
        <div className="absolute top-1/3 right-1/4 nc-float-slow text-white/20">
          <MapPin size={32} strokeWidth={1.5} />
        </div>
        <div className="absolute bottom-24 right-1/4 nc-float text-white/25">
          <MapPin size={44} strokeWidth={1.5} />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-[420px] rounded-[22px] bg-white px-10 py-10 shadow-2xl">
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

          {/* Form Email/Password Authentication */}
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
              {isSubmiting && !isRegister ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing...
                </>
              ) : (
                isRegister ? "Sign Up" : "Sign In"
              )}
            </button>
          </form>
          
          {/* Đường phân cách lựa chọn OAuth */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-400">Or continue with</span>
            </div>
          </div>

          {/* Nút bấm Đăng nhập qua Microsoft */}
          <button
            type="button"
            onClick={handleMicrosoftLogin}
            disabled={isSubmiting}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg className="h-4 w-4 mr-1 shrink-0" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
              <path fill="#f35325" d="M0 0h11v11H0z"/>
              <path fill="#81bc06" d="M12 0h11v11H12z"/>
              <path fill="#05a6f0" d="M0 12h11v11H0z"/>
              <path fill="#ffba08" d="M12 12h11v11H12z"/>
            </svg>
            Sign in with Microsoft
          </button>

          {/* Chuyển đổi trạng thái Đăng ký / Đăng nhập */}
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

      {/* Access-denied modal — shown when AuthContext redirects here with ?blocked=domain or ?blocked=deactivated */}
      {showBlockedModal && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m0 3.75h.008v.008H12v-.008ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Access Denied</h3>
            <p className="text-sm text-gray-600 mb-6">
              Your account does not have permission to access this website. Please contact the IT service for support.
            </p>
            <button
              type="button"
              onClick={() => setShowBlockedModal(false)}
              className="w-full h-11 rounded-lg bg-[#355e1d] text-white font-medium hover:bg-[#2d4f18] transition"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes nc-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
        @keyframes nc-float-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-22px); } }
        .nc-float { animation: nc-float 6s ease-in-out infinite; }
        .nc-float-slow { animation: nc-float-slow 9s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

export default LoginPage;