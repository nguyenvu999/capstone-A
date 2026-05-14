import { MapPin } from "lucide-react"

function MapArea() {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-[24px] border border-[#E0E0E0] bg-[#F5F5F5]">
      <div className="px-6 text-center">
        <MapPin size={40} className="mx-auto text-[#999]" />
        <p className="mt-4 text-lg font-medium text-[#1B2A4A]">
          Interactive Map Area
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[#666]">
          Google Map will appear here once the Google Maps API key is configured.
        </p>
      </div>
    </div>
  )
}

export default MapArea

/*
=== ORIGINAL MAP AREA CODE (commented out for future use) ===
=== Uncomment and restore this when Google Maps API is ready ===

import { useState } from "react"
import { MapPin, X, Star, Navigation, Plus, Minus } from "lucide-react"
import { businessStatuses } from "../data/mockPlaces"

const markerColors = {
  Restaurant: "#F97316",
  Bar: "#8B5CF6",
  Sight: "#3B82F6",
  Entertainment: "#EC4899",
  "Team Event": "#10B981",
}

function MapArea({ places, selectedPlace, onSelectPlace }) {
  const [zoom, setZoom] = useState(14)

  const positions = [
    { top: "25%", left: "35%" },
    { top: "45%", left: "55%" },
    { top: "35%", left: "70%" },
    { top: "60%", left: "40%" },
    { top: "50%", left: "25%" },
  ]

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[24px] bg-[#E8E4DF]">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, #D4D0CB 1px, transparent 1px),
            linear-gradient(to bottom, #D4D0CB 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="absolute right-[5%] top-[10%] h-[150px] w-[200px] rounded-full bg-blue-200/50 blur-2xl" />
      <div className="absolute bottom-[20%] left-[10%] h-[120px] w-[180px] rounded-full bg-blue-200/50 blur-2xl" />

      <div className="absolute left-[30%] top-0 h-full w-[4px] bg-amber-100" />
      <div className="absolute left-0 top-[40%] h-[4px] w-full bg-amber-100" />

      {places.map((place, index) => {
        const pos = positions[index % positions.length]
        const isSelected = selectedPlace?.id === place.id
        const color = markerColors[place.categories[0]] || "#10B981"

        return (
          <button
            key={place.id}
            onClick={() => onSelectPlace(isSelected ? null : place)}
            className={`absolute z-10 -translate-x-1/2 -translate-y-full transform transition-all ${
              isSelected ? "z-20 scale-125" : "hover:scale-110"
            }`}
            style={{ top: pos.top, left: pos.left }}
          >
            <MapPin
              size={isSelected ? 36 : 28}
              fill={color}
              color={color}
              className="drop-shadow-lg"
            />
          </button>
        )
      })}

      {selectedPlace && (
        <div className="absolute left-[35%] top-[15%] z-30 w-64 -translate-x-1/2 overflow-hidden rounded-lg bg-white shadow-xl">
          <button
            onClick={() => onSelectPlace(null)}
            className="absolute right-2 top-2 z-10 rounded-full bg-white/80 p-1 hover:bg-white"
          >
            <X size={14} />
          </button>

          <div className="h-24 w-full bg-[#F5F5F5]">
            {selectedPlace.image && (
              <img
                src={selectedPlace.image}
                alt={selectedPlace.name}
                className="h-full w-full object-cover"
              />
            )}
          </div>

          <div className="p-3">
            <h3 className="font-semibold text-[#1B2A4A]">{selectedPlace.name}</h3>
            <div className="mt-1 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star size={12} className="fill-yellow-400 text-yellow-400" />
                <span className="text-sm">{selectedPlace.rating}</span>
              </div>
              <span className="text-sm text-[#666]">{selectedPlace.price}</span>
              {selectedPlace.categories.map((cat) => (
                <span
                  key={cat}
                  className="rounded px-1.5 py-0.5 text-xs"
                  style={{
                    backgroundColor: `${selectedPlace.categoryColors[cat] || "#1B2A4A"}20`,
                    color: selectedPlace.categoryColors[cat] || "#1B2A4A",
                  }}
                >
                  {cat}
                </span>
              ))}
            </div>

            {(() => {
              const status = businessStatuses.find(
                (s) => s.value === selectedPlace.businessStatus
              )
              return status ? (
                <p
                  className="mt-1 text-xs font-medium"
                  style={{ color: status.textColor }}
                >
                  {status.label}
                </p>
              ) : null
            })()}

            <button className="mt-2 text-sm text-[#1B2A4A] hover:underline">
              View Details →
            </button>
          </div>
        </div>
      )}

      <button className="absolute bottom-20 left-4 flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-md">
        <Navigation size={16} className="text-[#1B2A4A]" />
        Near me
      </button>

      <div className="absolute bottom-20 right-4 flex flex-col overflow-hidden rounded-lg bg-white shadow-md">
        <button
          onClick={() => setZoom((z) => Math.min(20, z + 1))}
          className="border-b border-[#E0E0E0] p-2 hover:bg-[#F5F5F5]"
        >
          <Plus size={18} />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(1, z - 1))}
          className="p-2 hover:bg-[#F5F5F5]"
        >
          <Minus size={18} />
        </button>
      </div>

      <div className="absolute bottom-2 right-2 rounded bg-white/80 px-1 text-[10px] text-[#666]">
        Map data (demo)
      </div>
    </div>
  )
}

export default MapArea
*/