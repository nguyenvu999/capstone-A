import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { supabase } from "../api/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // `reason` is optional and gets appended to the /login redirect as a query param
  // (e.g. "domain") so LoginPage can show the right message after the full page
  // reload — React state doesn't survive window.location.replace().
  const logoutUser = async (reason = null) => {
    setUser(null);
    localStorage.removeItem("session_expires_at");
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Supabase signout error:", err.message);
    }
    const redirectUrl = reason ? `/login?blocked=${reason}` : "/login";
    window.location.replace(redirectUrl);
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
          const userEmail = session.user.email;

          // Security Restriction 1: Forbid administrative accounts from accessing the main client application
          if ((userEmail && userEmail.endsWith("@internal.admin"))) {
            console.error("Administrative accounts are restricted from logging into the client application.");
            await logoutUser();
            return;
          }

          // Security Restriction 2: Enforce strict whitelist policy matching the designated enterprise domain
          if (!userEmail || !userEmail.endsWith("@netcompany.com")) {
            console.error("Access denied: Client application restricted to authorized domains only.");
            await logoutUser("domain");
            return;
          }

          // Verify user activation status and role directly from the global profiles directory
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role, is_active")
            .eq("id", session.user.id)
            .single();

          // Security Restriction 3: Force exit immediately if account status is deactivated
          if (profile && profile.is_active === false) {
            console.error("This account has been deactivated by the administrator.");
            await logoutUser("deactivated");
            return;
          }

          // Security Restriction 4: Cross-validate double layer for admin role checks
          if (profile && profile.role === "admin") {
            console.error("Administrative accounts are restricted from logging into the client application.");
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
          const userEmail = session.user.email;

          // Live Security Sweep 1: Block administrative accounts instantly in real-time context
          if ((userEmail && userEmail.endsWith("@internal.admin"))) {
            console.error("Administrative accounts are restricted from logging into the client application.");
            await logoutUser();
            return;
          }

          // Live Security Sweep 2: Whitelist inspection filter preventing foreign domain bindings
          if (!userEmail || !userEmail.endsWith("@netcompany.com")) {
            console.error("Access denied: Client application restricted to authorized domains only.");
            await logoutUser("domain");
            return;
          }

          // Re-evaluate user profile state in real-time on session updates
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, is_active")
            .eq("id", session.user.id)
            .single();

          // Live Security Sweep 3: Boot user immediately if deactivated during an active session
          if (profile && profile.is_active === false) {
            console.error("This account has been deactivated by the administrator.");
            await logoutUser("deactivated");
            return;
          }

          // Live Security Sweep 4: Block and boot admin instantly if trying to access the user app context
          if (profile && profile.role === "admin") {
            console.error("Administrative accounts are restricted from logging into the client application.");
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