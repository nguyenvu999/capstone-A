import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signInWithEmail } from "../api/authApi";
import { supabase } from "../api/supabaseClient";
import Logo from "../../../shared/ui/Logo";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);

  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // HARDCODED FIX: Always route directly to User Management upon successful login
  const destinationRoute = "/admin/users";

  useEffect(() => {
    // Strictly prevent automatic routing redirection if the security block modal is active
    if (!loading && user && !showAccessDeniedModal) {
      navigate(destinationRoute, { replace: true });
    }
  }, [user, loading, navigate, destinationRoute, showAccessDeniedModal]);

  const handleFormSubmission = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

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
          setShowAccessDeniedModal(true);
          
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
    setShowAccessDeniedModal(false);
    setIsSubmitting(true);
    try {
      // Clear out the temporary invalid session data quietly after the warning has been acknowledged
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Failed to cleanly terminate session keys:", err);
    } finally {
      setIsSubmitting(false);
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
    <div className="relative min-h-screen flex items-center justify-center bg-[#94AB71] px-4">
      {/* Centralized Access Denied Popup Notification Overlay */}
      {showAccessDeniedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-[400px] rounded-2xl bg-white p-6 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-900">Access Denied</h3>
            <p className="text-sm font-medium text-gray-600 leading-relaxed">
              Tài khoản không có quyền truy cập trang này.
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
      <div className="w-full max-w-[420px] rounded-[22px] bg-white px-10 py-10 shadow-2xl">
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
    </div>
  );
}

export default LoginPage;