import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "../api/supabaseClient";

export default function ProtectedRoute({ children }) {
  const { user, loading: authLoading, logoutUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(null);
  const [isVerifyingRole, setIsVerifyingRole] = useState(true);

  useEffect(() => {
    async function verifyAdministrativePrivileges() {
      if (!user) {
        setIsAdmin(false);
        setIsVerifyingRole(false);
        return;
      }

      try {
        // Fetch user permissions strictly from the central profiles registry
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        // Check if the authenticated profile possesses explicit administrative clearance
        if (!profileError && profile?.role === "admin") {
          setIsAdmin(true);
        } else {
          console.error("Access denied: Account lacks administrative privileges.");
          setIsAdmin(false);
          
          // Terminate the unauthorized session natively via centralized logout sequence
          if (typeof logoutUser === "function") {
            await logoutUser();
          } else {
            await supabase.auth.signOut();
            navigate("/login", { replace: true });
          }
        }
      } catch (exception) {
        console.error("Administrative verification encountered an exception:", exception);
        setIsAdmin(false);
        navigate("/login", { replace: true });
      } finally {
        setIsVerifyingRole(false);
      }
    }

    if (!authLoading) {
      verifyAdministrativePrivileges();
    }
  }, [user, authLoading, navigate, logoutUser]);

  // Display continuous loading layout during asynchronous authorization cycles
  if (authLoading || isVerifyingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#94AB71]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
      </div>
    );
  }

  // Deny core rendering sequence if privileges are completely unauthenticated
  if (!user || !isAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}