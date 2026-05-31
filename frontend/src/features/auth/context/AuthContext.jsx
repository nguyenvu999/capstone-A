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
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session) {
          const currentTime = Math.floor(Date.now() / 1000);
          let expiresAt = localStorage.getItem("session_expires_at");

          if (!expiresAt) {
            expiresAt = (currentTime + 21600).toString();
            localStorage.setItem("session_expires_at", expiresAt);
          }

          const parsedExpiresAt = parseInt(expiresAt, 10);
          if (!isNaN(parsedExpiresAt)) {
            if (currentTime >= parsedExpiresAt) {
              logoutUser();
              return;
            }
          }
          setUser(session.user);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching session:", err);
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
        
        if (event === "SIGNED_IN") {
          const expiresAt = Math.floor(Date.now() / 1000) + 21600;
          localStorage.setItem("session_expires_at", expiresAt.toString());
          
          if (window.location.pathname === "/login" || window.location.pathname === "/") {
            window.location.replace("/map");
          }
        }
      } else {
        setUser(null);
        localStorage.removeItem("session_expires_at");
      }
      setLoading(false);
    });

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