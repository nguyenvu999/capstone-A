// Import clsx để kết hợp nhiều className điều kiện
import { clsx } from "clsx"

// Import tailwind-merge để merge Tailwind classes không bị conflict
import { twMerge } from "tailwind-merge"

// Hàm cn() dùng ở KHẮP NƠI trong project
// Mục đích: kết hợp nhiều class Tailwind một cách thông minh
// Ví dụ: cn("text-red-500", isActive && "font-bold", "p-4")
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}