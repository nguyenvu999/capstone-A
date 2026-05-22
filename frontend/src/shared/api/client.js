import axios from "axios";
import { supabase } from "../../features/auth/api/supabaseClient";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost/api",
  withCredentials: true
});

// Axios Interceptor: Tự động móc Token từ Supabase ném vào Header Authorization
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export default api;