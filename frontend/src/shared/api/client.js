import axios from "axios"

// Axios instance dùng chung cho toàn app
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
  timeout: 10000,

  // RẤT QUAN TRỌNG:
  // withCredentials: true để browser tự gửi cookie httpOnly lên backend
  // Đây là hướng mới thay cho localStorage token
  withCredentials: true,

  headers: {
    "Content-Type": "application/json",
  },
})

// Response interceptor để xử lý session hết hạn
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Nếu backend trả 401 thì coi như session không còn hợp lệ
    if (error.response?.status === 401) {
      const currentPath =
        `${window.location.pathname}${window.location.search}${window.location.hash}`

      // Nếu user đang ở protected page thì lưu intended destination
      if (
        currentPath !== "/login" &&
        currentPath !== "/auth/callback"
      ) {
        sessionStorage.setItem("redirectAfterLogin", currentPath)
      }

      // Phát tín hiệu để AuthContext clear user state
      window.dispatchEvent(new CustomEvent("auth:unauthorized"))

      // Chuyển về login page và replace history để tránh quay lại state cũ
      window.location.replace("/login")
    }

    return Promise.reject(error)
  }
)

export default api