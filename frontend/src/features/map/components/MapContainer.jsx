import { useEffect, useRef } from "react";
import trackasiagl from "trackasia-gl";
import { Navigation } from "lucide-react"; 

export default function MapContainer({ 
  apiKey, 
  activeCategory, 
  focusedLocation, 
  onCategoryResultsChange,
  setFocusedLocation,   
  setShowRegisterForm   
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);               
  const focusMarkerRef = useRef(null);         
  const userLocationMarkerRef = useRef(null);  
  const userCoordsRef = useRef([106.694945, 10.769034]); 

  const handleRecenter = () => {
    getUserCurrentLocation(true);
  };

  const getUserCurrentLocation = (shouldFlyTo = false) => {
    if (!navigator.geolocation) {
      alert("Your browser does not support geolocation.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        userCoordsRef.current = [longitude, latitude]; 

        if (!mapRef.current) return;

        if (shouldFlyTo) {
          mapRef.current.flyTo({
            center: [longitude, latitude],
            zoom: 15,
            essential: true,
          });
        }

        if (userLocationMarkerRef.current) {
          userLocationMarkerRef.current.remove();
        }

        const el = document.createElement("div");
        el.className = "user-pulse-marker";

        userLocationMarkerRef.current = new trackasiagl.Marker({ element: el })
          .setLngLat([longitude, latitude])
          .setPopup(new trackasiagl.Popup({ offset: 10 }).setHTML("<p class='text-xs font-semibold px-1'>Your Location</p>"))
          .addTo(mapRef.current);
      },
      (error) => {
        console.error("Location error:", error);
        if (error.code === 3) fallbackLocation(shouldFlyTo);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const fallbackLocation = (shouldFlyTo) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        userCoordsRef.current = [longitude, latitude];
        if (!mapRef.current) return;

        if (shouldFlyTo) {
          mapRef.current.flyTo({ center: [longitude, latitude], zoom: 15 });
        }
        if (userLocationMarkerRef.current) userLocationMarkerRef.current.remove();

        const el = document.createElement("div");
        el.className = "user-pulse-marker";
        userLocationMarkerRef.current = new trackasiagl.Marker({ element: el })
          .setLngLat([longitude, latitude])
          .addTo(mapRef.current);
      },
      (err) => console.error("Fallback failed:", err),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: Infinity }
    );
  };

  // 1. Initialize Map
  useEffect(() => {
    if (!document.getElementById("pulse-marker-style")) {
      const style = document.createElement("style");
      style.id = "pulse-marker-style";
      style.innerHTML = `
        .user-pulse-marker {
          width: 16px;
          height: 16px;
          background: #2563eb;
          border: 2px solid white;
          border-radius: 50%;
          position: relative;
          box-shadow: 0 0 8px rgba(0,0,0,0.3);
        }
        .user-pulse-marker::after {
          content: '';
          width: 40px;
          height: 40px;
          background: rgba(37, 99, 235, 0.4);
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0.5);
          animation: mapPulse 2s infinite ease-out;
          opacity: 0;
        }
        @keyframes mapPulse {
          0% { transform: translate(-50%, -50%) scale(0.2); opacity: 0; }
          50% { opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    mapRef.current = new trackasiagl.Map({
      container: mapContainerRef.current,
      style: `https://maps.track-asia.com/styles/v2/streets.json?key=${apiKey}&detailLevel=none`,
      center: userCoordsRef.current,
      zoom: 13,
    });

    mapRef.current.on("load", () => {
      getUserCurrentLocation(true);
    });

    // MAP CLICK CAPTURE
    mapRef.current.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      
      if (e.originalEvent.target.closest('.user-pulse-marker') || e.originalEvent.target.closest('img') || e.originalEvent.target.closest('.rounded-full')) {
        return; 
      }

      onCategoryResultsChange([]); 
      setFocusedLocation({
        lat: lat,
        lng: lng,
        name: "",
        address: `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
      });
      setShowRegisterForm(true);
    });

    return () => {
      mapRef.current?.remove();
      userLocationMarkerRef.current?.remove();
    };
  }, [apiKey]);

  // 2. Category Search
  useEffect(() => {
    if (!mapRef.current) return;
    if (!activeCategory) {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      return;
    }

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    const [lng, lat] = userCoordsRef.current;
    
    fetch(`https://maps.track-asia.com/api/v2/place/nearbysearch/json?location=${lat},${lng}&radius=3000&type=${activeCategory}&key=${apiKey}`)
      .then(res => res.json())
      .then(data => {
        if (data.results) {
          onCategoryResultsChange(data.results);
          data.results.forEach(place => {
            const el = document.createElement("div");
            el.className = "w-7 h-7 rounded-full border border-white shadow-md flex items-center justify-center cursor-pointer";
            el.style.backgroundColor = place.icon_background_color || "#3b82f6";
            el.innerHTML = `<img src="${place.icon}" style="width:14px; filter:brightness(0) invert(1)" />`;
            
            const m = new trackasiagl.Marker({ element: el })
              .setLngLat([place.geometry.location.lng, place.geometry.location.lat])
              .addTo(mapRef.current);
            markersRef.current.push(m);
          });
        }
      })
      .catch((err) => console.error("Nearby search error:", err));
  }, [activeCategory, apiKey, onCategoryResultsChange]);

  // 3. Camera Fly To & Pointer Focus
  useEffect(() => {
    if (!focusedLocation || !focusedLocation.lat || !focusedLocation.lng || !mapRef.current) return;
    const { lat, lng, name, address } = focusedLocation;
    
    mapRef.current.flyTo({ 
      center: [Number(lng), Number(lat)], 
      zoom: 16,
      essential: true 
    });
    
    focusMarkerRef.current?.remove();
    
    const pin = document.createElement("img");
    pin.src = "/pin_map_dot.svg"; 
    pin.style.width = "36px";     
    pin.style.height = "36px";
    pin.style.cursor = "pointer";
    
    focusMarkerRef.current = new trackasiagl.Marker({ element: pin, anchor: "bottom" })
      .setLngLat([Number(lng), Number(lat)])
      .setPopup(new trackasiagl.Popup({ offset: [0, -36] }).setHTML(`<b>${name || "Selected Point"}</b><br/>${address || ""}`))
      .addTo(mapRef.current)
      .togglePopup();
      
  }, [focusedLocation?.lat, focusedLocation?.lng, focusedLocation]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainerRef} className="h-full w-full" />
      
      {/* Recenter GPS Button */}
      <button 
        onClick={handleRecenter}
        className="absolute bottom-6 right-6 z-50 p-3 bg-white hover:bg-gray-50 text-blue-600 rounded-full shadow-xl border border-gray-100 transition-all active:scale-95 group"
        title="Recenter location"
      >
        <Navigation size={20} className="fill-blue-50 group-hover:rotate-45 transition-transform" />
      </button>
    </div>
  );
}