import { useState } from "react";
import MapContainer from "../components/MapContainer"; 
import MapSidebar from "../components/MapSidebar";
import RegisterPlaceForm from "../components/RegisterPlaceForm";
import { Plus } from "lucide-react";

export default function MapPage() {
  const [activeCategory, setActiveCategory] = useState(null);
  const [categoryResults, setCategoryResults] = useState([]);
  const [focusedLocation, setFocusedLocation] = useState(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  const API_KEY = "fbe052e2f17788443245e0c54f3084b0a2";

  const handleSelectCategory = (category) => {
    setActiveCategory(category);
  };

  const handleSetFocusedLocation = (location) => {
    setFocusedLocation(location);
  };

  const handleOpenRegisterForm = () => {
    setShowRegisterForm(true);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Left Sidebar */}
      <MapSidebar 
        apiKey={API_KEY}
        onSelectCategory={handleSelectCategory}
        categoryResults={categoryResults}
        setCategoryResults={setCategoryResults}
        setFocusedLocation={handleSetFocusedLocation}
      />
      
      {/* Map Main Container */}
      <MapContainer 
        apiKey={API_KEY}
        activeCategory={activeCategory}
        focusedLocation={focusedLocation}
        onCategoryResultsChange={setCategoryResults}
        setFocusedLocation={setFocusedLocation}
        setShowRegisterForm={setShowRegisterForm}
      />

      {/* Floating Register Action Button (Top Right) */}
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

      {/* Register Place Form Modal (Sliding from Right) */}
      {showRegisterForm && (
        <RegisterPlaceForm 
          apiKey={API_KEY}
          focusedLocation={focusedLocation}
          setFocusedLocation={setFocusedLocation}
          onClose={() => setShowRegisterForm(false)}
        />
      )}
    </div>
  );
}