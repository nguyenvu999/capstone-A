import { useState, useEffect, useRef } from "react";
import { Utensils, Hotel, ShoppingCart, Pill, Film, Building, GraduationCap, Landmark, Search, MapPin, X } from "lucide-react";
import { supabase } from "../../auth/api/supabaseClient"; // Đảm bảo import đúng đường dẫn supabase của bạn

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

export default function MapSidebar({ apiKey, onSelectCategory, categoryResults, setFocusedLocation, setCategoryResults, focusedLocation }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef(null);

  // Đồng bộ ô tìm kiếm khi click chọn điểm từ bản đồ
  useEffect(() => {
    if (focusedLocation && focusedLocation.name) {
      setSearchQuery(focusedLocation.name);
    }
  }, [focusedLocation]);

  // Debounce tìm kiếm đồng thời: Track-Asia API + Supabase Local Data
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    // Nếu query trùng khớp với điểm đang được focus thì bỏ qua không gọi lại API
    if (focusedLocation && (focusedLocation.name === searchQuery || focusedLocation.address === searchQuery)) {
      return;
    }

    const delayDebounce = setTimeout(async () => {
      const location = "10.769034,106.694945"; 
      let trackAsiaPredictions = [];
      let supabasePredictions = [];

      // 1. Gọi API Track-Asia Autocomplete
      try {
        const res = await fetch(`https://maps.track-asia.com/api/v2/place/autocomplete/json?input=${encodeURIComponent(searchQuery)}&location=${location}&key=${apiKey}`);
        const data = await res.json();
        if (data.predictions) {
          trackAsiaPredictions = data.predictions.map(item => ({
            ...item,
            isSupabaseData: false // Đánh dấu nguồn dữ liệu
          }));
        }
      } catch (err) {
        console.error("Lỗi Autocomplete Track-Asia:", err);
      }

      // 2. Tìm kiếm song song trong bảng `places` của Supabase
      try {
        const { data: sbData, error } = await supabase
          .from("places")
          .select("*")
          .ilike("name", `%${searchQuery}%`); // Tìm kiếm không phân biệt chữ hoa/thường theo tên

        if (error) throw error;
        if (sbData) {
          supabasePredictions = sbData.map(item => ({
            place_id: `supabase_${item.id}`, // Tạo ID giả định để tránh trùng lặp key
            description: item.name,
            structured_formatting: {
              main_text: item.name,
              secondary_text: item.address || "Địa điểm từ Database của bạn"
            },
            isSupabaseData: true,
            rawSupabaseItem: item // Giữ nguyên object để dùng khi click
          }));
        }
      } catch (err) {
        console.error("Lỗi tìm kiếm Supabase:", err);
      }

      // 3. Gộp dữ liệu hiển thị (Ưu tiên hiển thị dữ liệu của Supabase lên trước)
      setSuggestions([...supabasePredictions, ...trackAsiaPredictions]);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, apiKey, focusedLocation]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Xử lý khi chọn một địa điểm từ danh sách gợi ý
  const handleSelectSuggestion = (prediction) => {
    setSearchQuery(prediction.description);
    setShowSuggestions(false);

    // TRƯỜNG HỢP 1: Click trúng địa điểm do bạn tự tạo trong Supabase
    if (prediction.isSupabaseData) {
      const dbItem = prediction.rawSupabaseItem;
      const lat = Number(dbItem.latitude);
      const lng = Number(dbItem.longitude);

      // Đẩy thông tin lên cấu trúc tổng
      setFocusedLocation({
        lat: lat,
        lng: lng,
        name: dbItem.name,
        address: dbItem.address,
      });

      // Để lại điểm và hiển thị chính nó trong mảng kết quả sidebar để Map vẽ marker
      setCategoryResults([dbItem]);
    } 
    // TRƯỜNG HỢP 2: Điểm từ API ngoài của Track-Asia
    else {
      setCategoryResults([]); // Xóa danh mục cũ trên sidebar
      fetch(`https://maps.track-asia.com/api/v2/place/details/json?place_id=${prediction.place_id}&key=${apiKey}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.result && data.result.geometry) {
            const loc = data.result.geometry.location;
            
            setFocusedLocation({
              lat: Number(loc.lat),
              lng: Number(loc.lng),
              name: data.result.name,
              address: data.result.formatted_address || prediction.description,
            });
            // Đồng bộ hiển thị mảng kết quả từ API ngoài để sinh marker
            setCategoryResults([data.result]);
          }
        })
        .catch((err) => console.error("Lỗi lấy chi tiết địa điểm TrackAsia:", err));
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSuggestions([]);
  };

  return (
    <div className="absolute top-4 left-4 z-50 w-[360px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
      
      {/* Ô tìm kiếm */}
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

        {/* Khung Dropdown Autocomplete gợi ý hỗn hợp */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-4 right-4 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-[240px] overflow-y-auto z-50">
            {suggestions.map((item) => (
              <div
                key={item.place_id}
                onClick={() => handleSelectSuggestion(item)}
                className="flex items-start gap-2.5 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none"
              >
                {/* Đổi màu icon định vị nếu là điểm của Supabase để dễ nhận biết */}
                <MapPin size={14} className={`mt-0.5 shrink-0 ${item.isSupabaseData ? "text-red-500 font-bold" : "text-gray-400"}`} />
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-gray-800 truncate">
                    {item.structured_formatting?.main_text} 
                    {item.isSupabaseData && <span className="ml-1.5 text-[9px] bg-red-100 text-red-600 px-1 py-0.5 rounded font-normal">Đã lưu</span>}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate">
                    {item.structured_formatting?.secondary_text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danh mục nhanh */}
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

      {/* Danh sách hiển thị kết quả quét */}
      <div className="flex-1 overflow-y-auto">
        {categoryResults && categoryResults.length > 0 ? (
          categoryResults.map((place, index) => {
            const lat = Number(place.latitude || place.geometry?.location?.lat);
            const lng = Number(place.longitude || place.geometry?.location?.lng);
            const addressText = place.address || place.formatted_address || place.vicinity;

            return (
              <div 
                key={place.id || place.place_id || index} 
                onClick={() => {
                  if (lat && lng) {
                    setFocusedLocation({
                      lat: lat, 
                      lng: lng, 
                      name: place.name, 
                      address: addressText
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
                  <p className="text-[11px] text-gray-500 mt-0.5 truncate">{addressText}</p>
                </div>
              </div>
            );
          })
        ) : searchQuery && !showSuggestions && suggestions.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-400">Không tìm thấy địa điểm phù hợp</div>
        ) : null}
      </div>
    </div>
  );
}