import api from "../../../shared/api/client";

// Lấy thông tin user (Dùng để kiểm tra session)
export const getMe = () => api.get("/auth/me");

// Đăng xuất (Để Backend xóa Cookie)
export const logout = () => api.post("/auth/logout");

// Khởi động luồng Microsoft SSO
// authApi.js
export const getMicrosoftSSOStartUrl = () => {
  // Ưu tiên dùng biến định nghĩa sẵn, nếu không có mới ghép từ Base URL
  const startUrl = import.meta.env.VITE_MICROSOFT_AUTH_START_URL;
  if (startUrl) return startUrl;

  const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://backend-capstone-4f1a.onrender.com/api";
  return `${baseUrl}/oauth2/authorization/microsoft`;
};