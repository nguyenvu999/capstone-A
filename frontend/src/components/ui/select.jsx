// Select dropdown component
import React, { useState } from "react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

// SelectTrigger - phần hiển thị (nút bấm để mở dropdown)
function SelectTrigger({ className, children, onClick, isOpen, ...props }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2",
        "text-sm text-gray-900",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
        "transition-colors duration-200",
        className
      )}
      {...props}
    >
      {children}
      {/* Icon mũi tên xoay khi mở */}
      <ChevronDown
        className={cn(
          "h-4 w-4 text-gray-400 transition-transform duration-200",
          isOpen && "rotate-180"
        )}
      />
    </button>
  )
}

// SelectValue - text hiển thị trong trigger
function SelectValue({ placeholder, value }) {
  return (
    <span className={cn(value ? "text-gray-900" : "text-gray-400")}>
      {value || placeholder}
    </span>
  )
}

// SelectContent - dropdown list
function SelectContent({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg",
        "max-h-60 overflow-auto",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// SelectItem - mỗi option trong dropdown
function SelectItem({ className, children, value, onSelect, ...props }) {
  return (
    <div
      onClick={() => onSelect && onSelect(value)}
      className={cn(
        "px-3 py-2 text-sm text-gray-900 cursor-pointer",
        "hover:bg-blue-50 hover:text-blue-700",
        "transition-colors duration-150",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// Select - component chính bọc tất cả
function Select({ value, onValueChange, children }) {
  // State kiểm soát dropdown có đang mở không
  const [isOpen, setIsOpen] = useState(false)

  // Clone children và truyền thêm props cần thiết
  const childrenWithProps = React.Children.map(children, (child) => {
    if (child.type === SelectTrigger) {
      return React.cloneElement(child, {
        onClick: () => setIsOpen(!isOpen),
        isOpen,
      })
    }
    if (child.type === SelectContent) {
      if (!isOpen) return null
      // Clone SelectItems bên trong SelectContent
      const contentChildren = React.Children.map(
        child.props.children,
        (item) => {
          if (item.type === SelectItem) {
            return React.cloneElement(item, {
              onSelect: (val) => {
                onValueChange(val)
                setIsOpen(false)
              },
            })
          }
          return item
        }
      )
      return React.cloneElement(child, {}, contentChildren)
    }
    return child
  })

  return (
    <div className="relative">
      {childrenWithProps}
    </div>
  )
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }