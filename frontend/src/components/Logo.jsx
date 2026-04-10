// Logo component - hiển thị logo NetSuggest
// Dùng ở LoginPage, RegisterPage, và Navbar
import { MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

// Các kích thước logo
const logoSizes = {
  sm: { icon: 20, text: "text-lg" },
  md: { icon: 28, text: "text-2xl" },
  lg: { icon: 36, text: "text-3xl" },
}

function Logo({ size = "md", className }) {
  const { icon, text } = logoSizes[size]

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Icon: kết hợp Globe và MapPin */}
      <div className="relative">
        <MapPin
          size={icon}
          className="text-blue-700"
          fill="currentColor"
          fillOpacity={0.2}
        />
      </div>

      {/* Text: NetSuggest */}
      <span className={cn("font-bold text-blue-700", text)}>
        NetSuggest
      </span>
    </div>
  )
}

export { Logo }