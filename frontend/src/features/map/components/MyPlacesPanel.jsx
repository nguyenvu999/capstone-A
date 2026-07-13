import { useState, useEffect, useRef  } from "react";
import { X, MapPin, ArrowUpDown } from "lucide-react";
import { supabase } from "../../auth/api/supabaseClient";
import { useAuth } from "../../auth/context/AuthContext";

export default function MyPlacesPanel({ onClose, onPlaceClick, currentUserCoords }) {
  const { user } = useAuth();
  const [myPlaces, setMyPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("closest"); // "closest", "farthest", "a-z", "z-a", "rating-high", "rating-low"
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortDropdownRef = useRef(null);

  // Close dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setShowSortDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    loadMyPlaces();
  }, [user, currentUserCoords]); // ← THÊM currentUserCoords vào dependency

  const getSortedPlaces = () => {
    const sorted = [...myPlaces];
    
    switch (sortBy) {
      case "closest":
        // Closest first
        sorted.sort((a, b) => (a.distanceValue || 0) - (b.distanceValue || 0));
        break;
      case "farthest":
        // Farthest first
        sorted.sort((a, b) => (b.distanceValue || 0) - (a.distanceValue || 0));
        break;
      case "a-z":
        // A-Z by name
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "z-a":
        // Z-A by name
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "rating-high":
        // Highest rating first
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "rating-low":
        // Lowest rating first
        sorted.sort((a, b) => (a.rating || 0) - (b.rating || 0));
        break;
      default:
        break;
    }
    
    return sorted;
  };

  const loadMyPlaces = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("places")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Tính distance từ GPS đến từng place
      const placesWithDistance = (data || []).map(place => {
        const [gpsLng, gpsLat] = currentUserCoords;
        const R = 6371;
        const dLat = ((place.latitude - gpsLat) * Math.PI) / 180;
        const dLon = ((place.longitude - gpsLng) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((gpsLat * Math.PI) / 180) * Math.cos((place.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return {
          ...place,
          distanceText: `${distance.toFixed(1)} km`,
          distanceValue: distance
        };
      });

      setMyPlaces(placesWithDistance);
    } catch (error) {
      console.error("Load my places error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (categoryId) => {
    const category = categoryId?.toLowerCase();

    // Đồng bộ với MapSidebar
    if (category === "restaurant") {
        return <img src="/restaurant-icon.png" className="w-5 h-5 object-contain" alt="Restaurant" />;
    } else if (category === "bar") {
        return <span className="text-base">🍷</span>;
    } else if (category === "beverage") {
        return <span className="text-base">☕</span>;
    } else if (category === "sight") {
        return <span className="text-base">👁️</span>;
    } else if (category === "entertainment") {
        return <img src="/park_map_icon.png" className="w-5 h-5 object-contain" alt="Entertainment" />;
    } else if (category === "team_event") {
        return <span className="text-base">👥</span>;
    } else if (category === "vegetarian") {
        return <span className="text-base">🥗</span>;
    }    
    return <span className="text-base">📍</span>;
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

  const getSortLabel = () => {
    switch (sortBy) {
      case "closest":
        return "Closest";
      case "farthest":
        return "Farthest";
      case "a-z":
        return "A-Z";
      case "z-a":
        return "Z-A";
      case "rating-high":
        return "Rating";
      case "rating-low":
        return "Rating";
      default:
        return "Sort";
    }
  };

  return (
    <div className="fixed top-0 md:top-20 right-0 md:right-6 left-0 md:left-auto bottom-0 md:bottom-auto z-[999] w-full md:w-[400px] h-full md:h-auto max-h-full md:max-h-[calc(100vh-120px)] bg-white rounded-none md:rounded-2xl shadow-2xl flex flex-col border border-gray-100 transition-all duration-300 ease-out animate-in slide-in-from-bottom-10 md:slide-in-from-right-10">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0 relative">
        <h2 className="text-base font-bold text-gray-800">My Places</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>
        <div className="flex items-center gap-2">
          {/* Sort Dropdown */}
          <div className="relative" ref={sortDropdownRef}>
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center gap-1.5"
            >
              <ArrowUpDown size={14} />
              <span className="hidden sm:inline">{getSortLabel()}</span>
            </button>

            {showSortDropdown && (
              <div className="absolute top-full right-0 mt-2 w-40 bg-white border border-gray-100 rounded-xl shadow-xl py-1 z-[9999] animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  onClick={() => {
                    setSortBy("closest");
                    setShowSortDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    sortBy === "closest"
                      ? "text-blue-600 font-semibold bg-blue-50"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Closest
                </button>
                <button
                  onClick={() => {
                    setSortBy("farthest");
                    setShowSortDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    sortBy === "farthest"
                      ? "text-blue-600 font-semibold bg-blue-50"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Farthest
                </button>
                
                <div className="border-t border-gray-100 my-1"></div>
                
                <button
                  onClick={() => {
                    setSortBy("a-z");
                    setShowSortDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    sortBy === "a-z"
                      ? "text-blue-600 font-semibold bg-blue-50"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  A-Z
                </button>
                <button
                  onClick={() => {
                    setSortBy("z-a");
                    setShowSortDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    sortBy === "z-a"
                      ? "text-blue-600 font-semibold bg-blue-50"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Z-A
                </button>
                
                <div className="border-t border-gray-100 my-1"></div>
                
                <button
                  onClick={() => {
                    setSortBy("rating-high");
                    setShowSortDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    sortBy === "rating-high"
                      ? "text-blue-600 font-semibold bg-blue-50"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Rating (Highest)
                </button>
                <button
                  onClick={() => {
                    setSortBy("rating-low");
                    setShowSortDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    sortBy === "rating-low"
                      ? "text-blue-600 font-semibold bg-blue-50"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Rating (Lowest)
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="p-6 text-center text-sm text-gray-500">Loading your places...</div>
        ) : myPlaces.length === 0 ? (
          <div className="p-6 text-center">
            <MapPin size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">You haven't registered any places yet</p>
          </div>
        ) : (
          getSortedPlaces().map((place, index) => (
            <div
              key={place.id}
              onClick={() => onPlaceClick(place)}
              className="flex items-start justify-between p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 transition-all duration-150 active:bg-gray-100 group"
            >
              <div className="flex items-start gap-3 overflow-hidden max-w-[70%]">
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
                  {place.rating > 0 && (
                    <p className="text-[10px] text-yellow-600 mt-0.5 font-semibold flex items-center gap-1">
                      <span>{renderStars(place.rating)}</span>
                      <span className="text-gray-600">{Number(place.rating).toFixed(1)}</span>
                    </p>
                  )}
                  <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                    {place.place_type === "building" && place.building_name
                      ? `Level ${place.floor_level}, ${place.building_name}, ${place.address}`
                      : place.address
                    }
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded whitespace-nowrap ml-2 self-center shrink-0">
                {place.distanceText}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}