import { useState, useEffect, useRef } from "react";
import { X, MapPin, Edit3, Star, Copy, Image as ImageIcon, Search, MoreVertical, Trash2 } from "lucide-react";
import { supabase } from "../../auth/api/supabaseClient";
import { useToast } from "../../../shared/ui/Toast";
import { fetchReviewsByPlace } from "../api/reviewApi";
import { validateFloorLevel } from "../utils/floorLevelValidation";
import { checkDuplicatePlace, checkBuildingDuplicate, checkAddressForBuilding } from "../utils/duplicateDetection";
import DuplicatePlaceModal from "./DuplicatePlaceModal";

export default function PlaceDetailModal({ 
  place, 
  onClose, 
  onStatusUpdated, 
  apiKey, 
  openedFromBuilding = null, 
  onBackToBuilding = null,
  onDuplicateViewPlace = null
}) {
  const { showToast, ToastComponent } = useToast();
  
  const [showEditForm, setShowEditForm] = useState(false); // Toggle View ↔ Edit mode
  const [updating, setUpdating] = useState(false);
  const [editImages, setEditImages] = useState([]);
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false); // Dropdown 3 chấm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Modal xác nhận xóa
  const [deleting, setDeleting] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null); //Images popup
  const [duplicatePlace, setDuplicatePlace] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  // REVIEW STATE
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [displayedReviews, setDisplayedReviews] = useState(5);
  const [sortBy, setSortBy] = useState("time"); // "time" or "rating"
  const [sortOrder, setSortOrder] = useState("desc"); // "desc" or "asc"
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showRatingDropdown, setShowRatingDropdown] = useState(false);

  const MAX_IMAGE_COUNT = 3;
  const MAX_IMAGE_SIZE_MB = 5;
  const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

  const MAX_REVIEW_IMAGE_COUNT = 3;
  const MAX_REVIEW_IMAGE_SIZE_MB = 5;
  const MAX_REVIEW_IMAGE_SIZE_BYTES = MAX_REVIEW_IMAGE_SIZE_MB * 1024 * 1024;
  
  const [editData, setEditData] = useState({
    name: place?.name || "",
    description: place?.description || "",
    address: place?.address || "",
    latitude: place?.latitude || "",
    longitude: place?.longitude || "",
    price_level: place?.price_level || 1,
    business_status: place?.business_status || "open",
    floor_level: place?.floor_level ? String(place.floor_level) : "1",
    category: place?.category || "restaurant",
  });

  const [floorLevelError, setFloorLevelError] = useState(null);
  const [addressQuery, setAddressQuery] = useState(place?.address || "");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef(null);
  const dropdownRef = useRef(null);
  const timeDropdownRef = useRef(null);
  const ratingDropdownRef = useRef(null);
  const [placeImages, setPlaceImages] = useState([]);

  if (!place) return null;

  useEffect(() => {
    if (!place?.id) return;
    const loadImages = async () => {
      const { data, error } = await supabase
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

  // LOAD REVIEWS WHEN MODAL OPENS 
  useEffect(() => {
    let mounted = true;
    
    const loadReviews = async () => {
      if (!place?.id) return;
      
      setReviewsLoading(true);
      const { data, error } = await fetchReviewsByPlace(place.id);
      
      if (!mounted) return;
      
      if (error) {
        console.error("Failed to load reviews:", error);
        showToast("Unable to load reviews", "error");
      } else {
        setReviews(data || []);
        // ✅ KHÔNG TỰ ĐỘNG ĐIỀN FORM - Chỉ load reviews
      }
      
      setReviewsLoading(false);
    };
    
    loadReviews();
    
    return () => { mounted = false; };
  }, [place?.id]);

  // Close dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowOptionsDropdown(false);
      }
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(event.target)) {
        setShowTimeDropdown(false);
      }
      if (ratingDropdownRef.current && !ratingDropdownRef.current.contains(event.target)) {
        setShowRatingDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isOwner = true;

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

  const getPriceLabel = (level) => {
    const priceMap = {
      1: "Budget ($)",
      2: "Moderate ($$)",
      3: "Expensive ($$$)",
      4: "Ultra Luxe ($$$$)"
    };
    return priceMap[level] || "N/A";
  };

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

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(place.address);
    showToast("Address copied to clipboard!", "success");
  };

  const handleViewExistingDuplicate = (existingPlace) => {
    setShowDuplicateModal(false);
    setShowEditForm(false);

    if (onDuplicateViewPlace) {
      onDuplicateViewPlace({
        ...existingPlace,
        latitude: Number(existingPlace.latitude),
        longitude: Number(existingPlace.longitude),
      });
    }
  };
  
  const handleFloorLevelChange = (e) => {
    const value = e.target.value.toUpperCase();
    
    if (value === "") {
      setEditData(prev => ({ ...prev, floor_level: "" }));
      setFloorLevelError(null);
      return;
    }

    if (value.length > 2) return;

    setEditData(prev => ({ ...prev, floor_level: value }));

    const validation = validateFloorLevel(value);
    if (!validation.isValid) {
      setFloorLevelError(validation.error);
    } else {
      setFloorLevelError(null);
    }
  };

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
    // Remove from edit UI immediately
    setEditImages((prev) =>
      prev.filter((img) => img.url !== image.url)
    );

    // Remove from view mode images immediately
    setPlaceImages((prev) =>
      prev.filter((img) => img.url !== image.url)
    );

    // If image is newly selected but not uploaded yet
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
    
  const handleUpdatePlace = async () => {
    if (!editData.name.trim()) {
      showToast("Place name is required", "warning");
      return;
    }

    if (editData.name.trim().length < 3) {
      showToast("Place name must be at least 3 characters", "warning");
      return;
    }

    // Validate floor level if building
    if (place.place_type === "building") {
      const floorValidation = validateFloorLevel(editData.floor_level);
      if (!floorValidation.isValid) {
        showToast(floorValidation.error, "warning");
        return;
      }
    }

    setUpdating(true);

    try {
      const { data: otherPlaces, error: otherPlacesError } = await supabase
        .from("places")
        .select("*")
        .neq("id", place.id);

      if (otherPlacesError) throw otherPlacesError;

      const candidatePlace = {
        name: editData.name,
        address: editData.address,
        latitude: Number(editData.latitude),
        longitude: Number(editData.longitude),
      };

      // 1. Check duplicate với standalone places khác
      const directDuplicate = await checkDuplicatePlace(candidatePlace, otherPlaces || []);
      if (directDuplicate) {
        setDuplicatePlace(directDuplicate);
        setShowDuplicateModal(true);
        setUpdating(false);
        return;
      }

      // 2. Nếu đây là building place → check duplicate bên trong building
      if (place.place_type === "building") {
        const proposedBuildingAddress = editData.address;

        const buildingPlaces = (otherPlaces || []).filter(
          (p) =>
            p.place_type === "building" &&
            (p.building_address || p.address) === proposedBuildingAddress
        );

        const buildingDuplicate = checkBuildingDuplicate(
          {
            name: editData.name,
            floor_level: editData.floor_level,
          },
          buildingPlaces
        );

        if (buildingDuplicate) {
          setDuplicatePlace(buildingDuplicate);
          setShowDuplicateModal(true);
          setUpdating(false);
          return;
        }
      } else {
        // 3. Nếu standalone mà đổi địa chỉ sang address của 1 building đã tồn tại → block
        const existingBuilding = await checkAddressForBuilding(candidatePlace, otherPlaces || []);
        if (existingBuilding) {
          showToast(
            "This address is already registered as a building. Please update the building records instead.",
            "warning"
          );
          setUpdating(false);
          return;
        }
      }

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
          category: editData.category,
          ...(place.place_type === "building" && {
            floor_level: validateFloorLevel(editData.floor_level).normalized,
          }),
        })
        .eq("id", place.id);

      if (error) throw error;

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

        const { data: insertedImages, error: imageInsertError } = await supabase
          .from("place_images")
          .insert(uploadedRows)
          .select("id, url, sort_order");

        if (imageInsertError) throw imageInsertError;

        setPlaceImages((prev) => [...prev, ...(insertedImages || [])]);

        setEditImages((prev) => [
          ...prev.filter((img) => !img.isNew),
          ...(insertedImages || []),
        ]);
      }

      showToast("Place updated successfully!", "success");
      
      // Pass updated place data back so the modal reflects changes immediately
      const updatedPlace = {
        ...place,
        name: editData.name,
        description: editData.description,
        address: editData.address,
        latitude: Number(editData.latitude),
        longitude: Number(editData.longitude),
        price_level: Number(editData.price_level),
        business_status: editData.business_status,
        category: editData.category,
        ...(place.place_type === "building" && {
          floor_level: validateFloorLevel(editData.floor_level).normalized,
        }),
      };
      if (onStatusUpdated) onStatusUpdated(updatedPlace);

      // Return to view mode so user sees updated details immediately
      setShowEditForm(false);


    } catch (error) {
      console.error("Update place error:", error);
      showToast(`Failed to update place: ${error.message}`, "error");
    } finally {
      setUpdating(false);
    }
  };

  // ===== TASK 1: DELETE PLACE =====
  const handleDeletePlace = async () => {
    setDeleting(true);

    try {
      // Step 1: Xóa tất cả images
      const { error: imageDeleteError } = await supabase
        .from("place_images")
        .delete()
        .eq("place_id", String(place.id));

      if (imageDeleteError) throw imageDeleteError;

      // Step 2: Xóa tất cả reviews (nếu có)
      const { error: reviewDeleteError } = await supabase
        .from("reviews")
        .delete()
        .eq("place_id", String(place.id));

      if (reviewDeleteError) throw reviewDeleteError;

      // Step 3: Xóa place
      const { error: placeDeleteError } = await supabase
        .from("places")
        .delete()
        .eq("id", place.id);

      if (placeDeleteError) throw placeDeleteError;

      showToast("Place deleted successfully!", "success");
      
      if (onStatusUpdated) onStatusUpdated(); // Refresh map
      
      setTimeout(() => {
        onClose(); // Đóng modal
      }, 1000);

    } catch (error) {
      console.error("Delete place error:", error);
      showToast(`Failed to delete place: ${error.message}`, "error");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Fix timestamp parsing — nếu không có timezone thì coi là UTC
  const parseReviewTimestamp = (timestamp) => {
    if (!timestamp) return new Date();
    if (typeof timestamp !== "string") return new Date(timestamp);
    const normalized = timestamp.trim();
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(normalized)) {
      return new Date(`${normalized}Z`);
    }
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(normalized)) {
      return new Date(`${normalized.replace(" ", "T")}Z`);
    }
    return new Date(normalized);
  };

  // Handler chọn sort time từ dropdown
  const handleSelectTime = (order) => {
    setSortBy("time");
    setSortOrder(order);
    setShowTimeDropdown(false);
  };

  // Handler chọn sort rating từ dropdown
  const handleSelectRating = (order) => {
    setSortBy("rating");
    setSortOrder(order);
    setShowRatingDropdown(false);
  };

  const getSortedReviews = () => {
    let sorted = [...reviews];
    
    if (sortBy === "time") {
      sorted.sort((a, b) => {
        const dateA = parseReviewTimestamp(a.created_at); 
        const dateB = parseReviewTimestamp(b.created_at); 
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      });
    } else if (sortBy === "rating") {
      sorted.sort((a, b) => {
        return sortOrder === "desc" ? b.rating - a.rating : a.rating - b.rating;
      });
    }
    
    return sorted.slice(0, displayedReviews);
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + Number(r.rating), 0);
    return (sum / reviews.length).toFixed(1);
  };

  const toggleSort = (type) => {
    if (sortBy === type) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(type);
      setSortOrder("desc");
    }
  };

  return (
    <>
      {ToastComponent}

      {showDuplicateModal && duplicatePlace && (
        <DuplicatePlaceModal
          existingPlace={duplicatePlace}
          onClose={() => setShowDuplicateModal(false)}
          onViewPlace={handleViewExistingDuplicate}
        />
      )}

      {/* Main Container - Giống Register Form */}
      <div className="fixed top-0 md:top-20 right-0 md:right-6 left-0 md:left-auto bottom-0 md:bottom-auto z-[999] w-full md:w-[400px] h-full md:h-auto max-h-full md:max-h-[calc(100vh-120px)] bg-white rounded-none md:rounded-2xl shadow-2xl flex flex-col border border-gray-100 overflow-hidden transition-all duration-300 ease-out animate-in slide-in-from-bottom-10 md:slide-in-from-right-10">
        
        {/* Header Bar - Fixed */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <div className="flex-1 min-w-0">
            {/* Back to Building button */}
            {!showEditForm && openedFromBuilding && onBackToBuilding && (
              <button
                onClick={onBackToBuilding}
                className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1 mb-1"
              >
                ← Back to Building
              </button>
            )}
            <h2 className="text-base font-bold text-gray-800">
              {showEditForm ? "Edit Place" : "Place Details"}
            </h2>
            {!showEditForm && (
              <p className="text-xs text-blue-600 font-medium mt-0.5">Admin View — Full Access</p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* ===== 3 CHẤM DROPDOWN (chỉ hiện khi View mode + isOwner) ===== */}
            {!showEditForm && isOwner && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
                  className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="Options"
                >
                  <MoreVertical size={20} />
                </button>

                {showOptionsDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <button
                      onClick={() => {
                        setShowEditForm(true);
                        setShowOptionsDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                    >
                      <Edit3 size={16} className="text-gray-400" />
                      <span>Edit Place</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(true);
                        setShowOptionsDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <Trash2 size={16} />
                      <span>Delete Place</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Close Button X */}
            <button
              onClick={onClose}
              className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ===== VIEW MODE: Place Detail Info ===== */}
        {!showEditForm && (
          <div className="p-5 md:p-6 overflow-y-auto space-y-4 text-sm text-gray-700 h-full custom-scrollbar pb-12 md:pb-6">
            
            {/* Place Name */}
            <div className="pb-4">
              <h1 className="text-2xl md:text-xl font-bold text-gray-900">{place.name}</h1>

              {/* Images */}
              {placeImages.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                  {placeImages.map((image, index) => (
                    <div key={index} className="rounded-xl overflow-hidden border border-gray-200">
                      <img
                        src={image.url}
                        alt="Place"
                        onClick={() => setSelectedImageIndex(index)}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 mt-4">
                  <div className="text-center">
                    <ImageIcon size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 font-medium">No images</p>
                  </div>
                </div>
              )}

              <hr className="border-gray-200 mt-4" />
              
              {/* Badges */}
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

            {/* About */}
            <div className="py-4">
              <h2 className="text-lg font-bold text-gray-900 mb-3">About this place</h2>
              <p className="text-gray-600 leading-relaxed">
                {place.description || "No description available."}
              </p>
            </div>

            <hr className="border-gray-200" />

            {/* Location */}
            <div className="py-4">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Location</h2>
              
              {/* ✅ Hiển thị building info nếu có */}
              {place.place_type === "building" && place.building_name ? (
                <>
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    Level {place.floor_level}, {place.building_name}
                  </p>
                  <p className="text-sm text-gray-600 mb-3">{place.address}</p>
                </>
              ) : (
                <p className="text-gray-600 mb-3">{place.address}</p>
              )}
              
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
                <div className="py-4">
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


            {/* REVIEWS SECTION */}
            <hr className="border-gray-200" />
            <div className="py-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Reviews</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {reviews.length} review{reviews.length !== 1 ? "s" : ""} • ⭐ {getAverageRating()} average
                  </p>
                </div>
              </div>

              {/* Sort Dropdowns */}
              <div className="flex gap-2 mb-4">
                {/* Time sort dropdown */}
                <div className="relative" ref={timeDropdownRef}>
                  <button
                    onClick={() => setShowTimeDropdown(s => !s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      sortBy === "time"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Time: {sortBy === "time" ? (sortOrder === "desc" ? "Newest" : "Oldest") : "Time"} ▼
                  </button>

                  {showTimeDropdown && (
                    <div className="absolute left-0 mt-2 w-40 bg-white border border-gray-100 rounded-xl shadow-xl py-1 z-50">
                      <button
                        onClick={() => handleSelectTime("desc")}
                        className={`w-full text-left px-4 py-2 text-sm ${
                          sortBy === "time" && sortOrder === "desc"
                            ? "text-blue-600 font-semibold"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Newest
                      </button>
                      <button
                        onClick={() => handleSelectTime("asc")}
                        className={`w-full text-left px-4 py-2 text-sm ${
                          sortBy === "time" && sortOrder === "asc"
                            ? "text-blue-600 font-semibold"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Oldest
                      </button>
                    </div>
                  )}
                </div>

                {/* Rating sort dropdown */}
                <div className="relative" ref={ratingDropdownRef}>
                  <button
                    onClick={() => setShowRatingDropdown(s => !s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      sortBy === "rating"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Rating: {sortBy === "rating" ? (sortOrder === "desc" ? "Highest" : "Lowest") : "Rating"} ▼
                  </button>

                  {showRatingDropdown && (
                    <div className="absolute left-0 mt-2 w-40 bg-white border border-gray-100 rounded-xl shadow-xl py-1 z-50">
                      <button
                        onClick={() => handleSelectRating("desc")}
                        className={`w-full text-left px-4 py-2 text-sm ${
                          sortBy === "rating" && sortOrder === "desc"
                            ? "text-blue-600 font-semibold"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Highest
                      </button>
                      <button
                        onClick={() => handleSelectRating("asc")}
                        className={`w-full text-left px-4 py-2 text-sm ${
                          sortBy === "rating" && sortOrder === "asc"
                            ? "text-blue-600 font-semibold"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Lowest
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ===== COMMENT CONTAINER (SCROLL RIÊNG) ===== */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-6 max-h-[300px] overflow-y-auto">
                {reviewsLoading ? (
                  <p className="text-sm text-gray-500 text-center py-4">Loading reviews...</p>
                ) : reviews.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">This place has no reviews yet</p>
                ) : (
                  <>
                    {getSortedReviews().map((review) => {
                      
                      return (
                        <div key={review.id} className="bg-white rounded-lg p-4 mb-3 last:mb-0 border border-gray-100">
                          {/* User info + 3-dot menu */}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                                {review.user_name?.substring(0, 2).toUpperCase() || "U"}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{review.user_name || "User"}</p>
                                <p className="text-xs text-gray-500">
                                  {parseReviewTimestamp(review.created_at).toLocaleString('vi-VN', {
                                    timeZone: 'Asia/Ho_Chi_Minh',
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false,
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Rating stars */}
                          <div className="flex items-center gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={14}
                                className={star <= review.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}
                              />
                            ))}
                            <span className="text-xs text-gray-600 ml-1">{review.rating}/5</span>
                          </div>

                          {/* Comment */}
                          {review.comment && (
                            <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                          )}
                          {/*Upload images*/}
                          {review.review_images?.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mt-3">
                              {review.review_images.map((image) => (
                                <img
                                  key={image.id}
                                  src={image.url}
                                  alt="Review"
                                  className="w-full h-20 object-cover rounded-lg border border-gray-200 cursor-pointer"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* See More button */}
                    {reviews.length > displayedReviews && (
                      <button
                        onClick={() => setDisplayedReviews(displayedReviews + 5)}
                        className="w-full py-2 mt-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        See More ({reviews.length - displayedReviews} more)
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== EDIT MODE: Edit Place Form ===== */}
        {showEditForm && (
          <div className="p-5 md:p-6 overflow-y-auto space-y-4 text-sm text-gray-700 h-full custom-scrollbar pb-12 md:pb-6">
            
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

            {/* Category */}
            <div>
              <label className="block font-medium text-gray-700 mb-1.5 text-sm">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "restaurant", name: "Restaurant", icon: "/restaurant-icon.png", bgColor: "#fb923c" },
                  { id: "bar", name: "Bar", emoji: "🍷", bgColor: "#a855f7" },
                  { id: "beverage", name: "Beverage", emoji: "☕", bgColor: "#8b5cf6" },
                  { id: "sight", name: "Sight", emoji: "👁️", bgColor: "#3b82f6" },
                  { id: "entertainment", name: "Entertainment", icon: "/park_map_icon.png", bgColor: "#ec4899" },
                  { id: "team_event", name: "Team Event", emoji: "👥", bgColor: "#10b981" }
                ].map((cat) => {
                  const isSelected = editData.category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setEditData(prev => ({ ...prev, category: cat.id }))}
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

            {/* Coordinates */}
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

            {/* Floor Level - chỉ hiện nếu place thuộc building */}
            {place.place_type === "building" && (
              <div>
                <label className="block font-medium text-gray-700 mb-1.5 text-sm">
                  Floor Level
                </label>
                <input
                  type="text"
                  maxLength={2}
                  value={editData.floor_level}
                  onChange={handleFloorLevelChange}
                  placeholder="e.g. 1, 15, B1"
                  className={`w-full bg-gray-50 border rounded-xl p-2.5 text-sm focus:outline-none transition-all uppercase ${
                    floorLevelError
                      ? "border-red-300 focus:border-red-500 bg-red-50"
                      : "border-gray-200 focus:border-blue-500 focus:bg-white"
                  }`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  eg: 01 or 1 → 99 / Basement: B1 → B3
                </p>
                {floorLevelError && (
                  <p className="text-xs text-red-600 mt-1">{floorLevelError}</p>
                )}
              </div>
            )}

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
                  <span className={`font-semibold text-sm ${editData.business_status === "closed" ? "text-red-800" : "text-gray-700"}`}>
                    Permanently Closed
                  </span>
                </button>
              </div>
            </div>

            {/* Images */}
            <div>
              <label className="block font-medium text-gray-700 mb-1.5 text-sm">
                Place Images
              </label>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleEditImageChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
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
                        className="absolute top-1 right-1 text-white bg-black/40 hover:bg-black/70 rounded p-0.5 cursor-pointer transition-all"
                        aria-label="Remove image"
                      >
                        <X size={11} strokeWidth={3} />
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

            {/* Footer Buttons (Fixed tại cuối form) */}
            <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex gap-3 -mx-6 -mb-6">
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
        )}
      </div>

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Place</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete "<strong>{place.name}</strong>"? This action cannot be undone. All images and reviews associated with this place will also be deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePlace}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:bg-red-300 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
       {/* Add pop-up images */}
      {selectedImageIndex !== null && (
      <div
        className="fixed inset-0 z-[10001] bg-black/80 flex items-center justify-center p-4"
        onClick={() => setSelectedImageIndex(null)}
      >
        <button
          type="button"
          onClick={() => setSelectedImageIndex(null)}
          className="absolute top-5 right-5 text-white bg-black/50 rounded p-2 cursor-pointer hover:bg-black"
        >
          <X size={22} />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedImageIndex((prev) =>
              prev === 0 ? editImages.length - 1 : prev - 1
            );
          }}
          className="absolute left-5 text-white text-8xl cursor-pointer"
        >
          ‹
        </button>

        <img
          src={editImages[selectedImageIndex].url}
          alt="Selected"
          className="max-w-[75vh] max-h-[70vh] rounded-xl object-contain shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedImageIndex((prev) =>
              prev === editImages.length - 1 ? 0 : prev + 1
            );
          }}
          className="absolute right-5 text-white text-8xl cursor-pointer"
        >
          ›
        </button>
      </div>
    )}
    </>
  );
}