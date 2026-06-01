import { useEffect, useRef } from "react";
import trackasiagl from "trackasia-gl";
import { Navigation } from "lucide-react"; 
import "trackasia-gl/dist/trackasia-gl.css";

export default function MapContainer({ 
  apiKey, 
  activeCategory, 
  focusedLocation, 
  categoryResults, 
  onCategoryResultsChange,
  setFocusedLocation,   
  setShowRegisterForm,
  onUserLocationDetected,
  allPlaces,
  onPlaceClick
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);              
  const focusMarkerRef = useRef(null);         
  const userLocationMarkerRef = useRef(null);  
  const userCoordsRef = useRef([106.694945, 10.769034]); 

  // --- HELPER FUNCTION 1: Distance Calculation ---
  const appendDistanceToPlaces = (placesArray, userLat, userLng) => {
    if (!placesArray || placesArray.length === 0) return [];
    return placesArray.map(place => {
      const pLat = Number(place.latitude || place.geometry?.location?.lat || place.lat);
      const pLng = Number(place.longitude || place.geometry?.location?.lng || place.lng);
      
      if (isNaN(pLat) || isNaN(pLng)) {
        return { ...place, distanceText: "--- km" };
      }

      const R = 6371; // Bán kính Trái Đất (km)
      const dLat = ((pLat - userLat) * Math.PI) / 180;
      const dLon = ((pLng - userLng) * Math.PI) / 180;
      
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((userLat * Math.PI) / 180) *
          Math.cos((pLat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
          
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c; 

      return { 
        ...place, 
        latitude: pLat,
        longitude: pLng,
        distanceText: `${distance.toFixed(1)} km` 
      };
    });
  };

  // Xử lý khi user click nút "Recenter" (quay về vị trí hiện tại)
  const handleRecenter = () => {
    getUserCurrentLocation(true);
  };

  // Lấy vị trí GPS hiện tại của user
  const getUserCurrentLocation = (shouldFlyTo = false) => {
    if (!navigator.geolocation) {
      alert("Your browser does not support geolocation.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        userCoordsRef.current = [longitude, latitude]; 
        if (onUserLocationDetected) onUserLocationDetected([longitude, latitude]);
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

        // Đồng bộ khoảng cách dựa trên allPlaces của Supabase đổ về
        const placesWithDistance = appendDistanceToPlaces(allPlaces, latitude, longitude);
        onCategoryResultsChange(placesWithDistance);
      },
      (error) => {
        console.error("Geolocation error:", error);
        fallbackLocation(shouldFlyTo);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Fallback khi GPS độ chính xác cao lỗi
  const fallbackLocation = (shouldFlyTo) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        userCoordsRef.current = [longitude, latitude];
        if (onUserLocationDetected) onUserLocationDetected([longitude, latitude]);
        if (!mapRef.current) return;
        if (shouldFlyTo) mapRef.current.flyTo({ center: [longitude, latitude], zoom: 14 });
        if (userLocationMarkerRef.current) userLocationMarkerRef.current.remove();

        const el = document.createElement("div");
        el.className = "user-pulse-marker";
        userLocationMarkerRef.current = new trackasiagl.Marker({ element: el }).setLngLat([longitude, latitude]).addTo(mapRef.current);

        const placesWithDistance = appendDistanceToPlaces(allPlaces, latitude, longitude);
        onCategoryResultsChange(placesWithDistance);
      },
      (err) => console.error("Fallback geolocation failed:", err),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: Infinity }
    );
  };

  // 1. Initialize Map & Click Event Handling
  useEffect(() => {
    if (!document.getElementById("pulse-marker-style")) {
      const style = document.createElement("style");
      style.id = "pulse-marker-style";
      style.innerHTML = `
        .user-pulse-marker { width: 16px; height: 16px; background: #2563eb; border: 2px solid white; border-radius: 50%; position: relative; box-shadow: 0 0 8px rgba(0,0,0,0.3); z-index: 10; }
        .user-pulse-marker::after { content: ''; width: 40px; height: 40px; background: rgba(37, 99, 235, 0.4); border-radius: 50%; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.5); animation: mapPulse 2s infinite ease-out; opacity: 0; }
        @keyframes mapPulse { 0% { transform: translate(-50%, -50%) scale(0.2); opacity: 0; } 50% { opacity: 0.8; } 100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; } }
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

    mapRef.current.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      
      if (e.originalEvent.target.closest('.user-pulse-marker') || e.originalEvent.target.closest('img') || e.originalEvent.target.closest('.rounded-full')) {
        return; 
      }

      fetch(`https://maps.track-asia.com/api/v2/geocode/json?result_type=street_address&latlng=${lat},${lng}&key=${apiKey}&new_admin=true&include_old_admin=true&size=1&radius=100`)
        .then((res) => res.json())
        .then((data) => {
          let detectedAddress = `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          let detectedCity = "";

          if (data.status === "OK" && data.results && data.results.length > 0) {
            const topPlace = data.results[0];
            detectedAddress = topPlace.formatted_address || topPlace.name || detectedAddress;

            if (topPlace.address_components) {
              const cityComp = topPlace.address_components.find(comp => 
                comp.types.includes("administrative_area_level_1") || comp.types.includes("province")
              );
              if (cityComp) detectedCity = cityComp.long_name;
            }
            
            if (!detectedCity && detectedAddress.includes(",")) {
              const parts = detectedAddress.split(",");
              detectedCity = parts[parts.length - 1].trim();
            }
          }

          setFocusedLocation({
            lat: lat,
            lng: lng,
            name: "",
            address: detectedAddress,
            city: detectedCity,
            isNewCustomPoint: true 
          });
        })
        .catch((err) => {
          console.error("Geocoding click error:", err);
          setFocusedLocation({
            lat: lat,
            lng: lng,
            name: "",
            address: `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            city: "",
            isNewCustomPoint: true
          });
        });
    });

    return () => {
      mapRef.current?.remove();
      userLocationMarkerRef.current?.remove();
    };
  }, [apiKey]);

  // 2. ĐÃ SỬA ĐỔI: Loại bỏ hoàn toàn fetch api TrackAsia vãng lai khi đổi category
  // Chỉ thực hiện mapping khoảng cách Haversine chính xác dựa theo mảng Supabase (allPlaces)
  useEffect(() => {
    if (!mapRef.current) return;
    const [lng, lat] = userCoordsRef.current;

    if (!activeCategory) {
      onCategoryResultsChange(appendDistanceToPlaces(allPlaces, lat, lng));
    } else {
      const supabaseFilteredItems = allPlaces.filter(
        item => item.category?.toLowerCase() === activeCategory.toLowerCase()
      );
      onCategoryResultsChange(appendDistanceToPlaces(supabaseFilteredItems, lat, lng));
    }
  }, [activeCategory, allPlaces]);

  // 3. Render Markers Loop - Chỉ vẽ những gì nằm trong mảng kết quả đã lọc sạch
  useEffect(() => {
    if (!mapRef.current) return;
    
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    
    if (!categoryResults || categoryResults.length === 0) return;

    categoryResults.forEach(place => {
      const lat = Number(place.latitude);
      const lng = Number(place.longitude);
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

      const el = document.createElement("div");
      el.className = "w-10 h-10 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer group z-20";
      
      const isSupabase = place.id !== undefined; 
      const category = (place.category || "").toLowerCase();
      const types = place.types || []; 

      let markerConfig = { bgColor: "#3b82f6", iconHtml: `🏢` }; 

      if (category === "restaurant" || types.includes("restaurant") || types.includes("food")) {
        markerConfig = { bgColor: "#fb923c", iconHtml: `<img src="/restaurant-icon.png" class="w-6 h-6 object-contain transition-transform duration-200 group-hover:scale-110" />` };
      } else if (category === "bar" || types.includes("bar") || types.includes("night_club")) {
        markerConfig = { bgColor: "#a855f7", iconHtml: `<span class="text-xl">🍷</span>` };
      } else if (category === "beverage" || types.includes("cafe") || types.includes("coffee_shop")) {
        markerConfig = { bgColor: "#8b5cf6", iconHtml: `<span class="text-xl">☕</span>` }; 
      } else if (category === "sight" || types.includes("tourist_attraction") || types.includes("point_of_interest")) {
        markerConfig = { bgColor: "#3b82f6", iconHtml: `<span class="text-xl">👁️</span>` };
      } else if (category === "entertainment" || types.includes("amusement_park") || types.includes("casino") || types.includes("movie_theater")) {
        markerConfig = { bgColor: "#ec4899", iconHtml: `<img src="/park_map_icon.png" class="w-6 h-6 object-contain transition-transform duration-200 group-hover:scale-110" />` }; 
      } else if (category === "team_event") {
        markerConfig = { bgColor: "#10b981", iconHtml: `<span class="text-xl">👥</span>` };
      }

      el.style.backgroundColor = markerConfig.bgColor;
      el.innerHTML = markerConfig.iconHtml;

      if (isSupabase && (category === "team_event" || category === "bar" || category === "sight" || category === "beverage")) {
        el.style.borderColor = "#fbbf24";
        el.style.boxShadow = "0 0 10px rgba(251, 191, 36, 0.6)";
      }

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
          address: place.address || place.formatted_address || place.vicinity,
          isNewCustomPoint: false
        });
      });

      const m = new trackasiagl.Marker({ element: el, anchor: "center" }).setLngLat([lng, lat]).addTo(mapRef.current);
      markersRef.current.push(m);
    });
  }, [categoryResults]);

  // 4. Camera Fly to Focused Location
  useEffect(() => {
    if (!focusedLocation || !focusedLocation.lat || !focusedLocation.lng || !mapRef.current) return;
    const { lat, lng, name, address } = focusedLocation;
    
    mapRef.current.flyTo({ 
      center: [Number(lng), Number(lat)], 
      essential: true 
    });
    
    focusMarkerRef.current?.remove();
    
    const pin = document.createElement("div");
    pin.className = "w-10 h-10 flex items-center justify-center cursor-pointer drop-shadow-md z-30";
    pin.innerHTML = `<img src="/pin_map_dot.svg" style="width: 100%; height: 100%; object-fit: contain;" />`;
    
    const popupHTML = `
      <div class="p-2">
        <div class="font-bold text-sm mb-1">${name || "Selected Location"}</div>
        <div class="text-xs text-gray-600 mb-2">${address || ""}</div>
        ${!focusedLocation.isNewCustomPoint ? `
          <button 
            class="see-details-btn w-full px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            See Details
          </button>
        ` : ''}
      </div>
    `;
    
    const focusPopup = new trackasiagl.Popup({ 
      offset: [0, -32], 
      closeButton: true,
      closeOnClick: false 
    }).setHTML(popupHTML);
    
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
          
          const clickedPlace = categoryResults.find(p => 
            Number(p.latitude) === Number(lat) && 
            Number(p.longitude) === Number(lng)
          );
          
          if (clickedPlace && clickedPlace.id) {
            focusPopup.remove();
            onPlaceClick(clickedPlace);
          }
        });
      }
    }, 100);
  }, [focusedLocation?.lat, focusedLocation?.lng, categoryResults, onPlaceClick]);

  return (
    // FIX: Tách biệt z-index của container bản đồ (về số thấp z-0) để không che khuất ô search dropdown
    <div className="relative h-full w-full flex-1 z-0">
      <div ref={mapContainerRef} className="h-full w-full" />
      
      {/* Nút "Recenter" quay về vị trí user */}
      <button 
        onClick={handleRecenter} 
        className="absolute bottom-6 max-md:bottom-28 right-6 z-40 p-3 bg-white hover:bg-gray-50 text-blue-600 rounded-full shadow-xl border border-gray-100 transition-all active:scale-95 group"
      >
        <Navigation size={20} className="fill-blue-50 group-hover:rotate-45 transition-transform" />
      </button>
    </div>
  );
}