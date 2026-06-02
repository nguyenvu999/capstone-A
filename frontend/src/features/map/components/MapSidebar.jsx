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
  onFilterChange,
  onPlaceClick
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const suggestionRef = useRef(null);
  const [sortedResults, setSortedResults] = useState([]);

  // State cho filters
  const [selectedPriceLevels, setSelectedPriceLevels] = useState([]); 
  const [selectedRatings, setSelectedRatings] = useState([]); 
  const [showFilters, setShowFilters] = useState(false); 

  // Sync search query box khi chọn địa điểm từ bản đồ
  useEffect(() => {
    if (focusedLocation && focusedLocation.name) {
      setSearchQuery(focusedLocation.name);
    }
  }, [focusedLocation]);

  // Sắp xếp và LỌC TRÙNG TỌA ĐỘ cho list kết quả hiển thị bên dưới danh mục
  useEffect(() => {
    if (!categoryResults || categoryResults.length === 0) {
      setSortedResults([]);
      return;
    }

    // Lọc trùng theo Tọa độ & Tên đối với dữ liệu danh mục trả về thực tế
    const uniquePlacesMap = new Map();
    categoryResults.forEach(place => {
      const lat = Number(place.latitude).toFixed(4); // Làm tròn 4 chữ số để tránh lệch coordinate siêu nhỏ
      const lng = Number(place.longitude).toFixed(4);
      const cleanName = (place.name || "").toLowerCase().replace(/\s+/g, "");
      const geoKey = `${cleanName}_${lat}_${lng}`;

      // Nếu trùng tọa độ + tên, ưu tiên giữ lại dữ liệu không phải từ Track-Asia ngẫu nhiên
      if (!uniquePlacesMap.has(geoKey) || place.category !== "TrackAsiaPlace") {
        uniquePlacesMap.set(geoKey, place);
      }
    });

    const sorted = Array.from(uniquePlacesMap.values()).sort((a, b) => {
      const distA = parseFloat(a.distanceText) || 0;
      const distB = parseFloat(b.distanceText) || 0;
      return distA - distB;
    });

    setSortedResults(sorted);
  }, [categoryResults]);

  // Gửi filter thay đổi lên component cha
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
              secondary_text: item.address || "Registered location"
            },
            isSupabaseData: true,
            rawSupabaseItem: item
          }));
        }
      } catch (err) {
        console.error("Supabase Query Error:", err);
      }

      // --- BỘ LỌC NGHIÊM NGẶT: TÊN + SỐ NHÀ/ĐƯỜNG RÚT GỌN ---
      const allRawSuggestions = [...supabasePredictions, ...trackAsiaPredictions];
      const seenKeys = new Set();
      
      const filteredSuggestions = allRawSuggestions.filter(item => {
        const mainText = (item.structured_formatting?.main_text || "").toLowerCase();
        const secondaryText = (item.structured_formatting?.secondary_text || "").toLowerCase();
        
        // 1. Chuẩn hóa Tên (Xóa hết khoảng trắng, xóa dấu)
        const cleanName = mainText
          .replace(/\s+/g, "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        // 2. Tách lấy phần cốt lõi của địa chỉ (Chỉ lấy số nhà + tên đường)
        // Loại bỏ từ khóa hành chính
        let coreAddress = secondaryText
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/(duong|phuong|quan|thanh pho|tp\.|q\.|p\.|d\.)/g, "");

        // Giữ lại 4 từ/cụm số đầu tiên của địa chỉ (Ví dụ: "17 vo van tan" thay vì đọc hết đuôi đằng sau)
        const addressParts = coreAddress.trim().split(/[\s,]+/);
        const shortAddress = addressParts.slice(0, 4).join("");

        // Tạo khóa định danh nghiêm ngặt
        const uniqueKey = `${cleanName}_${shortAddress}`;

        if (seenKeys.has(uniqueKey)) {
          return false; // Loại bỏ hoàn toàn bản ghi trùng lặp từ Track-Asia phía sau
        }
        
        seenKeys.add(uniqueKey);
        return true;
      });

      setSuggestions(filteredSuggestions);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, apiKey, focusedLocation, currentUserCoords]);

  // Đóng bảng gợi ý khi nhấn ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Xử lý khi click vào item trong dropdown gợi ý
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

  const togglePriceLevel = (level) => {
    setSelectedPriceLevels(prev => 
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  };

  const toggleRating = (rating) => {
    setSelectedRatings(prev => 
      prev.includes(rating) ? prev.filter(r => r !== rating) : [...prev, rating]
    );
  };

  const clearAllFilters = () => {
    setSelectedPriceLevels([]);
    setSelectedRatings([]);
  };

  const activeFiltersCount = selectedPriceLevels.length + selectedRatings.length;

  const getCategoryIcon = (categoryId) => {
    const category = CATEGORIES.find(cat => cat.id.toLowerCase() === categoryId?.toLowerCase());
    if (!category) return null;
    
    const IconComponent = category.icon;
    return <IconComponent className={category.iconColor} size={14} />;
  };

  return (
    <>
      {/* MOBILE LIST TOGGLE */}
      <button
        onClick={() => setIsMobileExpanded(!isMobileExpanded)}
        className="md:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-1.5 active:scale-95 transition-all text-xs"
      >
        {isMobileExpanded ? <X size={14} /> : <Menu size={14} />}
        <span>{isMobileExpanded ? "Hide Panel" : "View List"}</span>
      </button>

      {/* SIDEBAR CONTAINER */}
      <div 
        className={`
          fixed bg-white shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-in-out
          md:top-[88px] md:left-6 md:z-30 md:w-[360px] md:max-h-[76vh] md:rounded-2xl md:translate-y-0 md:opacity-100
          max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:w-full max-md:z-[90] max-md:rounded-t-2xl max-md:border-t max-md:border-gray-150
          ${isMobileExpanded 
            ? "max-md:h-[65vh] max-md:opacity-100 max-md:translate-y-0" 
            : "max-md:h-[76px] max-md:overflow-hidden"
          }
        `}
      >
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
                  <div className="overflow-hidden bg-white w-full">
                    <div className="text-xs font-semibold text-gray-800 flex items-center flex-wrap gap-1.5">
                      <span className="truncate max-w-[200px]">{item.structured_formatting?.main_text}</span>
                      {item.isSupabaseData && (
                        <span className="text-[9px] bg-red-100 text-red-600 px-1 py-0.5 rounded font-normal shrink-0">
                          Registered
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500 truncate mt-0.5">{item.structured_formatting?.secondary_text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bọc nội dung danh mục và kết quả */}
        <div className={`flex-1 flex flex-col overflow-hidden max-md:transition-opacity max-md:duration-200 ${!isMobileExpanded && "max-md:opacity-0 max-md:pointer-events-none"}`}>
          {/* Categories Grid Area */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Categories within 5km</h2>
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

          {/* Filter Panel */}
          {showFilters && (
            <div className="p-4 border-b border-gray-100 bg-gray-50 shrink-0 space-y-3 max-h-[240px] overflow-y-auto">
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

          {/* Results Area */}
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