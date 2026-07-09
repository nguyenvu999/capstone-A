import { useState, useEffect, useRef } from "react";
import { X, MoreVertical } from "lucide-react";
import { supabase } from "../../auth/api/supabaseClient";
import { useAuth } from "../../auth/context/AuthContext";
import { sortFloorLevels } from "../utils/floorLevelValidation";

export default function BuildingDetailPanel({ 
  buildingAddress,
  initialBuildingName,
  onClose, 
  onAddPlace,
  onPlaceClick,
  onBuildingConverted,
  activeFilters = null
}) {
  const { user } = useAuth();
  const [places, setPlaces] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState("");
  const [loading, setLoading] = useState(true);
  const [buildingName, setBuildingName] = useState(initialBuildingName || "Building");
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  const [converting, setConverting] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadPlaces();
  }, [buildingAddress]);

  // ✅ Auto-select floor đầu tiên có place match filter
  useEffect(() => {
    if (filteredPlaces.length > 0) {
      const uniqueFloors = [...new Set(filteredPlaces.map(p => String(p.floor_level)))];
      const sortedFloors = sortFloorLevels(uniqueFloors);
      
      if (sortedFloors.length > 0 && !sortedFloors.includes(String(selectedFloor))) {
        setSelectedFloor(sortedFloors[0]);
      }
    }
  }, [activeFilters, places]);

  // Close dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowOptionsDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadPlaces = async () => {
    if (!buildingAddress) return;
    
    setLoading(true);
    
    const { data, error } = await supabase
      .from("places")
      .select("*")
      .eq("building_address", buildingAddress)
      .eq("place_type", "building")
      .order("floor_level", { ascending: true });

    if (error) {
      console.error("Failed to load building places:", error);
    } else {
      setPlaces(data || []);
      
      if (data && data.length > 0) {
        setBuildingName(data[0].building_name || initialBuildingName || "Building");
        
        // Auto-select floor có place đầu tiên
        const firstFloor = data[0].floor_level;
        if (firstFloor) setSelectedFloor(String(firstFloor));
      }
    }
    
    setLoading(false);
  };

  // ✅ Filter places theo activeFilters (nếu có)
  const applyFilters = (placesList) => {
    if (!activeFilters) return placesList;
    
    let filtered = placesList;
    
    // Filter price level
    if (activeFilters.priceLevels && activeFilters.priceLevels.length > 0) {
      filtered = filtered.filter(p => activeFilters.priceLevels.includes(Number(p.price_level)));
    }
    
    // Filter rating
    if (activeFilters.ratings && activeFilters.ratings.length > 0) {
      if (activeFilters.ratings.length === 1) {
        const minRating = activeFilters.ratings[0];
        filtered = filtered.filter(p => (p.rating || 0) >= minRating);
      } else {
        const minRating = Math.min(...activeFilters.ratings);
        const maxRating = Math.max(...activeFilters.ratings);
        if (maxRating === 5) {
          filtered = filtered.filter(p => (p.rating || 0) >= minRating);
        } else {
          filtered = filtered.filter(p => {
            const r = p.rating || 0;
            return r >= minRating && r < maxRating;
          });
        }
      }
    }
    
    return filtered;
  };

  const filteredPlaces = applyFilters(places);

  // ✅ Floors có places sau khi filter
  const floorsWithPlaces = [...new Set(filteredPlaces.map(p => p.floor_level))].sort((a, b) => a - b);
  const placesOnFloor = filteredPlaces.filter(p => String(p.floor_level) === String(selectedFloor));

  const isOwnerOfAll = places.length > 0 && places.every(p => 
    user && (p.created_by === user.id || String(p.created_by) === String(user.id))
  );
  const canConvert = places.length === 1 && isOwnerOfAll;

  const handleConvertToStandalone = async () => {
    if (!canConvert || converting) return;
    
    if (!confirm(`Convert "${buildingName}" to a standalone place?\n\nThe place will become a regular standalone place.`)) {
      return;
    }

    setConverting(true);

    try {
      const placeToConvert = places[0];

      const { error } = await supabase
        .from("places")
        .update({
          place_type: "standalone",
          building_name: null,
          building_address: null,
          floor_level: null,
        })
        .eq("id", placeToConvert.id);

      if (error) throw error;

      // ✅ Đóng Building Panel
      onClose();

      // ✅ Gọi callback để refresh map
      if (onBuildingConverted) onBuildingConverted();

    } catch (error) {
      console.error("Failed to convert:", error);
      alert("Failed to convert building.");
    } finally {
      setConverting(false);
    }
  };

  const getCategoryIcon = (categoryId) => {
    const icons = {
      restaurant: "🍽️", bar: "🍷", beverage: "☕",
      sight: "👁️", entertainment: "🎬", team_event: "👥",
      vegetarian: "🥗"
    };
    return icons[categoryId?.toLowerCase()] || "📍";
  };

  return (
    <div className="fixed top-0 md:top-20 right-0 md:right-6 left-0 md:left-auto bottom-0 md:bottom-auto z-[999] w-full md:w-[400px] h-full md:h-auto max-h-full md:max-h-[calc(100vh-120px)] bg-white rounded-none md:rounded-2xl shadow-2xl flex flex-col border border-gray-100 overflow-hidden transition-all duration-300 ease-out animate-in slide-in-from-bottom-10 md:slide-in-from-right-10">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <div className="overflow-hidden flex-1 mr-3">
          <h2 className="text-base font-bold text-gray-800 truncate">{buildingName}</h2>
          <p className="text-xs text-gray-600 truncate mt-0.5">📍 {buildingAddress}</p>
        </div>
        
        <div className="flex items-center gap-1">
          {canConvert && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
                className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <MoreVertical size={18} />
              </button>
              
              {showOptionsDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-xl py-1 z-50">
                  <button
                    onClick={() => {
                      setShowOptionsDropdown(false);
                      handleConvertToStandalone();
                    }}
                    disabled={converting}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                  >
                    🏠 {converting ? "Converting..." : "Convert to Standalone Place"}
                  </button>
                </div>
              )}
            </div>
          )}
          
          <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Floor Selector */}
      <div className="p-4 border-b border-gray-100 shrink-0">
        <label className="block text-sm font-medium text-gray-700 mb-2">Floor Level</label>
        <select 
          value={selectedFloor} 
          onChange={(e) => setSelectedFloor(e.target.value)}
          disabled={loading}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-blue-500 cursor-pointer transition-all disabled:opacity-70"
        >
          {sortFloorLevels(floorsWithPlaces).map(floor => {
            const placeCount = filteredPlaces.filter(p => String(p.floor_level) === String(floor)).length;
            return (
              <option key={floor} value={floor}>
                Level {floor} ({placeCount} place{placeCount > 1 ? 's' : ''})
              </option>
            );
          })}
        </select>
      </div>

      {/* Places List */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full shrink-0"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : placesOnFloor.length > 0 ? (
          <div className="space-y-2">
            {placesOnFloor.map(place => (
              <div key={place.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer" onClick={() => onPlaceClick(place)}>
                <div className="flex items-center gap-2 flex-1 overflow-hidden">
                  <span className="text-lg shrink-0">{getCategoryIcon(place.category)}</span>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium text-gray-900 truncate">{place.name}</p>
                    <p className="text-xs text-gray-600">{place.category?.charAt(0).toUpperCase() + place.category?.slice(1)}</p>
                  </div>
                </div>
                <button className="text-xs text-blue-600 hover:underline font-medium shrink-0 ml-2" onClick={(e) => { e.stopPropagation(); onPlaceClick(place); }}>View</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 mb-1">📭 No places on this floor</p>
            <p className="text-xs text-gray-400">Try selecting a different floor level</p>
          </div>
        )}
      </div>

      {/* Add More Place */}
      <div className="p-4 border-t border-gray-100 shrink-0">
        <button onClick={onAddPlace} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors">
          + Add More Place
        </button>
      </div>
    </div>
  );
}