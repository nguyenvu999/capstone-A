// // MapPage.jsx
// // Trang chính hiển thị map, filters, nearby places

// import { useState } from "react"
// import MapNavbar from "../components/MapNavbar"
// import FilterSidebar from "../components/FilterSidebar"
// import NearbyPlacesList from "../components/NearbyPlacesList"
// import MapArea from "../components/MapArea"
// import RegisterPlaceDrawer from "../components/RegisterPlaceDrawer"
// // import { getPlaces } from "../api/placesApi"  // TẠM THỜI COMMENT OUT
// import { DEFAULT_MAP_CENTER } from "../constants/mapConstants"

// function MapPage() {
//   // Places data - TẠM THỜI ĐỂ TRỐNG
//   const [places] = useState([])
//   const [totalPlaces] = useState(0)
//   const [isLoading] = useState(false)

//   // Filters - TẠM THỜI KHÔNG DÙNG
//   // const [filters, setFilters] = useState({})

//   // UI state
//   const [showRegisterPlace, setShowRegisterPlace] = useState(false)

//   // TẠM THỜI DISABLE fetchPlaces vì backend chưa có endpoint
//   // useEffect(() => {
//   //   fetchPlaces()
//   // }, [filters])

//   // const fetchPlaces = async () => {
//   //   setIsLoading(true)
//   //   try {
//   //     const response = await getPlaces({
//   //       lat: DEFAULT_MAP_CENTER.lat,
//   //       lng: DEFAULT_MAP_CENTER.lng,
//   //       radius: DEFAULT_NEARBY_RADIUS,
//   //       ...filters,
//   //     })
//   //     setPlaces(response.data || [])
//   //     setTotalPlaces(response.total || 0)
//   //   } catch (error) {
//   //     console.error('Failed to fetch places:', error)
//   //     setPlaces([])
//   //     setTotalPlaces(0)
//   //   } finally {
//   //     setIsLoading(false)
//   //   }
//   // }

//   // Handle filter change - TẠM THỜI DISABLE
//   const handleFilterChange = () => {
//     // setFilters(newFilters)
//     console.log('Filter changed - waiting for backend')
//   }

//   // Handle search - TẠM THỜI DISABLE
//   const handleSearch = () => {
//     // setFilters((prev) => ({
//     //   ...prev,
//     //   search: searchQuery || null,
//     // }))
//     console.log('Search - waiting for backend')
//   }

//   // Handle place added
//   const handlePlaceAdded = () => {
//     // fetchPlaces()
//     console.log('Place added - waiting for backend to refresh')
//   }

//   return (
//     <div className='flex h-screen flex-col overflow-hidden [font-family:"Nunito_Sans",sans-serif]'>
//       {/* Navbar */}
//       <MapNavbar
//         onRegisterPlaceClick={() => setShowRegisterPlace(true)}
//         onSearch={handleSearch}
//       />

//       {/* Main content */}
//       <div className="flex flex-1 overflow-hidden">
//         {/* Left: stacked panel (filters + nearby) — desktop only */}
//         <div className="hidden flex-col border-r border-[#D4E5C4] bg-white lg:flex lg:w-[380px]">
//           {/* Top: Filters */}
//           <div className="min-h-0 flex-1 overflow-hidden">
//             <FilterSidebar
//               totalPlaces={totalPlaces}
//               filteredPlaces={places.length}
//               onFilterChange={handleFilterChange}
//             />
//           </div>

//           {/* Bottom: Nearby Places */}
//           <div className="min-h-0 flex-1 overflow-hidden border-t border-[#D4E5C4]">
//             <NearbyPlacesList places={places} isLoading={isLoading} />
//           </div>
//         </div>

//         {/* Right: Map area */}
//         <div className="relative flex-1">
//           <MapArea places={places} isLoading={isLoading} />
//         </div>
//       </div>

//       {/* Register Place Drawer */}
//       <RegisterPlaceDrawer
//         isOpen={showRegisterPlace}
//         onClose={() => setShowRegisterPlace(false)}
//         onPlaceAdded={handlePlaceAdded}
//       />
//     </div>
//   )
// }

// export default MapPage

import { useState } from "react"
import MapNavbar from "../components/MapNavbar"
import FilterSidebar from "../components/FilterSidebar"
import NearbyPlacesList from "../components/NearbyPlacesList"
import MapArea from "../components/MapArea"
import RegisterPlaceDrawer from "../components/RegisterPlaceDrawer"

const mockPlaces = []

function MapPage() {
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