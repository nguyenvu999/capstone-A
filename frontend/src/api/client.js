// Import axios - thư viện để gọi HTTP requests
import axios from 'axios'

// Tạo một axios instance với config mặc định
// Thay vì gọi axios.get(), ta gọi api.get() - gọn hơn và có config sẵn
const api = axios.create({
  // Base URL - tất cả API call sẽ tự động thêm prefix này
  // Ví dụ: api.get('/places') = gọi đến http://localhost:8080/api/places
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  
  // Timeout 10 giây - nếu server không trả lời sau 10s thì báo lỗi
  timeout: 10000,
  
  // Header mặc định cho mọi request
  headers: {
    'Content-Type': 'application/json',
  },
})

// REQUEST INTERCEPTOR
// Chạy TRƯỚC KHI mỗi request được gửi đi
// Mục đích: tự động gắn token vào header, không cần viết lại ở từng chỗ
api.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage
    const token = localStorage.getItem('token')
    
    // Nếu có token thì gắn vào header Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    // Nếu có lỗi khi setup request thì reject
    return Promise.reject(error)
  }
)

// RESPONSE INTERCEPTOR
// Chạy SAU KHI nhận được response từ server
// Mục đích: bắt lỗi 401 (token hết hạn) ở một chỗ duy nhất
api.interceptors.response.use(
  (response) => {
    // Request thành công - trả về response bình thường
    return response
  },
  (error) => {
    // Nếu server trả về lỗi 401 = token hết hạn hoặc không hợp lệ
    if (error.response?.status === 401) {
      // Xóa token cũ khỏi localStorage
      localStorage.removeItem('token')
      
      // Lưu URL hiện tại để sau khi login lại sẽ quay về đúng trang
      localStorage.setItem('redirectAfterLogin', window.location.pathname)
      
      // Chuyển về trang login
      window.location.href = '/login'
    }
    
    return Promise.reject(error)
  }
)

export default api