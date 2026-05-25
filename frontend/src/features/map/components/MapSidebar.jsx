import { useState, useEffect, useRef } from "react";
import { Utensils, Hotel, ShoppingCart, Pill, Film, Building, GraduationCap, Landmark, Search, MapPin, X } from "lucide-react";
import { supabase } from "../../auth/api/supabaseClient";

const CATEGORIES = [
  { id: "restaurant", label: "Nhà hàng", icon: Utensils, bgColor: "bg-orange-50", iconColor: "text-orange-600" },
  { id: "hotel", label: "Khách sạn", icon: Hotel, bgColor: "bg-blue-50", iconColor: "text-blue-600" },
  { id: "supermarket", label: "Siêu thị", icon: ShoppingCart, bgColor: "bg-purple-50", iconColor: "text-purple-600" },
  { id: "pharmacy", label: "Nhà thuốc", icon: Pill, bgColor: "bg-emerald-50", iconColor: "text-emerald-600" },
  { id: "entertainment", label: "Giải trí", icon: Film, bgColor: "bg-pink-50", iconColor: "text-pink-600" },
  { id: "government", label: "Hành chính", icon: Building, bgColor: "bg-slate-50", iconColor: "text-slate-600" },
  { id: "education", label: "Giáo dục", icon: GraduationCap, bgColor: "bg-indigo-50", iconColor: "text-indigo-600" },
  { id: "bank", label: "Ngân hàng", icon: Landmark, bgColor: "bg-amber-50", iconColor: "text-amber-600" },
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
  onTriggerDirectionPanel
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef(null);
  const [sortedResults, setSortedResults] = useState([]);

  // Cập nhật ô input khi click chọn địa điểm từ bản đồ
  useEffect(() => {
    if (focusedLocation && focusedLocation.name) {
      setSearchQuery(focusedLocation.name);
    }
  }, [focusedLocation]);

  // ĐÃ PHÁT TRIỂN THÊM: Sắp xếp danh sách kết quả tự động từ GẦN NHẤT đến XA NHẤT
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

  // Xử lý tìm kiếm Autocomplete (Giữ nguyên logic của bạn)
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
        console.error("Lỗi Autocomplete Track-Asia:", err);
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
              secondary_text: item.address || "Địa điểm đã lưu"
            },
            isSupabaseData: true,
            rawSupabaseItem: item
          }));
        }
      } catch (err) {
        console.error("Lỗi tìm kiếm Supabase:", err);
      }

      setSuggestions([...supabasePredictions, ...trackAsiaPredictions]);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, apiKey, focusedLocation, currentUserCoords]);

  // Đóng khung gợi ý khi click ra ngoài vùng search
  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Click chọn vị trí từ danh sách gợi ý tìm kiếm
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
          }
        })
        .catch((err) => console.error("Lỗi chi tiết vị trí:", err));
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

  return (
    <div className="absolute top-4 left-4 z-50 w-[360px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
      {/* Vùng Tìm kiếm */}
      <div className="p-4 border-b border-gray-100 relative" ref={suggestionRef}>
        <div className="relative flex items-center bg-gray-100 rounded-xl px-3 py-2.5">
          <Search size={16} className="text-gray-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Tìm kiếm địa điểm..."
            className="bg-transparent text-xs text-gray-800 focus:outline-none w-full pr-6"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(""); setSuggestions([]); }} className="absolute right-3 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-4 right-4 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-[240px] overflow-y-auto z-50">
            {suggestions.map((item) => (
              <div key={item.place_id} onClick={() => handleSelectSuggestion(item)} className="flex items-start gap-2.5 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none">
                <MapPin size={14} className={`mt-0.5 shrink-0 ${item.isSupabaseData ? "text-red-500 font-bold" : "text-gray-400"}`} />
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-gray-800 truncate">
                    {item.structured_formatting?.main_text}
                    {item.isSupabaseData && <span className="ml-1.5 text-[9px] bg-red-100 text-red-600 px-1 py-0.5 rounded font-normal">Đã lưu</span>}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate">{item.structured_formatting?.secondary_text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid Danh mục */}
      <div className="p-4 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Danh mục trong bán kính 5km</h2>
        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.map((cat) => {
            const isSelected = activeCategory?.toLowerCase() === cat.id.toLowerCase();
            return (
              <button 
                key={cat.id} 
                onClick={() => handleCategoryClick(cat.id)} 
                className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all border ${
                  isSelected ? "bg-white border-blue-500 shadow-md ring-1 ring-blue-500" : "border-transparent hover:bg-white hover:shadow-sm"
                }`}
              >
                <div className={`w-9 h-9 ${cat.bgColor} rounded-full flex items-center justify-center`}>
                  <cat.icon className={cat.iconColor} size={15} />
                </div>
                <span className={`text-[9px] font-medium ${isSelected ? "text-blue-600 font-bold" : "text-gray-600"}`}>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Vùng hiển thị kết quả đã được tối ưu KM từ trên xuống dưới */}
      <div className="flex-1 overflow-y-auto">
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
                  }
                }} 
                className="flex items-start justify-between p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 transition-all duration-150 active:bg-gray-100"
              >
                <div className="flex items-start gap-3 overflow-hidden">
                  <div className="w-6 h-6 bg-blue-50 text-blue-600 flex items-center justify-center rounded-lg font-bold text-[11px] shrink-0">
                    {index + 1}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-gray-800 truncate">{place.name}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 truncate">{addressText}</p>
                  </div>
                </div>

                {/* ĐÃ FIX: Nhận trực tiếp chuỗi distanceText từ hàm Haversine xử lý mảng phẳng */}
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded whitespace-nowrap ml-2 self-center shrink-0">
                  {place.distanceText || "--- km"}
                </span>
              </div>
            );
          })
        ) : (
          <div className="p-6 text-center text-xs text-gray-400">Không tìm thấy địa điểm phù hợp trong 5km</div>
        )}
      </div>
    </div>
  );
}