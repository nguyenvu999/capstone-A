import { useEffect, useState } from "react"
import { MapPin, Trash2 } from "lucide-react"
import NearbyPlaceCard from "./NearbyPlaceCard"
import {
  loadSavedLocations,
  deleteLocation,
  formatDistance,
  getDistanceFrom,
  currentGPSPosition,
} from "./MapArea"

function NearbyPlacesList({ places, refreshTrigger }) {
  const [savedLocations, setSavedLocations] = useState([])
  const [userPos, setUserPos] = useState(null)

  // Poll GPS position from MapArea's exported variable
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentGPSPosition) setUserPos({ ...currentGPSPosition })
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  // Load saved locations on mount and when refreshTrigger changes
  useEffect(() => {
    loadSavedLocations().then(setSavedLocations)
  }, [refreshTrigger])

  const handleDelete = async (id) => {
    await deleteLocation(id)
    loadSavedLocations().then(setSavedLocations)
  }

  const sortedLocations = [...savedLocations].sort((a, b) => {
    if (!userPos) return 0
    return (
      (getDistanceFrom(userPos, a.lat, a.lng) ?? Infinity) -
      (getDistanceFrom(userPos, b.lat, b.lng) ?? Infinity)
    )
  })

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="shrink-0 border-b border-[#D4E5C4] bg-white p-4">
        <h2 className="text-base font-bold text-[#001910]">Nearby Places</h2>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">

        {/* ── Saved Locations from Supabase ── */}
        {sortedLocations.length > 0 && (
          <div className="mb-2">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#64748B]">
              My Saved Locations
            </p>
            {sortedLocations.map((loc) => {
              const dist = getDistanceFrom(userPos, loc.lat, loc.lng)
              return (
                <div
                  key={loc.id}
                  className="mb-2 flex items-center justify-between rounded-xl border border-[#D4E5C4] bg-[#F0F5ED] px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#001910]">{loc.name}</p>
                    <p className="text-xs text-[#64748B]">
                      {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                      {dist !== null && (
                        <span className="ml-2 text-[#355e1d]">· {formatDistance(dist)}</span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(loc.id)}
                    className="ml-2 rounded-lg p-1.5 text-red-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Team places (existing) ── */}
        {places.length === 0 && savedLocations.length === 0 ? (
          <div className="py-8 text-center">
            <MapPin size={24} className="mx-auto text-[#8ea183]" />
            <p className="mt-2 text-sm text-[#64748B]">No nearby places found</p>
          </div>
        ) : (
          places.map((place) => (
            <NearbyPlaceCard key={place.id} place={place} />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center gap-2 border-t border-[#D4E5C4] bg-[#F0F5ED] p-4 text-xs text-[#64748B]">
        <MapPin size={14} className="text-[#355e1d]" />
        Showing {places.length + savedLocations.length} nearby places
      </div>
    </div>
  )
}

export default NearbyPlacesList
