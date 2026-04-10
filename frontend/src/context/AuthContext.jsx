// Import các hooks cần thiết từ React
import { createContext, useContext, useState, useEffect } from 'react'

// Import API functions
import { getMe } from '../api/auth'

// Tạo Context - đây là "kho chứa" thông tin user
// Mọi component trong app đều có thể lấy thông tin từ đây
const AuthContext = createContext(null)

// AuthProvider - component bọc toàn bộ app
// Mục đích: cung cấp thông tin user cho tất cả component con
export function AuthProvider({ children }) {
  // State lưu thông tin user đang đăng nhập
  // null = chưa đăng nhập, object = đã đăng nhập
  const [user, setUser] = useState(null)
  
  // State kiểm tra app đang load (kiểm tra token) hay không
  // true = đang kiểm tra, false = đã kiểm tra xong
  const [loading, setLoading] = useState(true)

  // useEffect chạy 1 lần khi app khởi động
  // Mục đích: kiểm tra localStorage có token không, nếu có thì lấy thông tin user
  useEffect(() => {
    const initAuth = async () => {
      // Lấy token từ localStorage
      const token = localStorage.getItem('token')
      
      if (token) {
        try {
          // Gọi API để lấy thông tin user từ token
          const response = await getMe()
          
          // Lưu thông tin user vào state
          setUser(response.data)
        } catch (error) {
          // Token không hợp lệ hoặc hết hạn
          // Xóa token cũ đi
          localStorage.removeItem('token')
          setUser(null)
        }
      }
      
      // Đánh dấu đã kiểm tra xong, dù có token hay không
      setLoading(false)
    }

    initAuth()
  }, []) // [] = chỉ chạy 1 lần khi component mount

  // Hàm đăng nhập - gọi từ LoginPage
  // Lưu token và thông tin user vào state
  const loginUser = (userData, token) => {
    localStorage.setItem('token', token)
    setUser(userData)
  }

  // Hàm đăng xuất - gọi từ bất kỳ component nào
  const logoutUser = () => {
    localStorage.removeItem('token')
    setUser(null)
    window.location.href = '/login'
  }

  // Giá trị được chia sẻ cho toàn bộ app
  const value = {
    user,        // Thông tin user hiện tại
    loading,     // App đang kiểm tra token không
    loginUser,   // Hàm đăng nhập
    logoutUser,  // Hàm đăng xuất
    isLoggedIn: !!user, // true nếu đã đăng nhập, false nếu chưa
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook để lấy thông tin auth từ bất kỳ component nào
// Thay vì viết useContext(AuthContext), chỉ cần viết useAuth()
export function useAuth() {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth phải được dùng bên trong AuthProvider')
  }
  
  return context
}