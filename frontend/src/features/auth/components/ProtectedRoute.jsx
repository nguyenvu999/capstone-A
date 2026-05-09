import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import PageLoader from "../../../shared/ui/PageLoader"
import { saveRedirectAfterLogin } from "../utils/redirectAfterLogin"

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <PageLoader text="Checking your session..." />
  }

  if (!user) {
    // Lưu path user định vào để sau login quay lại đúng page
    const intendedPath =
      `${location.pathname}${location.search}${location.hash}`

    saveRedirectAfterLogin(intendedPath)

    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute