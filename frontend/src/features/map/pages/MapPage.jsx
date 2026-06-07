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
  const [selectedPlace, setSelectedPlace] = useState(null); 

  const [activeFilters, setActiveFilters] = useState({
    priceLevels: [],
    ratings: []
  });

  const API_KEY = "47c259f38d98bc1780380421e9735f2b0a";

  // ===== THÊM: Function mở Register Form + đóng Place Detail =====
  const handleOpenRegisterForm = () => {
    setSelectedPlace(null); // Đóng Place Detail nếu đang mở
    setShowRegisterForm(true); // Mở Register Form
  };

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

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; 
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
        
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
  };

  const fetchPlacesFromSupabase = async (userCoords = currentUserCoords, currentCat = activeCategory, filters = activeFilters) => {
    try {
      let query = supabase.from("places").select("*");

      if (currentCat) {
        query = query.eq("category", currentCat);
      }

      if (filters.priceLevels.length > 0) {
        query = query.in("price_level", filters.priceLevels);
      }

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
          rating: item.rating || 0,
          created_by: item.created_by, 
          created_by_email: item.created_by_email, 
          description: item.description,
          isSupabaseData: true 
        }));

        const [userLng, userLat] = userCoords;
        const placesWithin5km = normalized.filter(place => {
          const distance = calculateDistance(
            userLat, 
            userLng, 
            place.latitude, 
            place.longitude
          );
          return distance <= 5; 
        });

        const sorted = await sortPlacesByRealRoad(placesWithin5km, userCoords);
        
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

  const handleFilterChange = (newFilters) => {
    setActiveFilters(newFilters);
    fetchPlacesFromSupabase(currentUserCoords, activeCategory, newFilters);
  };

  const handleSelectCategory = (category) => {
    const nextCat = activeCategory === category ? null : category;
    setActiveCategory(nextCat);
    setFocusedLocation(null);
    fetchPlacesFromSupabase(currentUserCoords, nextCat, activeFilters);
  };

  const handlePlaceRegistered = () => {
    fetchPlacesFromSupabase(currentUserCoords, activeCategory, activeFilters);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden flex flex-col bg-white">
      {/* ===== THAY ĐỔI: Truyền handleOpenRegisterForm thay vì setShowRegisterForm ===== */}
      <Navbar user={user} onSignOut={logoutUser} onRegisterClick={handleOpenRegisterForm} />
      
      <div className="w-full flex-1 relative flex overflow-hidden z-10">
        
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
          onFilterChange={handleFilterChange} 
          onPlaceClick={setSelectedPlace} 
        />
        
        <MapContainer 
          apiKey={API_KEY} 
          activeCategory={activeCategory} 
          focusedLocation={focusedLocation}
          categoryResults={categoryResults.filter(place => place.isSupabaseData === true)} 
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

      {/* Place Detail Modal - Giờ đây nằm bên phải giống Register Form */}
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