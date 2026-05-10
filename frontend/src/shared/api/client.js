import axios from "axios";

const api = axios.create({
  // URL Backend của bạn trên Render
  baseURL: "https://backend-capstone-4f1a.onrender.com/api",
  // BẮT BUỘC: Để Axios gửi kèm Cookie access_token trong mọi request
  withCredentials: true, 
});

// Interceptor để xử lý lỗi 401 (Hết hạn phiên)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
    return Promise.reject(error);
  }
);

export default api;