import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Landing page - public */}
          <Route path="/" element={<LandingPage />} />

          {/* Protected routes - sẽ thêm sau */}
          <Route
            path="/map"
            element={
              <ProtectedRoute>
                <div style={{ padding: '32px' }}>
                  <h1>Map Page - Coming Soon</h1>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App