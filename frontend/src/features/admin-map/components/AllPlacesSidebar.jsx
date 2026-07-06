import { useState } from "react";
import { Utensils, Wine, Coffee, Eye, Film, Users, Search, X, DollarSign, Star, Filter as FilterIcon } from "lucide-react";

const CATEGORIES = [
  { id: "restaurant", label: "Restaurant", icon: Utensils, bgColor: "bg-orange-50", iconColor: "text-orange-600" },
  { id: "bar", label: "Bar", icon: Wine, bgColor: "bg-purple-50", iconColor: "text-purple-600" },
  { id: "beverage", label: "Beverage", icon: Coffee, bgColor: "bg-indigo-50", iconColor: "text-indigo-600" },
  { id: "sight", label: "Sight", icon: Eye, bgColor: "bg-blue-50", iconColor: "text-blue-600" },
  { id: "entertainment", label: "Entertainment", icon: Film, bgColor: "bg-pink-50", iconColor: "text-pink-600" },
  { id: "team_event", label: "Team Event", icon: Users, bgColor: "bg-emerald-50", iconColor: "text-emerald-600" },
];

export default function AllPlacesSidebar({ places, onPlaceClick, activeCategory, onSelectCategory }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPriceLevels, setSelectedPriceLevels] = useState([]);
  const [selectedRatings, setSelectedRatings] = useState([]);

  const filteredPlaces = places.filter(place => {
    // Search filter
    if (searchQuery && !place.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Category filter
    if (activeCategory && place.category?.toLowerCase() !== activeCategory.toLowerCase()) {
      return false;
    }

    // Price filter
    if (selectedPriceLevels.length > 0 && !selectedPriceLevels.includes(place.price_level)) {
      return false;
    }

    // Rating filter
    if (selectedRatings.length > 0) {
      const rating = place.rating || 0;
      if (selectedRatings.length === 1) {
        if (rating < selectedRatings[0]) return false;
      } else {
        const min = Math.min(...selectedRatings);
        const max = Math.max(...selectedRatings);
        if (max === 5) {
          if (rating < min) return false;
        } else {
          if (rating < min || rating >= max) return false;
        }
      }
    }

    return true;
  });

  const getCategoryIcon = (categoryId) => {
    const category = CATEGORIES.find(cat => cat.id.toLowerCase() === categoryId?.toLowerCase());
    if (!category) return null;
    const IconComponent = category.icon;
    return <IconComponent className={category.iconColor} size={14} />;
  };

  const renderStars = (rating) => {
    const filledStars = Math.floor(rating);
    const hasHalfStar = rating % 1 > 0;
    let stars = "★".repeat(filledStars);
    if (hasHalfStar) stars += "☆";
    const emptyStarsNeeded = 5 - filledStars - (hasHalfStar ? 1 : 0);
    stars += "☆".repeat(emptyStarsNeeded);
    return stars;
  };

  const formatPlaceAddress = (place) => {
    if (place.place_type === "building" && place.building_name) {
      return `Level ${place.floor_level}, ${place.building_name}, ${place.address}`;
    }
    return place.address;
  };

  const togglePriceLevel = (level) => {
    setSelectedPriceLevels(prev => 
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  };

  const toggleRating = (rating) => {
    setSelectedRatings(prev => {
      if (prev.includes(rating)) {
        return prev.filter(r => r !== rating);
      } else if (prev.length >= 2) {
        return prev;
      } else {
        return [...prev, rating];
      }
    });
  };

  const clearAllFilters = () => {
    setSelectedPriceLevels([]);
    setSelectedRatings([]);
  };

  const activeFiltersCount = selectedPriceLevels.length + selectedRatings.length;

  return (
    <div className="fixed bg-white shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-in-out md:top-[88px] md:left-6 md:z-30 md:w-[360px] md:max-h-[76vh] md:rounded-2xl">
      
      {/* Search */}
      <div className="p-4 border-b border-gray-100 relative shrink-0">
        <div className="relative flex items-center bg-gray-100 rounded-xl px-3 py-2.5">
          <Search size={16} className="text-gray-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search places..."
            className="bg-transparent text-xs text-gray-800 focus:outline-none w-full pr-6"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">All Categories</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
          >
            <FilterIcon size={12} />
            <span className="text-[10px] font-semibold">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full">{activeFiltersCount}</span>
            )}
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((cat) => {
            const isSelected = activeCategory?.toLowerCase() === cat.id.toLowerCase();
            return (
              <button 
                key={cat.id} 
                onClick={() => onSelectCategory(activeCategory === cat.id ? null : cat.id)} 
                className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all border ${
                  isSelected ? "bg-white border-blue-500 shadow-md ring-1 ring-blue-500" : "border-transparent hover:bg-white hover:shadow-sm"
                }`}
              >
                <div className={`w-9 h-9 ${cat.bgColor} rounded-full flex items-center justify-center`}>
                  <cat.icon className={cat.iconColor} size={15} />
                </div>
                <span className={`text-[9px] font-medium truncate w-full text-center ${isSelected ? "text-blue-600 font-bold" : "text-gray-600"}`}>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-4 border-b border-gray-100 bg-gray-50 shrink-0 space-y-3 max-h-[240px] overflow-y-auto">
          {/* Price Level */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <DollarSign size={12} className="text-gray-500" />
                <span className="text-[10px] font-bold uppercase tracking-wide text-gray-600">Price Level</span>
              </div>
              {selectedPriceLevels.length > 0 && (
                <button onClick={() => setSelectedPriceLevels([])} className="text-[9px] text-blue-600 hover:underline">Clear</button>
              )}
            </div>
            <div className="flex gap-2">
              {[
                { level: 1, label: "Budget" },
                { level: 2, label: "Moderate" },
                { level: 3, label: "Expensive" },
                { level: 4, label: "Ultra Luxe" }
              ].map(item => (
                <button
                  key={item.level}
                  onClick={() => togglePriceLevel(item.level)}
                  className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                    selectedPriceLevels.includes(item.level)
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"
                  }`}
                >
                  {"$".repeat(item.level)}
                  <span className="block text-[8px] mt-0.5 opacity-80">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Star size={12} className="text-gray-500" />
                <span className="text-[10px] font-bold uppercase tracking-wide text-gray-600">Rating Range</span>
              </div>
              {selectedRatings.length > 0 && (
                <button onClick={() => setSelectedRatings([])} className="text-[9px] text-blue-600 hover:underline">Clear</button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedRatings.length > 0 ? Math.min(...selectedRatings) : ""}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (!value) {
                    setSelectedRatings([]);
                    return;
                  }
                  if (selectedRatings.length === 0) {
                    setSelectedRatings([value]);
                  } else if (selectedRatings.length === 1) {
                    setSelectedRatings([value]);
                  } else {
                    const currentMax = Math.max(...selectedRatings);
                    if (value >= currentMax) {
                      setSelectedRatings([value]);
                    } else {
                      setSelectedRatings([value, currentMax]);
                    }
                  }
                }}
                className="flex-1 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="">Min</option>
                {[1, 2, 3, 4, 5].map(rating => (
                  <option key={rating} value={rating}>{rating} ★</option>
                ))}
              </select>
              <span className="text-xs font-medium text-gray-500 shrink-0">To</span>
              <select
                value={selectedRatings.length === 2 ? Math.max(...selectedRatings) : ""}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (!value) {
                    if (selectedRatings.length === 2) {
                      setSelectedRatings([Math.min(...selectedRatings)]);
                    }
                    return;
                  }
                  if (selectedRatings.length === 0) {
                    return;
                  } else if (selectedRatings.length === 1) {
                    const currentMin = selectedRatings[0];
                    if (value > currentMin) {
                      setSelectedRatings([currentMin, value]);
                    }
                  } else {
                    const currentMin = Math.min(...selectedRatings);
                    if (value > currentMin) {
                      setSelectedRatings([currentMin, value]);
                    }
                  }
                }}
                disabled={selectedRatings.length === 0}
                className={`flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-amber-400 cursor-pointer ${
                  selectedRatings.length === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'
                }`}
              >
                <option value="">Max</option>
                {[1, 2, 3, 4, 5].map(rating => {
                  const currentMin = selectedRatings.length > 0 ? Math.min(...selectedRatings) : 0;
                  const isDisabled = rating <= currentMin;
                  return (
                    <option key={rating} value={rating} disabled={isDisabled} className={isDisabled ? 'text-gray-300' : ''}>
                      {rating} ★
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="w-full py-2 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
            >
              Clear All Filters ({activeFiltersCount})
            </button>
          )}
        </div>
      )}

      {/* All Places List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-3 bg-blue-50 border-b border-blue-100">
          <p className="text-xs font-bold text-blue-700">
            {filteredPlaces.length} place{filteredPlaces.length !== 1 ? 's' : ''} total
          </p>
        </div>
        
        {filteredPlaces.length > 0 ? (
          filteredPlaces.map((place, index) => (
            <div 
              key={place.id} 
              onClick={() => onPlaceClick(place)}
              className="flex items-start justify-between p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 transition-all duration-150 active:bg-gray-100"
            >
              <div className="flex items-start gap-3 overflow-hidden max-w-[78%]">
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-6 h-6 bg-blue-50 text-blue-600 flex items-center justify-center rounded-lg font-bold text-[11px]">
                    {index + 1}
                  </div>
                  <div className="w-5 h-5 flex items-center justify-center">
                    {getCategoryIcon(place.category)}
                  </div>
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-gray-800 truncate">{place.name}</p>
                  {place.rating > 0 && (
                    <p className="text-[10px] text-yellow-600 mt-0.5 font-semibold flex items-center gap-1">
                      <span>{renderStars(place.rating)}</span>
                      <span className="text-gray-600">{Number(place.rating).toFixed(1)}</span>
                    </p>
                  )}
                  <p className="text-[11px] text-gray-500 mt-0.5 truncate">{formatPlaceAddress(place)}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-xs text-gray-400">No places found</div>
        )}
      </div>
    </div>
  );
}