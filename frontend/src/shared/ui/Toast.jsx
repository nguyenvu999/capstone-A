import { useState, useEffect } from "react"
import { X, CheckCircle, AlertCircle, AlertTriangle } from "lucide-react"

// Component Toast hiển thị thông báo cho user
// type: "success" | "error" | "warning"
function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  // Config màu sắc và icon theo type
  const config = {
    success: { bg: "#003b1f", icon: CheckCircle },
    error: { bg: "#dc2626", icon: AlertCircle },
    warning: { bg: "#d97706", icon: AlertTriangle }
  }

  const { bg, icon: Icon } = config[type] || config.success

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "12px 16px",
        borderRadius: "12px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        backgroundColor: bg,
        color: "white",
        fontSize: "14px",
        fontWeight: 500,
        maxWidth: "360px",
      }}
    >
      <Icon size={18} />
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "white",
          display: "flex",
        }}
      >
        <X size={16} />
      </button>
    </div>
  )
}

export function useToast() {
  const [toast, setToast] = useState(null)

  // Hiển thị toast với type tùy chỉnh
  const showToast = (message, type = "success") => {
    setToast({ message, type })
  }

  const hideToast = () => {
    setToast(null)
  }

  const ToastComponent = toast ? (
    <Toast message={toast.message} type={toast.type} onClose={hideToast} />
  ) : null

  // Helper functions để gọi nhanh hơn
  return { 
    showToast, 
    ToastComponent,
    success: (message) => showToast(message, "success"),
    error: (message) => showToast(message, "error"),
    warning: (message) => showToast(message, "warning")
  }
}