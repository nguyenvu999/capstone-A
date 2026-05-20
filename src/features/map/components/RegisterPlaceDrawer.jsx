// RegisterPlaceDrawer.jsx
// Drawer để user đăng ký place mới với search location

import { useState } from "react"
import { X, MapPin, AlertCircle, Check, Utensils, Wine, Eye, Gamepad2, Users } from "lucide-react"
import { CATEGORY_DEFINITIONS, PRICE_LEVELS } from "../constants/mapConstants"
import { createPlace, uploadPlaceImages } from "../api/placesApi"
import { isDuplicateError, getExistingPlaceFromError } from "../utils/duplicateDetection"
import DuplicatePlaceModal from "./DuplicatePlaceModal"
import ImageUpload from "./ImageUpload"

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
  
  // Location search state
  const [locationSearch, setLocationSearch] = useState("")
  const [locationResults, setLocationResults] = useState([])
  const [showLocationResults, setShowLocationResults] = useState(false)
  const [latitude, setLatitude] = useState(10.7769)
  const [longitude, setLongitude] = useState(106.7009)
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [duplicatePlace, setDuplicatePlace] = useState(null)

  if (!isOpen) return null

  // Search location qua Nominatim
  const handleLocationSearch = async (query) => {
    setLocationSearch(query)
    
    if (query.length < 3) {
      setLocationResults([])
      setShowLocationResults(false)
      return
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=vn`
      )
      const data = await response.json()
      setLocationResults(data)
      setShowLocationResults(true)
    } catch (error) {
      console.error('Location search failed:', error)
    }
  }

  // Khi user chọn 1 địa điểm từ search results
  const handleSelectLocation = (result) => {
    // Lấy tên ngắn gọn (phần đầu tiên trước dấu phẩy)
    const shortName = result.display_name.split(',')[0].trim()
    
    setPlaceName(shortName)
    setAddress(result.display_name)
    setLatitude(parseFloat(result.lat))
    setLongitude(parseFloat(result.lon))
    setLocationSearch(result.display_name)
    setShowLocationResults(false)
  }

  // Toggle category selection
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
      newErrors.address = "Please search and select a location"
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
      const priceLevelMap = { "$": 1, "$$": 2, "$$$": 3, "$$$$": 4 }
      
      const placeData = {
        name: placeName.trim(),
        address: address.trim(),
        city: city.trim(),
        latitude,
        longitude,
        price_level: priceLevelMap[selectedPrice],
        description: description.trim() || null,
        category_ids: selectedCategories,
        business_status: "open",
      }
      
      console.log('Submitting place:', placeData)
      
      const response = await createPlace(placeData)
      const createdPlace = response.data
      
      // Upload ảnh nếu có
      if (images.length > 0) {
        await uploadPlaceImages(createdPlace.id, images)
      }
      
      // Success
      if (onPlaceAdded) {
        onPlaceAdded(createdPlace)
      }
      handleClose()
      
    } catch (error) {
      if (isDuplicateError(error)) {
        const existingPlace = getExistingPlaceFromError(error)
        setDuplicatePlace(existingPlace)
        setShowDuplicateModal(true)
      } else {
        console.error('Failed to create place:', error)
        setErrors({ submit: 'Failed to create place. Please try again.' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form
  const handleClose = () => {
    setPlaceName("")
    setAddress("")
    setCity("Ho Chi Minh City")
    setDescription("")
    setSelectedCategories([])
    setSelectedPrice("$$")
    setOpeningHours("")
    setImages([])
    setLocationSearch("")
    setLocationResults([])
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
            <button onClick={handleClose} className="rounded-md p-1 transition hover:bg-[#F0F5ED]">
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {/* Search Location */}
              <div>
                <label className="text-sm font-medium text-[#001910]">
                  Search Location <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search Landmark 81, Pizza 4P's..."
                    value={locationSearch}
                    onChange={(e) => handleLocationSearch(e.target.value)}
                    className={`mt-1 h-[44px] w-full rounded-xl border ${
                      errors.address ? 'border-red-500' : 'border-[#D4E5C4]'
                    } px-4 text-sm outline-none transition focus:border-[#355e1d]`}
                  />

                  {/* Search results */}
                  {showLocationResults && locationResults.length > 0 && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowLocationResults(false)} />
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-[#D4E5C4] bg-white shadow-xl">
                        {locationResults.map((result, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectLocation(result)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-[#F0F5ED] border-b border-[#D4E5C4] last:border-0"
                          >
                            <div className="flex items-start gap-2">
                              <MapPin size={14} className="mt-1 shrink-0 text-[#355e1d]" />
                              <span className="text-[#001910] text-xs">{result.display_name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                {errors.address && (
                  <p className="mt-1 text-xs text-red-600">{errors.address}</p>
                )}
                <p className="mt-1 text-xs text-[#64748B]">
                  Search for a real place name or landmark
                </p>
              </div>

              {/* Place Name (auto-filled) */}
              <div>
                <label className="text-sm font-medium text-[#001910]">
                  Place Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  placeholder="Auto-filled from search"
                  className={`mt-1 h-[44px] w-full rounded-xl border ${
                    errors.placeName ? 'border-red-500' : 'border-[#D4E5C4]'
                  } px-4 text-sm outline-none transition focus:border-[#355e1d]`}
                />
                {errors.placeName && (
                  <p className="mt-1 text-xs text-red-600">{errors.placeName}</p>
                )}
              </div>

              {/* Address (readonly) */}
              {address && (
                <div>
                  <label className="text-sm font-medium text-[#001910]">
                    Address
                  </label>
                  <div className="mt-1 rounded-xl border border-[#D4E5C4] bg-[#F0F5ED] px-4 py-2 text-sm text-[#64748B]">
                    {address}
                  </div>
                </div>
              )}

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

              {/* Categories */}
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
                        className={`relative flex flex-col items-center justify-center gap-2 rounded-lg border p-3 transition-all ${
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

              {/* Opening Hours */}
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
              {isSubmitting ? 'Adding...' : 'Add Place'}
            </button>
          </div>
        </div>
      </div>

      <DuplicatePlaceModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        existingPlace={duplicatePlace}
      />
    </>
  )
}

export default RegisterPlaceDrawer