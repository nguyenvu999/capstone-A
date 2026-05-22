import { useState, useEffect, useRef } from "react";
import { Utensils, Hotel, ShoppingCart, Pill, Film, Building, GraduationCap, Landmark, Search, MapPin, X } from "lucide-react";

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

export default function MapSidebar({ apiKey, onSelectCategory, categoryResults, setFocusedLocation, setCategoryResults }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef(null);

  // Debounce gọi API Autocomplete khi người dùng gõ tìm kiếm
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      const location = "10.769034,106.694945"; // Ưu tiên tìm vùng lân cận HCM
      
      fetch(`https://maps.track-asia.com/api/v2/place/autocomplete/json?input=${encodeURIComponent(searchQuery)}&location=${location}&key=${apiKey}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.predictions) {
            setSuggestions(data.predictions);
          }
        })
        .catch((err) => console.error("Lỗi Autocomplete:", err));
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, apiKey]);

  // Click ra ngoài tự động đóng dropdown gợi ý
  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Xử lý khi chọn một địa điểm từ danh sách gợi ý Autocomplete
  const handleSelectSuggestion = (prediction) => {
    setSearchQuery(prediction.description);
    setShowSuggestions(false);
    setCategoryResults([]); // Xóa danh mục cũ trên sidebar nếu có

    // Endpoint chuẩn của TrackAsia phải là "details" (có chữ s)
    fetch(`https://maps.track-asia.com/api/v2/place/details/json?place_id=${prediction.place_id}&key=${apiKey}`)
      .then((res) => {
        if (!res.ok) throw new Error("Lỗi HTTP server trả về: " + res.status);
        return res.json();
      })
      .then((data) => {
        if (data.result && data.result.geometry) {
          const loc = data.result.geometry.location;
          
          // Truyền object đầy đủ thuộc tính lên state tổng
          setFocusedLocation({
            lat: Number(loc.lat),
            lng: Number(loc.lng),
            name: data.result.name,
            address: data.result.formatted_address || prediction.description,
          });
        }
      })
      .catch((err) => console.error("Lỗi lấy chi tiết địa điểm:", err));
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSuggestions([]);
  };

  return (
    <div className="absolute top-4 left-4 z-50 w-[360px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
      
      {/* Ô tìm kiếm địa điểm */}
      <div className="p-4 border-b border-gray-100 relative" ref={suggestionRef}>
        <div className="relative flex items-center bg-gray-100 rounded-xl px-3 py-2.5">
          <Search size={16} className="text-gray-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Tìm kiếm địa điểm trên bản đồ..."
            className="bg-transparent text-xs text-gray-800 focus:outline-none w-full pr-6"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
          />
          {searchQuery && (
            <button onClick={handleClearSearch} className="absolute right-3 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Khung hiển thị Autocomplete kết quả */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-4 right-4 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-[240px] overflow-y-auto z-50">
            {suggestions.map((item) => (
              <div
                key={item.place_id}
                onClick={() => handleSelectSuggestion(item)}
                className="flex items-start gap-2.5 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none"
              >
                <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-gray-800 truncate">
                    {item.structured_formatting?.main_text || item.description}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate">
                    {item.structured_formatting?.secondary_text || item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danh mục tìm kiếm nhanh (Category xung quanh) */}
      <div className="p-4 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Danh mục xung quanh</h2>
        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.map((cat) => (
            <button 
              key={cat.id} 
              onClick={() => { handleClearSearch(); onSelectCategory(cat.id); }} 
              className="flex flex-col items-center gap-1 p-1.5 hover:bg-white hover:shadow-sm rounded-xl transition-all"
            >
              <div className={`w-9 h-9 ${cat.bgColor} rounded-full flex items-center justify-center`}>
                <cat.icon className={cat.iconColor} size={15} />
              </div>
              <span className="text-[9px] font-medium text-gray-600">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Danh sách hiển thị kết quả quét theo Category */}
      <div className="flex-1 overflow-y-auto">
        {categoryResults.length > 0 ? (
          categoryResults.map((place, index) => (
            <div 
              key={place.place_id || index} 
              onClick={() => {
                const lat = Number(place.geometry?.location?.lat);
                const lng = Number(place.geometry?.location?.lng);
                if (lat && lng) {
                  setFocusedLocation({
                    lat: lat, 
                    lng: lng, 
                    name: place.name, 
                    address: place.formatted_address || place.vicinity
                  });
                }
              }} 
              className="flex items-start gap-3 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50"
            >
              <div className="w-6 h-6 bg-blue-50 text-blue-600 flex items-center justify-center rounded-lg font-bold text-[11px] shrink-0">
                {index + 1}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-gray-800 truncate">{place.name}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">{place.formatted_address || place.vicinity}</p>
              </div>
            </div>
          ))
        ) : searchQuery && !showSuggestions && suggestions.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-400">Không tìm thấy địa điểm phù hợp</div>
        ) : null}
      </div>
    </div>
  );
}