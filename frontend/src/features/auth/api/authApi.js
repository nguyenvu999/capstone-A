import api from "../../../shared/api/client"

// Lấy thông tin user hiện tại từ session/cookie
export const getMe = () => api.get("/auth/me")

// Logout - backend sẽ xóa httpOnly cookie
export const logout = () => api.post("/auth/logout")

// Backend endpoint bắt đầu flow Microsoft SSO
// Thường backend sẽ redirect thẳng sang Microsoft
export const getMicrosoftSSOStartUrl = () =>
  import.meta.env.VITE_MICROSOFT_AUTH_START_URL ||
  `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api"}/auth/sso/microsoft`

// Callback exchange code -> backend xác thực với Microsoft
export const exchangeMicrosoftCode = (code) =>
  api.post("/auth/sso/microsoft/callback", { code })