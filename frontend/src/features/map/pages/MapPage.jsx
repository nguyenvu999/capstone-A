import { useState } from "react";
import MapContainer from "../components/MapContainer"; 
import MapSidebar from "../components/MapSidebar";
import RegisterPlaceForm from "../components/RegisterPlaceForm";
import Navbar from "../components/Navbar"; 
import { useAuth } from "../../auth/context/AuthContext"; 
import { supabase } from "../../auth/api/supabaseClient"; 

export default function MapPage() {
  const { user, logoutUser } = useAuth(); 
  const [activeCategory, setActiveCategory] = useState(null);
  const [allPlaces, setAllPlaces] = useState([]); 
  const [categoryResults, setCategoryResults] = useState([]); 
  const [focusedLocation, setFocusedLocation] = useState(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [currentUserCoords, setCurrentUserCoords] = useState([106.694945, 10.769034]); 
  const [forceOpenDirectionPlace, setForceOpenDirectionPlace] = useState(null);

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

  const fetchPlacesFromSupabase = async (userCoords = currentUserCoords, currentCat = activeCategory) => {
    try {
      const { data, error } = await supabase.from("places").select("*"); 
      if (error) throw error;
      if (data) {
        const normalized = data.map(item => ({
          id: item.id, name: item.name, latitude: Number(item.latitude), longitude: Number(item.longitude), address: item.address, category: item.category
        }));

        const sorted = await sortPlacesByRealRoad(normalized, userCoords);
        setAllPlaces(sorted);
        setCategoryResults(currentCat ? sorted.filter(item => item.category?.toLowerCase() === currentCat.toLowerCase()) : sorted);
      }
    } catch (err) { console.error(err); }
  };

  const handleSelectCategory = (category) => {
    const nextCat = activeCategory === category ? null : category;
    setActiveCategory(nextCat);
    fetchPlacesFromSupabase(currentUserCoords, nextCat);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden pt-16">
      <Navbar user={user} onSignOut={logoutUser} onRegisterClick={() => setShowRegisterForm(true)} />
      <div className="w-full h-full relative flex overflow-hidden">
        <MapSidebar 
          apiKey={API_KEY} activeCategory={activeCategory} categoryResults={categoryResults}
          onSelectCategory={handleSelectCategory} setCategoryResults={setCategoryResults}
          setFocusedLocation={setFocusedLocation} focusedLocation={focusedLocation} currentUserCoords={currentUserCoords}
          onTriggerDirectionPanel={(place) => setForceOpenDirectionPlace(place)}
        />
        <MapContainer 
          apiKey={API_KEY} activeCategory={activeCategory} focusedLocation={focusedLocation}
          categoryResults={categoryResults} onCategoryResultsChange={setCategoryResults}
          setFocusedLocation={setFocusedLocation} setShowRegisterForm={setShowRegisterForm}
          onUserLocationDetected={(coords) => { setCurrentUserCoords(coords); fetchPlacesFromSupabase(coords, activeCategory); }}
          allPlaces={allPlaces} sortPlacesByRealRoad={sortPlacesByRealRoad} currentUserCoords={currentUserCoords}
          forceOpenDirectionPlace={forceOpenDirectionPlace} setForceOpenDirectionPlace={setForceOpenDirectionPlace}
        />
      </div>
      {showRegisterForm && <RegisterPlaceForm apiKey={API_KEY} focusedLocation={focusedLocation} setFocusedLocation={setFocusedLocation} onClose={() => setShowRegisterForm(false)} />}
    </div>
  );
}