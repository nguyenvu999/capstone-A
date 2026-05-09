import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Logo from "../../../shared/ui/Logo"
import MicrosoftSignInButton from "../components/MicrosoftSignInButton"
import { useAuth } from "../context/AuthContext"

function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    // Nếu user đã đăng nhập rồi thì không cần ở login page nữa
    if (!loading && isAuthenticated) {
      navigate("/map", { replace: true })
    }
  }, [loading, isAuthenticated, navigate])

  const handleMicrosoftSignIn = async () => {
    try {
      setIsLoading(true)

      const useMockSSO = import.meta.env.VITE_USE_MOCK_SSO === "true"

      // Mock mode để FE test trước khi backend SSO hoàn chỉnh
      if (useMockSSO) {
        navigate("/auth/callback?mock=true", { replace: true })
        return
      }

      const startUrl =
        import.meta.env.VITE_MICROSOFT_AUTH_START_URL ||
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api"}/auth/sso/microsoft`

      // Dùng replace để login page không nằm lại trong browser history
      window.location.replace(startUrl)
    } catch (error) {
      console.error("Microsoft sign-in error:", error)
      setIsLoading(false)
    }
  }

  if (loading) {
    return null
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-[#94AB71] px-4 [font-family:"Nunito_Sans",sans-serif]'>
      <div className="w-full max-w-[420px] rounded-[22px] bg-white px-10 py-10 shadow-2xl">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>

        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-[#001910]">
            Sign in to NetSuggest
          </h1>

          <p className="mb-8 text-sm text-[#5f6a60]">
            Use your Microsoft account to continue
          </p>

          <MicrosoftSignInButton
            onClick={handleMicrosoftSignIn}
            isLoading={isLoading}
          />

          <p className="mt-6 text-xs leading-6 text-[#6b746c]">
            Only authorized company users can access this platform. By signing in,
            you authorize this app to access your Microsoft account information as
            outlined in our{" "}
            <span className="underline">privacy policy</span>.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage