import { useState } from "react";
import { X } from "lucide-react";

export default function BuildingDetailPanel({ buildingAddress, buildingPlaces, onClose, onPlaceClick }) {
  const buildingName = buildingPlaces[0]?.building_name || "Building";
  
  const floors = [...new Set(buildingPlaces.map(p => String(p.floor_level)))];
  const sortedFloors = sortFloors(floors);
  const [selectedFloor, setSelectedFloor] = useState(sortedFloors[0] || "1");

  const placesOnFloor = buildingPlaces.filter(p => String(p.floor_level) === String(selectedFloor));

  const getCategoryIcon = (categoryId) => {
    const icons = {
      restaurant: "🍽️", bar: "🍷", beverage: "☕",
      sight: "👁️", entertainment: "🎬", team_event: "👥"
    };
    return icons[categoryId?.toLowerCase()] || "📍";
  };

  return (
    <div className="fixed top-0 md:top-20 right-0 md:right-6 left-0 md:left-auto bottom-0 md:bottom-auto z-[999] w-full md:w-[400px] h-full md:h-auto max-h-full md:max-h-[calc(100vh-120px)] bg-white rounded-none md:rounded-2xl shadow-2xl flex flex-col border border-gray-100 overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <div className="overflow-hidden flex-1 mr-3">
          <h2 className="text-base font-bold text-gray-800 truncate">{buildingName}</h2>
          <p className="text-xs text-gray-600 truncate mt-0.5">📍 {buildingAddress}</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0">
          <X size={20} />
        </button>
      </div>

      {/* Floor Selector */}
      <div className="p-4 border-b border-gray-100 shrink-0">
        <label className="block text-sm font-medium text-gray-700 mb-2">Floor Level</label>
        <select 
          value={selectedFloor} 
          onChange={(e) => setSelectedFloor(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-blue-500 cursor-pointer transition-all"
        >
          {sortedFloors.map(floor => {
            const placeCount = buildingPlaces.filter(p => String(p.floor_level) === String(floor)).length;
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
        {placesOnFloor.length > 0 ? (
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
          </div>
        )}
      </div>
    </div>
  );
}

// Simple floor sort (basement first, then ascending)
function sortFloors(floors) {
  return floors.sort((a, b) => {
    const aIsBasement = String(a).startsWith("B");
    const bIsBasement = String(b).startsWith("B");
    if (aIsBasement && bIsBasement) {
      return parseInt(String(b).substring(1), 10) - parseInt(String(a).substring(1), 10);
    }
    if (aIsBasement && !bIsBasement) return -1;
    if (!aIsBasement && bIsBasement) return 1;
    return parseInt(a, 10) - parseInt(b, 10);
  });
}