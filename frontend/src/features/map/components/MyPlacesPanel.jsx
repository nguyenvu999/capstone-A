import { useState, useEffect } from "react";
import { X, MapPin } from "lucide-react";
import { supabase } from "../../auth/api/supabaseClient";
import { useAuth } from "../../auth/context/AuthContext";

export default function MyPlacesPanel({ onClose, onPlaceClick, currentUserCoords }) {
  const { user } = useAuth();
  const [myPlaces, setMyPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyPlaces();
  }, [user, currentUserCoords]); // ← THÊM currentUserCoords vào dependency

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

  return (
    <div className="fixed top-0 md:top-20 right-0 md:right-6 left-0 md:left-auto bottom-0 md:bottom-auto z-[999] w-full md:w-[400px] h-full md:h-auto max-h-full md:max-h-[calc(100vh-120px)] bg-white rounded-none md:rounded-2xl shadow-2xl flex flex-col border border-gray-100 overflow-hidden transition-all duration-300 ease-out animate-in slide-in-from-bottom-10 md:slide-in-from-right-10">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <h2 className="text-base font-bold text-gray-800">My Places</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>
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
          myPlaces.map((place, index) => (
            <div
              key={place.id}
              onClick={() => onPlaceClick(place)}
              className="flex items-start justify-between p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 transition-all duration-150 active:bg-gray-100"
            >
              <div className="flex items-start gap-3 overflow-hidden max-w-[78%]">
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
                  <p className="text-[11px] text-gray-500 mt-0.5 truncate">{place.address}</p>
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