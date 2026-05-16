import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { AuthProvider } from "./features/auth/context/AuthContext"
import ProtectedRoute from "./features/auth/components/ProtectedRoute"
import LoginPage from "./features/auth/pages/LoginPage"
import AuthCallbackPage from "./features/auth/pages/AuthCallbackPage"
import MapPage from "./features/map/pages/MapPage"
import PlaceDetailPage from "./features/place/pages/PlaceDetailPage"

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Root route: luôn đưa về login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* PUBLIC ROUTES */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* PROTECTED ROUTES */}
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

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App