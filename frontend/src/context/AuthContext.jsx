import { createContext, useContext, useState, useEffect } from 'react'
import { getMe } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const response = await getMe()
          setUser(response.data)
        } catch (error) {
          localStorage.removeItem('token')
          setUser(null)
        }
      }
      setLoading(false)
    }
    initAuth()
  }, [])

  const loginUser = (userData, token) => {
    localStorage.setItem('token', token)
    setUser(userData)
  }

  const logoutUser = () => {
    localStorage.removeItem('token')
    setUser(null)
    window.location.href = '/'
  }

  const value = {
    user,
    loading,
    loginUser,
    logoutUser,
    isLoggedIn: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth phải được dùng bên trong AuthProvider')
  }
  return context
}