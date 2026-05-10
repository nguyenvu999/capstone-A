import api from "../../../shared/api/client";

// Lấy thông tin user (Dùng để kiểm tra session)
export const getMe = () => api.get("/auth/me");

// Đăng xuất (Để Backend xóa Cookie)
export const logout = () => api.post("/auth/logout");

// Khởi động luồng Microsoft SSO
export const getMicrosoftSSOStartUrl = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
  return `${baseUrl}/oauth2/authorization/microsoft`;
};