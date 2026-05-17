// reviewsApi.js
// API functions cho reviews

import client from '../../../shared/api/client'

// Lấy danh sách reviews của 1 place
// Backend endpoint: GET /api/places/:id/reviews?page=1&limit=15
export const getReviews = async (placeId, page = 1, limit = 15) => {
  const response = await client.get(`/places/${placeId}/reviews`, {
    params: { page, limit }
  })
  return response.data
}

// Tạo review mới
// Backend endpoint: POST /api/places/:id/reviews
// Backend sẽ check xem user đã review place này chưa (mỗi user chỉ review 1 lần)
export const createReview = async (placeId, reviewData) => {
  const response = await client.post(`/places/${placeId}/reviews`, reviewData)
  return response.data
}

// Cập nhật review (Should Have feature - chưa cần làm sprint này)
// Backend endpoint: PUT /api/reviews/:id
export const updateReview = async (reviewId, reviewData) => {
  const response = await client.put(`/reviews/${reviewId}`, reviewData)
  return response.data
}

// Xóa review (Should Have feature - chưa cần làm sprint này)
// Backend endpoint: DELETE /api/reviews/:id
export const deleteReview = async (reviewId) => {
  const response = await client.delete(`/reviews/${reviewId}`)
  return response.data
}