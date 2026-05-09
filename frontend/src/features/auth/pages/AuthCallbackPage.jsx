import { useEffect, useRef } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import PageLoader from "../../../shared/ui/PageLoader"
import { useToast } from "../../../shared/ui/Toast"
import { exchangeMicrosoftCode, getMe } from "../api/authApi"
import { useAuth } from "../context/AuthContext"
import {
  consumeRedirectAfterLogin,
  navigateAfterLogin,
} from "../utils/redirectAfterLogin"

function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { finishLogin } = useAuth()
  const { showToast, ToastComponent } = useToast()

  // Ngăn effect chạy lại nhiều lần trong dev / StrictMode
  const hasHandledRef = useRef(false)

  useEffect(() => {
    if (hasHandledRef.current) return
    hasHandledRef.current = true

    const handleCallback = async () => {
      const mock = searchParams.get("mock")
      const code = searchParams.get("code")
      const error = searchParams.get("error")

      if (error) {
        showToast("Microsoft sign-in failed. Please try again.", "error")
        setTimeout(() => {
          navigate("/login", { replace: true })
        }, 1200)
        return
      }

      try {
        if (mock === "true") {
          const mockUser = {
            id: "mock-user-1",
            name: "John Doe",
            email: "john.doe@netcompany.com",
            role: "user",
          }

          finishLogin(mockUser)

          const targetPath = consumeRedirectAfterLogin()
          navigateAfterLogin(navigate, targetPath || "/map")
          return
        }

        if (!code) {
          showToast("Missing Microsoft callback code.", "error")
          setTimeout(() => {
            navigate("/login", { replace: true })
          }, 1200)
          return
        }

        const exchangeResponse = await exchangeMicrosoftCode(code)

        const userData =
          exchangeResponse.data?.user || (await getMe()).data

        finishLogin(userData)

        const targetPath = consumeRedirectAfterLogin()
        navigateAfterLogin(navigate, targetPath || "/map")
      } catch (error) {
        console.error("Callback error:", error)
        showToast(
          error.response?.data?.error || "Authentication failed. Please try again.",
          "error"
        )

        setTimeout(() => {
          navigate("/login", { replace: true })
        }, 1500)
      }
    }

    handleCallback()
  }, [searchParams, navigate, finishLogin, showToast])

  return (
    <>
      <PageLoader text="Signing you in with Microsoft..." />
      {ToastComponent}
    </>
  )
}

export default AuthCallbackPage