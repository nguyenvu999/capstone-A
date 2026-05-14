import { useState } from "react"
import { Eye, Utensils, Wine, Gamepad2, Users, Star } from "lucide-react"
import { categoryDefinitions, priceLevels } from "../data/mockPlaces"

// Map icon name sang component
const iconMap = {
  Utensils,
  Wine,
  Eye,
  Gamepad2,
  Users,
}

function FilterSidebar({ totalPlaces = 0, filteredPlaces = 0 }) {
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedPrices, setSelectedPrices] = useState([])
  const [minRating, setMinRating] = useState(0)
  const [statusFilter, setStatusFilter] = useState("all")

  const toggleCategory = (id) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const togglePrice = (price) => {
    setSelectedPrices((prev) =>
      prev.includes(price) ? prev.filter((p) => p !== price) : [...prev, price]
    )
  }

  const clearAll = () => {
    setSelectedCategories([])
    setSelectedPrices([])
    setMinRating(0)
    setStatusFilter("all")
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden border-b border-[#D4E5C4] bg-white">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-[#D4E5C4] p-4">
        <h2 className="text-base font-bold text-[#001910]">Filters</h2>
        <button
          onClick={clearAll}
          className="text-sm text-[#355e1d] hover:underline"
        >
          Clear all
        </button>
      </div>

      {/* Scrollable filters */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Category - multi select */}
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#64748B]">
            Category (Multi-select)
          </h3>
          <div className="space-y-2">
            {categoryDefinitions.map((cat) => {
              const Icon = iconMap[cat.icon] || Eye
              const isChecked = selectedCategories.includes(cat.id)
              return (
                <label
                  key={cat.id}
                  className="flex cursor-pointer items-center gap-3"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCategory(cat.id)}
                    className="h-4 w-4 rounded border-[#D4E5C4] text-[#355e1d] accent-[#355e1d]"
                  />
                  <Icon
                    size={16}
                    className={isChecked ? "text-[#355e1d]" : "text-[#64748B]"}
                  />
                  <span
                    className={`text-sm ${
                      isChecked
                        ? "font-medium text-[#001910]"
                        : "text-[#64748B]"
                    }`}
                  >
                    {cat.label}
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Price Level */}
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#64748B]">
            Price Level
          </h3>
          <div className="flex gap-2">
            {priceLevels.map((price) => {
              const isActive = selectedPrices.includes(price)
              return (
                <button
                  key={price}
                  onClick={() => togglePrice(price)}
                  className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    isActive
                      ? "border-[#355e1d] bg-[#355e1d]/10 text-[#355e1d]"
                      : "border-[#D4E5C4] text-[#64748B] hover:border-[#355e1d]/50"
                  }`}
                >
                  {price}
                </button>
              )
            })}
          </div>
        </div>

        {/* Status filter */}
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#64748B]">
            Status
          </h3>
          <div className="space-y-2">
            {[
              { value: "all", label: "All" },
              { value: "open", label: "Open now" },
              { value: "temporarily_closed", label: "Temporarily closed" },
              { value: "permanently_closed", label: "Permanently closed" },
            ].map((s) => (
              <label key={s.value} className="flex cursor-pointer items-center gap-3">
                <input
                  type="radio"
                  name="statusFilter"
                  checked={statusFilter === s.value}
                  onChange={() => setStatusFilter(s.value)}
                  className="h-4 w-4 accent-[#355e1d]"
                />
                <span className="text-sm text-[#001910]">{s.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Rating */}
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#64748B]">
            Minimum Rating
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setMinRating(star)} className="p-0.5">
                  <Star
                    size={18}
                    className={
                      star <= minRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-[#D4E5C4]"
                    }
                  />
                </button>
              ))}
            </div>
            <span className="text-sm text-[#64748B]">{minRating}+</span>
          </div>
        </div>
      </div>

      {/* Stats footer */}
      <div className="shrink-0 border-t border-[#D4E5C4] bg-[#F0F5ED] p-4">
        <p className="text-xs text-[#64748B]">
          Showing{" "}
          <span className="font-semibold text-[#001910]">{filteredPlaces}</span>{" "}
          of <span className="font-semibold">{totalPlaces}</span> places
        </p>
      </div>
    </div>
  )
}

export default FilterSidebar