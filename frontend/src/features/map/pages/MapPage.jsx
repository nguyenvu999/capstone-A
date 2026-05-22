import { useState, useEffect } from "react";
import MapContainer from "../components/MapContainer"; 
import MapSidebar from "../components/MapSidebar";
import RegisterPlaceForm from "../components/RegisterPlaceForm";
import { supabase } from "../../auth/api/supabaseClient"; 
import { Plus } from "lucide-react";

export default function MapPage() {
  const [activeCategory, setActiveCategory] = useState(null);
  const [allPlaces, setAllPlaces] = useState([]); 
  const [categoryResults, setCategoryResults] = useState([]); 
  const [focusedLocation, setFocusedLocation] = useState(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  const API_KEY = "fbe052e2f17788443245e0c54f3084b0a2";

  const fetchPlacesFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from("places")
        .select("*"); 

      if (error) throw error;

      if (data) {
        setAllPlaces(data);
        setCategoryResults(data); 
      }
    } catch (err) {
      console.error("Lỗi khi fetch dữ liệu từ Supabase:", err.message);
    }
  };

  useEffect(() => {
    fetchPlacesFromSupabase();
  }, []);

  const handleSelectCategory = (category) => {
    setActiveCategory(category);
    if (!category) {
      setCategoryResults(allPlaces);
    } else {
      // Lọc danh sách dữ liệu Supabase cục bộ dựa vào id tiếng anh viết thường
      const filtered = allPlaces.filter(
        (item) => item.category?.toLowerCase() === category.toLowerCase()
      );
      setCategoryResults(filtered);
    }
  };

  const handleSetFocusedLocation = (location) => {
    setFocusedLocation(location);
    if (location && location.isConfirmed) {
      fetchPlacesFromSupabase();
    }
  };

  const handleOpenRegisterForm = () => {
    setShowRegisterForm(true);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <MapSidebar 
        apiKey={API_KEY}
        onSelectCategory={handleSelectCategory}
        categoryResults={categoryResults}
        setCategoryResults={setCategoryResults}
        setFocusedLocation={handleSetFocusedLocation}
        focusedLocation={focusedLocation} 
        allPlaces={allPlaces} 
      />
      
      <MapContainer 
        apiKey={API_KEY}
        activeCategory={activeCategory}
        focusedLocation={focusedLocation}
        categoryResults={categoryResults} 
        onCategoryResultsChange={setCategoryResults}
        setFocusedLocation={handleSetFocusedLocation}
        setShowRegisterForm={setShowRegisterForm}
      />

      {!showRegisterForm && (
        <button 
          onClick={handleOpenRegisterForm}
          className="absolute top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl font-bold text-xs transition-all active:scale-95 group"
          title="Register a new place"
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