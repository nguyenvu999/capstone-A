import { useState, useEffect, useRef } from "react";
import { supabase } from "../../auth/api/supabaseClient";
import { X, Save, Search, MapPin } from "lucide-react";

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
  });
  
  const [addressQuery, setAddressQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const suggestionRef = useRef(null);

  // Sync with map selection if user clicks on the map
  useEffect(() => {
    if (focusedLocation) {
      setFormData((prev) => ({
        ...prev,
        name: focusedLocation.name || prev.name,
        address: focusedLocation.address || prev.address,
        latitude: focusedLocation.lat || prev.latitude,
        longitude: focusedLocation.lng || prev.longitude,
      }));
      if (focusedLocation.address && !focusedLocation.address.startsWith("Coordinates:")) {
        setAddressQuery(focusedLocation.address);
      }
    }
  }, [focusedLocation]);

  // Address Autocomplete Logic
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

  // Close suggestions on outside click
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
          
          setFormData((prev) => ({
            ...prev,
            address: data.result.formatted_address || prediction.description,
            latitude: Number(loc.lat),
            longitude: Number(loc.lng),
          }));

          setFocusedLocation({
            lat: Number(loc.lat),
            lng: Number(loc.lng),
            name: formData.name || data.result.name,
            address: data.result.formatted_address || prediction.description,
          });
        }
      })
      .catch((err) => console.error("Place details error:", err));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.latitude || !formData.longitude) {
      alert("Please select a valid address from the suggestions or click on the map.");
      return;
    }
    setLoading(true);

    try {
      // 1. Lấy thông tin phiên đăng nhập của User hiện tại từ Supabase Auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.warn("Could not retrieve logged-in user context:", authError.message);
      }

      // 2. Tiến hành đẩy bản ghi lên bảng dữ liệu
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
          // Gán UUID tài khoản người tạo nếu có, ngược lại để null cho khách vãng lai
          created_by: user ? user.id : null, 
          // 'created_at' & 'updated_at' đã được cấu hình tự động sinh DEFAULT sinh ra ở phía DB
        },
      ]);

      if (error) throw error;

      alert("Place registered successfully!");
      if (onClose) onClose();
    } catch (error) {
      console.error("Database insert error:", error.message);
      alert("Failed to save place: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute top-4 right-4 z-50 w-[360px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Register New Place</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-4 flex-1 overflow-y-auto space-y-3 text-xs text-gray-700">
        
        {/* Name Input */}
        <div>
          <label className="block font-semibold text-gray-600 mb-1">Place Name *</label>
          <input
            type="text"
            name="name"
            required
            placeholder="e.g. Highlands Coffee"
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-blue-500"
            value={formData.name}
            onChange={handleChange}
          />
        </div>

        {/* Address Search Input */}
        <div className="relative" ref={suggestionRef}>
          <label className="block font-semibold text-gray-600 mb-1">Search Address *</label>
          <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2">
            <Search size={14} className="text-gray-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Type to search address..."
              className="bg-transparent focus:outline-none w-full"
              value={addressQuery}
              onChange={(e) => {
                setAddressQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
            />
          </div>

          {/* Autocomplete List */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-[180px] overflow-y-auto z-50">
              {suggestions.map((item) => (
                <div
                  key={item.place_id}
                  onClick={() => handleSelectSuggestion(item)}
                  className="flex items-start gap-2 p-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none"
                >
                  <MapPin size={12} className="text-gray-400 mt-0.5 shrink-0" />
                  <div className="overflow-hidden">
                    <p className="font-semibold text-gray-800 truncate">{item.structured_formatting?.main_text || item.description}</p>
                    <p className="text-[10px] text-gray-500 truncate">{item.structured_formatting?.secondary_text || item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* City Input */}
        <div>
          <label className="block font-semibold text-gray-600 mb-1">City *</label>
          <input
            type="text"
            name="city"
            required
            placeholder="e.g. Ho Chi Minh City"
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-blue-500"
            value={formData.city}
            onChange={handleChange}
          />
        </div>

        {/* Lat & Lng Display */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block font-semibold text-gray-600 mb-1">Latitude</label>
            <input
              type="number"
              step="any"
              name="latitude"
              required
              readOnly
              placeholder="0.000000"
              className="w-full bg-gray-100 border border-gray-200 rounded-lg p-2 text-gray-500 cursor-not-allowed"
              value={formData.latitude}
            />
          </div>
          <div>
            <label className="block font-semibold text-gray-600 mb-1">Longitude</label>
            <input
              type="number"
              step="any"
              name="longitude"
              required
              readOnly
              placeholder="0.000000"
              className="w-full bg-gray-100 border border-gray-200 rounded-lg p-2 text-gray-500 cursor-not-allowed"
              value={formData.longitude}
            />
          </div>
        </div>

        {/* Price Level Dropdown */}
        <div>
          <label className="block font-semibold text-gray-600 mb-1">Price Level</label>
          <select
            name="price_level"
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-blue-500"
            value={formData.price_level}
            onChange={handleChange}
          >
            <option value={1}>1 - Budget</option>
            <option value={2}>2 - Moderate</option>
            <option value={3}>3 - Expensive</option>
            <option value={4}>4 - Ultra Luxe</option>
          </select>
        </div>

        {/* Business Status Dropdown */}
        <div>
          <label className="block font-semibold text-gray-600 mb-1">Business Status</label>
          <select
            name="business_status"
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-blue-500"
            value={formData.business_status}
            onChange={handleChange}
          >
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="temporarily_closed">Temporarily Closed</option>
          </select>
        </div>

        {/* Description Input */}
        <div>
          <label className="block font-semibold text-gray-600 mb-1">Description</label>
          <textarea
            name="description"
            rows={3}
            placeholder="Write some notes or details about this place..."
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-blue-500 resize-none"
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all disabled:opacity-50"
        >
          <Save size={14} />
          {loading ? "Saving..." : "Save to Supabase"}
        </button>
      </form>
    </div>
  );
}