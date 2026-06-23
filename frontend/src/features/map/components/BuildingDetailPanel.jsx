import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { supabase } from "../../auth/api/supabaseClient";

export default function BuildingDetailPanel({ 
  buildingAddress, 
  onClose, 
  onAddPlace,
  onPlaceClick 
}) {
  const [places, setPlaces] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [loading, setLoading] = useState(true);
  const [buildingName, setBuildingName] = useState("");

  useEffect(() => {
    loadPlaces();
  }, [buildingAddress]);

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
      
      // Lấy building name từ place đầu tiên
      if (data && data.length > 0) {
        setBuildingName(data[0].building_name);
        setSelectedFloor(data[0].floor_level); // Auto-select floor có place đầu tiên
      }
    }
    
    setLoading(false);
  };

  // Lấy danh sách floors có places
  const floorsWithPlaces = [...new Set(places.map(p => p.floor_level))].sort((a, b) => a - b);
  
  // Lấy places trên floor hiện tại
  const placesOnFloor = places.filter(p => p.floor_level === selectedFloor);

  // Helper: Get category icon
  const getCategoryIcon = (categoryId) => {
    const icons = {
      restaurant: "🍽️",
      bar: "🍷",
      beverage: "☕",
      sight: "👁️",
      entertainment: "🎬",
      team_event: "👥"
    };
    return icons[categoryId?.toLowerCase()] || "📍";
  };

  return (
    <div className="fixed top-0 md:top-20 right-0 md:right-6 left-0 md:left-auto bottom-0 md:bottom-auto z-[999] w-full md:w-[400px] h-full md:h-auto max-h-full md:max-h-[calc(100vh-120px)] bg-white rounded-none md:rounded-2xl shadow-2xl flex flex-col border border-gray-100 overflow-hidden transition-all duration-300 ease-out animate-in slide-in-from-bottom-10 md:slide-in-from-right-10">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <div className="overflow-hidden flex-1 mr-3">
          <h2 className="text-base font-bold text-gray-800 truncate">{buildingName || "Building"}</h2>
          <p className="text-xs text-gray-600 truncate mt-0.5">📍 {buildingAddress}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      {/* Floor Selector */}
      <div className="p-4 border-b border-gray-100 shrink-0">
        <label className="block text-sm font-medium text-gray-700 mb-2">Floor Level</label>
        <select 
          value={selectedFloor} 
          onChange={(e) => setSelectedFloor(Number(e.target.value))}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-blue-500 cursor-pointer transition-all"
        >
          {Array.from({ length: 100 }, (_, i) => i + 1).map(floor => {
            const hasPlaces = floorsWithPlaces.includes(floor);
            const placeCount = places.filter(p => p.floor_level === floor).length;
            
            return (
              <option 
                key={floor} 
                value={floor}
                className={hasPlaces ? 'font-bold' : ''}
              >
                Level {floor} {hasPlaces ? `(${placeCount} place${placeCount > 1 ? 's' : ''})` : ''}
              </option>
            );
          })}
        </select>
      </div>

      {/* Places List */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {loading ? (
          <p className="text-sm text-gray-500 text-center py-4">Loading places...</p>
        ) : placesOnFloor.length > 0 ? (
          <div className="space-y-2">
            {placesOnFloor.map(place => (
              <div 
                key={place.id} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer"
                onClick={() => onPlaceClick(place)}
              >
                <div className="flex items-center gap-2 flex-1 overflow-hidden">
                  <span className="text-lg shrink-0">{getCategoryIcon(place.category)}</span>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium text-gray-900 truncate">{place.name}</p>
                    <p className="text-xs text-gray-600">
                      {place.category?.charAt(0).toUpperCase() + place.category?.slice(1)}
                    </p>
                  </div>
                </div>
                <button 
                  className="text-xs text-blue-600 hover:underline font-medium shrink-0 ml-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlaceClick(place);
                  }}
                >
                  View
                </button>
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

      {/* Add More Place Button */}
      <div className="p-4 border-t border-gray-100 shrink-0">
        <button 
          onClick={onAddPlace}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors"
        >
          + Add More Place
        </button>
      </div>
    </div>
  );
}