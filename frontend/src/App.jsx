import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"
import LandingPage from "./pages/LandingPage"
import PlacesPage from "./pages/PlacesPage"
import AddPlacePage from "./pages/AddPlacePage"

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route
            path="/map"
            element={
              <ProtectedRoute>
                <div style={{ padding: "32px" }}>
                  <h1>Map Page - Coming Soon</h1>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/places"
            element={
              <ProtectedRoute>
                <PlacesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/places/new"
            element={
              <ProtectedRoute>
                <AddPlacePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App