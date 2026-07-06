import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { supabase } from "../api/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logoutUser = async () => {
    setUser(null);
    localStorage.removeItem("session_expires_at");
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Supabase signout error:", err.message);
    }
    window.location.replace("/login");
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Handle third-party OAuth redirect token processing latency (e.g., Microsoft Auth hash fragments)
        if (window.location.hash && (window.location.hash.includes("access_token") || window.location.hash.includes("error"))) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Fetch both role and active status flags from the profiles database table
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role, is_active")
            .eq("id", session.user.id)
            .single();

          // Security Check 1: Block completely if user account is deactivated by an administrator
          if (profile && profile.is_active === false) {
            console.error("This account has been deactivated by the administrator.");
            await logoutUser();
            return;
          }

          // Security Check 2: Verify user role privilege for admin repository isolation
          if (profileError || !profile || profile.role !== "admin") {
            console.error("Access denied. Insufficient administrative privileges.");
            await logoutUser();
            return;
          }

          const currentTime = Math.floor(Date.now() / 1000);
          let expiresAt = localStorage.getItem("session_expires_at");

          if (!expiresAt) {
            expiresAt = (currentTime + 21600).toString(); // 6 hours default session life
            localStorage.setItem("session_expires_at", expiresAt);
          }

          const parsedExpiresAt = parseInt(expiresAt, 10);
          if (!isNaN(parsedExpiresAt) && currentTime >= parsedExpiresAt) {
            logoutUser();
            return;
          }
          
          setUser(session.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Error initializing session:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for real-time authentication status changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        try {
          // Re-verify administration permissions and active state on state changes
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, is_active")
            .eq("id", session.user.id)
            .single();

          // Real-time Security Check 1: Immediate lock if account is deactivated
          if (profile && profile.is_active === false) {
            console.error("This account has been deactivated by the administrator.");
            await logoutUser();
            return;
          }

          // Real-time Security Check 2: Immediate lock if account role changes
          if (!profile || profile.role !== "admin") {
            await logoutUser();
            return;
          }

          setUser(session.user);
          
          if (event === "SIGNED_IN") {
            const expiresAt = Math.floor(Date.now() / 1000) + 21600;
            localStorage.setItem("session_expires_at", expiresAt.toString());
            
            // Clean route address context and direct the administrator into control view
            if (window.location.pathname === "/login" || window.location.pathname === "/") {
              window.location.replace("/admin");
            }
          }
        } catch (err) {
          console.error("Authorization check failure:", err);
          await logoutUser();
        }
      } else {
        setUser(null);
        localStorage.removeItem("session_expires_at");
      }
      setLoading(false);
    });

    // Handle token expiry sweep cycles every 60 seconds
    const interval = setInterval(() => {
      const expiresAt = localStorage.getItem("session_expires_at");
      if (expiresAt) {
        const parsedExpiresAt = parseInt(expiresAt, 10);
        if (!isNaN(parsedExpiresAt) && Math.floor(Date.now() / 1000) >= parsedExpiresAt) {
          logoutUser();
        }
      }
    }, 60000);

    return () => {
      if (subscription) subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const value = useMemo(() => ({
    user, 
    loading, 
    logoutUser, 
    isAuthenticated: !!user
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);