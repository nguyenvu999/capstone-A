// RegisterPlaceDrawer.jsx
// Drawer để user đăng ký place mới
// Flow: Hiển thị warning về auto-fill → scroll xuống → form Add Place Manually

import { useState } from "react"
import { X, MapPin, AlertCircle, Check, Utensils, Wine, Eye, Gamepad2, Users } from "lucide-react"
import { CATEGORY_DEFINITIONS, PRICE_LEVELS } from "../constants/mapConstants"
import { createPlace, uploadPlaceImages } from "../api/placesApi"
import { isDuplicateError, getExistingPlaceFromError } from "../utils/duplicateDetection"
import DuplicatePlaceModal from "./DuplicatePlaceModal"
import ImageUpload from "./ImageUpload"


// Map icon names sang components
const iconMap = {
  Utensils,
  Wine,
  Eye,
  Gamepad2,
  Users,
}

function RegisterPlaceDrawer({ isOpen, onClose, onPlaceAdded }) {
  // Form state
  const [placeName, setPlaceName] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("Ho Chi Minh City")
  const [description, setDescription] = useState("")
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedPrice, setSelectedPrice] = useState("$$")
  const [openingHours, setOpeningHours] = useState("")
  const [images, setImages] = useState([])
  
  // Location state
  const [locationMode, setLocationMode] = useState("address") // "address" | "map"
  const [latitude, setLatitude] = useState(10.7769)
  const [longitude, setLongitude] = useState(106.7009)
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [duplicatePlace, setDuplicatePlace] = useState(null)

  if (!isOpen) return null

  // Toggle category selection (multi-select)
  const toggleCategory = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  // Validate form
  const validateForm = () => {
    const newErrors = {}
    
    if (!placeName.trim()) {
      newErrors.placeName = "Place name is required"
    }
    
    if (!address.trim()) {
      newErrors.address = "Address is required"
    }
    
    if (selectedCategories.length === 0) {
      newErrors.categories = "Please select at least one category"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submit
  const handleSubmit = async () => {
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      // Map price level string to number
      const priceLevelMap = { "$": 1, "$$": 2, "$$$": 3, "$$$$": 4 }
      
      // Prepare place data
      const placeData = {
        name: placeName.trim(),
        address: address.trim(),
        city: city.trim(),
        latitude,
        longitude,
        price_level: priceLevelMap[selectedPrice],
        description: description.trim() || null,
        category_ids: selectedCategories, // Backend sẽ map string IDs sang numeric IDs
        business_status: "open",
      }
      
      // Call API để tạo place
      const response = await createPlace(placeData)
      const createdPlace = response.data
      
      // Nếu có ảnh, upload riêng
      if (images.length > 0) {
        await uploadPlaceImages(createdPlace.id, images)
      }
      
      // Success — đóng drawer và trigger refresh map
      if (onPlaceAdded) {
        onPlaceAdded(createdPlace)
      }
      handleClose()
      
    } catch (error) {
      // Check nếu là duplicate error
      if (isDuplicateError(error)) {
        const existingPlace = getExistingPlaceFromError(error)
        setDuplicatePlace(existingPlace)
        setShowDuplicateModal(true)
      } else {
        // Other errors
        console.error('Failed to create place:', error)
        setErrors({ submit: 'Failed to create place. Please try again.' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form và đóng drawer
  const handleClose = () => {
    setPlaceName("")
    setAddress("")
    setCity("Ho Chi Minh City")
    setDescription("")
    setSelectedCategories([])
    setSelectedPrice("$$")
    setOpeningHours("")
    setImages([])
    setLocationMode("address")
    setLatitude(10.7769)
    setLongitude(106.7009)
    setErrors({})
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-[#D4E5C4] bg-white p-4">
            <h2 className="text-lg font-bold text-[#001910]">Register Place</h2>
            <button
              onClick={handleClose}
              className="rounded-md p-1 transition hover:bg-[#F0F5ED]"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Warning về auto-fill feature */}
            <div className="mb-6 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-900">
                  Auto-fill feature is under development
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  Please scroll down to add place manually.
                </p>
              </div>
            </div>

            {/* Form: Add Place Manually */}
            <div className="space-y-4">
              {/* Place Name */}
              <div>
                <label className="text-sm font-medium text-[#001910]">
                  Place Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Pizza 4P's"
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  className={`mt-1 h-[44px] w-full rounded-xl border ${
                    errors.placeName ? 'border-red-500' : 'border-[#D4E5C4]'
                  } px-4 text-sm outline-none transition focus:border-[#355e1d]`}
                />
                {errors.placeName && (
                  <p className="mt-1 text-xs text-red-600">{errors.placeName}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="text-sm font-medium text-[#001910]">
                  Address <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter full address..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={`mt-1 h-[44px] w-full rounded-xl border ${
                    errors.address ? 'border-red-500' : 'border-[#D4E5C4]'
                  } px-4 text-sm outline-none transition focus:border-[#355e1d]`}
                />
                {errors.address && (
                  <p className="mt-1 text-xs text-red-600">{errors.address}</p>
                )}
              </div>

              {/* City */}
              <div>
                <label className="text-sm font-medium text-[#001910]">
                  City <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 h-[44px] w-full rounded-xl border border-[#D4E5C4] px-4 text-sm outline-none transition focus:border-[#355e1d]"
                />
              </div>

              {/* Categories (multi-select) */}
              <div>
                <label className="text-sm font-medium text-[#001910]">
                  Category <span className="text-red-600">*</span>
                </label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {CATEGORY_DEFINITIONS.map((cat) => {
                    const Icon = iconMap[cat.icon]
                    const isSelected = selectedCategories.includes(cat.id)
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={`flex flex-col items-center justify-center gap-2 rounded-lg border p-3 transition-all ${
                          isSelected
                            ? 'border-[#355e1d] bg-[#355e1d]/10'
                            : 'border-[#D4E5C4] hover:border-[#355e1d]/50'
                        }`}
                      >
                        {isSelected && (
                          <Check size={14} className="absolute top-1 right-1 text-[#355e1d]" />
                        )}
                        <Icon size={20} className={isSelected ? 'text-[#355e1d]' : 'text-[#64748B]'} />
                        <span className={`text-xs ${isSelected ? 'text-[#355e1d] font-medium' : 'text-[#64748B]'}`}>
                          {cat.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
                {errors.categories && (
                  <p className="mt-1 text-xs text-red-600">{errors.categories}</p>
                )}
              </div>

              {/* Price Level */}
              <div>
                <label className="text-sm font-medium text-[#001910]">
                  Price Level <span className="text-red-600">*</span>
                </label>
                <div className="mt-2 flex gap-2">
                  {PRICE_LEVELS.map((price) => {
                    const isSelected = selectedPrice === price
                    return (
                      <button
                        key={price}
                        type="button"
                        onClick={() => setSelectedPrice(price)}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                          isSelected
                            ? 'border-[#355e1d] bg-[#355e1d] text-white'
                            : 'border-[#D4E5C4] text-[#64748B] hover:border-[#355e1d]/50'
                        }`}
                      >
                        {price}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-[#001910]">
                  Description
                </label>
                <textarea
                  placeholder="Why do you recommend this place?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full resize-none rounded-xl border border-[#D4E5C4] px-3 py-2 text-sm outline-none transition focus:border-[#355e1d]"
                  rows={3}
                />
              </div>

              {/* Opening Hours (optional) */}
              <div>
                <label className="text-sm font-medium text-[#001910]">
                  Opening Hours <span className="text-[#64748B] font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., 10:00 - 22:00"
                  value={openingHours}
                  onChange={(e) => setOpeningHours(e.target.value)}
                  className="mt-1 h-[44px] w-full rounded-xl border border-[#D4E5C4] px-4 text-sm outline-none transition focus:border-[#355e1d]"
                />
              </div>

              {/* Photos (placeholder — future sprint) */}
                            {/* Photos */}
              <ImageUpload
                images={images}
                onChange={setImages}
                maxImages={5}
                maxSizeMB={5}
              />
            </div>

            {/* Submit error */}
            {errors.submit && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-800">{errors.submit}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex shrink-0 gap-2 border-t border-[#D4E5C4] bg-white p-4">
            <button
              onClick={handleClose}
              className="flex-1 rounded-full border border-[#D4E5C4] px-4 py-2.5 text-sm font-medium text-[#001910] transition hover:bg-[#F0F5ED]"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 rounded-full bg-[#355e1d] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#2d4f18] disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Add Place'}
            </button>
          </div>
        </div>
      </div>

      {/* Duplicate Place Modal */}
      <DuplicatePlaceModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        existingPlace={duplicatePlace}
      />
    </>
  )
}

export default RegisterPlaceDrawer