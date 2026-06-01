import { useState } from "react";
import MapContainer from "../components/MapContainer"; 
import MapSidebar from "../components/MapSidebar";
import RegisterPlaceForm from "../components/RegisterPlaceForm";
import Navbar from "../components/Navbar"; 
import { useAuth } from "../../auth/context/AuthContext"; 
import { supabase } from "../../auth/api/supabaseClient"; 
import PlaceDetailModal from "../components/PlaceDetailModal";

export default function MapPage() {
  const { user, logoutUser } = useAuth(); 
  const [activeCategory, setActiveCategory] = useState(null);
  const [allPlaces, setAllPlaces] = useState([]); 
  const [categoryResults, setCategoryResults] = useState([]); 
  const [focusedLocation, setFocusedLocation] = useState(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [currentUserCoords, setCurrentUserCoords] = useState([106.694945, 10.769034]); 
  const [forceOpenDirectionPlace, setForceOpenDirectionPlace] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null); // Place đang được xem detail

  // THÊM: State cho filters
  const [activeFilters, setActiveFilters] = useState({
    priceLevels: [],
    ratings: []
  });

  const API_KEY = "fbe052e2f17788443245e0c54f3084b0a2";

  // Hàm tính toán ma trận cự ly chuẩn xác thực tế từ API Track-Asia
  const sortPlacesByRealRoad = async (placesArray, userCoords) => {
    if (!placesArray || placesArray.length === 0) return [];
    try {
      const [userLng, userLat] = userCoords;
      let coordinatesString = `${userLng},${userLat}`;
      placesArray.forEach(p => { coordinatesString += `;${p.longitude},${p.latitude}`; });

      const response = await fetch(`https://maps.track-asia.com/distance-matrix/v1/moto/${coordinatesString}?sources=0&annotations=distance&key=${API_KEY}`);
      const matrixData = await response.json();

      if (matrixData && matrixData.distances && matrixData.distances[0]) {
        const distancesFromUser = matrixData.distances[0]; 
        const enrichedPlaces = placesArray.map((place, index) => ({
          ...place,
          distance: (distancesFromUser[index + 1] || Infinity) / 1000
        }));
        return enrichedPlaces.sort((a, b) => a.distance - b.distance);
      }
    } catch (e) { console.error("Lỗi khoảng cách matrix:", e); }
    return placesArray;
  };

  // CẬP NHẬT: Apply filters khi fetch places từ Supabase
  const fetchPlacesFromSupabase = async (userCoords = currentUserCoords, currentCat = activeCategory, filters = activeFilters) => {
    try {
      // Bắt đầu query builder
      let query = supabase.from("places").select("*");

      // Filter theo category (nếu có)
      if (currentCat) {
        query = query.eq("category", currentCat);
      }

      // Filter theo price levels (nếu có)
      if (filters.priceLevels.length > 0) {
        query = query.in("price_level", filters.priceLevels);
      }

      // Execute query
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data) {
        const normalized = data.map(item => ({
          id: item.id, 
          name: item.name, 
          latitude: Number(item.latitude), 
          longitude: Number(item.longitude), 
          address: item.address, 
          category: item.category,
          price_level: item.price_level,
          business_status: item.business_status,
          // THÊM: Thêm rating (tính từ reviews - tạm thời dùng placeholder)
          // TODO: Sau khi có review system, cần tính avg rating từ bảng reviews
          rating: item.rating || 0,
          created_by: item.created_by, 
          created_by_email: item.created_by_email, 
          description: item.description 
        }));

        const sorted = await sortPlacesByRealRoad(normalized, userCoords);
        
        // Filter theo rating (client-side vì cần tính avg từ reviews)
        let filtered = sorted;
        if (filters.ratings.length > 0) {
          const minRating = Math.min(...filters.ratings);
          filtered = sorted.filter(place => (place.rating || 0) >= minRating);
        }
        
        setAllPlaces(filtered);
        setCategoryResults(filtered);
      }
    } catch (err) { 
      console.error("Fetch places error:", err); 
    }
  };

  // THÊM: Handler khi filters thay đổi từ MapSidebar
  const handleFilterChange = (newFilters) => {
    setActiveFilters(newFilters);
    fetchPlacesFromSupabase(currentUserCoords, activeCategory, newFilters);
  };

  const handleSelectCategory = (category) => {
    const nextCat = activeCategory === category ? null : category;
    setActiveCategory(nextCat);
    fetchPlacesFromSupabase(currentUserCoords, nextCat, activeFilters);
  };

  // Callback để refresh places sau khi register thành công
  const handlePlaceRegistered = () => {
    fetchPlacesFromSupabase(currentUserCoords, activeCategory, activeFilters);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden pt-16">
      <Navbar user={user} onSignOut={logoutUser} onRegisterClick={() => setShowRegisterForm(true)} />
      <div className="w-full h-full relative flex overflow-hidden">
        <MapSidebar 
          apiKey={API_KEY} 
          activeCategory={activeCategory} 
          categoryResults={categoryResults}
          onSelectCategory={handleSelectCategory} 
          setCategoryResults={setCategoryResults}
          setFocusedLocation={setFocusedLocation} 
          focusedLocation={focusedLocation} 
          currentUserCoords={currentUserCoords}
          onTriggerDirectionPanel={(place) => setForceOpenDirectionPlace(place)}
          onFilterChange={handleFilterChange} // THÊM: Truyền callback xuống MapSidebar
          onPlaceClick={setSelectedPlace} // THÊM: Truyền callback
        />
        <MapContainer 
          apiKey={API_KEY} 
          activeCategory={activeCategory} 
          focusedLocation={focusedLocation}
          categoryResults={categoryResults} 
          onCategoryResultsChange={setCategoryResults}
          setFocusedLocation={setFocusedLocation} 
          setShowRegisterForm={setShowRegisterForm}
          onUserLocationDetected={(coords) => { 
            setCurrentUserCoords(coords); 
            fetchPlacesFromSupabase(coords, activeCategory, activeFilters); 
          }}
          allPlaces={allPlaces} 
          sortPlacesByRealRoad={sortPlacesByRealRoad} 
          currentUserCoords={currentUserCoords}
          forceOpenDirectionPlace={forceOpenDirectionPlace} 
          setForceOpenDirectionPlace={setForceOpenDirectionPlace}
          onPlaceClick={setSelectedPlace}
        />
      </div>
      
      {showRegisterForm && (
        <RegisterPlaceForm 
          apiKey={API_KEY} 
          focusedLocation={focusedLocation} 
          setFocusedLocation={setFocusedLocation} 
          onClose={() => setShowRegisterForm(false)} 
          allPlaces={allPlaces} 
          onSuccess={handlePlaceRegistered}
        />
      )}

      {/* THÊM: Place Detail Modal */}
      {selectedPlace && (
        <PlaceDetailModal
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
          onStatusUpdated={handlePlaceRegistered}
          apiKey={API_KEY}
        />
      )}
    </div>
  );
}