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
        // Validate and handle Microsoft OAuth provider hash latency fragments from URL redirection
        if (window.location.hash && (window.location.hash.includes("access_token") || window.location.hash.includes("error"))) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Verify user activation status directly from the global profiles directory
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("is_active")
            .eq("id", session.user.id)
            .single();

          // Security Restriction: Force exit immediately if account status is deactivated
          if (profile && profile.is_active === false) {
            console.error("This account has been deactivated by the administrator.");
            await logoutUser();
            return;
          }

          const currentTime = Math.floor(Date.now() / 1000);
          let expiresAt = localStorage.getItem("session_expires_at");

          if (!expiresAt) {
            expiresAt = (currentTime + 21600).toString();
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

    // Listen to real-time authentication status change streams
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        try {
          // Re-evaluate user profile state in real-time on session updates
          const { data: profile } = await supabase
            .from("profiles")
            .select("is_active")
            .eq("id", session.user.id)
            .single();

          // Live Security Sweep: Boot user immediately if deactivated during an active session
          if (profile && profile.is_active === false) {
            console.error("This account has been deactivated by the administrator.");
            await logoutUser();
            return;
          }

          setUser(session.user);
          
          if (event === "SIGNED_IN") {
            const expiresAt = Math.floor(Date.now() / 1000) + 21600;
            localStorage.setItem("session_expires_at", expiresAt.toString());
            
            // Clean browser parameters and route standard user into map dashboard
            if (window.location.pathname === "/login" || window.location.pathname === "/") {
              window.location.replace("/map");
            }
          }
        } catch (err) {
          console.error("Real-time authorization status error:", err);
          await logoutUser();
        }
      } else {
        setUser(null);
        localStorage.removeItem("session_expires_at");
      }
      setLoading(false);
    });

    // Check token expiry timelines periodically every 60 seconds
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
