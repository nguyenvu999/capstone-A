import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"
import { getMe, logout } from "../api/authApi"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await getMe()
        setUser(response.data)
      } catch (error) {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null)
    }

    window.addEventListener("auth:unauthorized", handleUnauthorized)

    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized)
    }
  }, [])

  // Dùng useCallback để function không bị tạo lại mỗi lần render
  const finishLogin = useCallback((userData) => {
    setUser(userData)
  }, [])

  const logoutUser = useCallback(async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setUser(null)
      sessionStorage.removeItem("redirectAfterLogin")
      window.location.replace("/login")
    }
  }, [])

  // Dùng useMemo để object value ổn định hơn
  const value = useMemo(() => {
    return {
      user,
      loading,
      finishLogin,
      logoutUser,
      isAuthenticated: !!user,
    }
  }, [user, loading, finishLogin, logoutUser])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider")
  }

  return context
}