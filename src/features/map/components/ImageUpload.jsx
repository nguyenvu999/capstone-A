// ImageUpload.jsx
// Component để user upload và preview ảnh trước khi submit

import { useState } from "react"
import { Camera, ImageIcon, X } from "lucide-react"

function ImageUpload({ images, onChange, maxImages = 5, maxSizeMB = 5 }) {
  const [error, setError] = useState(null)

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    
    // Check số lượng ảnh
    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`)
      return
    }

    // Validate từng file
    const validFiles = []
    for (const file of files) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} is not an image`)
        continue
      }

      // Check file size
      const sizeMB = file.size / (1024 * 1024)
      if (sizeMB > maxSizeMB) {
        setError(`${file.name} is too large (max ${maxSizeMB}MB)`)
        continue
      }

      validFiles.push(file)
    }

    if (validFiles.length > 0) {
      setError(null)
      onChange([...images, ...validFiles])
    }
  }

  // Remove image
  const handleRemove = (index) => {
    const newImages = images.filter((_, i) => i !== index)
    onChange(newImages)
  }

  // Get preview URL cho file
  const getPreviewUrl = (file) => {
    if (file instanceof File) {
      return URL.createObjectURL(file)
    }
    return file.url || file
  }

  return (
    <div>
      <label className="text-sm font-medium text-[#001910]">
        Photos <span className="text-[#64748B] font-normal">(optional)</span>
      </label>

      {/* Preview thumbnails */}
      {images.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-3">
          {images.map((img, idx) => (
            <div key={idx} className="relative">
              <div className="h-20 w-20 overflow-hidden rounded-lg bg-[#F0F5ED]">
                <img
                  src={getPreviewUrl(img)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-md hover:bg-red-600"
              >
                <X size={14} />
              </button>
            </div>
          ))}

          {/* Add more button */}
          {images.length < maxImages && (
            <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-[#D4E5C4] text-[#64748B] transition hover:border-[#355e1d] hover:text-[#355e1d]">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <span className="text-2xl">+</span>
            </label>
          )}
        </div>
      )}

      {/* Upload buttons (nếu chưa có ảnh) */}
      {images.length === 0 && (
        <div className="mt-2 flex gap-3">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#D4E5C4] px-4 py-3 text-sm text-[#64748B] transition hover:border-[#355e1d] hover:text-[#355e1d]">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Camera size={18} />
            Camera
          </label>

          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#D4E5C4] px-4 py-3 text-sm text-[#64748B] transition hover:border-[#355e1d] hover:text-[#355e1d]">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <ImageIcon size={18} />
            Gallery
          </label>
        </div>
      )}

      {/* Helper text */}
      <p className="mt-2 text-xs text-[#64748B]">
        Max {maxImages} photos, up to {maxSizeMB}MB each
      </p>

      {/* Error message */}
      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}

export default ImageUpload