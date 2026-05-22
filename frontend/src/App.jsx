import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./features/auth/context/AuthContext";
import LoginPage from "./features/auth/pages/LoginPage";
import MapPage from "./features/map/pages/MapPage";
import ProtectedRoute from "./features/auth/components/ProtectedRoute";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Định tuyến mặc định truy cập web */}
          <Route path="/" element={<Navigate to="/map" replace />} />
          
          <Route path="/login" element={<LoginPage />} />
          
          {/* Bảo vệ trang Map bằng ProtectedRoute */}
          <Route 
            path="/map" 
            element={
              <ProtectedRoute>
                <MapPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Xử lý các đường dẫn không tồn tại */}
          <Route path="*" element={<Navigate to="/map" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}