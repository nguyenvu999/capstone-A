import { supabase } from "./supabaseClient";
import api from "../../../shared/api/client";

export const signUpWithEmail = (email, password) => 
  supabase.auth.signUp({ email, password });

export const signInWithEmail = (email, password) => 
  supabase.auth.signInWithPassword({ email, password });

export const logout = () => supabase.auth.signOut();

export const getMe = () => api.get("/auth/me");