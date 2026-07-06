import { useEffect, useRef } from "react";
import trackasiagl from "trackasia-gl";
import { Navigation } from "lucide-react";

export default function MapContainer({ 
  apiKey, 
  places,
  onPlaceClick,
  focusedLocation,
  setFocusedLocation,
  onBuildingClick,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const focusMarkerRef = useRef(null);
  const userLocationMarkerRef = useRef(null);
  const userCoordsRef = useRef([106.694945, 10.769034]);

  // Initialize map
  useEffect(() => {
    if (!document.getElementById("pulse-marker-style")) {
      const style = document.createElement("style");
      style.id = "pulse-marker-style";
      style.innerHTML = `
        .user-pulse-marker { width: 16px; height: 16px; background: #2563eb; border: 2px solid white; border-radius: 50%; position: relative; box-shadow: 0 0 8px rgba(0,0,0,0.3); z-index: 10; }
        .user-pulse-marker::after { content: ''; width: 40px; height: 40px; background: rgba(37, 99, 235, 0.4); border-radius: 50%; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.5); animation: mapPulse 2s infinite ease-out; opacity: 0; }
        @keyframes mapPulse { 0% { transform: translate(-50%, -50%) scale(0.2); opacity: 0; } 50% { opacity: 0.8; } 100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; } }
        .focused-place-popup { z-index: 99999 !important; }
      `;
      document.head.appendChild(style);
    }

    mapRef.current = new trackasiagl.Map({
      container: mapContainerRef.current,
      style: `https://maps.track-asia.com/styles/v2/streets.json?key=${apiKey}`,
      center: userCoordsRef.current,
      zoom: 13,
    });

    mapRef.current.on("load", () => {
      getUserCurrentLocation(true);
    });

    return () => {
      mapRef.current?.remove();
      userLocationMarkerRef.current?.remove();
    };
  }, [apiKey]);

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
          mapRef.current.flyTo({ center: [longitude, latitude], zoom: 14, essential: true });
        }

        if (userLocationMarkerRef.current) userLocationMarkerRef.current.remove();

        const el = document.createElement("div");
        el.className = "user-pulse-marker";

        userLocationMarkerRef.current = new trackasiagl.Marker({ element: el })
          .setLngLat([longitude, latitude])
          .setPopup(new trackasiagl.Popup({ offset: 10 }).setHTML("<p class='text-xs font-semibold px-1'>Your Location</p>"))
          .addTo(mapRef.current);
      },
      (error) => console.error("Geolocation error:", error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleRecenter = () => {
    getUserCurrentLocation(true);
  };

  // Render markers for ALL places - WITH BUILDING GROUPING
  useEffect(() => {
    if (!mapRef.current || !places) return;
    
    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // ===== STEP 1: GROUP PLACES BY BUILDING ADDRESS =====
    const buildingGroups = {};
    const standalonePlaces = [];

    places.forEach(place => {
      if (place.place_type === "building" && place.building_address) {
        if (!buildingGroups[place.building_address]) {
          buildingGroups[place.building_address] = [];
        }
        buildingGroups[place.building_address].push(place);
      } else {
        standalonePlaces.push(place);
      }
    });

    // ===== STEP 2: RENDER BUILDING MARKERS =====
    Object.entries(buildingGroups).forEach(([buildingAddress, bPlaces]) => {
      const firstPlace = bPlaces[0];
      const lat = Number(firstPlace.latitude);
      const lng = Number(firstPlace.longitude);
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

      const el = document.createElement("div");
      el.className = "w-10 h-10 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer group z-20 bg-gray-700";
      el.innerHTML = `<span class="text-xl">🏢</span>`;

      const hoverPopup = new trackasiagl.Popup({ offset: [0, -20], closeButton: false, closeOnClick: false })
        .setHTML(`<div class="p-1.5 max-w-xs text-slate-800"><div class="font-bold text-xs line-clamp-1">${firstPlace.building_name || "Building"}</div></div>`);

      el.addEventListener("mouseenter", () => hoverPopup.setLngLat([lng, lat]).addTo(mapRef.current));
      el.addEventListener("mouseleave", () => hoverPopup.remove());

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        hoverPopup.remove();

        mapRef.current.flyTo({ center: [lng, lat], essential: true });

        if (focusMarkerRef.current) {
          focusMarkerRef.current.remove();
          focusMarkerRef.current = null;
        }

        const pin = document.createElement("div");
        pin.className = "w-10 h-10 flex items-center justify-center cursor-pointer drop-shadow-md z-30";
        pin.innerHTML = `<img src="/pin_map_dot.svg" style="width: 100%; height: 100%; object-fit: contain;" />`;

        const buildingPopupHTML = `
          <div class="p-2">
            <div class="font-bold text-sm mb-1">${firstPlace.building_name || "Building"}</div>
            <div class="text-xs text-gray-600 mb-1">${bPlaces.length} place${bPlaces.length > 1 ? 's' : ''} inside</div>
            <div class="text-xs text-gray-600 mb-2">${buildingAddress}</div>
            <button class="see-building-details-btn w-full px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors">
              See Details
            </button>
          </div>
        `;

        const buildingPopup = new trackasiagl.Popup({ offset: [0, -32], closeButton: true, closeOnClick: false, className: "focused-place-popup" })
          .setHTML(buildingPopupHTML);

        buildingPopup.on("close", () => {
          if (focusMarkerRef.current) {
            focusMarkerRef.current.remove();
            focusMarkerRef.current = null;
          }
          setFocusedLocation(null);
          getUserCurrentLocation(true);
        });

        focusMarkerRef.current = new trackasiagl.Marker({ element: pin, anchor: "bottom" })
          .setLngLat([lng, lat])
          .setPopup(buildingPopup)
          .addTo(mapRef.current)
          .togglePopup();

        setTimeout(() => {
          const btn = document.querySelector('.see-building-details-btn');
          if (btn) {
            btn.addEventListener('click', (e) => {
              e.stopPropagation();
              if (onBuildingClick) onBuildingClick(buildingAddress, bPlaces);
            });
          }
        }, 100);
      });

      const m = new trackasiagl.Marker({ element: el, anchor: "center" }).setLngLat([lng, lat]).addTo(mapRef.current);
      markersRef.current.push(m);
    });

    // ===== STEP 3: RENDER STANDALONE MARKERS =====
    standalonePlaces.forEach(place => {
      const lat = Number(place.latitude);
      const lng = Number(place.longitude);
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

      const el = document.createElement("div");
      el.className = "w-10 h-10 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer group z-20";
      
      const category = (place.category || "").toLowerCase();
      let markerConfig = { bgColor: "#3b82f6", iconHtml: `🏢` };

      if (category === "restaurant") {
        markerConfig = { bgColor: "#fb923c", iconHtml: `<img src="/restaurant-icon.png" class="w-6 h-6 object-contain transition-transform duration-200 group-hover:scale-110" />` };
      } else if (category === "bar") {
        markerConfig = { bgColor: "#a855f7", iconHtml: `<span class="text-xl">🍷</span>` };
      } else if (category === "beverage") {
        markerConfig = { bgColor: "#8b5cf6", iconHtml: `<span class="text-xl">☕</span>` };
      } else if (category === "sight") {
        markerConfig = { bgColor: "#3b82f6", iconHtml: `<span class="text-xl">👁️</span>` };
      } else if (category === "entertainment") {
        markerConfig = { bgColor: "#ec4899", iconHtml: `<img src="/park_map_icon.png" class="w-6 h-6 object-contain transition-transform duration-200 group-hover:scale-110" />` };
      } else if (category === "team_event") {
        markerConfig = { bgColor: "#10b981", iconHtml: `<span class="text-xl">👥</span>` };
      }

      el.style.backgroundColor = markerConfig.bgColor;
      el.innerHTML = markerConfig.iconHtml;

      const hoverPopup = new trackasiagl.Popup({ offset: [0, -20], closeButton: false, closeOnClick: false })
        .setHTML(`<div class="p-1.5 max-w-xs text-slate-800"><div class="font-bold text-xs line-clamp-1">${place.name || "Location"}</div></div>`);

      el.addEventListener("mouseenter", () => hoverPopup.setLngLat([lng, lat]).addTo(mapRef.current));
      el.addEventListener("mouseleave", () => hoverPopup.remove());

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        hoverPopup.remove();
        setFocusedLocation({
          lat: lat,
          lng: lng,
          name: place.name,
          address: place.address,
          rating: place.rating || 0,
          place_type: place.place_type,
          building_name: place.building_name,
          floor_level: place.floor_level,
        });
      });

      const m = new trackasiagl.Marker({ element: el, anchor: "center" }).setLngLat([lng, lat]).addTo(mapRef.current);
      markersRef.current.push(m);
    });
  }, [places]);

  // Render focused location popup
  useEffect(() => {
    if (!focusedLocation || !focusedLocation.lat || !focusedLocation.lng || !mapRef.current) return;
    
    const { lat, lng, name, address, rating } = focusedLocation;

    mapRef.current.flyTo({ center: [Number(lng), Number(lat)], essential: true });
    
    if (focusMarkerRef.current) {
      focusMarkerRef.current.remove();
      focusMarkerRef.current = null;
    }

    const pin = document.createElement("div");
    pin.className = "w-10 h-10 flex items-center justify-center cursor-pointer drop-shadow-md z-30";
    pin.innerHTML = `<img src="/pin_map_dot.svg" style="width: 100%; height: 100%; object-fit: contain;" />`;
    
    const renderStars = (rating) => {
      const filledStars = Math.floor(rating);
      const hasHalfStar = rating % 1 > 0;
      let stars = '★'.repeat(filledStars);
      if (hasHalfStar) stars += '☆';
      const emptyStarsNeeded = 5 - filledStars - (hasHalfStar ? 1 : 0);
      stars += '☆'.repeat(emptyStarsNeeded);
      return stars;
    };

    const displayName = focusedLocation.place_type === "building" && focusedLocation.building_name
      ? `${name} · Level ${focusedLocation.floor_level}, ${focusedLocation.building_name}`
      : (name || "Selected Location");

    const popupHTML = `
      <div class="p-2">
        <div class="font-bold text-sm mb-1">${displayName}</div>
        ${rating ? `
          <div class="flex items-center gap-1 mb-1">
            <span class="text-yellow-500 text-sm">${renderStars(rating)}</span>
            <span class="text-xs text-gray-600">${Number(rating).toFixed(1)}</span>
          </div>
        ` : ''}
        <div class="text-xs text-gray-600 mb-2">${address || ""}</div>
        <button class="see-details-btn w-full px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors">
          See Details
        </button>
      </div>
    `;
    
    const focusPopup = new trackasiagl.Popup({ offset: [0, -32], closeButton: true, closeOnClick: false, className: "focused-place-popup" })
      .setHTML(popupHTML);
    
    focusPopup.on("close", () => {
      if (focusMarkerRef.current) {
        focusMarkerRef.current.remove();
        focusMarkerRef.current = null;
      }
      setFocusedLocation(null);
      getUserCurrentLocation(true);
    });
    
    focusMarkerRef.current = new trackasiagl.Marker({ element: pin, anchor: "bottom" })
      .setLngLat([Number(lng), Number(lat)])
      .setPopup(focusPopup)
      .addTo(mapRef.current)
      .togglePopup();
    
    setTimeout(() => {
      const seeDetailsBtn = document.querySelector('.see-details-btn');
      if (seeDetailsBtn && onPlaceClick) {
        seeDetailsBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const clickedPlace = places.find(p => 
            Math.abs(Number(p.latitude) - Number(lat)) < 0.0001 && 
            Math.abs(Number(p.longitude) - Number(lng)) < 0.0001
          );
          if (clickedPlace) onPlaceClick(clickedPlace);
        });
      }
    }, 100);
  }, [focusedLocation]);

  return (
    <div className="relative h-full w-full flex-1 z-0">
      <div ref={mapContainerRef} className="h-full w-full" />
      
      {/* Recenter Button */}
      <div className="absolute bottom-6 right-6 z-40">
        <div className="bg-white rounded-full shadow-xl border border-gray-200 p-2">
          <button 
            onClick={handleRecenter}
            className="p-2.5 bg-gray-50 hover:bg-gray-100 text-blue-600 rounded-full transition-all active:scale-95"
            aria-label="Back to my location"
          >
            <Navigation size={18} className="fill-blue-50" />
          </button>
        </div>
      </div>
    </div>
  );
}