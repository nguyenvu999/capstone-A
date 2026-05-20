import { useEffect, useState } from "react"

export default function useUserLocation() {
  const [location, setLocation] = useState(null)

  useEffect(() => {
    if (!navigator.geolocation) return

    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setLocation({
          lat: coords.latitude,
          lng: coords.longitude,
        })
      }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  return location
}
