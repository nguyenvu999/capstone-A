// WriteReviewModal.jsx
// Modal để user viết review cho place

import { useState } from "react"
import { X, Star } from "lucide-react"
import { createReview } from "../../map/api/reviewsApi"

function WriteReviewModal({ isOpen, onClose, placeId, placeName, onReviewSubmitted }) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate rating
    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await createReview(placeId, {
        rating,
        comment: comment.trim() || null,
      })

      // Success
      if (onReviewSubmitted) {
        onReviewSubmitted()
      }
      handleClose()
    } catch (err) {
      console.error('Failed to submit review:', err)
      
      // Check if user already reviewed
      if (err.response?.status === 409) {
        setError('You have already reviewed this place')
      } else {
        setError('Failed to submit review. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setRating(0)
    setHoveredRating(0)
    setComment("")
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#D4E5C4] p-4">
          <h2 className="text-lg font-bold text-[#001910]">Write a Review</h2>
          <button
            onClick={handleClose}
            className="rounded-md p-1 transition hover:bg-[#F0F5ED]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Place name */}
          <p className="text-sm text-[#64748B]">
            How was your experience at <span className="font-medium text-[#001910]">{placeName}</span>?
          </p>

          {/* Rating stars */}
          <div className="mt-4">
            <label className="text-sm font-medium text-[#001910]">
              Rating <span className="text-red-600">*</span>
            </label>
            <div className="mt-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition"
                >
                  <Star
                    size={32}
                    className={
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-[#D4E5C4]"
                    }
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-[#64748B]">
                  {rating} {rating === 1 ? 'star' : 'stars'}
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div className="mt-4">
            <label className="text-sm font-medium text-[#001910]">
              Your Review <span className="text-[#64748B] font-normal">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 500))}
              placeholder="Share your experience..."
              className="mt-2 w-full resize-none rounded-xl border border-[#D4E5C4] px-3 py-2 text-sm outline-none transition focus:border-[#355e1d]"
              rows={4}
            />
            <p className="mt-1 text-right text-xs text-[#64748B]">
              {comment.length} / 500
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-full border border-[#D4E5C4] px-4 py-2.5 text-sm font-medium text-[#001910] transition hover:bg-[#F0F5ED]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="flex-1 rounded-full bg-[#355e1d] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#2d4f18] disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default WriteReviewModal