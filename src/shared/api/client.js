import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost/api",
  withCredentials: true, // Quan trọng để gửi Cookie
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Phát tín hiệu cho AuthContext
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }
    return Promise.reject(error);
  }
);

export default api;