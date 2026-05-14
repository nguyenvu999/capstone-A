import { useState } from "react"
import MapNavbar from "../components/MapNavbar"
import FilterSidebar from "../components/FilterSidebar"
import NearbyPlacesList from "../components/NearbyPlacesList"
import MapArea from "../components/MapArea"
import RegisterPlaceDrawer from "../components/RegisterPlaceDrawer"
// import { mockPlaces } from "../data/mockPlaces"
const mockPlaces = []

function MapPage() {
  // const [selectedPlace, setSelectedPlace] = useState(null)
  const [showRegisterPlace, setShowRegisterPlace] = useState(false)

  return (
    <div className='flex h-screen flex-col overflow-hidden [font-family:"Nunito_Sans",sans-serif]'>
      {/* Navbar */}
      <MapNavbar onRegisterPlaceClick={() => setShowRegisterPlace(true)} />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: stacked panel (filters + nearby) — desktop only */}
        <div className="hidden flex-col border-r border-[#D4E5C4] bg-white lg:flex lg:w-[380px]">
          {/* Top: Filters */}
          <div className="min-h-0 flex-1 overflow-hidden">
            <FilterSidebar
              totalPlaces={mockPlaces.length}
              filteredPlaces={mockPlaces.length}
            />
          </div>

          {/* Bottom: Nearby Places */}
          <div className="min-h-0 flex-1 overflow-hidden border-t border-[#D4E5C4]">
            <NearbyPlacesList places={mockPlaces} />
          </div>
        </div>

        {/* Right: Map area */}
        <div className="relative flex-1">
          <MapArea />
        </div>

        
      </div>

      {/* Register Place Drawer */}
      <RegisterPlaceDrawer
        isOpen={showRegisterPlace}
        onClose={() => setShowRegisterPlace(false)}
      />
    </div>
  )
}

export default MapPage