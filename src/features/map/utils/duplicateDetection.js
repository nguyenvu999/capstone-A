// duplicateDetection.js
// Utility functions để xử lý duplicate detection
// File này KHÔNG check duplicate — backend mới check
// File này chỉ xử lý UI logic khi backend trả về duplicate error

// Chuẩn hóa text để so sánh (dùng để hiển thị preview cho user)
export function normalizeText(text) {
  if (!text) return ''
  
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')           // Thay nhiều spaces bằng 1 space
    .replace(/[^\w\s]/g, '')        // Xóa ký tự đặc biệt
}

// Kiểm tra xem error có phải là duplicate detection không
export function isDuplicateError(error) {
  return (
    error.response?.status === 409 && 
    error.response?.data?.error === 'duplicate_place'
  )
}

// Lấy thông tin existing place từ duplicate error
export function getExistingPlaceFromError(error) {
  if (!isDuplicateError(error)) return null
  return error.response?.data?.existing_place || null
}