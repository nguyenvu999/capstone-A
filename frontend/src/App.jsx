// Import BrowserRouter và các components routing từ react-router-dom
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Import AuthProvider để bọc toàn bộ app
import { AuthProvider } from './context/AuthContext'

// Import ProtectedRoute để bảo vệ các trang cần đăng nhập
import ProtectedRoute from './components/ProtectedRoute'

// Import các trang - tạm thời dùng placeholder, sẽ thay bằng trang thật sau
// TODO: Thay thế bằng các page components thật sau khi tạo
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

function App() {
  return (
    // BrowserRouter: kích hoạt routing cho toàn bộ app
    <BrowserRouter>
      {/* AuthProvider: cung cấp thông tin user cho toàn bộ app */}
      <AuthProvider>
        <Routes>
          {/* Route mặc định: tự động chuyển về /login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* PUBLIC ROUTES: ai cũng vào được dù chưa đăng nhập */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* PROTECTED ROUTES: phải đăng nhập mới vào được */}
          {/* Sẽ thêm các trang khác ở các phase sau */}
          <Route
            path="/map"
            element={
              <ProtectedRoute>
                {/* Placeholder tạm thời */}
                <div className="p-8">
                  <h1 className="text-2xl font-bold">Map Page - Coming Soon</h1>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App