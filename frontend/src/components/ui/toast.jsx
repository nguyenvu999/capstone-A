// Toast notification component
// Hiện thông báo ngắn ở góc màn hình rồi tự động biến mất
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { X, CheckCircle, AlertCircle } from "lucide-react"

function Toast({ message, type = "success", onClose }) {
  // Tự động đóng sau 3 giây
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 3000)

    // Cleanup: xóa timer khi component unmount
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={cn(
        // Vị trí: góc dưới phải màn hình
        "fixed bottom-4 right-4 z-50",
        "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg",
        "text-sm font-medium text-white",
        "animate-in slide-in-from-bottom-2",
        // Màu theo type
        type === "success" ? "bg-green-600" : "bg-red-600"
      )}
    >
      {/* Icon */}
      {type === "success" ? (
        <CheckCircle size={18} />
      ) : (
        <AlertCircle size={18} />
      )}

      {/* Message */}
      <span>{message}</span>

      {/* Nút đóng */}
      <button
        onClick={onClose}
        className="ml-2 hover:opacity-70 transition-opacity"
      >
        <X size={16} />
      </button>
    </div>
  )
}

// Custom hook để dùng toast dễ dàng hơn
// Cách dùng: const { showToast, ToastComponent } = useToast()
function useToast() {
  const [toast, setToast] = useState(null)

  // Hàm hiện toast
  const showToast = (message, type = "success") => {
    setToast({ message, type })
  }

  // Hàm đóng toast
  const hideToast = () => {
    setToast(null)
  }

  // Component render toast (đặt ở cuối return của page)
  const ToastComponent = toast ? (
    <Toast message={toast.message} type={toast.type} onClose={hideToast} />
  ) : null

  return { showToast, ToastComponent }
}

export { Toast, useToast }