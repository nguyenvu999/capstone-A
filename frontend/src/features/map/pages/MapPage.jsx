import { useState, useEffect } from "react";
import MapContainer from "../components/MapContainer"; 
import MapSidebar from "../components/MapSidebar";
import RegisterPlaceForm from "../components/RegisterPlaceForm";
import { supabase } from "../../auth/api/supabaseClient"; 
import { Plus } from "lucide-react";

// Hàm tính khoảng cách giữa 2 tọa độ (Haversine công thức) trả về đơn vị km
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Bán kính Trái Đất
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
  const [activeCategory, setActiveCategory] = useState(null);
  const [allPlaces, setAllPlaces] = useState([]); // Lưu toàn bộ địa điểm trong bán kính 5km
  const [categoryResults, setCategoryResults] = useState([]); // Lưu địa điểm hiển thị sau lọc
  const [focusedLocation, setFocusedLocation] = useState(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [currentUserCoords, setCurrentUserCoords] = useState([106.694945, 10.769034]); // [lng, lat] mặc định

  const API_KEY = "fbe052e2f17788443245e0c54f3084b0a2";

  // Hàm tải dữ liệu từ Supabase kết hợp lọc bán kính 5km
  const fetchPlacesFromSupabase = async (userCoords = currentUserCoords, currentCat = activeCategory) => {
    try {
      const { data, error } = await supabase.from("places").select("*"); 
      if (error) throw error;

      if (data) {
        // Lọc những địa điểm nằm trong phạm vi 5km từ tọa độ user
        const placesWithin5Km = data.filter((item) => {
          const lat = Number(item.latitude);
          const lng = Number(item.longitude);
          if (isNaN(lat) || !lng) return false;
          
          const distance = getDistanceKm(userCoords[1], userCoords[0], lat, lng);
          return distance <= 5; 
        });

        // Lưu mảng 5km gốc
        setAllPlaces(placesWithin5Km);
        
        // Cập nhật hiển thị dựa theo danh mục hiện tại
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

  // Kích hoạt chạy khi định vị user thành công từ MapContainer truyền lên
  const handleUserLocationDetected = (coords) => {
    setCurrentUserCoords(coords);
    fetchPlacesFromSupabase(coords, activeCategory);
  };

  const handleSelectCategory = (category) => {
    if (activeCategory === category || !category) {
      // HỦY LỌC: Quay về hiển thị tất cả các điểm Supabase trong bán kính 5km
      setActiveCategory(null);
      setCategoryResults(allPlaces);
    } else {
      // BẬT BỘ LỌC: Chỉ lọc từ mảng 5km gốc ban đầu
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
    <div className="relative h-screen w-screen overflow-hidden">
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
        allPlaces={allPlaces} // Truyền thêm biến này xuống Map để giữ đồng bộ dữ liệu gốc khi quét API ngoài
      />

      {!showRegisterForm && (
        <button 
          onClick={() => setShowRegisterForm(true)}
          className="absolute top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl font-bold text-xs transition-all active:scale-95 group"
        >
          <Plus size={16} className="group-hover:rotate-90 transition-transform duration-200" />
          <span>Register a Place</span>
        </button>
      )}

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