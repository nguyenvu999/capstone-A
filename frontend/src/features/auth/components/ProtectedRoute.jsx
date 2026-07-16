import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "../api/supabaseClient";

export default function ProtectedRoute({ children }) {
  const { user, loading: authLoading, logoutUser } = useAuth();
  const location = useLocation();
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
        // Fetch privileges directly from profiles registry
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (!profileError && profile?.role === "admin") {
          setIsAdmin(true);
        } else {
          console.error("Access denied: Account lacks administrative privileges.");
          setIsAdmin(false);
          
          if (typeof logoutUser === "function") {
            await logoutUser();
          } else {
            await supabase.auth.signOut();
          }
        }
      } catch (exception) {
        console.error("Administrative verification encountered an exception:", exception);
        setIsAdmin(false);
      } finally {
        setIsVerifyingRole(false);
      }
    }

    if (!authLoading) {
      verifyAdministrativePrivileges();
    }
  }, [user, authLoading, logoutUser]);

  // Wait until auth state and role verification are completely done
  if (authLoading || isVerifyingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#94AB71]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
      </div>
    );
  }

  // If no user session exists or profile role is not admin, forcefully redirect to login
  if (!user || !isAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}