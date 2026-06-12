import { useState, useEffect, useRef } from "react";
import trackasiagl from "trackasia-gl";
import { Navigation, MapPin, X } from "lucide-react"; 
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
  onPlaceClick,
  showRegisterForm,      
  selectedPlace,         
  onPinPointChange,  
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);              
  const focusMarkerRef = useRef(null);         
  const userLocationMarkerRef = useRef(null);  
  const userCoordsRef = useRef([106.694945, 10.769034]);
  
  // PIN POINT STATE
  const [isPinPointMode, setIsPinPointMode] = useState(false);
  const isPinPointModeRef = useRef(false); 
  const [pinPointLocation, setPinPointLocation] = useState(null);
  const pinMarkerRef = useRef(null);

  // GIỮ NGUYÊN HOÀN TOÀN LOGIC CŨ CỦA BẠN
  const appendDistanceToPlaces = (placesArray, userLat, userLng) => {
    if (!placesArray || placesArray.length === 0) return [];
    return placesArray.map(place => {
      const pLat = Number(place.latitude || place.geometry?.location?.lat || place.lat);
      const pLng = Number(place.longitude || place.geometry?.location?.lng || place.lng);
      
      if (isNaN(pLat) || isNaN(pLng)) {
        return { ...place, distanceText: "--- km" };
      }

      const R = 6371; 
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

  const handleRecenter = () => {
    getUserCurrentLocation(true);
  };

  // PIN POINT HANDLERS 
  const handlePinPointToggle = () => {
    console.log("🔘 [MapContainer] Pin Point button clicked");
    
    if (!isPinPointMode) {
      // BẬT MODE
      console.log("✅ [MapContainer] Enabling PIN MODE");
      setIsPinPointMode(true);
      isPinPointModeRef.current = true; // ← SYNC NGAY LẬP TỨC
    } else {
      // TẮT MODE
      console.log("❌ [MapContainer] Disabling PIN MODE");
      setIsPinPointMode(false);
      isPinPointModeRef.current = false; // ← SYNC NGAY LẬP TỨC
      if (mapRef.current) {
        mapRef.current.getCanvas().style.cursor = '';
      }
    }
  };

  const handleClearPin = () => {
    console.log("🗑️ [MapContainer] Clearing pin point");
    
    setPinPointLocation(null);
    setIsPinPointMode(false);
    isPinPointModeRef.current = false;
    
    // Xóa pin marker
    if (pinMarkerRef.current) {
      pinMarkerRef.current.remove();
      pinMarkerRef.current = null;
    }
    
    // Reset cursor
    if (mapRef.current) {
      mapRef.current.getCanvas().style.cursor = '';
    }
    
    // ✅ GỌI onPinPointChange TRƯỚC → MapPage load đúng places từ GPS
    if (onPinPointChange) {
      onPinPointChange(null);
    }
    
    // ✅ SAU ĐÓ mới tạo lại user marker (KHÔNG gọi appendDistance/setCategoryResults)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          if (!mapRef.current) return;
          
          // Fly về GPS
          mapRef.current.flyTo({ center: [longitude, latitude], zoom: 14, essential: true });
          
          // Xóa marker cũ nếu có
          if (userLocationMarkerRef.current) userLocationMarkerRef.current.remove();
          
          // Tạo lại user marker
          const el = document.createElement("div");
          el.className = "user-pulse-marker";
          userLocationMarkerRef.current = new trackasiagl.Marker({ element: el })
            .setLngLat([longitude, latitude])
            .setPopup(new trackasiagl.Popup({ offset: 10 }).setHTML("<p class='text-xs font-semibold px-1'>Your Location</p>"))
            .addTo(mapRef.current);
          
          console.log("🔵 [MapContainer] User GPS marker restored at:", { longitude, latitude });
        },
        (err) => console.error("GPS error:", err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  const handleMapClickForPin = (e) => {
    console.log("🗺️ [MapContainer] Map clicked in PIN MODE");
    
    // ✅ DÙNG REF thay vì STATE
    if (!isPinPointModeRef.current) {
      console.log("⚠️ [MapContainer] isPinPointModeRef = false, ignoring click");
      return;
    }
    
    const { lng, lat } = e.lngLat;
    console.log("📌 [MapContainer] Pin placed at:", { lng, lat });
    
    // ẨN USER MARKER
    if (userLocationMarkerRef.current) {
      console.log("🔵 [MapContainer] Removing user GPS marker");
      userLocationMarkerRef.current.remove();
      userLocationMarkerRef.current = null;
    }
    
    // Xóa pin marker cũ (nếu có)
    if (pinMarkerRef.current) {
      pinMarkerRef.current.remove();
    }
    
    // Đặt pin location
    setPinPointLocation({ lat, lng });
    setIsPinPointMode(false);
    isPinPointModeRef.current = false; // ← RESET REF
    
    // Tạo pin marker mới
    const pinEl = document.createElement("div");
    pinEl.className = "w-12 h-12 flex items-center justify-center cursor-pointer drop-shadow-lg z-30";
    pinEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-10 h-10 text-red-500"><path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" /></svg>`;
    
    fetch(`https://maps.track-asia.com/api/v2/geocode/json?result_type=street_address&latlng=${lat},${lng}&key=${apiKey}&size=1&radius=100`)
      .then((res) => res.json())
      .then((data) => {
        let pinAddress = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        if (data.status === "OK" && data.results && data.results.length > 0) {
          pinAddress = data.results[0].formatted_address || pinAddress;
        }
        
        // Cập nhật popup với địa chỉ
        if (pinMarkerRef.current) {
          pinMarkerRef.current.getPopup()?.remove();
          const updatedPopup = new trackasiagl.Popup({ offset: [0, -40], closeButton: false })
            .setHTML(`
              <div class="p-2">
                <div class="font-bold text-sm text-red-600 mb-1">📍 Pin Point Location</div>
                <div class="text-xs text-gray-600">${pinAddress}</div>
              </div>
            `);
          pinMarkerRef.current.setPopup(updatedPopup).togglePopup();
        }
      })
      .catch(() => {});
    
    pinMarkerRef.current = new trackasiagl.Marker({ element: pinEl, anchor: "bottom" })
      .setLngLat([lng, lat])
      .setPopup(
        new trackasiagl.Popup({ offset: [0, -40], closeButton: false })
          .setHTML(`
            <div class="p-2">
              <div class="font-bold text-sm text-red-600 mb-1">📍 Pin Point Location</div>
              <div class="text-xs text-gray-600">Loading address...</div>
            </div>
          `)
      )
      .addTo(mapRef.current)
      .togglePopup();
    
    console.log("🔴 [MapContainer] Red pin marker created");
    
    // ✅ KHÔNG ZOOM IN - chỉ pan đến vị trí pin, giữ nguyên zoom level
    mapRef.current.panTo([lng, lat], { essential: true });
    
    // TRIGGER LOAD PLACES TỪ PIN LOCATION
    console.log("🚀 [MapContainer] Calling onPinPointChange with coords:", [lng, lat]);
    if (onPinPointChange) {
      onPinPointChange([lng, lat]);
    } else {
      console.error("❌ [MapContainer] onPinPointChange is undefined!");
    }
    
    // Reset cursor
    mapRef.current.getCanvas().style.cursor = '';
    console.log("✅ [MapContainer] Pin point setup complete");
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

        // CHỈ UPDATE distance nếu KHÔNG đang trong pin mode
        if (!pinPointLocation) {
          const placesWithDistance = appendDistanceToPlaces(allPlaces, latitude, longitude);
          onCategoryResultsChange(placesWithDistance);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        fallbackLocation(shouldFlyTo);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

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

        if (!pinPointLocation) {
          const placesWithDistance = appendDistanceToPlaces(allPlaces, latitude, longitude);
          onCategoryResultsChange(placesWithDistance);
        }
      },
      (err) => console.error("Fallback geolocation failed:", err),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: Infinity }
    );
  };

  // 1. Initialize Map & Click Event Handling (Giữ nguyên)
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
      console.log("🖱️ [MapContainer] Map clicked, isPinPointMode =", isPinPointModeRef.current);
      
      // PRIORITY 1: XỬ LÝ PIN POINT MODE (DÙNG REF THAY VÌ STATE)
      if (isPinPointModeRef.current) {
        console.log("✅ [MapContainer] Pin mode active, calling handleMapClickForPin");
        handleMapClickForPin(e);
        return; // Dừng lại, không xử lý logic khác
      }
      
      console.log("⏩ [MapContainer] Normal click handler (not pin mode)");
      
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

  // CHANGE CURSOR KHI BẬT PIN MODE + SYNC REF
  useEffect(() => {
    if (!mapRef.current) return;
    
    // ✅ SYNC REF
    isPinPointModeRef.current = isPinPointMode;
    console.log("🔄 [MapContainer] isPinPointMode changed to:", isPinPointMode);
    
    if (isPinPointMode) {
      mapRef.current.getCanvas().style.cursor = 'crosshair';
    } else {
      mapRef.current.getCanvas().style.cursor = '';
    }
  }, [isPinPointMode]);

  // 2. Sync Category items distance
  useEffect(() => {
    if (!mapRef.current) return;
    
    // ✅ Nếu đang có pin → tính distance từ PIN, không phải GPS
    const coords = pinPointLocation 
      ? [pinPointLocation.lng, pinPointLocation.lat]  // Pin coords
      : userCoordsRef.current;                         // GPS coords
    
    const [lng, lat] = coords;

    if (!activeCategory) {
      onCategoryResultsChange(appendDistanceToPlaces(allPlaces, lat, lng));
    } else {
      const supabaseFilteredItems = allPlaces.filter(
        item => item.category?.toLowerCase() === activeCategory.toLowerCase()
      );
      onCategoryResultsChange(appendDistanceToPlaces(supabaseFilteredItems, lat, lng));
    }
  }, [activeCategory, allPlaces, pinPointLocation]);

  // 3. Render Markers Loop (Giữ nguyên)
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

  // 4. FIX CHỈ ĐỊNH: Chặn nhảy chữ vào popup khi đang gõ text trong Form đăng ký
  useEffect(() => {
    if (!focusedLocation || !focusedLocation.lat || !focusedLocation.lng || !mapRef.current) return;
    const { lat, lng, name, address } = focusedLocation;
    
    // Thực hiện di chuyển camera và trả popup về nguyên bản logic cũ (.togglePopup())
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
    
    // delete marker and return to user
  focusPopup.on("close", () => {
  if (focusMarkerRef.current) {
    focusMarkerRef.current.remove();
    focusMarkerRef.current = null;
  }
  setFocusedLocation(null);
  handleClearPin();
});
    
    focusMarkerRef.current = new trackasiagl.Marker({ element: pin, anchor: "bottom" })
      .setLngLat([Number(lng), Number(lat)])
      .setPopup(focusPopup)
      .addTo(mapRef.current)
      .togglePopup(); // Giữ nguyên hành vi tự động mở popup cũ của bạn
    
    setTimeout(() => {
      const seeDetailsBtn = document.querySelector('.see-details-btn');
      if (seeDetailsBtn && onPlaceClick) {
        seeDetailsBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          
          // ✅ Tìm place bằng tọa độ (tolerance 0.0001 cho floating point)
          const clickedPlace = categoryResults.find(p => 
            Math.abs(Number(p.latitude) - Number(lat)) < 0.0001 && 
            Math.abs(Number(p.longitude) - Number(lng)) < 0.0001
          );
          
          if (clickedPlace && clickedPlace.id) {
            focusPopup.remove();
            onPlaceClick(clickedPlace);
          } else {
            console.log("⚠️ Place not found in categoryResults for coords:", { lat, lng });
          }
        });
      }
    }, 100);

  // THAY ĐỔI QUAN TRỌNG: Chỉ lắng nghe sự thay đổi của TỌA ĐỘ (lat, lng).
  // Loại bỏ hoàn toàn sự phụ thuộc vào text 'name' hay 'address' để khi bạn gõ, useEffect này KHÔNG bị chạy lại.
  }, [focusedLocation?.lat, focusedLocation?.lng, onPlaceClick]); 

  return (
    <div className="relative h-full w-full flex-1 z-0">
      <div ref={mapContainerRef} className="h-full w-full" />
      
      {/* CONTROL BUTTONS (GPS + PIN POINT)*/}
      <div 
        className={`absolute bottom-6 max-md:bottom-28 z-40 flex gap-3 transition-all duration-300 ${
          showRegisterForm || selectedPlace 
            ? 'right-[420px] max-md:right-6' // Nhảy sang trái khi form mở
            : 'right-6'
        }`}
      >
        {/* Pin Point / Clear Pin Button (toggle) */}
        {pinPointLocation ? (
          // ĐÃ ĐẶT PIN → HIỂN THỊ NÚT X
          <button 
            onClick={handleClearPin}
            className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-xl border border-red-600 transition-all active:scale-95"
            title="Clear pin point and back to my location"
          >
            <X size={20} />
          </button>
        ) : (
          // CHƯA ĐẶT PIN → HIỂN THỊ NÚT PIN POINT
          <button 
            onClick={handlePinPointToggle}
            className={`p-3 rounded-full shadow-xl border border-gray-100 transition-all active:scale-95 ${
              isPinPointMode 
                ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse' 
                : 'bg-white hover:bg-gray-50 text-gray-600'
            }`}
            title={isPinPointMode ? "Click map to set pin" : "Set pin point to explore other areas"}
          >
            <MapPin size={20} />
          </button>
        )}

        {/* GPS Recenter Button */}
        <button 
          onClick={handleRecenter} 
          className="p-3 bg-white hover:bg-gray-50 text-blue-600 rounded-full shadow-xl border border-gray-100 transition-all active:scale-95 group"
          title="Back to my location"
        >
          <Navigation size={20} className="fill-blue-50 group-hover:rotate-45 transition-transform" />
        </button>
      </div>
    </div>
  );
}
