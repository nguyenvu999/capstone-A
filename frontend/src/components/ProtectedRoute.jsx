// Import Navigate để redirect user
import { Navigate } from 'react-router-dom'

// Import useAuth hook để lấy thông tin đăng nhập
import { useAuth } from '../context/AuthContext'

// ProtectedRoute - component bảo vệ các trang cần đăng nhập
// Cách dùng: bọc bất kỳ trang nào cần login vào component này
// Ví dụ: <ProtectedRoute><MapPage /></ProtectedRoute>
function ProtectedRoute({ children }) {
  // Lấy thông tin user và trạng thái loading từ AuthContext
  const { user, loading } = useAuth()

  // Nếu app đang kiểm tra token thì hiển thị loading
  // Tránh trường hợp redirect nhầm khi token chưa được verify
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  // Nếu không có user = chưa đăng nhập
  // Redirect về trang login, replace=true để không lưu vào browser history
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Có user = đã đăng nhập, cho phép vào trang
  return children
}

export default ProtectedRoute