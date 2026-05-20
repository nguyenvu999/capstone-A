import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png"
import markerIcon from "leaflet/dist/images/marker-icon.png"
import markerShadow from "leaflet/dist/images/marker-shadow.png"

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})



function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistance(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(2)} km`
}

export function getDistanceFrom(userPos, lat, lng) {
  if (!userPos) return null
  return haversineKm(userPos.lat, userPos.lng, lat, lng)
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MapArea() {
  const mapDivRef       = useRef(null)
  const mapRef          = useRef(null)
  const userMarkerRef   = useRef(null)
  const savedMarkersRef = useRef([])
  const hasCenteredRef  = useRef(false)

  const [savedLocations, setSavedLocations] = useState([])

  // Init map
  useEffect(() => {
    if (mapRef.current) return
    const map = L.map(mapDivRef.current).setView([10.7769, 106.7009], 13)
L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  {
    attribution: "&copy; OpenStreetMap &copy; CARTO",
  }
).addTo(map)
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [])

  // GPS tracking
  useEffect(() => {
    if (!navigator.geolocation) return
    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords
        currentGPSPosition = { lat, lng }

        const map = mapRef.current
        if (!map) return

        if (!userMarkerRef.current) {
      const pulseIcon = L.divIcon({
  className: "",
  html: `<div class="pulse-marker"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

userMarkerRef.current = L.marker([lat, lng], {
  icon: pulseIcon,
})
  .addTo(map)
  .bindPopup("📍 You are here")
        } else {
          userMarkerRef.current.setLatLng([lat, lng])
        }

        if (!hasCenteredRef.current) {
          map.setView([lat, lng], 15)
          hasCenteredRef.current = true
        }
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  // Load locations
  useEffect(() => {
    loadSavedLocations().then(setSavedLocations)
  }, [])

  // Sync markers
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    savedMarkersRef.current.forEach((m) => map.removeLayer(m))
    savedMarkersRef.current = []
    savedLocations.forEach((loc) => {
      const m = L.marker([loc.lat, loc.lng]).addTo(map).bindPopup(`<strong>${loc.name}</strong>`)
      savedMarkersRef.current.push(m)
    })
  }, [savedLocations])

  return (
    <div className="relative h-full w-full">
      <div ref={mapDivRef} className="h-full w-full" />
    </div>
  )
}
