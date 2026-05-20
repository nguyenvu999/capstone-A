// DuplicatePlaceModal.jsx
// Modal hiển thị khi backend phát hiện duplicate place
// Cho phép user xem existing place thay vì tạo duplicate

import { AlertCircle, MapPin, ExternalLink } from "lucide-react"
import { useNavigate } from "react-router-dom"

function DuplicatePlaceModal({ isOpen, onClose, existingPlace }) {
  const navigate = useNavigate()

  if (!isOpen || !existingPlace) return null

  // Khi user click "View Existing Place"
  // Navigate đến place detail page và đóng modal
  const handleViewExisting = () => {
    navigate(`/place/${existingPlace.id}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-[#D4E5C4] bg-amber-50 p-6">
          <AlertCircle className="mt-1 shrink-0 text-amber-600" size={24} />
          <div>
            <h2 className="text-lg font-bold text-[#001910]">
              Place Already Exists
            </h2>
            <p className="mt-1 text-sm text-[#64748B]">
              This place may already be in our system. Would you like to view it instead?
            </p>
          </div>
        </div>

        {/* Existing place preview */}
        <div className="p-6">
          <div className="rounded-lg border border-[#D4E5C4] p-4">
            <h3 className="font-semibold text-[#001910]">
              {existingPlace.name}
            </h3>
            <p className="mt-2 flex items-start gap-2 text-sm text-[#64748B]">
              <MapPin className="mt-0.5 shrink-0" size={16} />
              {existingPlace.address}
            </p>
            {existingPlace.description && (
              <p className="mt-2 text-sm text-[#64748B]">
                {existingPlace.description}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-[#D4E5C4] p-6">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-[#D4E5C4] px-4 py-2.5 text-sm font-medium text-[#001910] transition hover:bg-[#F0F5ED]"
          >
            Cancel
          </button>
          <button
            onClick={handleViewExisting}
            className="flex-1 rounded-full bg-[#355e1d] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#2d4f18] flex items-center justify-center gap-2"
          >
            <ExternalLink size={16} />
            View Existing Place
          </button>
        </div>
      </div>
    </div>
  )
}

export default DuplicatePlaceModal