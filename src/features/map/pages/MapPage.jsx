import { useState } from "react"
import MapNavbar from "../components/MapNavbar"
import FilterSidebar from "../components/FilterSidebar"
import NearbyPlacesList from "../components/NearbyPlacesList"
import MapArea from "../components/MapArea"
import RegisterPlaceDrawer from "../components/RegisterPlaceDrawer"

const mockPlaces = []

function MapPage() {
  const [showRegisterPlace, setShowRegisterPlace] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Called by RegisterPlaceDrawer after saving a location
  const handleLocationSaved = () => {
    setRefreshTrigger((n) => n + 1)
  }

  return (
    <div className='flex h-screen flex-col overflow-hidden [font-family:"Nunito_Sans",sans-serif]'>
      <MapNavbar onRegisterPlaceClick={() => setShowRegisterPlace(true)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="hidden flex-col border-r border-[#D4E5C4] bg-white lg:flex lg:w-[380px]">
          <div className="min-h-0 flex-1 overflow-hidden">
            <FilterSidebar
              totalPlaces={mockPlaces.length}
              filteredPlaces={mockPlaces.length}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-hidden border-t border-[#D4E5C4]">
            <NearbyPlacesList places={mockPlaces} refreshTrigger={refreshTrigger} />
          </div>
        </div>

        {/* Map */}
        <div className="relative flex-1">
          <MapArea />
        </div>
      </div>

      <RegisterPlaceDrawer
        isOpen={showRegisterPlace}
        onClose={() => setShowRegisterPlace(false)}
        onLocationSaved={handleLocationSaved}
      />
    </div>
  )
}

export default MapPage
