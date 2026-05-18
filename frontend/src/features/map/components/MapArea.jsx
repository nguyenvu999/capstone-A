// // MapArea.jsx
// // Bản đơn giản để fix lỗi useState

// import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
// import { useNavigate } from 'react-router-dom'
// import { MapPin, Star } from 'lucide-react'
// import L from 'leaflet'
// import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '../constants/mapConstants'

// // Fix Leaflet default marker icon
// delete L.Icon.Default.prototype._getIconUrl
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
//   iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
//   shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
// })

// function MapArea({ places = [], center = DEFAULT_MAP_CENTER, isLoading }) {
//   const navigate = useNavigate()

//   const handleViewDetails = (placeId) => {
//     navigate(`/place/${placeId}`)
//   }

//   return (
//     <div className="h-full w-full relative">
//       <MapContainer
//         center={[center.lat, center.lng]}
//         zoom={DEFAULT_MAP_ZOOM}
//         style={{ height: '100%', width: '100%' }}
//         className="rounded-xl"
//       >
//         <TileLayer
//           attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//         />

//         {places.map((place) => (
//           <Marker
//             key={place.id}
//             position={[place.latitude, place.longitude]}
//           >
//             <Popup>
//               <div className="min-w-[200px]">
//                 {place.images && place.images.length > 0 && (
//                   <img
//                     src={place.images[0].url}
//                     alt={place.name}
//                     className="h-24 w-full rounded-lg object-cover mb-2"
//                   />
//                 )}

//                 <h3 className="font-semibold text-[#001910]">
//                   {place.name}
//                 </h3>

//                 {place.categories && place.categories.length > 0 && (
//                   <div className="mt-1 flex flex-wrap gap-1">
//                     {place.categories.map((cat) => (
//                       <span
//                         key={cat.id}
//                         className="rounded-full px-2 py-0.5 text-xs"
//                         style={{
//                           backgroundColor: `${cat.color || '#355e1d'}20`,
//                           color: cat.color || '#355e1d',
//                         }}
//                       >
//                         {cat.name}
//                       </span>
//                     ))}
//                   </div>
//                 )}

//                 {place.rating && (
//                   <div className="mt-2 flex items-center gap-1">
//                     <Star size={14} className="fill-yellow-400 text-yellow-400" />
//                     <span className="text-sm font-medium">{place.rating}</span>
//                     {place.review_count && (
//                       <span className="text-xs text-[#64748B]">
//                         ({place.review_count} reviews)
//                       </span>
//                     )}
//                   </div>
//                 )}

//                 {place.price_level && (
//                   <div className="mt-1 text-sm text-[#64748B]">
//                     {'$'.repeat(place.price_level)}
//                   </div>
//                 )}

//                 <button
//                   onClick={() => handleViewDetails(place.id)}
//                   className="mt-2 w-full rounded-lg bg-[#355e1d] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#2d4f18]"
//                 >
//                   View Details
//                 </button>
//               </div>
//             </Popup>
//           </Marker>
//         ))}
//       </MapContainer>

//       {!isLoading && places.length === 0 && (
//         <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-xl pointer-events-none">
//           <div className="text-center">
//             <MapPin size={48} className="mx-auto text-[#8ea183]" />
//             <p className="mt-4 text-sm text-[#64748B]">No places to display</p>
//             <p className="mt-1 text-xs text-[#94A3B8]">Try adjusting your filters</p>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// export default MapArea

// import { MapPin } from "lucide-react"

//function MapArea() {
//  return (
//    <div className="flex h-full w-full items-center justify-center rounded-[24px] border border-[#E0E0E0] bg-[#F5F5F5]">
//      <div className="px-6 text-center">
//        <MapPin size={40} className="mx-auto text-[#999]" />
//       <p className="mt-4 text-lg font-medium text-[#1B2A4A]">
//          Interactive Map Area
//        </p>
//        <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[#666]">
//          Map will appear here (Leaflet integration pending)
//      </p>
//      </div>
//    </div>
//  )
//}


// MapArea.jsx
// Hiển thị Leaflet map bằng vanilla JS
// Hiển thị markers cho:
// 1. Places từ database
// 2. User current location (marker xanh)
// 3. Search result location (marker đỏ)

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Import marker icons
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png"
import markerIcon from "leaflet/dist/images/marker-icon.png"
import markerShadow from "leaflet/dist/images/marker-shadow.png"

// Fix Leaflet default icon paths
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

function MapArea({ places = [], isLoading, userLocation, searchLocation }) {
  // ==================== REFS ====================
  
  // Ref cho DOM container của map
  const mapContainerRef = useRef(null)
  
  // Ref cho Leaflet map instance
  const mapRef = useRef(null)
  
  // Ref cho danh sách markers của places
  const markersRef = useRef([])
  
  // Ref cho marker của search result
  const searchMarkerRef = useRef(null)
  
  // Ref cho marker của user location
  const userMarkerRef = useRef(null)

  // ==================== EFFECTS ====================

  // Effect 1: Initialize map khi component mount
  useEffect(() => {
    // Nếu map đã tồn tại rồi thì không tạo lại
    if (mapRef.current) return

    // Tạo map mới với center mặc định (HCMC)
    const map = L.map(mapContainerRef.current, {
      center: [10.7769, 106.7009],
      zoom: 14,
      zoomControl: true,
    })

    // Thêm tile layer từ OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    // Lưu map instance vào ref
    mapRef.current = map

    // Cleanup: xóa map khi component unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Effect 2: Hiển thị user location marker
  useEffect(() => {
    const map = mapRef.current
    if (!map || !userLocation) return

    // Xóa marker cũ nếu có
    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current)
    }

    // Tạo icon màu xanh cho user location
    const blueIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })

    // Tạo marker cho user location
    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
      icon: blueIcon
    })
      .addTo(map)
      .bindPopup("<strong>You are here</strong>")

    // Zoom map về vị trí user (chỉ lần đầu tiên)
    map.setView([userLocation.lat, userLocation.lng], 14)

    // Cleanup: xóa marker khi user location thay đổi hoặc component unmount
    return () => {
      if (userMarkerRef.current && map) {
        map.removeLayer(userMarkerRef.current)
      }
    }
  }, [userLocation])

  // Effect 3: Update markers cho places từ database
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Xóa tất cả markers cũ của places
    markersRef.current.forEach((marker) => {
      map.removeLayer(marker)
    })
    markersRef.current = []

    // Thêm markers mới cho mỗi place
    places.forEach((place) => {
      const marker = L.marker([place.latitude, place.longitude])
        .addTo(map)
        .bindPopup(`
          <div style="min-width: 150px;">
            <strong>${place.name}</strong><br/>
            ${place.address || ''}
          </div>
        `)

      markersRef.current.push(marker)
    })

    // Nếu có places, fit map bounds để hiển thị tất cả
    if (places.length > 0) {
      const bounds = L.latLngBounds(
        places.map((p) => [p.latitude, p.longitude])
      )
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [places])

  // Effect 4: Zoom đến vị trí search
  useEffect(() => {
    const map = mapRef.current
    if (!map || !searchLocation) return

    // Xóa search marker cũ
    if (searchMarkerRef.current) {
      map.removeLayer(searchMarkerRef.current)
    }

    // Tạo icon màu đỏ cho search result
    const redIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })

    // Tạo marker mới cho search result
    searchMarkerRef.current = L.marker([searchLocation.lat, searchLocation.lng], {
      icon: redIcon
    })
      .addTo(map)
      .bindPopup(`<strong>${searchLocation.name}</strong>`)
      .openPopup()

    // Zoom đến vị trí search
    map.setView([searchLocation.lat, searchLocation.lng], 16)
  }, [searchLocation])

  // ==================== RENDER ====================

  return (
    <div className="h-full w-full">
      {/* Map container - Leaflet sẽ render vào đây */}
      <div ref={mapContainerRef} className="h-full w-full rounded-xl" />
    </div>
  )
}

export default MapArea
