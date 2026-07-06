import { useState } from "react";
import AdminNavbar from "../components/AdminNavbar";
import MapContainer from "../components/MapContainer";
import AllPlacesSidebar from "../components/AllPlacesSidebar";
import PlaceDetailModal from "../components/PlaceDetailModal";
import { MOCK_PLACES, MOCK_UPDATE_REQUESTS } from "../../../shared/data/mockPlaces";
import BuildingDetailPanel from "../components/BuildingDetailPanel";

const API_KEYS = [
  "8193e665190bbc1781789003bbe9e009a8",
  "77419a61591781935988168acf687f7dee",
  "e0f1ad1781936067b59fec71b12732236d",
];

export default function AdminMapPage() {
  const [places, setPlaces] = useState(MOCK_PLACES);
  const [activeCategory, setActiveCategory] = useState(null);
  const [focusedLocation, setFocusedLocation] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [currentKeyIndex] = useState(0);
  const [showBuildingDetail, setShowBuildingDetail] = useState(false);
  const [selectedBuildingAddress, setSelectedBuildingAddress] = useState(null);
  const [selectedBuildingPlaces, setSelectedBuildingPlaces] = useState([]);

  const API_KEY = API_KEYS[currentKeyIndex];
  const pendingCount = MOCK_UPDATE_REQUESTS.filter(r => r.status === "pending").length;

  const handlePlaceClick = (place) => {
    setSelectedPlace(place);
    setFocusedLocation({
      lat: Number(place.latitude),
      lng: Number(place.longitude),
      name: place.name,
      address: place.address,
      rating: place.rating || 0,
      place_type: place.place_type,
      building_name: place.building_name,
      floor_level: place.floor_level,
    });
  };

  const handleBuildingClick = (buildingAddress, buildingPlaces) => {
    setSelectedBuildingAddress(buildingAddress);
    setSelectedBuildingPlaces(buildingPlaces);
    setShowBuildingDetail(true);
    setSelectedPlace(null);
  };

  const handlePlaceUpdated = (updatedPlace) => {
    setPlaces(prev => prev.map(p => p.id === updatedPlace.id ? { ...p, ...updatedPlace } : p));
    setSelectedPlace({ ...selectedPlace, ...updatedPlace });
  };

  const handlePlaceDeleted = (deletedPlace) => {
    setPlaces(prev => prev.filter(p => p.id !== deletedPlace.id));
    setSelectedPlace(null);
    setFocusedLocation(null);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden flex flex-col bg-white">
      
      <AdminNavbar pendingRequestsCount={pendingCount} />
      
      <div className="w-full flex-1 relative flex overflow-hidden z-10">
        
        <AllPlacesSidebar 
          places={places}
          onPlaceClick={handlePlaceClick}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
        />
        
        <MapContainer 
          apiKey={API_KEY}
          places={places}
          onPlaceClick={handlePlaceClick}
          focusedLocation={focusedLocation}
          setFocusedLocation={setFocusedLocation}
          onBuildingClick={handleBuildingClick}
        />
      </div>

      {/* Building Detail Panel */}
      {showBuildingDetail && selectedBuildingAddress && (
        <BuildingDetailPanel
          buildingAddress={selectedBuildingAddress}
          buildingPlaces={selectedBuildingPlaces}
          onClose={() => {
            setShowBuildingDetail(false);
            setSelectedBuildingAddress(null);
            setSelectedBuildingPlaces([]);
          }}
          onPlaceClick={(place) => {
            setShowBuildingDetail(false);
            handlePlaceClick(place);
          }}
        />
      )}

      {selectedPlace && (
        <PlaceDetailModal
          place={selectedPlace}
          onClose={() => {
            setSelectedPlace(null);
            setFocusedLocation(null);
          }}
          onPlaceUpdated={handlePlaceUpdated}
          onPlaceDeleted={handlePlaceDeleted}
          apiKey={API_KEY}
        />
      )}
    </div>
  );
}