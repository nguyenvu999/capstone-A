import { useState, useEffect } from "react";
import MapContainer from "../components/MapContainer"; 
import MapSidebar from "../components/MapSidebar";
import RegisterPlaceForm from "../components/RegisterPlaceForm";
import Navbar from "../components/Navbar"; // Thêm dòng import Navbar mới
import { useAuth } from "../../auth/context/AuthContext"; // Thêm dòng import hook Auth
import { supabase } from "../../auth/api/supabaseClient"; 

const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function MapPage() {
  const { user, logoutUser } = useAuth(); // Lấy thông tin user hiện tại và hàm đăng xuất hệ thống
  const [activeCategory, setActiveCategory] = useState(null);
  const [allPlaces, setAllPlaces] = useState([]); 
  const [categoryResults, setCategoryResults] = useState([]); 
  const [focusedLocation, setFocusedLocation] = useState(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [currentUserCoords, setCurrentUserCoords] = useState([106.694945, 10.769034]); 

  const API_KEY = "fbe052e2f17788443245e0c54f3084b0a2";

  const fetchPlacesFromSupabase = async (userCoords = currentUserCoords, currentCat = activeCategory) => {
    try {
      const { data, error } = await supabase.from("places").select("*"); 
      if (error) throw error;

      if (data) {
        const placesWithin5Km = data.filter((item) => {
          const lat = Number(item.latitude);
          const lng = Number(item.longitude);
          if (isNaN(lat) || !lng) return false;
          
          const distance = getDistanceKm(userCoords[1], userCoords[0], lat, lng);
          return distance <= 5; 
        });

        setAllPlaces(placesWithin5Km);
        
        if (currentCat) {
          const filtered = placesWithin5Km.filter(
            (item) => item.category?.toLowerCase() === currentCat.toLowerCase()
          );
          setCategoryResults(filtered);
        } else {
          setCategoryResults(placesWithin5Km);
        }
      }
    } catch (err) {
      console.error("Lỗi khi fetch dữ liệu từ Supabase:", err.message);
    }
  };

  const handleUserLocationDetected = (coords) => {
    setCurrentUserCoords(coords);
    fetchPlacesFromSupabase(coords, activeCategory);
  };

  const handleSelectCategory = (category) => {
    if (activeCategory === category || !category) {
      setActiveCategory(null);
      setCategoryResults(allPlaces);
    } else {
      setActiveCategory(category);
      const filtered = allPlaces.filter(
        (item) => item.category?.toLowerCase() === category.toLowerCase()
      );
      setCategoryResults(filtered);
    }
  };

  const handleSetFocusedLocation = (location) => {
    setFocusedLocation(location);
    if (location && location.isConfirmed) {
      fetchPlacesFromSupabase(currentUserCoords, activeCategory);
    }
  };

  return (
    // Thêm khoảng đệm pt-16 (padding-top: 64px) cho toàn bộ trang để không bị Navbar đè lên nội dung map bên dưới
    <div className="relative h-screen w-screen overflow-hidden pt-16">
      
      {/* 1. Giao diện Navbar điều khiển vị trí đầu trang */}
      <Navbar 
        user={user}
        onSignOut={logoutUser}
        onRegisterClick={() => setShowRegisterForm(true)}
      />

      {/* 2. Khối nội dung chính của Map và Sidebar */}
      <div className="w-full h-full relative flex overflow-hidden">
        <MapSidebar 
          apiKey={API_KEY}
          onSelectCategory={handleSelectCategory}
          activeCategory={activeCategory}
          categoryResults={categoryResults}
          setCategoryResults={setCategoryResults}
          setFocusedLocation={handleSetFocusedLocation}
          focusedLocation={focusedLocation} 
          currentUserCoords={currentUserCoords}
        />
        
        <MapContainer 
          apiKey={API_KEY}
          activeCategory={activeCategory}
          focusedLocation={focusedLocation}
          categoryResults={categoryResults} 
          onCategoryResultsChange={setCategoryResults}
          setFocusedLocation={handleSetFocusedLocation}
          setShowRegisterForm={setShowRegisterForm}
          onUserLocationDetected={handleUserLocationDetected}
          allPlaces={allPlaces} 
        />
      </div>

      {/* 3. Form Đăng ký địa điểm hiển thị đè đắp lớp layer trên cùng */}
      {showRegisterForm && (
        <RegisterPlaceForm 
          apiKey={API_KEY}
          focusedLocation={focusedLocation}
          setFocusedLocation={handleSetFocusedLocation} 
          onClose={() => setShowRegisterForm(false)}
        />
      )}
    </div>
  );
}