import { useState } from "react"
import { X } from "lucide-react"
import { currentGPSPosition, saveLocation } from "./MapArea"

function RegisterPlaceDrawer({ isOpen, onClose, onLocationSaved }) {
  const [locationName, setLocationName] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!currentGPSPosition) {
      alert("Still getting your location, please wait...")
      return
    }
    if (!locationName.trim()) {
      alert("Please enter a name for this location")
      return
    }

    setSaving(true)
    const ok = await saveLocation(
      locationName.trim(),
      currentGPSPosition.lat,
      currentGPSPosition.lng
    )
    setSaving(false)

    if (!ok) { alert("Failed to save location"); return }

    if (onLocationSaved) onLocationSaved()
    handleClose()
  }

  const handleClose = () => {
    setLocationName("")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 px-4" style={{ zIndex: 9999 }}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#D4E5C4] p-4">
          <h2 className="text-lg font-bold text-[#001910]">Save Location</h2>
          <button onClick={handleClose} className="rounded-md p-1 transition hover:bg-[#F0F5ED]">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-[#64748B]">
            {currentGPSPosition
              ? `📍 GPS ready: ${currentGPSPosition.lat.toFixed(5)}, ${currentGPSPosition.lng.toFixed(5)}`
              : "⏳ Getting your location..."}
          </p>

          <input
            type="text"
            placeholder="Name this location..."
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="h-[44px] w-full rounded-xl border border-[#D4E5C4] px-4 text-sm outline-none focus:border-[#355e1d]"
          />
        </div>

        {/* Footer */}
        <div className="flex gap-2 border-t border-[#D4E5C4] p-4">
          <button
            onClick={handleClose}
            className="flex-1 rounded-full border border-[#D4E5C4] px-4 py-2.5 text-sm font-medium text-[#001910] transition hover:bg-[#F0F5ED]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !currentGPSPosition}
            className="flex-1 rounded-full bg-[#355e1d] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#2d4f18] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

      </div>
    </div>
  )
}

export default RegisterPlaceDrawer
