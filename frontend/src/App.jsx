import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./features/auth/context/AuthContext";
import LoginPage from "./features/auth/pages/LoginPage";
import ProtectedRoute from "./features/auth/components/ProtectedRoute";

// Admin features components
import AdminMapPage from "./features/admin-map/pages/AdminMapPage";
import UserManagementPage from "./features/admin-panel/pages/UserManagementPage";
import UpdateRequestsPage from "./features/admin-panel/pages/UpdateRequestsPage";

/**
 * RootHandler avoids losing the Supabase OAuth hash fragments during redirection.
 * Automatically routes authenticated administrators straight to the management dashboard.
 */
function RootHandler() {
  const { user, loading } = useAuth();

  // Displays a loading state while processing Supabase authentication state tokens
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#94AB71]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
      </div>
    );
  }

  // FIXED: Redirects directly to admin users management instead of generic admin route
  return user ? <Navigate to="/admin/users" replace /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Smart Root Path handler to parse incoming auth hash tokens securely */}
          <Route path="/" element={<RootHandler />} />
          
          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Secured Isolated Admin Dashboard Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminMapPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute>
                <UserManagementPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/requests" 
            element={
              <ProtectedRoute>
                <UpdateRequestsPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Global Fallback Route - Redirects any unregistered endpoints back to user management */}
          <Route path="*" element={<Navigate to="/admin/users" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}