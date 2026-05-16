// placesApi.js
// API functions cho places

import client from '../../../shared/api/client'

// Lấy danh sách places với filters
// Backend endpoint: GET /api/places?category=1,2&price=2,3&lat=10.7769&lng=106.7009&radius=5000&search=pizza
export const getPlaces = async (filters = {}) => {
  const params = new URLSearchParams()
  
  // Build query params từ filters object
  if (filters.category) params.append('category', filters.category)
  if (filters.price) params.append('price', filters.price)
  if (filters.status) params.append('status', filters.status)
  if (filters.minRating) params.append('minRating', filters.minRating)
  if (filters.lat) params.append('lat', filters.lat)
  if (filters.lng) params.append('lng', filters.lng)
  if (filters.radius) params.append('radius', filters.radius)
  if (filters.search) params.append('search', filters.search)
  if (filters.page) params.append('page', filters.page)
  if (filters.limit) params.append('limit', filters.limit)

  const response = await client.get(`/places?${params.toString()}`)
  return response.data
}

// Lấy chi tiết 1 place
// Backend endpoint: GET /api/places/:id
export const getPlaceById = async (id) => {
  const response = await client.get(`/places/${id}`)
  return response.data
}

// Tạo place mới
// Backend endpoint: POST /api/places
// Backend sẽ check duplicate và trả về 409 error nếu place đã tồn tại
export const createPlace = async (placeData) => {
  const response = await client.post('/places', placeData)
  return response.data
}

// Upload ảnh cho place
// Backend endpoint: POST /api/places/:id/images
export const uploadPlaceImages = async (placeId, images) => {
  const formData = new FormData()
  
  // Append từng file vào FormData
  images.forEach((image) => {
    formData.append('images', image)
  })

  const response = await client.post(`/places/${placeId}/images`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

// Cập nhật place
// Backend endpoint: PUT /api/places/:id
export const updatePlace = async (id, placeData) => {
  const response = await client.put(`/places/${id}`, placeData)
  return response.data
}

// Xóa place
// Backend endpoint: DELETE /api/places/:id
export const deletePlace = async (id) => {
  const response = await client.delete(`/places/${id}`)
  return response.data
}