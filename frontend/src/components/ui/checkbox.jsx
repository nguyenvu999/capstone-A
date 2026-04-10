// Checkbox component
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

function Checkbox({
  className,
  checked = false,        // Trạng thái checked hay không
  onCheckedChange,        // Callback khi user click (truyền true/false)
  disabled = false,
  ...props
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange && onCheckedChange(!checked)}
      className={cn(
        // Base styles - hình vuông nhỏ
        "h-4 w-4 rounded border border-gray-300",
        "flex items-center justify-center",
        "transition-colors duration-200",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        // Khi checked: nền xanh, viền xanh
        checked ? "bg-blue-700 border-blue-700" : "bg-white",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      {...props}
    >
      {/* Icon check chỉ hiện khi checked */}
      {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
    </button>
  )
}

export { Checkbox }