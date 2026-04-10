import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Mail, Lock, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Logo } from "@/components/Logo"
import { useToast } from "@/components/ui/toast"
import { useAuth } from "@/context/AuthContext"
import { login } from "@/api/auth"

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
})

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const navigate = useNavigate()
  const { loginUser } = useAuth()
  const { showToast, ToastComponent } = useToast()

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (data) => {
    try {
      setIsLoading(true)
      const response = await login({ email: data.email, password: data.password })
      const { user, token } = response.data
      loginUser(user, token)
      showToast(`Welcome back, ${user.name}!`, "success")
      const redirectPath = localStorage.getItem("redirectAfterLogin")
      setTimeout(() => {
        if (redirectPath) {
          localStorage.removeItem("redirectAfterLogin")
          navigate(redirectPath)
        } else {
          navigate("/map")
        }
      }, 500)
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Something went wrong. Please try again."
      showToast(errorMessage, "error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    /* Toàn bộ trang: căn giữa theo chiều dọc và ngang */
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
      background: "linear-gradient(to bottom, #EFF6FF, #ffffff)",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* Background dots pattern */}
      <div style={{
        position: "absolute",
        inset: 0,
        opacity: 0.05,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231E40AF' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Card container */}
      <div style={{
        width: "100%",
        maxWidth: "420px",
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
        padding: "40px",
        position: "relative",
        zIndex: 10,
      }}>

        {/* Logo - căn giữa */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>
          <Logo size="md" />
        </div>

        {/* Tagline */}
        <p style={{
          textAlign: "center",
          color: "#64748B",
          fontSize: "14px",
          fontStyle: "italic",
          marginBottom: "32px",
        }}>
          Discover places your colleagues love
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>

          {/* Email field */}
          <div style={{ marginBottom: "16px" }}>
            <div style={{ position: "relative" }}>
              <Mail
                size={18}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94A3B8",
                }}
              />
              <Input
                type="email"
                placeholder="Email address"
                style={{ paddingLeft: "40px" }}
                {...register("email")}
              />
            </div>
            {/* Error message */}
            {errors.email && (
              <p style={{ color: "#EF4444", fontSize: "12px", marginTop: "4px" }}>
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password field */}
          <div style={{ marginBottom: "16px" }}>
            <div style={{ position: "relative" }}>
              <Lock
                size={18}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94A3B8",
                }}
              />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                style={{ paddingLeft: "40px", paddingRight: "40px" }}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#94A3B8",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p style={{ color: "#EF4444", fontSize: "12px", marginTop: "4px" }}>
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Remember me + Forgot password */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
          }}>
            <label style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              fontSize: "14px",
              color: "#64748B",
            }}>
              <Checkbox
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked)}
              />
              Remember me
            </label>
            <span style={{
              fontSize: "14px",
              color: "#1D4ED8",
              cursor: "pointer",
            }}>
              Forgot password?
            </span>
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            disabled={isLoading}
            style={{ width: "100%" }}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        {/* Divider */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          margin: "20px 0",
        }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: "#E2E8F0" }} />
          <span style={{ color: "#94A3B8", fontSize: "14px" }}>or</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "#E2E8F0" }} />
        </div>

        {/* Register link */}
        <p style={{ textAlign: "center", fontSize: "14px", color: "#64748B" }}>
          {"Don't have an account?"}{" "}
          <Link
            to="/register"
            style={{ color: "#1D4ED8", fontWeight: 600, textDecoration: "none" }}
          >
            Create one here
          </Link>
        </p>
      </div>

      {/* Toast */}
      {ToastComponent}
    </div>
  )
}

export default LoginPage