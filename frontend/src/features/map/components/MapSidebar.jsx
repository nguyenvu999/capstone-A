import { useState, useEffect, useRef } from "react";
import { Utensils, Wine, Coffee, Eye, Film, Users, Search, MapPin, X, Menu, DollarSign, Star, Filter as FilterIcon } from "lucide-react";
import { supabase } from "../../auth/api/supabaseClient";

// 6 categories 
const CATEGORIES = [
  { id: "restaurant", label: "Restaurant", icon: Utensils, bgColor: "bg-orange-50", iconColor: "text-orange-600" },
  { id: "bar", label: "Bar", icon: Wine, bgColor: "bg-purple-50", iconColor: "text-purple-600" },
  { id: "beverage", label: "Beverage", icon: Coffee, bgColor: "bg-indigo-50", iconColor: "text-indigo-600" },
  { id: "sight", label: "Sight", icon: Eye, bgColor: "bg-blue-50", iconColor: "text-blue-600" },
  { id: "entertainment", label: "Entertainment", icon: Film, bgColor: "bg-pink-50", iconColor: "text-pink-600" },
  { id: "team_event", label: "Team Event", icon: Users, bgColor: "bg-emerald-50", iconColor: "text-emerald-600" },
];

export default function MapSidebar({ 
  apiKey, 
  onSelectCategory, 
  activeCategory, 
  categoryResults, 
  setFocusedLocation, 
  setCategoryResults, 
  focusedLocation, 
  currentUserCoords,
  onTriggerDirectionPanel,
  onFilterChange, // THÊM: Callback để thông báo filter thay đổi
  onPlaceClick // THÊM: Callback khi click vào place
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const suggestionRef = useRef(null);
  const [sortedResults, setSortedResults] = useState([]);

  // THÊM: State cho filters
  const [selectedPriceLevels, setSelectedPriceLevels] = useState([]); // [1, 2, 3, 4]
  const [selectedRatings, setSelectedRatings] = useState([]); // [1, 2, 3, 4, 5]
  const [showFilters, setShowFilters] = useState(false); // Toggle filter panel

  // Sync search query box when selecting from the map
  useEffect(() => {
    if (focusedLocation && focusedLocation.name) {
      setSearchQuery(focusedLocation.name);
    }
  }, [focusedLocation]);

  // Sort list results by nearest distance automatically
  useEffect(() => {
    if (!categoryResults || categoryResults.length === 0) {
      setSortedResults([]);
      return;
    }

    const sorted = [...categoryResults].sort((a, b) => {
      const distA = parseFloat(a.distanceText) || 0;
      const distB = parseFloat(b.distanceText) || 0;
      return distA - distB;
    });

    setSortedResults(sorted);
  }, [categoryResults]);

  // THÊM: Gửi filter changes lên MapPage
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange({
        priceLevels: selectedPriceLevels,
        ratings: selectedRatings
      });
    }
  }, [selectedPriceLevels, selectedRatings]);

  // Autocomplete search processing logic
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    if (focusedLocation && (focusedLocation.name === searchQuery || focusedLocation.address === searchQuery)) {
      return;
    }

    const delayDebounce = setTimeout(async () => {
      const locationStr = `${currentUserCoords[1]},${currentUserCoords[0]}`; 
      let trackAsiaPredictions = [];
      let supabasePredictions = [];

      try {
        const res = await fetch(`https://maps.track-asia.com/api/v2/place/autocomplete/json?input=${encodeURIComponent(searchQuery)}&location=${locationStr}&radius=5000&key=${apiKey}`);
        const data = await res.json();
        if (data.predictions) {
          trackAsiaPredictions = data.predictions.map(item => ({ ...item, isSupabaseData: false }));
        }
      } catch (err) {
        console.error("Track-Asia Autocomplete Error:", err);
      }

      try {
        const { data: sbData, error } = await supabase
          .from("places")
          .select("*")
          .ilike("name", `%${searchQuery}%`);

        if (!error && sbData) {
          supabasePredictions = sbData.map(item => ({
            place_id: `supabase_${item.id}`,
            description: item.name,
            structured_formatting: {
              main_text: item.name,
              secondary_text: item.address || "Saved location"
            },
            isSupabaseData: true,
            rawSupabaseItem: item
          }));
        }
      } catch (err) {
        console.error("Supabase Query Error:", err);
      }

      setSuggestions([...supabasePredictions, ...trackAsiaPredictions]);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, apiKey, focusedLocation, currentUserCoords]);

  // Close search suggestions panel on clicking outside area
  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle suggestion click selection
  const handleSelectSuggestion = (prediction) => {
    setSearchQuery(prediction.description);
    setShowSuggestions(false);

    if (prediction.isSupabaseData) {
      const dbItem = prediction.rawSupabaseItem;
      const normalizedPlace = {
        id: dbItem.id,
        name: dbItem.name,
        latitude: Number(dbItem.latitude),
        longitude: Number(dbItem.longitude),
        address: dbItem.address,
        category: dbItem.category
      };
      setFocusedLocation({
        lat: normalizedPlace.latitude,
        lng: normalizedPlace.longitude,
        name: normalizedPlace.name,
        address: normalizedPlace.address,
      });
      setCategoryResults([normalizedPlace]);
      if (onTriggerDirectionPanel) onTriggerDirectionPanel(normalizedPlace);
      setIsMobileExpanded(false);
    } else {
      setCategoryResults([]);
      fetch(`https://maps.track-asia.com/api/v2/place/details/json?place_id=${prediction.place_id}&key=${apiKey}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.result && data.result.geometry) {
            const loc = data.result.geometry.location;
            const normalizedPlace = {
              name: data.result.name,
              latitude: Number(loc.lat),
              longitude: Number(loc.lng),
              address: data.result.formatted_address || prediction.description,
              category: "TrackAsiaPlace"
            };
            setFocusedLocation({
              lat: normalizedPlace.latitude,
              lng: normalizedPlace.longitude,
              name: normalizedPlace.name,
              address: normalizedPlace.address,
            });
            setCategoryResults([normalizedPlace]);
            if (onTriggerDirectionPanel) onTriggerDirectionPanel(normalizedPlace);
            setIsMobileExpanded(false);
          }
        })
        .catch((err) => console.error("Place details lookup error:", err));
    }
  };

  const handleCategoryClick = (categoryId) => {
    setSearchQuery("");
    if (activeCategory === categoryId) {
      onSelectCategory(null);
    } else {
      onSelectCategory(categoryId);
    }
  };

  // THÊM: Toggle price level filter
  const togglePriceLevel = (level) => {
    setSelectedPriceLevels(prev => 
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  };

  // THÊM: Toggle rating filter
  const toggleRating = (rating) => {
    setSelectedRatings(prev => 
      prev.includes(rating) ? prev.filter(r => r !== rating) : [...prev, rating]
    );
  };

  // THÊM: Clear all filters
  const clearAllFilters = () => {
    setSelectedPriceLevels([]);
    setSelectedRatings([]);
  };

  // THÊM: Count active filters
  const activeFiltersCount = selectedPriceLevels.length + selectedRatings.length;

  // Function để lấy icon tương ứng với category
  const getCategoryIcon = (categoryId) => {
    const category = CATEGORIES.find(cat => cat.id.toLowerCase() === categoryId?.toLowerCase());
    if (!category) return null;
    
    const IconComponent = category.icon;
    return <IconComponent className={category.iconColor} size={14} />;
  };

  return (
    <>
      {/* NÚT XEM DANH SÁCH CHỈ HIỂN THỊ TRÊN MOBILE */}
      <button
        onClick={() => setIsMobileExpanded(!isMobileExpanded)}
        className="md:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-1.5 active:scale-95 transition-all text-xs"
      >
        {isMobileExpanded ? <X size={14} /> : <Menu size={14} />}
        <span>{isMobileExpanded ? "Hide Panel" : "View List"}</span>
      </button>

      {/* SIDEBAR CONTAINER: Cấu hình Responsive linh hoạt */}
      <div 
        className={`
          fixed bg-white shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-in-out
          md:top-4 md:left-4 md:z-50 md:w-[360px] md:max-h-[85vh] md:rounded-2xl md:translate-y-0 md:opacity-100
          max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:w-full max-md:z-[90] max-md:rounded-t-2xl max-md:border-t max-md:border-gray-150
          ${isMobileExpanded 
            ? "max-md:h-[65vh] max-md:opacity-100 max-md:translate-y-0" 
            : "max-md:h-[76px] max-md:overflow-hidden"
          }
        `}
      >
        {/* Thanh gờ kéo gợi ý vuốt trên mobile */}
        <div 
          onClick={() => setIsMobileExpanded(!isMobileExpanded)}
          className="md:hidden w-12 h-1 bg-gray-300 rounded-full mx-auto mt-2.5 mb-1.5 shrink-0 cursor-pointer" 
        />

        {/* Search Input Box Area */}
        <div className="p-4 border-b border-gray-100 relative shrink-0" ref={suggestionRef}>
          <div className="relative flex items-center bg-gray-100 rounded-xl px-3 py-2.5">
            <Search size={16} className="text-gray-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search for places..."
              className="bg-transparent text-xs text-gray-800 focus:outline-none w-full pr-6"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={() => { setShowSuggestions(true); }}
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setSuggestions([]); }} className="absolute right-3 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Dropdown gợi ý kết quả tìm kiếm */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-4 right-4 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-[200px] md:max-h-[240px] overflow-y-auto z-50">
              {suggestions.map((item) => (
                <div key={item.place_id} onClick={() => handleSelectSuggestion(item)} className="flex items-start gap-2.5 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none">
                  <MapPin size={14} className={`mt-0.5 shrink-0 ${item.isSupabaseData ? "text-red-500 font-bold" : "text-gray-400"}`} />
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-gray-800 truncate">
                      {item.structured_formatting?.main_text}
                      {item.isSupabaseData && <span className="ml-1.5 text-[9px] bg-red-100 text-red-600 px-1 py-0.5 rounded font-normal">Saved</span>}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate">{item.structured_formatting?.secondary_text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bọc nội dung còn lại */}
        <div className={`flex-1 flex flex-col overflow-hidden max-md:transition-opacity max-md:duration-200 ${!isMobileExpanded && "max-md:opacity-0 max-md:pointer-events-none"}`}>
          {/* Categories Grid Area */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Categories within 5km</h2>
              {/* THÊM: Toggle filter button */}
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
            
            <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none md:grid md:grid-cols-3">
              {CATEGORIES.map((cat) => {
                const isSelected = activeCategory?.toLowerCase() === cat.id.toLowerCase();
                return (
                  <button 
                    key={cat.id} 
                    onClick={() => handleCategoryClick(cat.id)} 
                    className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all border shrink-0 max-md:w-[72px] ${
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

          {/* THÊM: Filter Panel (collapsible) */}
          {showFilters && (
            <div className="p-4 border-b border-gray-100 bg-gray-50 shrink-0 space-y-3 max-h-[240px] overflow-y-auto">
              {/* Price Level Filter */}
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

              {/* Rating Filter */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Star size={12} className="text-gray-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wide text-gray-600">Minimum Rating</span>
                  </div>
                  {selectedRatings.length > 0 && (
                    <button onClick={() => setSelectedRatings([])} className="text-[9px] text-blue-600 hover:underline">Clear</button>
                  )}
                </div>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      onClick={() => toggleRating(rating)}
                      className={`flex-1 px-1.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-0.5 ${
                        selectedRatings.includes(rating)
                          ? "bg-amber-500 text-white shadow-sm"
                          : "bg-white text-gray-600 border border-gray-200 hover:border-amber-300"
                      }`}
                    >
                      <span>{rating}</span>
                      <Star size={10} className={selectedRatings.includes(rating) ? "fill-white" : "fill-gray-300"} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear All Button */}
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

          {/* Results Distance List Feed Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {sortedResults && sortedResults.length > 0 ? (
              sortedResults.map((place, index) => {
                const lat = Number(place.latitude);
                const lng = Number(place.longitude);
                const addressText = place.address || place.formatted_address || place.vicinity;

                return (
                  <div 
                    key={place.id || place.place_id || index} 
                    onClick={() => {
                      if (lat && lng) {
                        setFocusedLocation({ lat, lng, name: place.name, address: addressText });
                        if (onTriggerDirectionPanel) onTriggerDirectionPanel(place);
                        setIsMobileExpanded(false);
                        // THÊM: Mở Place Detail Modal
                        if (onPlaceClick) onPlaceClick(place);
                      }
                    }} 
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
                        <p className="text-[11px] text-gray-500 mt-0.5 truncate">{addressText}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded whitespace-nowrap ml-2 self-center shrink-0">
                      {place.distanceText || "--- km"}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-gray-400">No matching places found within 5km</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}