import { MapPin, Clock, Star } from "lucide-react"
import { businessStatuses } from "../data/mockPlaces"

function NearbyPlaceCard({ place }) {
  const status = businessStatuses.find((s) => s.value === place.businessStatus) ||
    businessStatuses[0]

  return (
    <div className="flex gap-3 rounded-lg border border-[#D4E5C4] bg-white p-3 transition-shadow hover:shadow-md">
      {/* Thumbnail */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#F0F5ED]">
        {place.image ? (
          <img
            src={place.image}
            alt={place.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#8ea183]">
            <MapPin size={20} />
          </div>
        )}

        {/* Status badge on image */}
        <div
          className="absolute right-1 top-1 flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium"
          style={{
            backgroundColor: status.bgColor,
            color: status.textColor,
          }}
        >
          <Clock size={10} />
          {status.label}
        </div>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-[#001910]">
          {place.name}
        </h3>

        {/* Categories */}
        <div className="mt-1 flex flex-wrap gap-1">
          {place.categories.map((cat) => (
            <span
              key={cat}
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: `${place.categoryColors[cat] || "#355e1d"}20`,
                color: place.categoryColors[cat] || "#355e1d",
              }}
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Rating + Distance */}
        <div className="mt-1.5 flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Star size={12} className="fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-[#001910]">{place.rating}</span>
          </div>
          <span className="text-xs text-[#64748B]">{place.price}</span>
          <div className="flex items-center gap-1 text-xs text-[#64748B]">
            <MapPin size={12} />
            <span>{place.distance}</span>
          </div>
        </div>

        {/* Location */}
        <p className="mt-1 truncate text-xs text-[#64748B]">{place.location}</p>
      </div>
    </div>
  )
}

export default NearbyPlaceCard