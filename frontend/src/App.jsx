import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./features/auth/context/AuthContext";
import LoginPage from "./features/auth/pages/LoginPage";
import MapPage from "./features/map/pages/MapPage";
import { AccessibilityProvider } from "./shared/context/AccessibilityContext";
import ItinerariesPage from "./features/itinerary/pages/ItinerariesPage";
import ItineraryDetailPage from "./features/itinerary/pages/ItineraryDetailPage";
import ProtectedRoute from "./features/auth/components/ProtectedRoute";

// Component trung gian xử lý trang gốc để tránh nuốt mất Token OAuth của Supabase
function RootHandler() {
  const { user, loading } = useAuth();

  // Nếu đang nạp token, giữ nguyên giao diện loading đẹp mắt của bạn
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#94AB71]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
      </div>
    );
  }

  // Nếu đã có user thì vào thẳng /map, ngược lại thì sang /login
  return user ? <Navigate to="/map" replace /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <AccessibilityProvider>
      <BrowserRouter>
        <Routes>
          {/* Định tuyến mặc định thông minh - Fix lỗi nuốt mã băm hash token */}
          <Route path="/" element={<RootHandler />} />
          
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

            {/* Itinerary pages */}
          <Route
            path="/itineraries"
            element={
              <ProtectedRoute>
                <ItinerariesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/itineraries/:id"
            element={
              <ProtectedRoute>
                <ItineraryDetailPage />
              </ProtectedRoute>
            }
          />
          
          {/* Xử lý các đường dẫn không tồn tại */}
          <Route path="*" element={<Navigate to="/map" replace />} />
        </Routes>
      </BrowserRouter>
      </AccessibilityProvider>
    </AuthProvider>
  );
}
