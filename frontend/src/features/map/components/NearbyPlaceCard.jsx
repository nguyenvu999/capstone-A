// NearbyPlaceCard.jsx
// Card hiển thị thông tin place trong nearby list

import { MapPin, Clock, Star } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { BUSINESS_STATUSES } from "../constants/mapConstants"

function NearbyPlaceCard({ place }) {
  const navigate = useNavigate()

  const status = BUSINESS_STATUSES.find((s) => s.value === place.business_status) ||
    BUSINESS_STATUSES[0]

  const handleClick = () => {
    navigate(`/place/${place.id}`)
  }

  return (
    <button
      onClick={handleClick}
      className="flex w-full gap-3 rounded-lg border border-[#D4E5C4] bg-white p-3 text-left transition-shadow hover:shadow-md"
    >
      {/* Thumbnail */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#F0F5ED]">
        {place.images && place.images.length > 0 ? (
          <img
            src={place.images[0].url}
            alt={place.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#8ea183]">
            <MapPin size={20} />
          </div>
        )}

        {/* Status badge */}
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
        {place.categories && place.categories.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {place.categories.map((cat) => (
              <span
                key={cat.id}
                className="rounded-full bg-[#355e1d]/10 px-2 py-0.5 text-[10px] font-medium text-[#355e1d]"
              >
                {cat.name}
              </span>
            ))}
          </div>
        )}

        {/* Rating + Price + Distance */}
        <div className="mt-1.5 flex items-center gap-3">
          {place.rating && (
            <div className="flex items-center gap-1">
              <Star size={12} className="fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-[#001910]">{place.rating}</span>
            </div>
          )}

          {place.price_level && (
            <span className="text-xs text-[#64748B]">
              {'$'.repeat(place.price_level)}
            </span>
          )}

          {place.distance && (
            <div className="flex items-center gap-1 text-xs text-[#64748B]">
              <MapPin size={12} />
              <span>{place.distance}km</span>
            </div>
          )}
        </div>

        {/* Address */}
        <p className="mt-1 truncate text-xs text-[#64748B]">{place.address}</p>
      </div>
    </button>
  )
}

export default NearbyPlaceCard