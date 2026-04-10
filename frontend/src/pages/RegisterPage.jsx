import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { User, Mail, Lock, Eye, EyeOff, MapPin, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Logo } from "@/components/Logo"
import { useToast } from "@/components/ui/toast"
import { useAuth } from "@/context/AuthContext"
import { register as registerApi } from "@/api/auth"

const CITIES = [
  "Ho Chi Minh City",
  "Hanoi",
]

const registerSchema = z.object({
  name: z.string().min(1, "Full name is required").min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required").min(8, "Password must be at least 8 characters"),
  city: z.string().min(1, "Please select your city"),
})

function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCity, setSelectedCity] = useState("")
  const [cityOpen, setCityOpen] = useState(false)

  const navigate = useNavigate()
  const { loginUser } = useAuth()
  const { showToast, ToastComponent } = useToast()

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", city: "" },
  })

  const handleCitySelect = (city) => {
    setSelectedCity(city)
    setValue("city", city, { shouldValidate: true })
    setCityOpen(false)
  }

  const onSubmit = async (data) => {
    try {
      setIsLoading(true)
      const response = await registerApi({
        name: data.name,
        email: data.email,
        password: data.password,
        city: data.city,
      })
      const { user, token } = response.data
      loginUser(user, token)
      showToast(`Welcome to NetSuggest, ${user.name}!`, "success")
      setTimeout(() => navigate("/map"), 500)
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Registration failed. Please try again."
      showToast(errorMessage, "error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
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

      {/* Background dots */}
      <div style={{
        position: "absolute",
        inset: 0,
        opacity: 0.05,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231E40AF' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Card */}
      <div style={{
        width: "100%",
        maxWidth: "450px",
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
        padding: "40px",
        position: "relative",
        zIndex: 10,
      }}>

        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
          <Logo size="md" />
        </div>

        {/* Heading */}
        <h1 style={{
          textAlign: "center",
          fontSize: "20px",
          fontWeight: 700,
          color: "#1E293B",
          marginBottom: "4px",
        }}>
          Create your account
        </h1>
        <p style={{
          textAlign: "center",
          color: "#64748B",
          fontSize: "14px",
          marginBottom: "28px",
        }}>
          Join your colleagues and start discovering great places
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>

          {/* Full Name */}
          <div style={{ marginBottom: "14px" }}>
            <div style={{ position: "relative" }}>
              <User size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
              <Input type="text" placeholder="Full name" style={{ paddingLeft: "40px" }} {...register("name")} />
            </div>
            {errors.name && <p style={{ color: "#EF4444", fontSize: "12px", marginTop: "4px" }}>{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div style={{ marginBottom: "14px" }}>
            <div style={{ position: "relative" }}>
              <Mail size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
              <Input type="email" placeholder="Work email address" style={{ paddingLeft: "40px" }} {...register("email")} />
            </div>
            {errors.email && <p style={{ color: "#EF4444", fontSize: "12px", marginTop: "4px" }}>{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div style={{ marginBottom: "14px" }}>
            <div style={{ position: "relative" }}>
              <Lock size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
              <Input type={showPassword ? "text" : "password"} placeholder="Create password" style={{ paddingLeft: "40px", paddingRight: "40px" }} {...register("password")} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", display: "flex", alignItems: "center" }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p style={{ color: "#EF4444", fontSize: "12px", marginTop: "4px" }}>{errors.password.message}</p>}
          </div>

          {/* City dropdown */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ position: "relative" }}>
              <MapPin size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8", zIndex: 1 }} />
              <button
                type="button"
                onClick={() => setCityOpen(!cityOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  height: "40px",
                  paddingLeft: "40px",
                  paddingRight: "12px",
                  borderRadius: "6px",
                  border: "1px solid #D1D5DB",
                  backgroundColor: "#ffffff",
                  fontSize: "14px",
                  color: selectedCity ? "#1E293B" : "#94A3B8",
                  cursor: "pointer",
                }}
              >
                {selectedCity || "Select your city"}
                <ChevronDown
                  size={16}
                  style={{
                    color: "#94A3B8",
                    transform: cityOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                />
              </button>

              {/* Dropdown list */}
              {cityOpen && (
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  right: 0,
                  backgroundColor: "#ffffff",
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  zIndex: 50,
                  overflow: "hidden",
                }}>
                  {CITIES.map((city) => (
                    <div
                      key={city}
                      onClick={() => handleCitySelect(city)}
                      style={{
                        padding: "10px 16px",
                        fontSize: "14px",
                        color: selectedCity === city ? "#1D4ED8" : "#1E293B",
                        backgroundColor: selectedCity === city ? "#EFF6FF" : "transparent",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#EFF6FF"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedCity === city ? "#EFF6FF" : "transparent"}
                    >
                      {city}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {errors.city && <p style={{ color: "#EF4444", fontSize: "12px", marginTop: "4px" }}>{errors.city.message}</p>}
          </div>

          {/* Submit button */}
          <Button type="submit" disabled={isLoading} style={{ width: "100%" }}>
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        {/* Sign in link */}
        <p style={{ textAlign: "center", fontSize: "14px", color: "#64748B", marginTop: "16px" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#1D4ED8", fontWeight: 600, textDecoration: "none" }}>
            Sign in
          </Link>
        </p>
      </div>

      {ToastComponent}
    </div>
  )
}

export default RegisterPage