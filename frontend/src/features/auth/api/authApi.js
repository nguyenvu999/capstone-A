import api from "../../../shared/api/client";

// Lấy thông tin user (Dùng để kiểm tra session)
export const getMe = () => api.get("/auth/me");

// Đăng xuất (Để Backend xóa Cookie)
export const logout = () => api.post("/auth/logout");

// Khởi động luồng Microsoft SSO
export const getMicrosoftSSOStartUrl = () => {
  // Thay đổi: Ưu tiên lấy URL từ biến môi trường của Render, 
  // nếu không có mới dùng localhost (dành cho dev)
  const baseUrl = "https://backend-capstone-4f1a.onrender.com/api";
  return `${baseUrl}/oauth2/authorization/microsoft`;
};