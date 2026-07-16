import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./features/auth/context/AuthContext";
import LoginPage from "./features/auth/pages/LoginPage";
import MapPage from "./features/map/pages/MapPage";
import { AccessibilityProvider } from "./shared/context/AccessibilityContext";
import ItinerariesPage from "./features/itinerary/pages/ItinerariesPage";
import ItineraryDetailPage from "./features/itinerary/pages/ItineraryDetailPage";
import ProtectedRoute from "./features/auth/components/ProtectedRoute";
// Đảm bảo đường dẫn import dưới đây khớp với vị trí file IntroScreen của bạn
import IntroScreen from "./features/map/components/IntroScreen"; 

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
  // Khởi tạo state bằng hàm callback để kiểm tra môi trường ngay lập tức khi load
  const [showIntro, setShowIntro] = useState(() => {
    // 1. Nếu đã xem rồi trong phiên này (sessionStorage), không hiện lại
    if (sessionStorage.getItem('hasSeenIntro')) return false;

    // 2. Kiểm tra nếu là thiết bị di động
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // 3. Kiểm tra nếu đang chạy chế độ PWA (Standalone)
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator.standalone === true);

    // Chỉ hiện Intro nếu là Mobile HOẶC PWA
    return isMobile || isPWA;
  });

  // Xử lý ẩn Intro sau khi đã hiển thị
  const handleIntroFinished = () => {
    setShowIntro(false);
    sessionStorage.setItem('hasSeenIntro', 'true');
  };

  return (
    <AuthProvider>
      <AccessibilityProvider>
        {showIntro ? (
          <IntroScreen onFinish={handleIntroFinished} />
        ) : (
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
        )}
      </AccessibilityProvider>
    </AuthProvider>
  );
}