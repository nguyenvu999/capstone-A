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

// import { useState } from "react"
// import MapNavbar from "../components/MapNavbar"
// import FilterSidebar from "../components/FilterSidebar"
// import NearbyPlacesList from "../components/NearbyPlacesList"
// import MapArea from "../components/MapArea"
// import RegisterPlaceDrawer from "../components/RegisterPlaceDrawer"

// const mockPlaces = []

// function MapPage() {
//   const [showRegisterPlace, setShowRegisterPlace] = useState(false)

//   return (
//     <div className='flex h-screen flex-col overflow-hidden [font-family:"Nunito_Sans",sans-serif]'>
//       {/* Navbar */}
//       <MapNavbar onRegisterPlaceClick={() => setShowRegisterPlace(true)} />

//       {/* Main content */}
//       <div className="flex flex-1 overflow-hidden">
//         {/* Left: stacked panel (filters + nearby) — desktop only */}
//         <div className="hidden flex-col border-r border-[#D4E5C4] bg-white lg:flex lg:w-[380px]">
//           {/* Top: Filters */}
//           <div className="min-h-0 flex-1 overflow-hidden">
//             <FilterSidebar
//               totalPlaces={mockPlaces.length}
//               filteredPlaces={mockPlaces.length}
//             />
//           </div>

//           {/* Bottom: Nearby Places */}
//           <div className="min-h-0 flex-1 overflow-hidden border-t border-[#D4E5C4]">
//             <NearbyPlacesList places={mockPlaces} />
//           </div>
//         </div>

//         {/* Right: Map area */}
//         <div className="relative flex-1">
//           <MapArea />
//         </div>
//       </div>

//       {/* Register Place Drawer */}
//       <RegisterPlaceDrawer
//         isOpen={showRegisterPlace}
//         onClose={() => setShowRegisterPlace(false)}
//       />
//     </div>
//   )
// }

// export default MapPage

// MapPage.jsx
// Trang chính hiển thị map, filters, nearby places

// MapPage.jsx
// Trang chính hiển thị map, filters, nearby places

// MapPage.jsx
// Trang chính hiển thị map, filters, nearby places
// VERSION: Có GPS tracking để lấy current location

import { useState, useEffect, useRef } from "react"
import MapNavbar from "../components/MapNavbar"
import FilterSidebar from "../components/FilterSidebar"
import NearbyPlacesList from "../components/NearbyPlacesList"
import MapArea from "../components/MapArea"
import RegisterPlaceDrawer from "../components/RegisterPlaceDrawer"
import { getPlaces } from "../api/placesApi"
import { DEFAULT_MAP_CENTER, DEFAULT_NEARBY_RADIUS } from "../constants/mapConstants"

function MapPage() {
  // ==================== STATE ====================
  
  // Places data - danh sách places từ API
  const [places, setPlaces] = useState([])
  const [totalPlaces, setTotalPlaces] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Filters - lưu các điều kiện lọc từ FilterSidebar
  const [filters, setFilters] = useState({})

  // User location - vị trí GPS hiện tại của user
  const [userLocation, setUserLocation] = useState(null)

  // Search location - vị trí được search từ navbar
  const [searchLocation, setSearchLocation] = useState(null)

  // UI state - hiển thị drawer register place
  const [showRegisterPlace, setShowRegisterPlace] = useState(false)

  // Ref để tránh fetch lặp lại khi mount
  const hasFetchedRef = useRef(false)

  // ==================== EFFECTS ====================

  // Effect 1: Theo dõi GPS location của user liên tục (như code Khang)
  useEffect(() => {
    // Kiểm tra browser có hỗ trợ geolocation không
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser.')
      // Fallback: dùng tọa độ mặc định (HCMC center)
      setUserLocation({
        lat: DEFAULT_MAP_CENTER.lat,
        lng: DEFAULT_MAP_CENTER.lng,
      })
      return
    }

    // Theo dõi vị trí liên tục (watchPosition thay vì getCurrentPosition)
    const watchId = navigator.geolocation.watchPosition(
      // Success callback - mỗi khi vị trí thay đổi
      (position) => {
        const userPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        console.log('User location updated:', userPos)
        setUserLocation(userPos)
      },
      // Error callback - khi bị lỗi (user deny permission, timeout, etc.)
      (error) => {
        console.error('Geolocation error:', error)
        // Fallback: dùng tọa độ mặc định (HCMC center)
        setUserLocation({
          lat: DEFAULT_MAP_CENTER.lat,
          lng: DEFAULT_MAP_CENTER.lng,
        })
      },
      // Options - cấu hình tracking
      {
        enableHighAccuracy: true,  // Ưu tiên GPS thay vì WiFi/IP
        timeout: 15000,             // Timeout sau 15 giây nếu không lấy được GPS
        maximumAge: 5000            // Cache vị trí tối đa 5 giây
      }
    )

    // Cleanup: dừng tracking khi component unmount
    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  // Effect 2: Fetch places khi có user location (lần đầu tiên)
  useEffect(() => {
    // Chỉ fetch khi:
    // 1. Chưa fetch lần nào
    // 2. Đã có user location
    if (!hasFetchedRef.current && userLocation) {
      hasFetchedRef.current = true
      fetchPlaces()
    }
  }, [userLocation])

  // Effect 3: Fetch lại khi filters thay đổi (sau lần đầu)
  useEffect(() => {
    // Chỉ fetch khi đã fetch lần đầu rồi
    if (hasFetchedRef.current && Object.keys(filters).length > 0) {
      fetchPlaces()
    }
  }, [filters])

  // ==================== FUNCTIONS ====================

  // Hàm fetch places từ API
  const fetchPlaces = async () => {
    setIsLoading(true)
    try {
      // Gọi API với params:
      // - lat/lng: vị trí user (hoặc center mặc định)
      // - radius: bán kính tìm kiếm (5000m = 5km)
      // - filters: category, price, status, minRating, search
      const response = await getPlaces({
        lat: userLocation?.lat || DEFAULT_MAP_CENTER.lat,
        lng: userLocation?.lng || DEFAULT_MAP_CENTER.lng,
        radius: DEFAULT_NEARBY_RADIUS,
        ...filters,
      })

      console.log('API Response:', response)

      // Backend có thể trả về { data: [...] } hoặc [...] trực tiếp
      const placesData = response.data || response || []
      setPlaces(placesData)
      setTotalPlaces(response.total || placesData.length)
    } catch (error) {
      console.error('Failed to fetch places:', error)
      setPlaces([])
      setTotalPlaces(0)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle filter change từ FilterSidebar
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
  }

  // Handle search từ MapNavbar
  const handleSearch = (searchData) => {
    // searchData = { name, lat, lng }
    if (searchData && searchData.lat && searchData.lng) {
      // Zoom map đến vị trí search
      setSearchLocation(searchData)
    }
  }

  // Handle place added - refresh places sau khi user thêm place mới
  const handlePlaceAdded = () => {
    fetchPlaces()
  }

  // ==================== RENDER ====================

  return (
    <div className='flex h-screen flex-col overflow-hidden [font-family:"Nunito_Sans",sans-serif]'>
      {/* Navbar */}
      <MapNavbar
        onRegisterPlaceClick={() => setShowRegisterPlace(true)}
        onSearch={handleSearch}
      />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: stacked panel (filters + nearby) — desktop only */}
        <div className="hidden flex-col border-r border-[#D4E5C4] bg-white lg:flex lg:w-[380px]">
          {/* Top: Filters */}
          <div className="min-h-0 flex-1 overflow-hidden">
            <FilterSidebar
              totalPlaces={totalPlaces}
              filteredPlaces={places.length}
              onFilterChange={handleFilterChange}
            />
          </div>

          {/* Bottom: Nearby Places */}
          <div className="min-h-0 flex-1 overflow-hidden border-t border-[#D4E5C4]">
            <NearbyPlacesList places={places} isLoading={isLoading} />
          </div>
        </div>

        {/* Right: Map area */}
        <div className="relative flex-1">
          <MapArea 
            places={places} 
            isLoading={isLoading}
            userLocation={userLocation}
            searchLocation={searchLocation}
          />
        </div>
      </div>

      {/* Register Place Drawer */}
      <RegisterPlaceDrawer
        isOpen={showRegisterPlace}
        onClose={() => setShowRegisterPlace(false)}
        onPlaceAdded={handlePlaceAdded}
      />
    </div>
  )
}

export default MapPage