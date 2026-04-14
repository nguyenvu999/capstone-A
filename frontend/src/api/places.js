import api from "./client"

export const createPlace = (formData) => {
  return api.post("/places", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })
}

export const getPlaces = (params = {}) => {
  return api.get("/places", { params })
}

export const getPlaceById = (id) => {
  return api.get(`/places/${id}`)
}

export const updatePlace = (id, formData) => {
  return api.put(`/places/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })
}

export const deletePlace = (id) => {
  return api.delete(`/places/${id}`)
}