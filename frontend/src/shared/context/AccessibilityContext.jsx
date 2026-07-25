import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AccessibilityContext = createContext(null);

export function AccessibilityProvider({ children }) {
  const [isAccessibilityMode, setIsAccessibilityMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("netsuggest-accessibility-mode") === "true";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("netsuggest-accessibility-mode", String(isAccessibilityMode));
    }
  }, [isAccessibilityMode]);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (isAccessibilityMode) {
      root.classList.add("accessibility-mode");
      body.classList.add("accessibility-mode");
    } else {
      root.classList.remove("accessibility-mode");
      body.classList.remove("accessibility-mode");
    }

    return () => {
      root.classList.remove("accessibility-mode");
      body.classList.remove("accessibility-mode");
    };
  }, [isAccessibilityMode]);

  const resetAccessibilityMode = () => {
    setIsAccessibilityMode(false);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("netsuggest-accessibility-mode");
      document.documentElement.classList.remove("accessibility-mode");
      document.body.classList.remove("accessibility-mode");
    }
  };

  const value = useMemo(() => ({
    isAccessibilityMode,
    toggleAccessibilityMode: () => setIsAccessibilityMode((prev) => !prev),
    resetAccessibilityMode,
  }), [isAccessibilityMode]);

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider");
  }
  return context;
}