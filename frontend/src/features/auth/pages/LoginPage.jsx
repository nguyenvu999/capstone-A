import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { signInWithEmail } from "../api/authApi";
import { supabase } from "../api/supabaseClient";
import Logo from "../../../shared/ui/Logo";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  // null | "invalid_credentials" (wrong domain / wrong creds) | "access_denied" (valid login, not an admin)
  const [modalReason, setModalReason] = useState(null);

  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // HARDCODED FIX: Always route directly to User Management upon successful login
  const destinationRoute = "/admin/users";

  useEffect(() => {
    // Strictly prevent automatic routing redirection if a security block modal is active
    if (!loading && user && modalReason === null) {
      navigate(destinationRoute, { replace: true });
    }
  }, [user, loading, navigate, destinationRoute, modalReason]);

  const handleFormSubmission = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    // Reject anything outside the @internal.admin domain before it ever reaches
    // Supabase — same generic message as a wrong password, so we don't leak
    // whether an email exists on another (e.g. client) account domain.
    if (!email.trim().toLowerCase().endsWith("@internal.admin")) {
      setModalReason("invalid_credentials");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Authenticate credentials via Supabase Client API
      const { data, error } = await signInWithEmail(email, password);
      if (error) throw error;

      const authenticatedUser = data?.user;

      if (authenticatedUser) {
        // 2. Query privileges directly from the centralized database registry
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authenticatedUser.id)
          .single();

        // 3. Evaluate administrative clearance requirements
        if (!profileError && profile?.role === "admin") {
          // Access Granted: The active useEffect will seamlessly route to /admin/users
        } else {
          // Access Denied: Trigger the visual popup notification lock FIRST
          setModalReason("access_denied");

          // CRITICAL FIX: Do NOT call signOut instantly here, as it triggers auth context listeners 
          // and wipes component states. Let the modal block the interface instead.
        }
      }
    } catch (exception) {
      setErrorMessage(exception.message || "Authentication rejected. Please verify your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Centralized resolution sequence triggered once the user dismisses the warning modal
  const handleModalClose = async () => {
    const reason = modalReason;
    setModalReason(null);

    // Only a successful-but-unauthorized login (access_denied) leaves behind an
    // active Supabase session that needs cleaning up. The invalid_credentials
    // path never authenticated, so there's nothing to sign out of.
    if (reason === "access_denied") {
      setIsSubmitting(true);
      try {
        // Clear out the temporary invalid session data quietly after the warning has been acknowledged
        await supabase.auth.signOut();
      } catch (err) {
        console.error("Failed to cleanly terminate session keys:", err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

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

        {/* Large "NetSuggest" text watermark, sitting behind the card — no "Admin" wording here */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap select-none">
          <span className="text-[110px] sm:text-[160px] md:text-[200px] font-black tracking-tight text-white/[0.07]">
            NetSuggest
          </span>
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

      {/* Centralized Security Popup Notification Overlay — covers both wrong credentials and access denied */}
      {modalReason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-[400px] rounded-2xl bg-white p-6 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-900">
              {modalReason === "invalid_credentials" ? "Sign In Failed" : "Access Denied"}
            </h3>
            <p className="text-sm font-medium text-gray-600 leading-relaxed">
              {modalReason === "invalid_credentials"
                ? "Wrong username or password."
                : "Tài khoản không có quyền truy cập trang này."}
            </p>
            <button
              type="button"
              onClick={handleModalClose}
              className="mt-5 w-full rounded-lg bg-gray-950 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Main Login UI Form Core Wrapper */}
      <div className="relative z-10 w-full max-w-[420px] rounded-[22px] bg-white px-10 py-10 shadow-2xl">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold">Sign in to NetSuggest Admin</h1>
          <p className="mb-6 text-sm text-[#5f6a60]">Use your internal email and password</p>
          
          {errorMessage && (
            <div className="mb-4 rounded-lg bg-red-50 p-2.5 text-left text-xs font-medium text-red-600">
              ⚠️ {errorMessage}
            </div>
          )}

          <form onSubmit={handleFormSubmission} className="space-y-4 text-left">
            <div>
              <label className="text-xs font-semibold text-gray-600">Email Address</label>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={event => setEmail(event.target.value)}
                placeholder="username@internal.admin"
                className="mt-1 h-11 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-[#355e1d] focus:outline-none transition" 
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Password</label>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={event => setPassword(event.target.value)}
                placeholder="••••••••"
                className="mt-1 h-11 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-[#355e1d] focus:outline-none transition" 
              />
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#355e1d] px-4 text-base font-medium text-white transition hover:bg-[#2d4f18] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="mt-8 text-xs text-[#6b746c]">
            Only authorized internal company administrators can access this secure environment.
          </p>
        </div>
      </div>

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