
// MapArea.jsx
// Hiển thị Leaflet map bằng vanilla JS
// Hiển thị markers cho places và search results

import useUserLocation from "../hooks/useUserLocation"
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

function MapArea({ places = [], isLoading, searchLocation }) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const searchMarkerRef = useRef(null)

  const userLocation = useUserLocation()
  const userMarkerRef = useRef(null)
  const hasCenteredRef = useRef(false)

  // Initialize map khi component mount
  useEffect(() => {
    if (mapRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [10.7769, 106.7009],
      zoom: 14,
      zoomControl: true,
    })

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }
    ).addTo(map)

    mapRef.current = map

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Update markers khi places thay đổi
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Xóa tất cả markers cũ
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
            ${place.address || ""}
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

  // Zoom đến vị trí search
  useEffect(() => {
    const map = mapRef.current

    if (!map || !searchLocation) return

    // Xóa search marker cũ
    if (searchMarkerRef.current) {
      map.removeLayer(searchMarkerRef.current)
    }

    // Tạo icon màu đỏ cho search result
    const redIcon = L.icon({
      iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    })

    // Tạo marker mới cho search result
    searchMarkerRef.current = L.marker(
      [searchLocation.lat, searchLocation.lng],
      {
        icon: redIcon,
      }
    )
      .addTo(map)
      .bindPopup(`<strong>${searchLocation.name}</strong>`)
      .openPopup()

    // Zoom đến vị trí
    map.setView([searchLocation.lat, searchLocation.lng], 16)
  }, [searchLocation])

  // Hiển thị user location
  useEffect(() => {
    const map = mapRef.current

    if (!map || !userLocation) return

    const pulseIcon = L.divIcon({
      className: "",
      html: `<div class="pulse-marker"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    })

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker(
        [userLocation.lat, userLocation.lng],
        {
          icon: pulseIcon,
        }
      )
        .addTo(map)
        .bindPopup("📍 You are here")
    } else {
      userMarkerRef.current.setLatLng([
        userLocation.lat,
        userLocation.lng,
      ])
    }

    // Chỉ center map 1 lần
    if (!hasCenteredRef.current) {
      map.setView([userLocation.lat, userLocation.lng], 15)
      hasCenteredRef.current = true
    }
  }, [userLocation])

  return (
    <div className="h-full w-full">
      <div
        ref={mapContainerRef}
        className="h-full w-full rounded-xl"
      />
    </div>
  )
}

export default MapArea

