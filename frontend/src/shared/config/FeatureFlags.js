// src/shared/config/FeatureFlags.js

// Chỉ bật khi ở LOCAL (import.meta.env.DEV) VÀ biến env = "true"
export const ENABLE_EMAIL_PASSWORD_LOGIN =
  import.meta.env.DEV && import.meta.env.VITE_ENABLE_EMAIL_PASSWORD_LOGIN === "true";