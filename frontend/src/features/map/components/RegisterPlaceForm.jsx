import { useState, useEffect, useRef } from "react";
import { supabase } from "../../auth/api/supabaseClient";
import { X, Check, Search, MapPin } from "lucide-react";
import { useToast } from "../../../shared/ui/Toast";
import { checkDuplicatePlace } from "../utils/duplicateDetection";
import DuplicatePlaceModal from "./DuplicatePlaceModal";

// CẬP NHẬT: 6 categories đồng bộ với MapSidebar + MapContainer
const CATEGORIES = [
  { id: "restaurant", name: "Restaurant", icon: "/restaurant-icon.png", bgColor: "#fb923c" },
  { id: "bar", name: "Bar", emoji: "🍷", bgColor: "#a855f7" },
  { id: "beverage", name: "Beverage", emoji: "☕", bgColor: "#8b5cf6" },
  { id: "sight", name: "Sight", emoji: "👁️", bgColor: "#3b82f6" },
  { id: "entertainment", name: "Entertainment", icon: "/park_map_icon.png", bgColor: "#ec4899" },
  { id: "team_event", name: "Team Event", emoji: "👥", bgColor: "#10b981" }
];

export default function RegisterPlaceForm({ apiKey, focusedLocation, setFocusedLocation, onClose, allPlaces = [], onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    latitude: "",
    longitude: "",
    price_level: 1,
    source: "manual",
    category: "restaurant",
  });
  
  const [addressQuery, setAddressQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [duplicatePlace, setDuplicatePlace] = useState(null); // Lưu place trùng nếu phát hiện
  const [showDuplicateModal, setShowDuplicateModal] = useState(false); // Hiển thị modal cảnh báo
  const suggestionRef = useRef(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const MAX_IMAGE_COUNT = 3;
  const MAX_IMAGE_SIZE_MB = 5;
  const MAX_IMAGE_SIZE_BYTES =
    MAX_IMAGE_SIZE_MB * 1024 * 1024;
  
  // THÊM: useToast hook
  const { showToast, ToastComponent } = useToast();

  // Nhận trực tiếp chuỗi địa chỉ từ Map Geocode
  // Khi user click vào map → focusedLocation thay đổi → autofill form
  useEffect(() => {
    if (focusedLocation) {
      setFormData((prev) => ({
        ...prev,
        name: focusedLocation.name || prev.name,
        address: focusedLocation.address || prev.address,
        city: focusedLocation.city || prev.city, 
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
  // Gợi ý địa chỉ khi user gõ vào search box
  useEffect(() => {
    // Minimum 2 characters cho search 
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
        .catch((err) => {
          console.error("Autocomplete error:", err);
          // THÊM: Error handling
          showToast("Failed to load address suggestions", "error");
        });
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [addressQuery, apiKey]);

  // Đóng dropdown gợi ý khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Xử lý khi user chọn 1 gợi ý địa chỉ
  const handleSelectSuggestion = (prediction) => {
    setAddressQuery(prediction.description);
    setShowSuggestions(false);

    // Gọi API lấy chi tiết địa điểm (lat/lng)
    fetch(`https://maps.track-asia.com/api/v2/place/details/json?place_id=${prediction.place_id}&key=${apiKey}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.result && data.result.geometry) {
          const loc = data.result.geometry.location;
          const chosenName = formData.name || data.result.name;
          const formattedAddress = data.result.formatted_address || prediction.description;
          
          // Cập nhật form với tọa độ mới
          setFormData((prev) => ({
            ...prev,
            address: formattedAddress,
            latitude: Number(loc.lat),
            longitude: Number(loc.lng),
          }));

          // Cập nhật map focus
          setFocusedLocation({
            lat: Number(loc.lat),
            lng: Number(loc.lng),
            name: chosenName,
            address: formattedAddress,
            category: formData.category, 
          });
        }
      })
      .catch((err) => {
        console.error("Place details error:", err);
        // THÊM: Error handling
        showToast("Failed to load place details", "error");
      });
  };

  // Xử lý khi user thay đổi input trong form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      
      // Nếu đổi tên place → cập nhật marker trên map
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

  // Xử lý khi user chọn category
  const handleCategorySelect = (categoryId) => {
    setFormData((prev) => {
      const updated = { ...prev, category: categoryId };
      
      // Cập nhật marker trên map với category mới
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
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    if (!files.length) return;

    if (imageFiles.length + files.length > MAX_IMAGE_COUNT) {
      showToast(
        `Maximum ${MAX_IMAGE_COUNT} images allowed`,
        "warning"
      );

      e.target.value = "";
      return;
    }

    const validFiles = [];
    const previews = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        showToast("Only images are allowed", "warning");
        continue;
      }

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        showToast(
          `Each image must be under ${MAX_IMAGE_SIZE_MB}MB`,
          "warning"
        );
        continue;
      }

      validFiles.push(file);
      previews.push(URL.createObjectURL(file));
    }

    setImageFiles((prev) => [...prev, ...validFiles]);
    setImagePreviews((prev) => [...prev, ...previews]);

    e.target.value = "";
  };
  

 //Xử lý xoá ảnh 
const handleRemoveImage = (index) => {
  URL.revokeObjectURL(imagePreviews[index]);

  setImageFiles((prev) =>
    prev.filter((_, i) => i !== index)
  );

  setImagePreviews((prev) =>
    prev.filter((_, i) => i !== index)
  );
}

  // Xử lý submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // VALIDATION 1: Kiểm tra required fields
    if (!formData.name.trim()) {
      showToast("Please enter place name", "warning");
      return;
    }

    if (!formData.address.trim()) {
      showToast("Please enter or search for an address", "warning");
      return;
    }

    if (!formData.city.trim()) {
      showToast("Please enter city name", "warning");
      return;
    }

    // VALIDATION 2: Kiểm tra tọa độ
    if (!formData.latitude || !formData.longitude) {
      showToast("Please select a valid address from suggestions or click on the map", "warning");
      return;
    }

    // VALIDATION 3: Kiểm tra tên place (tối thiểu 3 ký tự)
    if (formData.name.trim().length < 3) {
      showToast("Place name must be at least 3 characters", "warning");
      return;
    }

    setLoading(true);

    try {
      // DUPLICATE CHECK: Kiểm tra trùng lặp trước khi insert
      const duplicate = await checkDuplicatePlace(
        {
          name: formData.name,
          address: formData.address,
          latitude: formData.latitude,
          longitude: formData.longitude
        },
        allPlaces
      );

      if (duplicate) {
        // Phát hiện duplicate → hiển thị modal cảnh báo
        setDuplicatePlace(duplicate);
        setShowDuplicateModal(true);
        setLoading(false);
        return;
      }

      // Lấy thông tin user hiện tại (nếu có)
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) console.warn("Auth context warning:", authError.message);

      //uplaod many images
      const uploadedImageUrls = [];
      for (const imageFile of imageFiles) {
        const fileExt =
          imageFile.name
            .split(".")
            .pop();

        const fileName =
          `${Date.now()}-${Math.random()}.${fileExt}`;

        const filePath =
          `places/${fileName}`;

        const { error: uploadError } =
          await supabase.storage
            .from("place-images")
            .upload(
              filePath,
              imageFile
            );

        if (uploadError)
          throw uploadError;

        const { data } =
          supabase.storage
            .from("place-images")
            .getPublicUrl(
              filePath
            );

        uploadedImageUrls.push(
          data.publicUrl
        );
      }
      
          
      // Insert place vào Supabase
      const { data: insertedData, error } = await supabase
        .from("places")
        .insert([
          {
            name: formData.name,
            description: formData.description,
            address: formData.address,
            city: formData.city,
            latitude: Number(formData.latitude),
            longitude: Number(formData.longitude),
            price_level: Number(formData.price_level),
            business_status: "open", // MẶC ĐỊNH luôn là "open"
            source: formData.source,
            category: formData.category,
            created_by: user ? user.id : null, 
            created_by_email: user ? user.email : null, 
          },
        ])
        .select(); 

      if (error) throw error;

      const savedPlace = insertedData && insertedData[0] ? insertedData[0] : null;

      // Save image URL into place_images table
      // Because your database stores image separately from places table
      if (uploadedImageUrls.length > 0 && savedPlace) {
        const imageRows =
          uploadedImageUrls.map(
            (url, index) => ({
              place_id: String(savedPlace.id),
              url,
              sort_order: index + 1,
            })
          );
        const { error: imageInsertError } =
          await supabase
            .from("place_images")
            .insert(imageRows);

        if (imageInsertError)
          throw imageInsertError;
      }

      setAddressQuery(formData.name);
      
      // Cập nhật map với place vừa thêm
      setFocusedLocation({
        id: savedPlace ? savedPlace.id : Date.now(),
        lat: Number(formData.latitude),
        lng: Number(formData.longitude),
        name: formData.name,
        address: formData.address,
        category: formData.category,
        isConfirmed: true
      });

      // THÊM: Success toast
      showToast("Place registered successfully!", "success");

      // Refresh map markers immediately so new location appears without reload
      if (onSuccess) onSuccess();
      
      // Đóng form sau 1.5 giây
      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);
    }
      catch (error) {
      console.error("Insert error:", error.message);
      // THÊM: Error toast
      showToast(`Failed to register place: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi user muốn xem place đã tồn tại
  const handleViewExistingPlace = (place) => {
    setFocusedLocation({
      lat: Number(place.latitude),
      lng: Number(place.longitude),
      name: place.name,
      address: place.address,
      category: place.category,
    });
    showToast("Navigated to existing place", "success");
    if (onClose) onClose();
  };

  return (
    <>
      {/* THÊM: Toast Component */}
      {ToastComponent}

      {/* THÊM: Duplicate Modal */}
      {showDuplicateModal && (
        <DuplicatePlaceModal
          existingPlace={duplicatePlace}
          onClose={() => setShowDuplicateModal(false)}
          onViewPlace={handleViewExistingPlace}
        />
      )}

      {/* Container Form Chính: Mobile Fullscreen, Desktop Floating Card */}
      <div className="fixed top-0 md:top-20 right-0 md:right-6 left-0 md:left-auto bottom-0 md:bottom-auto z-[999] w-full md:w-[400px] h-full md:h-auto max-h-full md:max-h-[calc(100vh-120px)] bg-white rounded-none md:rounded-2xl shadow-2xl flex flex-col border border-gray-100 overflow-hidden transition-all duration-300 ease-out animate-in slide-in-from-bottom-10 md:slide-in-from-right-10">
        
        {/* Close Button UI optimized for fingers */}
        <button 
          type="button" 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-[1000] focus:outline-none"
          aria-label="Close form"
        >
          <X size={20} />
        </button>

        <form onSubmit={handleSubmit} className="p-5 md:p-6 overflow-y-auto space-y-4 text-sm text-gray-700 h-full custom-scrollbar pb-12 md:pb-6">
          
          <div className="pb-1 mt-2 md:mt-0">
            <h2 className="text-lg md:text-base font-bold text-gray-800">Register Place</h2>
          </div>

          {/* Place Name */}
          <div>
            <label className="block font-medium text-gray-700 mb-1.5">
              Place Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. Highlands Coffee"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 md:p-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          {/* Category Grid - 2 cols on mobile and desktop */}
          <div>
            <label className="block font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-[160px] md:max-h-none overflow-y-auto pr-1 md:pr-0">
              {CATEGORIES.map((cat) => {
                const isSelected = formData.category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`flex items-center gap-2 p-2.5 md:p-2 rounded-xl border text-left transition-all ${
                      isSelected 
                        ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20 font-semibold" 
                        : "border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    {/* Hiển thị icon hoặc emoji tùy theo category */}
                    <div 
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-white"
                      style={{ backgroundColor: cat.bgColor }}
                    >
                      {cat.icon ? (
                        <img src={cat.icon} alt={cat.name} className="w-4 h-4 object-contain" />
                      ) : (
                        <span className="text-sm">{cat.emoji}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-700 truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Address */}
          <div className="relative" ref={suggestionRef}>
            <label className="block font-medium text-gray-700 mb-1.5">
              Search Address <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 md:py-2.5 focus-within:border-blue-500 focus-within:bg-white transition-all">
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

            {/* Dropdown gợi ý địa chỉ */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-2xl max-h-[180px] overflow-y-auto z-50">
                {suggestions.map((item) => (
                  <div
                    key={item.place_id}
                    onClick={() => handleSelectSuggestion(item)}
                    className="flex items-start gap-2.5 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none"
                  >
                    <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                    <div className="overflow-hidden">
                      <p className="font-medium text-gray-800 truncate text-xs md:text-sm">
                        {item.structured_formatting?.main_text || item.description}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {item.structured_formatting?.secondary_text || item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* City */}
          <div>
            <label className="block font-medium text-gray-700 mb-1.5">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="city"
              required
              placeholder="e.g. Ho Chi Minh City"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 md:p-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              value={formData.city}
              onChange={handleChange}
            />
          </div>

          {/* Latitude & Longitude */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 mb-1.5">Latitude</label>
              <input
                type="number"
                step="any"
                name="latitude"
                required
                disabled
                className="w-full bg-gray-100 border border-gray-150 rounded-xl p-3 md:p-2.5 text-xs text-gray-400 cursor-not-allowed select-none"
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
                className="w-full bg-gray-100 border border-gray-150 rounded-xl p-3 md:p-2.5 text-xs text-gray-400 cursor-not-allowed select-none"
                value={formData.longitude}
              />
            </div>
          </div>

          {/* Price Level */}
          <div>
            <label className="block font-medium text-gray-700 mb-1.5">Price Level</label>
            <select
              name="price_level"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 md:p-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white cursor-pointer transition-all"
              value={formData.price_level}
              onChange={handleChange}
            >
              <option value={1}>1 - Budget</option>
              <option value={2}>2 - Moderate</option>
              <option value={3}>3 - Expensive</option>
              <option value={4}>4 - Ultra Luxe</option>
            </select>
          </div>

          {/* Place Image */}
          <div>
            <label className="block font-medium text-gray-700 mb-1.5">
              Place Image
            </label>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="cursor-pointer
              w-full
              bg-gray-50
              border
              border-gray-200
              rounded-xl
              p-3
              hover:border-blue-500
              hover:bg-blue-50
              transition"
            />

            <p className="text-xs text-gray-400 mt-1">
            Max 3 images • Max 5MB each
            </p>

            {imagePreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {imagePreviews.map((preview, index) => (
                <div
                  key={index}
                  className="relative"
                >
                  <img
                    src={preview}
                    className="w-full h-28 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveImage(index)
                    }
                    className="absolute top-1 right-1 text-white bg-black/40 hover:bg-black/70 rounded p-0.5 cursor-pointer transition-all"
                    aria-label="Remove image"
                  >
                    <X size={11} strokeWidth={3}/>
                  </button>
                </div>
              ))}
            </div>
          )}
          </div>
          {/* Description */}
          <div>
            <label className="block font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              name="description"
              rows={3}
              placeholder="Write some notes or details about this place..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 md:p-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white resize-none transition-all"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-[#1b5e20] hover:bg-[#2e7d32] text-white font-bold p-3.5 md:p-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all disabled:bg-[#a5d6a7] disabled:cursor-not-allowed text-sm"
          >
            <span>{loading ? "Registering place..." : "Register Place"}</span>
          </button>
        </form>
      </div>
    </>
  );
}
