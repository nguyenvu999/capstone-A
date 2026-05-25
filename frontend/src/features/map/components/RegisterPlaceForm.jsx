import { useState, useEffect, useRef } from "react";
import { supabase } from "../../auth/api/supabaseClient";
import { X, Save, Search, MapPin } from "lucide-react";

const CATEGORIES = [
  { id: "restaurant", name: "Restaurant", icon: "/restaurant-icon.png", bgColor: "#fb923c" },
  { id: "hotel", name: "Hotel", icon: "/lodging_map_icon.png", bgColor: "#87CEEB" },
  { id: "supermarket", name: "Supermarket", icon: "/supermarket_icon.png", bgColor: "#a855f7" },
  { id: "pharmacy", name: "Pharmacy", icon: "/medical_map_icon.png", bgColor: "#10b981" },
  { id: "entertainment", name: "Entertainment", icon: "/park_map_icon.png", bgColor: "#ec4899" },
  { id: "bank", name: "Bank", icon: "/bank_icon.png", bgColor: "#FFE74A" },
  { id: "education", name: "Education", icon: "/education-icon.png", bgColor: "#8b5cf6" },
  { id: "government", name: "Government", icon: "/local_government_icon.png", bgColor: "#64748b" }
];

export default function RegisterPlaceForm({ apiKey, focusedLocation, setFocusedLocation, onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    latitude: "",
    longitude: "",
    price_level: 1,
    business_status: "open",
    source: "manual",
    category: "restaurant",
  });
  
  const [addressQuery, setAddressQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const suggestionRef = useRef(null);

  // ĐÃ FIX: Nhận trực tiếp chuỗi địa chỉ chữ thực tế đã được Map Geocode sẵn
  useEffect(() => {
    if (focusedLocation) {
      setFormData((prev) => ({
        ...prev,
        name: focusedLocation.name || prev.name,
        address: focusedLocation.address || prev.address,
        city: focusedLocation.city || prev.city || prev.city, // Tự điền ô City nếu Map quét ra tỉnh/thành phố
        latitude: focusedLocation.lat || prev.latitude,
        longitude: focusedLocation.lng || prev.longitude,
        category: focusedLocation.category || prev.category, 
      }));
      
      if (focusedLocation.address) {
        setAddressQuery(focusedLocation.address);
      }
    }
  }, [focusedLocation]);

  // Track-Asia Autocomplete logic
  useEffect(() => {
    if (addressQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(() => {
      fetch(`https://maps.track-asia.com/api/v2/place/autocomplete/json?input=${encodeURIComponent(addressQuery)}&key=${apiKey}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.predictions) setSuggestions(data.predictions);
        })
        .catch((err) => console.error("Autocomplete error:", err));
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [addressQuery, apiKey]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSuggestion = (prediction) => {
    setAddressQuery(prediction.description);
    setShowSuggestions(false);

    fetch(`https://maps.track-asia.com/api/v2/place/details/json?place_id=${prediction.place_id}&key=${apiKey}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.result && data.result.geometry) {
          const loc = data.result.geometry.location;
          const chosenName = formData.name || data.result.name;
          const formattedAddress = data.result.formatted_address || prediction.description;
          
          setFormData((prev) => ({
            ...prev,
            address: formattedAddress,
            latitude: Number(loc.lat),
            longitude: Number(loc.lng),
          }));

          setFocusedLocation({
            lat: Number(loc.lat),
            lng: Number(loc.lng),
            name: chosenName,
            address: formattedAddress,
            category: formData.category, 
          });
        }
      })
      .catch((err) => console.error("Place details error:", err));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if ((name === "name") && prev.latitude && prev.longitude) {
        setFocusedLocation({
          lat: Number(prev.latitude),
          lng: Number(prev.longitude),
          name: value,
          address: prev.address,
          category: prev.category,
        });
      }
      return updated;
    });
  };

  const handleCategorySelect = (categoryId) => {
    setFormData((prev) => {
      const updated = { ...prev, category: categoryId };
      if (prev.latitude && prev.longitude) {
        setFocusedLocation({
          lat: Number(prev.latitude),
          lng: Number(prev.longitude),
          name: prev.name,
          address: prev.address,
          category: categoryId,
        });
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.latitude || !formData.longitude) {
      alert("Please select a valid address from the suggestions or click on the map.");
      return;
    }
    setLoading(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) console.warn("Auth context warning:", authError.message);

      const { error } = await supabase.from("places").insert([
        {
          name: formData.name,
          description: formData.description,
          address: formData.address,
          city: formData.city,
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude),
          price_level: Number(formData.price_level),
          business_status: formData.business_status,
          source: formData.source,
          category: formData.category, 
          created_by: user ? user.id : null, 
          created_by_email: user ? user.email : null, 
        },
      ]);

      if (error) throw error;

      setAddressQuery(formData.name);
      setFocusedLocation({
        lat: Number(formData.latitude),
        lng: Number(formData.longitude),
        name: formData.name,
        address: formData.address,
        category: formData.category,
        isConfirmed: true 
      });

      alert("Place registered successfully with selected category!");
      if (onClose) onClose();
    } catch (error) {
      console.error("Insert error:", error.message);
      alert("Failed to save place: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed top-20 right-6 z-[999] w-[400px] bg-white rounded-2xl shadow-2xl flex flex-col max-h-[calc(100vh-120px)] border border-gray-100 overflow-hidden transition-all duration-300 ease-out animate-in slide-in-from-right-10">
      
      <button 
        type="button" 
        onClick={onClose} 
        className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-[1000] focus:outline-none"
        aria-label="Close form"
      >
        <X size={18} />
      </button>

      <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-sm text-gray-700 custom-scrollbar">
        
        <div className="pb-1">
          <h2 className="text-base font-bold text-gray-800">Register Place</h2>
        </div>

        {/* Input Tên Địa Điểm */}
        <div>
          <label className="block font-medium text-gray-700 mb-1.5">Place Name *</label>
          <input
            type="text"
            name="name"
            required
            placeholder="e.g. Highlands Coffee"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            value={formData.name}
            onChange={handleChange}
          />
        </div>

        {/* Giao diện chọn Category */}
        <div>
          <label className="block font-medium text-gray-700 mb-2">Category (Danh mục) *</label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => {
              const isSelected = formData.category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                    isSelected 
                      ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20 font-semibold" 
                      : "border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  <div 
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-white"
                    style={{ backgroundColor: cat.bgColor }}
                  >
                    <img src={cat.icon} alt={cat.name} className="w-4 h-4 object-contain" />
                  </div>
                  <span className="text-xs text-gray-700 truncate">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tìm kiếm địa chỉ (Tự động cập nhật nội dung chữ thực tế từ Map click) */}
        <div className="relative" ref={suggestionRef}>
          <label className="block font-medium text-gray-700 mb-1.5">Search Address *</label>
          <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white transition-all">
            <Search size={16} className="text-gray-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Type to search address..."
              className="bg-transparent focus:outline-none w-full text-sm"
              value={addressQuery}
              onChange={(e) => {
                setAddressQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
            />
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-2xl max-h-[200px] overflow-y-auto z-50">
              {suggestions.map((item) => (
                <div
                  key={item.place_id}
                  onClick={() => handleSelectSuggestion(item)}
                  className="flex items-start gap-2.5 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none"
                >
                  <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                  <div className="overflow-hidden">
                    <p className="font-medium text-gray-800 truncate">{item.structured_formatting?.main_text || item.description}</p>
                    <p className="text-xs text-gray-500 truncate">{item.structured_formatting?.secondary_text || item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* City (Cũng tự động ăn theo tỉnh/thành bóc được từ Map Geocode) */}
        <div>
          <label className="block font-medium text-gray-700 mb-1.5">City *</label>
          <input
            type="text"
            name="city"
            required
            placeholder="e.g. Ho Chi Minh City"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            value={formData.city}
            onChange={handleChange}
          />
        </div>

        {/* Tọa độ */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-gray-700 mb-1.5">Latitude</label>
            <input
              type="number"
              step="any"
              name="latitude"
              required
              disabled
              className="w-full bg-gray-100 border border-gray-150 rounded-xl p-2.5 text-sm text-gray-400 cursor-not-allowed select-none"
              value={formData.latitude}
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-1.5">Longitude</label>
            <input
              type="number"
              step="any"
              name="longitude"
              required
              disabled
              className="w-full bg-gray-100 border border-gray-150 rounded-xl p-2.5 text-sm text-gray-400 cursor-not-allowed select-none"
              value={formData.longitude}
            />
          </div>
        </div>

        {/* Price Level */}
        <div>
          <label className="block font-medium text-gray-700 mb-1.5">Price Level</label>
          <select
            name="price_level"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white cursor-pointer transition-all"
            value={formData.price_level}
            onChange={handleChange}
          >
            <option value={1}>1 - Budget</option>
            <option value={2}>2 - Moderate</option>
            <option value={3}>3 - Expensive</option>
            <option value={4}>4 - Ultra Luxe</option>
          </select>
        </div>

        {/* Business Status */}
        <div>
          <label className="block font-medium text-gray-700 mb-1.5">Business Status</label>
          <select
            name="business_status"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white cursor-pointer transition-all"
            value={formData.business_status}
            onChange={handleChange}
          >
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="temporarily_closed">Temporarily Closed</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block font-medium text-gray-700 mb-1.5">Description</label>
          <textarea
            name="description"
            rows={3}
            placeholder="Write some notes or details about this place..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white resize-none transition-all"
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50 text-sm"
        >
          <Save size={16} />
          <span>{loading ? "Saving to Supabase..." : "Save to Supabase"}</span>
        </button>
      </form>
    </div>
  );
}