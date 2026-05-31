import { supabase } from "./supabaseClient";
import api from "../../../shared/api/client";

// Đăng ký tài khoản bằng Email & Password
export const signUpWithEmail = (email, password) => 
  supabase.auth.signUp({ email, password });

// Đăng nhập bằng Email & Password
export const signInWithEmail = (email, password) => 
  supabase.auth.signInWithPassword({ email, password });

// Đăng nhập bằng Microsoft (Azure AD) OAuth
export const signInWithMicrosoft = () => 
  supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: {
      scopes: 'openid profile email', // Yêu cầu quyền lấy thông tin profile và email từ tài khoản Microsoft
    }
  });

// Đăng xuất ứng dụng khỏi Supabase
export const logout = () => supabase.auth.signOut();

// Lấy thông tin user hiện tại từ hệ thống Backend riêng (nếu có)
export const getMe = () => api.get("/auth/me");