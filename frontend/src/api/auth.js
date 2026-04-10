// Import axios instance đã config sẵn
import api from './client'

// Tất cả API calls liên quan đến authentication

// Đăng ký tài khoản mới
// userData = { name, email, password, city }
export const register = (userData) => {
  return api.post('/auth/register', userData)
}

// Đăng nhập
// credentials = { email, password }
export const login = (credentials) => {
  return api.post('/auth/login', credentials)
}

// Lấy thông tin user hiện tại từ token
// Dùng khi app load để kiểm tra token còn valid không
export const getMe = () => {
  return api.get('/auth/me')
}