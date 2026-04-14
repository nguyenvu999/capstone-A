import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { MapPin, X, ArrowLeft, Eye, EyeOff, ChevronDown } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { login, register as registerApi } from "../../api/auth"
import { useToast } from "../ui/Toast"
import { useState, useEffect } from "react"

// Danh sách cities
const CITIES = [
  "Ho Chi Minh City",
  "Hanoi",
]

// Validation schema cho Login
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
})

// Validation schema cho Register
const registerSchema = z.object({
  name: z
    .string()
    .min(1, "Full name is required")
    .min(2, "Name must be at least 2 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
  city: z.string().min(1, "Please select your city"),
})

// ================================================
// LOGIN FORM
// ================================================
function LoginForm({ onSwitchToRegister, onClose }) {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { loginUser, isLoggedIn } = useAuth()
  const { showToast, ToastComponent } = useToast()
  const navigate = useNavigate()

  // Nếu đã đăng nhập rồi thì đóng modal và chuyển về /map
  useEffect(() => {
    if (isLoggedIn) {
        onClose()
        navigate("/map")
       }
    }, [isLoggedIn])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
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
      setTimeout(() => {
        onClose()
        navigate("/map")
      }, 800)
    } catch (error) {
      const msg = error.response?.data?.error || "Invalid email or password"
      showToast(msg, "error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="mb-5 mt-3">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#003b1f]">
          <MapPin className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-[30px] font-bold leading-[34px] tracking-tight text-[#001910]">
          Welcome back.
        </h2>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Email */}
        <div>
          <label className="mb-2 block text-[14px] font-semibold text-[#16351e]">
            Email address
          </label>
          <input
            type="email"
            placeholder="Email"
            className="h-[48px] w-full rounded-[12px] border border-[#8ea183] px-4 text-[15px] outline-none transition focus:border-[#355e1d]"
            {...register("email")}
          />
          {/* Lỗi validation hiện ngay bên dưới input */}
          {errors.email && (
            <p className="mt-1 text-[12px] text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="mb-2 block text-[14px] font-semibold text-[#16351e]">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="h-[48px] w-full rounded-[12px] border border-[#8ea183] px-4 pr-11 text-[15px] outline-none transition focus:border-[#355e1d]"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#355e1d]"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-[12px] text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* Forgot password */}
        <button
          type="button"
          className="text-[14px] text-[#355e1d] underline hover:text-black"
        >
          Forgot password?
        </button>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="h-[50px] w-full rounded-full bg-[#003b1f] text-[17px] font-semibold text-white transition hover:bg-[#002814] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      {/* Switch to register */}
      <div className="mt-6 text-center">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#d7ddd4]" />
          <span className="text-[14px] text-[#5f6a60]">Not a member?</span>
          <div className="h-px flex-1 bg-[#d7ddd4]" />
        </div>
        <p className="text-[14px] text-[#355e1d]">
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-bold underline"
          >
            Join
          </button>{" "}
          to unlock the best of NetSuggest.
        </p>
        <p className="mt-5 text-[11px] leading-5 text-[#6b746c]">
          By proceeding, you agree to our{" "}
          <span className="underline">Terms of Use</span> and confirm you have
          read our <span className="underline">Privacy and Cookie Statement</span>.
        </p>
      </div>

      {ToastComponent}
    </>
  )
}

// ================================================
// REGISTER FORM
// ================================================
function RegisterForm({ onSwitchToLogin, onClose }) {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCity, setSelectedCity] = useState("")
  const [cityOpen, setCityOpen] = useState(false)
  const { loginUser } = useAuth()
  const { showToast, ToastComponent } = useToast()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", city: "" },
  })

  // Xử lý chọn city
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
      setTimeout(() => {
        onClose()
        navigate("/map")
      }, 800)
    } catch (error) {
      const msg = error.response?.data?.error || "Registration failed. Please try again."
      showToast(msg, "error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="mb-5 mt-3">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#003b1f]">
          <MapPin className="h-6 w-6 text-white" />
        </div>
        <h2 className="max-w-[360px] text-[26px] font-bold leading-[30px] tracking-tight text-[#001910]">
          Join to unlock the best of NetSuggest
        </h2>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Full Name - đổi từ First/Last thành Full Name */}
        <div>
          <label className="mb-2 block text-[14px] font-semibold text-[#16351e]">
            Full Name
          </label>
          <input
            type="text"
            placeholder="Full name"
            className="h-[48px] w-full rounded-[12px] border border-[#8ea183] px-4 text-[15px] outline-none transition focus:border-[#355e1d]"
            {...register("name")}
          />
          {errors.name && (
            <p className="mt-1 text-[12px] text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="mb-2 block text-[14px] font-semibold text-[#16351e]">
            Email address
          </label>
          <input
            type="email"
            placeholder="Email"
            className="h-[48px] w-full rounded-[12px] border border-[#8ea183] px-4 text-[15px] outline-none transition focus:border-[#355e1d]"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-[12px] text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="mb-2 block text-[14px] font-semibold text-[#16351e]">
            Create a password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="h-[48px] w-full rounded-[12px] border border-[#8ea183] px-4 pr-11 text-[15px] outline-none transition focus:border-[#355e1d]"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#355e1d]"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-[12px] text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* City dropdown */}
        <div>
          <label className="mb-2 block text-[14px] font-semibold text-[#16351e]">
            City
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setCityOpen(!cityOpen)}
              className="h-[48px] w-full rounded-[12px] border border-[#8ea183] px-4 text-[15px] outline-none transition focus:border-[#355e1d] flex items-center justify-between bg-white"
            >
              <span className={selectedCity ? "text-[#001910]" : "text-gray-400"}>
                {selectedCity || "Select your city"}
              </span>
              <ChevronDown
                size={16}
                className={`text-[#8ea183] transition-transform duration-200 ${cityOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown list */}
            {cityOpen && (
              <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 rounded-[12px] border border-[#C7D9B5] bg-white shadow-lg overflow-hidden">
                {CITIES.map((city) => (
                  <div
                    key={city}
                    onClick={() => handleCitySelect(city)}
                    className="px-4 py-3 text-[14px] cursor-pointer hover:bg-[#f0f5eb] transition-colors"
                    style={{ color: selectedCity === city ? "#355e1d" : "#001910" }}
                  >
                    {city}
                  </div>
                ))}
              </div>
            )}
          </div>
          {errors.city && (
            <p className="mt-1 text-[12px] text-red-500">{errors.city.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="h-[50px] w-full rounded-full bg-[#003b1f] text-[17px] font-semibold text-white transition hover:bg-[#002814] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? "Creating account..." : "Join"}
        </button>
      </form>

      {/* Switch to login */}
      <div className="mt-6 text-center">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#d7ddd4]" />
          <span className="text-[14px] text-[#5f6a60]">Already a member?</span>
          <div className="h-px flex-1 bg-[#d7ddd4]" />
        </div>
        <p className="text-[14px] text-[#355e1d]">
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-bold underline"
          >
            Sign in
          </button>{" "}
          using your NetSuggest account.
        </p>
        <p className="mt-5 text-[11px] leading-5 text-[#6b746c]">
          By proceeding, you agree to our{" "}
          <span className="underline">Terms of Use</span> and confirm you have
          read our <span className="underline">Privacy and Cookie Statement</span>.
        </p>
      </div>

      {ToastComponent}
    </>
  )
}

// ================================================
// AUTH MODAL - Component chính
// ================================================
function AuthModal({ authMode, setAuthMode }) {
  // Đóng modal
  const handleClose = () => setAuthMode(null)

  if (!authMode) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-[520px] rounded-[22px] bg-white px-7 pt-6 pb-5 shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Nút back - chỉ hiện ở register để quay về login */}
        <button
          type="button"
          onClick={() =>
            authMode === "register" ? setAuthMode("login") : handleClose()
          }
          className="absolute left-4 top-4 text-[#17341e] hover:opacity-70"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* Nút đóng modal */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 text-[#17341e] hover:opacity-70"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Render form tương ứng */}
        {authMode === "login" ? (
          <LoginForm
            onSwitchToRegister={() => setAuthMode("register")}
            onClose={handleClose}
          />
        ) : (
          <RegisterForm
            onSwitchToLogin={() => setAuthMode("login")}
            onClose={handleClose}
          />
        )}
      </div>
    </div>
  )
}

export default AuthModal