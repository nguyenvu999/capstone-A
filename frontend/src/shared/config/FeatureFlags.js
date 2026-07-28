// 💡 Chỉ cho phép đăng nhập Email/Password NẾU ĐANG Ở LOCAL (DEV) VÀ BIẾN ENV LÀ 'true'
const isEmailPasswordEnabled = 
  import.meta.env.DEV && 
  import.meta.env.VITE_ENABLE_EMAIL_PASSWORD_LOGIN === "true";

// Sử dụng biến này để ẩn/hHiện form đăng nhập Email/Password
if (isEmailPasswordEnabled) {
  // Hiển thị ô nhập Email / Password
} else {
  // Chỉ hiển thị nút Đăng nhập bằng Microsoft SSO
}