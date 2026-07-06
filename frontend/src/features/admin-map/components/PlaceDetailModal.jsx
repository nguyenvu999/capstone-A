import { useState } from "react";
import { X, Edit3, Trash2, MoreVertical, MapPin, Copy, Star, Image as ImageIcon, Search } from "lucide-react";

// Mock reviews cho demo
const MOCK_REVIEWS = [
  {
    id: "r1",
    user_name: "john.doe",
    rating: 5,
    comment: "Amazing food and great atmosphere! Highly recommended for team events.",
    created_at: "2025-01-10T14:30:00Z",
  },
  {
    id: "r2",
    user_name: "jane.smith",
    rating: 4,
    comment: "Good place, a bit pricey but worth it for special occasions.",
    created_at: "2025-01-08T09:15:00Z",
  },
  {
    id: "r3",
    user_name: "mike.j",
    rating: 3,
    comment: "Average experience. Service could be better.",
    created_at: "2025-01-05T18:00:00Z",
  },
];

const CATEGORIES = [
  { id: "restaurant", name: "Restaurant", icon: "/restaurant-icon.png", bgColor: "#fb923c" },
  { id: "bar", name: "Bar", emoji: "🍷", bgColor: "#a855f7" },
  { id: "beverage", name: "Beverage", emoji: "☕", bgColor: "#8b5cf6" },
  { id: "sight", name: "Sight", emoji: "👁️", bgColor: "#3b82f6" },
  { id: "entertainment", name: "Entertainment", icon: "/park_map_icon.png", bgColor: "#ec4899" },
  { id: "team_event", name: "Team Event", emoji: "👥", bgColor: "#10b981" }
];

export default function PlaceDetailModal({ place, onClose, onPlaceUpdated, onPlaceDeleted, apiKey }) {
  const [showEditForm, setShowEditForm] = useState(false);
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [displayedReviews, setDisplayedReviews] = useState(5);
  const [sortBy, setSortBy] = useState("time");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showRatingDropdown, setShowRatingDropdown] = useState(false);

  // Edit form state
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

  const [addressQuery, setAddressQuery] = useState(place?.address || "");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  if (!place) return null;

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

  const categoryConfig = getCategoryConfig(showEditForm ? editData.category : place.category);
  const statusConfig = getStatusConfig(showEditForm ? editData.business_status : place.business_status);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(place.address);
    alert("Address copied to clipboard!");
  };

  const renderStars = (rating) => {
    const filledStars = Math.floor(rating);
    const hasHalfStar = rating % 1 > 0;
    let stars = "★".repeat(filledStars);
    if (hasHalfStar) stars += "☆";
    const emptyStarsNeeded = 5 - filledStars - (hasHalfStar ? 1 : 0);
    stars += "☆".repeat(emptyStarsNeeded);
    return stars;
  };

  const parseReviewTimestamp = (timestamp) => {
    if (!timestamp) return new Date();
    return new Date(timestamp);
  };

  const getSortedReviews = () => {
    let sorted = [...MOCK_REVIEWS];
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
    if (MOCK_REVIEWS.length === 0) return 0;
    const sum = MOCK_REVIEWS.reduce((acc, r) => acc + Number(r.rating), 0);
    return (sum / MOCK_REVIEWS.length).toFixed(1);
  };

  const handleUpdatePlace = () => {
    setUpdating(true);
    setTimeout(() => {
      alert(`Place "${editData.name}" updated successfully!`);
      setUpdating(false);
      setShowEditForm(false);
      if (onPlaceUpdated) onPlaceUpdated({ ...place, ...editData });
    }, 500);
  };

  const handleDeletePlace = () => {
    setDeleting(true);
    setTimeout(() => {
      alert(`Place "${place.name}" deleted successfully!`);
      setDeleting(false);
      setShowDeleteConfirm(false);
      if (onPlaceDeleted) onPlaceDeleted(place);
      onClose();
    }, 500);
  };

  const handleCategorySelect = (categoryId) => {
    setEditData(prev => ({ ...prev, category: categoryId }));
  };

  return (
    <>
      <div className="fixed top-0 md:top-20 right-0 md:right-6 left-0 md:left-auto bottom-0 md:bottom-auto z-[999] w-full md:w-[400px] h-full md:h-auto max-h-full md:max-h-[calc(100vh-120px)] bg-white rounded-none md:rounded-2xl shadow-2xl flex flex-col border border-gray-100 overflow-hidden transition-all duration-300 ease-out">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-800">
              {showEditForm ? "Edit Place" : "Place Details"}
            </h2>
            <p className="text-xs text-blue-600 font-medium mt-0.5">Admin View — Full Access</p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 3-dot menu (only in view mode) */}
            {!showEditForm && (
              <div className="relative">
                <button
                  onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
                  className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <MoreVertical size={20} />
                </button>

                {showOptionsDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl py-1 z-50">
                    <button
                      onClick={() => {
                        setShowEditForm(true);
                        setShowOptionsDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Edit3 size={16} className="text-gray-400" />
                      <span>Edit Place</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(true);
                        setShowOptionsDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      <span>Delete Place</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ===== VIEW MODE ===== */}
        {!showEditForm && (
          <div className="p-5 md:p-6 overflow-y-auto space-y-4 text-sm text-gray-700 h-full custom-scrollbar pb-12 md:pb-6">
            
            {/* Place Name */}
            <div className="pb-4">
              <h1 className="text-2xl md:text-xl font-bold text-gray-900">{place.name}</h1>

              {/* Images placeholder */}
              <div className="flex items-center justify-center h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 mt-4">
                <div className="text-center">
                  <ImageIcon size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 font-medium">No images</p>
                </div>
              </div>

              <hr className="border-gray-200 mt-4" />
              
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <span
                  className="text-sm px-3 py-1 rounded-full font-medium"
                  style={{ backgroundColor: `${categoryConfig.color}20`, color: categoryConfig.color }}
                >
                  {categoryConfig.label}
                </span>
                <span className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                  {getPriceLabel(place.price_level)}
                </span>
                {place.rating > 0 && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <MapPin size={16} />
                    <span className="text-sm">N/A</span>
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

            {/* Created By */}
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

            {/* Last Updated */}
            <hr className="border-gray-200" />
            <div className="py-4">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Last Updated</h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-semibold text-sm">
                  {(place.updated_by_email || place.created_by_email || "AD").substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-medium">
                    {place.updated_by_email || place.created_by_email || "admin@netcompany.com"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {place.updated_at 
                      ? new Date(place.updated_at).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })
                      : "Jan 10, 2025, 02:30 PM"
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <hr className="border-gray-200" />
            <div className="py-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Reviews</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {MOCK_REVIEWS.length} review{MOCK_REVIEWS.length !== 1 ? "s" : ""} • ⭐ {getAverageRating()} average
                  </p>
                </div>
              </div>

              {/* Sort Dropdowns */}
              <div className="flex gap-2 mb-4">
                <div className="relative">
                  <button
                    onClick={() => setShowTimeDropdown(s => !s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      sortBy === "time" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Time: {sortBy === "time" ? (sortOrder === "desc" ? "Newest" : "Oldest") : "Time"} ▼
                  </button>
                  {showTimeDropdown && (
                    <div className="absolute left-0 mt-2 w-40 bg-white border border-gray-100 rounded-xl shadow-xl py-1 z-50">
                      <button onClick={() => { setSortBy("time"); setSortOrder("desc"); setShowTimeDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Newest</button>
                      <button onClick={() => { setSortBy("time"); setSortOrder("asc"); setShowTimeDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Oldest</button>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowRatingDropdown(s => !s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      sortBy === "rating" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Rating: {sortBy === "rating" ? (sortOrder === "desc" ? "Highest" : "Lowest") : "Rating"} ▼
                  </button>
                  {showRatingDropdown && (
                    <div className="absolute left-0 mt-2 w-40 bg-white border border-gray-100 rounded-xl shadow-xl py-1 z-50">
                      <button onClick={() => { setSortBy("rating"); setSortOrder("desc"); setShowRatingDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Highest</button>
                      <button onClick={() => { setSortBy("rating"); setSortOrder("asc"); setShowRatingDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Lowest</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Reviews List */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-6 max-h-[300px] overflow-y-auto">
                {getSortedReviews().map((review) => (
                  <div key={review.id} className="bg-white rounded-lg p-4 mb-3 last:mb-0 border border-gray-100">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                          {review.user_name?.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{review.user_name}</p>
                          <p className="text-xs text-gray-500">
                            {parseReviewTimestamp(review.created_at).toLocaleString('vi-VN', {
                              timeZone: 'Asia/Ho_Chi_Minh',
                              day: '2-digit', month: '2-digit', year: 'numeric',
                              hour: '2-digit', minute: '2-digit', hour12: false,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={14} className={star <= review.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"} />
                      ))}
                      <span className="text-xs text-gray-600 ml-1">{review.rating}/5</span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>


          </div>
        )}

        {/* ===== EDIT MODE ===== */}
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

            {/* Category Grid */}
            <div>
              <label className="block font-medium text-gray-700 mb-2 text-sm">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = editData.category === cat.id;
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

            {/* Address */}
            <div>
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
                  onChange={(e) => setAddressQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-gray-700 mb-1.5 text-sm">Latitude</label>
                <input type="number" step="any" disabled value={editData.latitude}
                  className="w-full bg-gray-100 border border-gray-150 rounded-xl p-2.5 text-xs text-gray-400 cursor-not-allowed" />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1.5 text-sm">Longitude</label>
                <input type="number" step="any" disabled value={editData.longitude}
                  className="w-full bg-gray-100 border border-gray-150 rounded-xl p-2.5 text-xs text-gray-400 cursor-not-allowed" />
              </div>
            </div>

            {/* Floor Level (building only) */}
            {place.place_type === "building" && (
              <div>
                <label className="block font-medium text-gray-700 mb-1.5 text-sm">Floor Level</label>
                <input
                  type="text"
                  maxLength={2}
                  value={editData.floor_level}
                  onChange={(e) => setEditData(prev => ({ ...prev, floor_level: e.target.value.toUpperCase() }))}
                  placeholder="e.g. 1, 15, B1"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all uppercase"
                />
                <p className="text-xs text-gray-500 mt-1">eg: 01 or 1 → 99 / Basement: B1 → B3</p>
              </div>
            )}

            {/* Price Level */}
            <div>
              <label className="block font-medium text-gray-700 mb-1.5 text-sm">Price Level</label>
              <select
                value={editData.price_level}
                onChange={(e) => setEditData(prev => ({ ...prev, price_level: Number(e.target.value) }))}
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
                {[
                  { value: "open", label: "Open", color: "emerald" },
                  { value: "temporarily_closed", label: "Temporarily Closed", color: "amber" },
                  { value: "closed", label: "Permanently Closed", color: "red" },
                ].map(status => (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => setEditData(prev => ({ ...prev, business_status: status.value }))}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                      editData.business_status === status.value
                        ? `border-${status.color}-500 bg-${status.color}-50`
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <span className={`font-semibold text-sm ${
                      editData.business_status === status.value ? `text-${status.color}-800` : "text-gray-700"
                    }`}>
                      {status.label}
                    </span>
                  </button>
                ))}
              </div>
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

            {/* Footer Buttons */}
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

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Place</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete "<strong>{place.name}</strong>"? This action cannot be undone. All images and reviews will also be deleted.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={handleDeletePlace} disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:bg-red-300 disabled:cursor-not-allowed">
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}