import api from "../../../shared/api/client";

export const getMe = () => api.get("/auth/me");
export const logout = () => api.post("/auth/logout");

export const getMicrosoftSSOStartUrl = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
  return `${baseUrl}/oauth2/authorization/microsoft`;
};