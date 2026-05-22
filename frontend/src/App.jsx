import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./features/auth/context/AuthContext";
import ProtectedRoute from "./features/auth/components/ProtectedRoute";
import LoginPage from "./features/auth/pages/LoginPage";
import PageLoader from "./shared/ui/PageLoader";

// IMPORT CÁC PAGES CHUẨN TỪ FOLDER MAP MỚI TẠO
import MapPage from "./features/map/pages/MapPage";
import PlaceDetailPage from "./features/map/pages/PlaceDetailPage";

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader text="Loading application..." />;
  return user ? <Navigate to="/map" replace /> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />

          {/* CÁC ROUTE ĐƯỢC BẢO VỆ ĐÃ TRỎ ĐÚNG FILE COMPONENT MỚI */}
          <Route
            path="/map"
            element={
              <ProtectedRoute>
                <MapPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/place/:id"
            element={
              <ProtectedRoute>
                <PlaceDetailPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;