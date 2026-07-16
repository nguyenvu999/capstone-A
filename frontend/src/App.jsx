import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./features/auth/context/AuthContext";
import LoginPage from "./features/auth/pages/LoginPage";
import MapPage from "./features/map/pages/MapPage";
import { AccessibilityProvider } from "./shared/context/AccessibilityContext";
import ItinerariesPage from "./features/itinerary/pages/ItinerariesPage";
import ItineraryDetailPage from "./features/itinerary/pages/ItineraryDetailPage";
import ProtectedRoute from "./features/auth/components/ProtectedRoute";

function RootHandler() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#94AB71]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
      </div>
    );
  }

  return user ? <Navigate to="/map" replace /> : <Navigate to="/login" replace />;
}

export default function App() {
  // Không cần state showIntro ở đây nữa
  
  return (
    <AuthProvider>
      <AccessibilityProvider>
        {/* App vào thẳng BrowserRouter, không cần điều kiện {showIntro ? ... : ...} nữa */}
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootHandler />} />
            <Route path="/login" element={<LoginPage />} />
            
            <Route 
              path="/map" 
              element={
                <ProtectedRoute>
                  <MapPage />
                </ProtectedRoute>
              } 
            />

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
            
            <Route path="*" element={<Navigate to="/map" replace />} />
          </Routes>
        </BrowserRouter>
      </AccessibilityProvider>
    </AuthProvider>
  );
}