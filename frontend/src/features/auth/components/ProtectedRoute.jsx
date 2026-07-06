import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "../api/supabaseClient";

export default function ProtectedRoute({ children }) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    async function verifyAdminRole() {
      if (!user) {
        setIsAdmin(false);
        setCheckingRole(false);
        return;
      }

      try {
        // Fetch user permissions strictly from the central profiles registry
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (!error && data?.role === "admin") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          // Terminate the unauthorized session immediately
          await supabase.auth.signOut();
          // Force clear client state and reroute directly to login panel
          navigate("/login", { replace: true });
        }
      } catch (err) {
        console.error("Administrative verification exception:", err);
        setIsAdmin(false);
        navigate("/login", { replace: true });
      } finally {
        setCheckingRole(false);
      }
    }

    if (!authLoading) {
      verifyAdminRole();
    }
  }, [user, authLoading, navigate]);

  // Display synchronous interface lock during authorization clearance cycles
  if (authLoading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#94AB71]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
      </div>
    );
  }

  // Deny core execution wrapper if privileges are completely unauthenticated
  if (!user || !isAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}