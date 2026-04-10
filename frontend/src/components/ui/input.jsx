import { cn } from "@/lib/utils"

function Input({ className, type = "text", style, ...props }) {
  return (
    <input
      type={type}
      style={{
        display: "flex",
        height: "40px",
        width: "100%",
        borderRadius: "6px",
        border: "1px solid #D1D5DB",
        backgroundColor: "#ffffff",
        paddingTop: "8px",
        paddingBottom: "8px",
        paddingRight: "12px",
        // padding-left mặc định, sẽ bị override bởi style từ bên ngoài
        paddingLeft: "12px",
        fontSize: "14px",
        color: "#1E293B",
        outline: "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
        ...style, // Cho phép override từ bên ngoài
      }}
      onFocus={(e) => {
        e.target.style.borderColor = "#2563EB"
        e.target.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.1)"
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "#D1D5DB"
        e.target.style.boxShadow = "none"
      }}
      {...props}
    />
  )
}

export { Input }