import { useState, useEffect, useRef } from "react";
import { X, MapPin, Edit3, Star, Copy, Image as ImageIcon, Search } from "lucide-react";
import { supabase } from "../../auth/api/supabaseClient";
import { useToast } from "../../../shared/ui/Toast";
import { useAuth } from "../../auth/context/AuthContext";

// Component hiển thị chi tiết place theo design mockup
export default function PlaceDetailModal({ place, onClose, onStatusUpdated, apiKey }) {
  const { user } = useAuth();
  const { showToast, ToastComponent } = useToast();
  
  const [showEditForm, setShowEditForm] = useState(false); // Toggle edit form
  const [updating, setUpdating] = useState(false);
  const [editImages, setEditImages] = useState([]); // Edit image
  const [newImageFiles, setNewImageFiles] = useState([]); // Add new image if it is deleted

  const MAX_IMAGE_COUNT = 3;
  const MAX_IMAGE_SIZE_MB = 5;
  const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
  
  // THÊM: Form data cho edit
  const [editData, setEditData] = useState({
    name: place?.name || "",
    description: place?.description || "",
    address: place?.address || "",
    latitude: place?.latitude || "",
    longitude: place?.longitude || "",
    price_level: place?.price_level || 1,
    business_status: place?.business_status || "open",
  });

  // THÊM: Address search state
  const [addressQuery, setAddressQuery] = useState(place?.address || "");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef(null);
  // Load images of current place
  const [placeImages, setPlaceImages] = useState([]);
  

  if (!place) return null;

  useEffect(() => {
  if (!place?.id) return;
  const loadImages = async () => {

      const { data, error } =
        await supabase
          .from("place_images")
          .select("id, url, sort_order")
          .eq("place_id", String(place.id))
          .order("sort_order", { ascending: true });

      if (error) {
        console.error(error.message);
        return;
      }

      setPlaceImages(data || []);

    
      setEditImages(data || []);
    };

  loadImages();
}, [place?.id]);

  // Kiểm tra xem user có phải là người tạo place không
  // So sánh cả 2 kiểu (string và number)
  const isOwner = user && place.created_by && (
    user.id === place.created_by || 
    String(user.id) === String(place.created_by)
  );

  // Map category ID sang label + màu
  const getCategoryConfig = (categoryId) => {
    const categoryMap = {
      restaurant: { label: "Restaurant", color: "#F97316" },
      bar: { label: "Bar", color: "#a855f7" },
      beverage: { label: "Beverage", color: "#8b5cf6" },
      sight: { label: "Sight", color: "#3b82f6" },
      entertainment: { label: "Entertainment", color: "#ec4899" },
      team_event: { label: "Team Event", color: "#10b981" }
    };
    return categoryMap[categoryId?.toLowerCase()] || { label: categoryId, color: "#6b7280" };
  };

  // Map price level sang label đầy đủ
  const getPriceLabel = (level) => {
    const priceMap = {
      1: "Budget ($)",
      2: "Moderate ($$)",
      3: "Expensive ($$$)",
      4: "Ultra Luxe ($$$$)"
    };
    return priceMap[level] || "N/A";
  };

  // Map business status sang badge
  const getStatusConfig = (status) => {
    const statusMap = {
      open: { label: "Open now", color: "text-emerald-600", dot: "bg-emerald-600" },
      temporarily_closed: { label: "Temporarily Closed", color: "text-amber-600", dot: "bg-amber-600" },
      closed: { label: "Permanently Closed", color: "text-red-600", dot: "bg-red-600" }
    };
    return statusMap[status] || statusMap.open;
  };

  const categoryConfig = getCategoryConfig(place.category);
  const statusConfig = getStatusConfig(editData.business_status);

  // Copy địa chỉ vào clipboard
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(place.address);
    showToast("Address copied to clipboard!", "success");
  };

  // THÊM: Address autocomplete
  useEffect(() => {
    if (addressQuery.trim().length < 2 || !showEditForm) {
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
        });
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [addressQuery, apiKey, showEditForm]);

  // THÊM: Close suggestions on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // THÊM: Handle select suggestion
  const handleSelectSuggestion = (prediction) => {
    setAddressQuery(prediction.description);
    setShowSuggestions(false);

    fetch(`https://maps.track-asia.com/api/v2/place/details/json?place_id=${prediction.place_id}&key=${apiKey}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.result && data.result.geometry) {
          const loc = data.result.geometry.location;
          setEditData(prev => ({
            ...prev,
            address: data.result.formatted_address || prediction.description,
            latitude: Number(loc.lat),
            longitude: Number(loc.lng),
          }));
        }
      })
      .catch((err) => console.error("Place details error:", err));
  };
  // Edit images when user edit place ( add or delete)
  const handleEditImageChange = (e) => {
  const files = Array.from(e.target.files);

  if (!files.length) return;
  if (editImages.length + files.length > MAX_IMAGE_COUNT) {
    showToast(`Maximum ${MAX_IMAGE_COUNT} images allowed`, "warning");
    e.target.value = "";
    return;
  }
  const validImages = [];
  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      showToast("Only image files are allowed", "warning");
      continue;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      showToast(`Each image must be under ${MAX_IMAGE_SIZE_MB}MB`, "warning");
      continue;
    }

    validImages.push({
      id: `new-${crypto.randomUUID()}`,
      url: URL.createObjectURL(file),
      file,
      isNew: true,
    });
  }
  setEditImages((prev) => [...prev, ...validImages]);
  e.target.value = "";
};

const handleRemoveEditImage = async (image) => {
  setEditImages((prev) =>
    prev.filter((img) => img.url !== image.url)
  );
  if (image.isNew) {
    URL.revokeObjectURL(image.url);
    return;
  }

  const { error } = await supabase
    .from("place_images")
    .delete()
    .eq("url", image.url)
    .eq("place_id", String(place.id));
  if (error) {
    showToast(`Failed to remove image: ${error.message}`, "error");
    return;
  }
  showToast("Image removed", "success");
};

  // THÊM: Handle update place
  const handleUpdatePlace = async () => {
    if (!isOwner) {
      showToast("You don't have permission to edit this place", "error");
      return;
    }

    // Validation
    if (!editData.name.trim()) {
      showToast("Place name is required", "warning");
      return;
    }

    if (editData.name.trim().length < 3) {
      showToast("Place name must be at least 3 characters", "warning");
      return;
    }

    setUpdating(true);

    try {
      const { error } = await supabase
        .from("places")
        .update({
          name: editData.name,
          description: editData.description,
          address: editData.address,
          latitude: Number(editData.latitude),
          longitude: Number(editData.longitude),
          price_level: Number(editData.price_level),
          business_status: editData.business_status,
        })
        .eq("id", place.id);

      if (error) throw error;
        // Upload new images in edit place
        const newImages = editImages.filter((img) => img.isNew);
        if (newImages.length > 0) {
          const uploadedRows = [];

        for (let i = 0; i < newImages.length; i++) {
          const file = newImages[i].file;

          const fileExt = file.name.split(".").pop();
          const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
          const filePath = `places/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("place-images")
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data } = supabase.storage
            .from("place-images")
            .getPublicUrl(filePath);

          uploadedRows.push({
            place_id: String(place.id),
            url: data.publicUrl,
            sort_order: editImages.length - newImages.length + i + 1,
          });
        }

        const { error: imageInsertError } = await supabase
          .from("place_images")
          .insert(uploadedRows);

        if (imageInsertError) throw imageInsertError;
      }

      showToast("Place updated successfully!", "success");
      setShowEditForm(false);
      
      if (onStatusUpdated) onStatusUpdated();
      
      setTimeout(() => {
        onClose();
      }, 1000);

    } catch (error) {
      console.error("Update place error:", error);
      showToast(`Failed to update place: ${error.message}`, "error");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      {/* Toast Component */}
      {ToastComponent}

      {/* Overlay */}
      <div 
        className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-[9999] overflow-y-auto pointer-events-none">
        <div className="min-h-full flex items-start md:items-center justify-center p-0 md:p-4">
          <div 
            className="bg-white w-full md:max-w-3xl md:rounded-2xl shadow-2xl pointer-events-auto animate-in slide-in-from-bottom md:zoom-in-95 duration-200 max-h-screen overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="fixed md:absolute top-4 right-4 z-10 p-2 bg-white md:bg-white/90 hover:bg-gray-100 rounded-full shadow-lg transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-gray-700" />
            </button>

            {/* Content */}
            <div className="pb-6">
              
              {/* Place Info Header */}
              <div className="px-6 pt-6 pb-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 pr-12">{place.name}</h1>

                    {/* Images uploaded */}
                    {placeImages.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                        {placeImages.map((image, index) => (
                          <div
                            key={index}
                            className="rounded-xl overflow-hidden border border-gray-200"
                          >
                            <img
                            src={image.url}
                            alt={`${place.name} ${index + 1}`}
                            onClick={() => setSelectedImage(image.url)}
                            className="w-full h-40 object-cover cursor-pointer hover:opacity-90"
                            />
                          </div>
                        ))}

                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                        <div className="text-center">
                          <ImageIcon size={32} className="mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500 font-medium">Place images</p>
                          <p className="text-xs text-gray-400">No image uploaded</p>
                        </div>
                      </div>
                    )}
                <hr className="border-gray-200" />
                
                {/* Badges Row */}
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  <span
                    className="text-sm px-3 py-1 rounded-full font-medium"
                    style={{ 
                      backgroundColor: `${categoryConfig.color}20`, 
                      color: categoryConfig.color 
                    }}
                  >
                    {categoryConfig.label}
                  </span>

                  <span className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                    {getPriceLabel(place.price_level)}
                  </span>

                  {place.distanceText && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPin size={16} />
                      <span className="text-sm">{place.distanceText}</span>
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center gap-3 mt-3 text-sm">
                  <div className={`flex items-center gap-1.5 ${statusConfig.color}`}>
                    <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
                    <span className="font-medium">{statusConfig.label}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 px-6 pb-4">
                {isOwner && (
                  <button
                    onClick={() => setShowEditForm(true)}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm"
                  >
                    <Edit3 size={16} />
                    Edit Place
                  </button>
                )}
              </div>

              {/* About Section */}
              <div className="px-6 py-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">About this place</h2>
                <p className="text-gray-600 leading-relaxed">
                  {place.description || "No description available."}
                </p>
              </div>

              <hr className="border-gray-200" />

              {/* Location Section */}
              <div className="px-6 py-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Location</h2>
                
                <p className="text-gray-600 mb-3">{place.address}</p>
                
                <button 
                  onClick={handleCopyAddress}
                  className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1.5"
                >
                  <Copy size={14} />
                  Copy address
                </button>
              </div>

              {/* Suggested By */}
              {place.created_by_email && (
                <>
                  <hr className="border-gray-200" />
                  <div className="px-6 py-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-3">Suggested by</h2>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold text-sm">
                        {place.created_by_email.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-700 font-medium">{place.created_by_email}</span>
                    </div>
                  </div>
                </>
              )}

              {/* Reviews Section Placeholder */}
              <hr className="border-gray-200" />
              <div className="px-6 py-6">
                <div className="text-center py-8 text-gray-400">
                  <Star size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Reviews & ratings coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Place Form Modal */}
      {showEditForm && (
        <div className="fixed inset-0 z-[10000] overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <h3 className="text-lg font-bold text-gray-800">Edit Place</h3>
                <button onClick={() => setShowEditForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5 text-sm">
                    Place Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>

                {/* Address Search */}
                <div className="relative" ref={suggestionRef}>
                  <label className="block font-medium text-gray-700 mb-1.5 text-sm">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white transition-all">
                    <Search size={16} className="text-gray-400 mr-2 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search address..."
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
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-2xl max-h-[180px] overflow-y-auto z-50">
                      {suggestions.map((item) => (
                        <div
                          key={item.place_id}
                          onClick={() => handleSelectSuggestion(item)}
                          className="flex items-start gap-2.5 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none"
                        >
                          <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                          <div className="overflow-hidden">
                            <p className="font-medium text-gray-800 truncate text-xs">
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

                {/* Coordinates (Read-only) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1.5 text-sm">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      disabled
                      value={editData.latitude}
                      className="w-full bg-gray-100 border border-gray-150 rounded-xl p-2.5 text-xs text-gray-400 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-1.5 text-sm">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      disabled
                      value={editData.longitude}
                      className="w-full bg-gray-100 border border-gray-150 rounded-xl p-2.5 text-xs text-gray-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Price Level */}
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5 text-sm">Price Level</label>
                  <select
                    value={editData.price_level}
                    onChange={(e) => setEditData(prev => ({ ...prev, price_level: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white cursor-pointer transition-all"
                  >
                    <option value={1}>Budget ($)</option>
                    <option value={2}>Moderate ($$)</option>
                    <option value={3}>Expensive ($$$)</option>
                    <option value={4}>Ultra Luxe ($$$$)</option>
                  </select>
                </div>

                {/* Business Status */}
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5 text-sm">Business Status</label>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setEditData(prev => ({ ...prev, business_status: "open" }))}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        editData.business_status === "open"
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <span className="text-xl"></span>
                      <span className={`font-semibold text-sm ${editData.business_status === "open" ? "text-emerald-800" : "text-gray-700"}`}>
                        Open
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditData(prev => ({ ...prev, business_status: "temporarily_closed" }))}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        editData.business_status === "temporarily_closed"
                          ? "border-amber-500 bg-amber-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <span className="text-xl"></span>
                      <span className={`font-semibold text-sm ${editData.business_status === "temporarily_closed" ? "text-amber-800" : "text-gray-700"}`}>
                        Temporarily Closed
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditData(prev => ({ ...prev, business_status: "closed" }))}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        editData.business_status === "closed"
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <span className="text-xl"></span>
                      <span className={`font-semibold text-sm ${editData.business_status === "closed" ? "text-red-800" : "text-gray-700"}`}>
                        Permanently Closed
                      </span>
                    </button>
                  </div>
                </div>

                {/* Edit image */}
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5 text-sm">
                    Place Images
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleEditImageChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm"
                  />

                  <p className="text-xs text-gray-400 mt-1">
                    Max 3 images • Max 5MB each
                  </p>

                  {editImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {editImages.map((image) => (
                        <div key={image.id || image.url} className="relative">
                          <img
                            src={image.url}
                            alt="Place"
                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                          />

                          <button
                            type="button"
                            onClick={() => handleRemoveEditImage(image)}
                            className="absolute top-1 right-1 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5 text-sm">Description</label>
                  <textarea
                    rows={3}
                    value={editData.description}
                    onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Write some notes or details about this place..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white resize-none transition-all"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex gap-3">
                <button
                  onClick={() => setShowEditForm(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePlace}
                  disabled={updating}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  {updating ? "Updating..." : "Update Place"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}