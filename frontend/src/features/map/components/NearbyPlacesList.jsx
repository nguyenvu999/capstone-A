import { MapPin } from "lucide-react"
import NearbyPlaceCard from "./NearbyPlaceCard"

function NearbyPlacesList({ places }) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="shrink-0 border-b border-[#D4E5C4] bg-white p-4">
        <h2 className="text-base font-bold text-[#001910]">Nearby Places</h2>
      </div>

      {/* Place cards - scrollable list view only */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {places.length === 0 ? (
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
        Showing {places.length} nearby places
      </div>
    </div>
  )
}

export default NearbyPlacesList