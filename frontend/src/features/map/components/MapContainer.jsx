import { useState, useEffect, useRef } from "react";
import trackasiagl from "trackasia-gl";
import { Navigation, MapPin, X } from "lucide-react"; 
import "trackasia-gl/dist/trackasia-gl.css";
import BuildingDetailPanel from "./BuildingDetailPanel";

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
  reopenBuildingAddress,
  reopenBuildingFloor,
  onReopenBuildingHandled,
  activeFilters,
  onAddPlaceToBuilding,
  onBuildingConverted,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);              
  const focusMarkerRef = useRef(null);         
  const userLocationMarkerRef = useRef(null);  
  const userCoordsRef = useRef([106.694945, 10.769034]);
  const isSwitchingLocationRef = useRef(false);

  // BUILDING DETAIL STATE 
  const [showBuildingDetail, setShowBuildingDetail] = useState(false);
  const [selectedBuildingAddress, setSelectedBuildingAddress] = useState(null);
  const [selectedBuildingInitialFloor, setSelectedBuildingInitialFloor] = useState(null);
  
  // ✅ Reopen Building Panel khi user click "Back to Building"
  useEffect(() => {
    if (reopenBuildingAddress) {
      setSelectedBuildingAddress(reopenBuildingAddress);
      setSelectedBuildingInitialFloor(
        reopenBuildingFloor ? String(reopenBuildingFloor) : null
      );
      setShowBuildingDetail(true);
      if (onReopenBuildingHandled) onReopenBuildingHandled();
    }
  }, [reopenBuildingAddress, reopenBuildingFloor]);

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
    
    // Tạo pin marker mới (icon cây kim)
    const pinEl = document.createElement("div");
    pinEl.className = "w-12 h-12 flex items-center justify-center cursor-pointer drop-shadow-lg z-30";
    pinEl.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-10 h-10 text-red-500">
        <circle cx="12" cy="6" r="4" fill="#EF4444" />
        <path d="M12 10 L12 22" stroke="#EF4444" stroke-width="2" stroke-linecap="round" />
      </svg>
    `;
    
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

        /* Focused popup phải luôn nằm trên tất cả category markers khác */
        .focused-place-popup {
          z-index: 99999 !important;
        }

        .focused-place-popup .trackasia-gl-popup-content,
        .focused-place-popup .mapboxgl-popup-content {
          z-index: 99999 !important;
          position: relative;
        }

        .focused-place-popup .trackasia-gl-popup-tip,
        .focused-place-popup .mapboxgl-popup-tip {
          z-index: 99999 !important;
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

  // 3. Render Markers Loop - WITH BUILDING GROUPING
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    
    if (!categoryResults || categoryResults.length === 0) return;

    // ===== STEP 1: GROUP PLACES BY BUILDING ADDRESS =====
    const buildingGroups = {};
    const standalonePlaces = [];

    categoryResults.forEach(place => {
      if (place.place_type === "building" && place.building_address) {
        // Group by building_address
        if (!buildingGroups[place.building_address]) {
          buildingGroups[place.building_address] = [];
        }
        buildingGroups[place.building_address].push(place);
      } else {
        // Standalone place
        standalonePlaces.push(place);
      }
    });

    // ===== STEP 2: RENDER BUILDING MARKERS =====
    Object.entries(buildingGroups).forEach(([buildingAddress, places]) => {
      // Use first place's coordinates for building marker
      const firstPlace = places[0];
      const lat = Number(firstPlace.latitude);
      const lng = Number(firstPlace.longitude);
      
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

      // Create building marker
      const el = document.createElement("div");
      el.className = "w-10 h-10 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer group z-20 bg-gray-700";
      el.innerHTML = `<span class="text-xl">🏢</span>`;

      // Hover popup (chỉ hiện tên building)
      const hoverPopup = new trackasiagl.Popup({ 
        offset: [0, -20], 
        closeButton: false, 
        closeOnClick: false 
      }).setHTML(`
        <div class="p-1.5 max-w-xs text-slate-800">
          <div class="font-bold text-xs line-clamp-1">${firstPlace.building_name || "Building"}</div>
        </div>
      `);

      el.addEventListener("mouseenter", () => hoverPopup.setLngLat([lng, lat]).addTo(mapRef.current));
      el.addEventListener("mouseleave", () => hoverPopup.remove());

      // Click → Show popup with "See Details" button (SAME behavior as normal place)
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        hoverPopup.remove();

        // ✅ Fly to building location
        mapRef.current.flyTo({ 
          center: [lng, lat], 
          essential: true 
        });

        // ✅ Remove old focused marker (same pattern as normal place)
        if (focusMarkerRef.current) {
          isSwitchingLocationRef.current = true;
          focusMarkerRef.current.remove();
          focusMarkerRef.current = null;
          setTimeout(() => { isSwitchingLocationRef.current = false; }, 50);
        }

        // ✅ Create pin marker
        const pin = document.createElement("div");
        pin.className = "w-10 h-10 flex items-center justify-center cursor-pointer drop-shadow-md z-30";
        pin.innerHTML = `<img src="/pin_map_dot.svg" style="width: 100%; height: 100%; object-fit: contain;" />`;

        // ✅ Create popup HTML
        const buildingPopupHTML = `
          <div class="p-2 max-w-xs">
            <div class="font-bold text-sm mb-1 break-words overflow-wrap-anywhere">${firstPlace.building_name || "Building"}</div>
            <div class="text-xs text-gray-600 mb-1">${places.length} place${places.length > 1 ? 's' : ''} inside</div>
            <div class="text-xs text-gray-600 mb-2">${buildingAddress}</div>
            <button 
              class="see-building-details-btn w-full px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              See Details
            </button>
          </div>
        `;

        const buildingPopup = new trackasiagl.Popup({
          offset: [0, -32],
          closeButton: true,
          closeOnClick: false,
          className: "focused-place-popup"
        }).setHTML(buildingPopupHTML);

        // ✅ Popup close event (SAME behavior as normal place)
        buildingPopup.on("close", () => {
          if (isSwitchingLocationRef.current) return;

          // Remove marker
          if (focusMarkerRef.current) {
            focusMarkerRef.current.remove();
            focusMarkerRef.current = null;
          }

          // ✅ Fly back to pin point or GPS
          if (pinPointLocation) {
            mapRef.current?.flyTo({
              center: [pinPointLocation.lng, pinPointLocation.lat],
              zoom: 14,
              essential: true,
            });
          } else {
            navigator.geolocation.getCurrentPosition((position) => {
              const { latitude, longitude } = position.coords;
              mapRef.current?.flyTo({
                center: [longitude, latitude],
                zoom: 14,
                essential: true,
              });
            });
          }
        });

        // ✅ Add marker + popup to map
        focusMarkerRef.current = new trackasiagl.Marker({ element: pin, anchor: "bottom" })
          .setLngLat([lng, lat])
          .setPopup(buildingPopup)
          .addTo(mapRef.current)
          .togglePopup();

        // ✅ Attach "See Details" button handler (KEEP marker + popup)
        setTimeout(() => {
          const btn = document.querySelector('.see-building-details-btn');
          if (btn) {
            btn.addEventListener('click', (e) => {
              e.stopPropagation();
              console.log("🏢 [MapContainer] Building See Details clicked");

              // ✅ KHÔNG remove marker + popup (giữ nguyên like normal place)
              // Chỉ mở Building Detail Panel
              setSelectedBuildingInitialFloor(null);
              setSelectedBuildingAddress(buildingAddress);
              setShowBuildingDetail(true);
            });
          }
        }, 100);
      });

      const m = new trackasiagl.Marker({ element: el, anchor: "center" })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);
      
      markersRef.current.push(m);
    });

    // ===== STEP 3: RENDER STANDALONE MARKERS (GIỮ NGUYÊN LOGIC CŨ) =====
    standalonePlaces.forEach(place => {
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
      } else if (category === "vegetarian") {
        markerConfig = { bgColor: "#22c55e", iconHtml: `<span class="text-xl">🥗</span>` };
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
          id: place.id || null,
          lat: lat,
          lng: lng,
          name: place.name,
          address: place.address || place.formatted_address || place.vicinity,
          rating: place.rating || 0,
          isNewCustomPoint: false,
          place_type: place.place_type,
          building_name: place.building_name,
          floor_level: place.floor_level,
          popupRefreshKey: Date.now(),
        });
      });

      const m = new trackasiagl.Marker({ element: el, anchor: "center" }).setLngLat([lng, lat]).addTo(mapRef.current);
      markersRef.current.push(m);
    });
  }, [categoryResults]);

  // ✅ useEffect riêng: Xóa marker + fly về pin point khi clear focused location
  useEffect(() => {
    if (focusedLocation === null) {
      // XÓA MARKER + POPUP NẾU CÒN TỒN TẠI
      if (focusMarkerRef.current) {
        console.log("🗑️ [MapContainer] Removing focus marker because focusedLocation = null");
        focusMarkerRef.current.remove();
        focusMarkerRef.current = null;
      }

      // NẾU ĐANG TRONG PIN MODE → FLY VỀ PIN POINT
      if (pinPointLocation && mapRef.current) {
        console.log("🔄 [MapContainer] focusedLocation cleared, flying back to pin point");
        mapRef.current.flyTo({
          center: [pinPointLocation.lng, pinPointLocation.lat],
          zoom: 14,
          essential: true,
        });
      }
    }
  }, [focusedLocation, pinPointLocation]);

  // 4. FIX CHỈ ĐỊNH: Chặn nhảy chữ vào popup khi đang gõ text trong Form đăng ký
  useEffect(() => {
    if (!focusedLocation || !focusedLocation.lat || !focusedLocation.lng || !mapRef.current) return;
    const { lat, lng, name, address, rating } = focusedLocation;

    // Helper render sao (luôn 5 sao tổng cộng)
    const renderStars = (rating) => {
      const filledStars = Math.floor(rating);
      const hasHalfStar = rating % 1 > 0;
      let stars = '★'.repeat(filledStars);
      if (hasHalfStar) stars += '☆';
      const emptyStarsNeeded = 5 - filledStars - (hasHalfStar ? 1 : 0);
      stars += '☆'.repeat(emptyStarsNeeded);
      return stars;
    };

    
    // Thực hiện di chuyển camera và trả popup về nguyên bản logic cũ (.togglePopup())
    mapRef.current.flyTo({ 
      center: [Number(lng), Number(lat)], 
      essential: true 
    });
    
if (focusMarkerRef.current) {
  isSwitchingLocationRef.current = true;

  focusMarkerRef.current.remove();
  focusMarkerRef.current = null;

  setTimeout(() => {
    isSwitchingLocationRef.current = false;
  }, 50);
}

    const pin = document.createElement("div");
    pin.className = "w-10 h-10 flex items-center justify-center cursor-pointer drop-shadow-md z-30";
    pin.innerHTML = `<img src="/pin_map_dot.svg" style="width: 100%; height: 100%; object-fit: contain;" />`;
    
    // ✅ Format popup title + address cho place thuộc building
    const displayName =
      focusedLocation.place_type === "building" && focusedLocation.building_name
        ? `${name} · Level ${focusedLocation.floor_level}, ${focusedLocation.building_name}`
        : (name || "Selected Location");

    // ✅ Dòng địa chỉ chỉ giữ địa chỉ gốc, KHÔNG lặp lại level/building
    const displayAddress = address || "";

    const popupHTML = `
      <div class="p-2 max-w-xs">
        <div class="font-bold text-sm mb-1 break-words overflow-wrap-anywhere">${displayName}</div>
        ${rating ? `
          <div class="flex items-center gap-1 mb-1">
            <span class="text-yellow-500 text-sm">${renderStars(rating)}</span>
            <span class="text-xs text-gray-600">${Number(rating).toFixed(1)}</span>
          </div>
        ` : ''}
        <div class="text-xs text-gray-600 mb-2">${displayAddress}</div>
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
      closeOnClick: false,
      className: "focused-place-popup"
    }).setHTML(popupHTML);
    
  // ===== POPUP CLOSE EVENT ===== 
  focusPopup.on("close", () => {
    // Ignore popup closes caused by switching locations
    if (isSwitchingLocationRef.current) {
      return;
    }

    if (focusMarkerRef.current) {
      focusMarkerRef.current.remove();
      focusMarkerRef.current = null;
    }

    setFocusedLocation(null);

    // ✅ CASE 1: Đang trong PIN MODE
    if (pinPointLocation) {
      const [pinLng, pinLat] = [pinPointLocation.lng, pinPointLocation.lat];
      
      // Tìm place đang focused
      const focusedPlace = categoryResults.find(p => 
        Math.abs(Number(p.latitude) - Number(lat)) < 0.0001 && 
        Math.abs(Number(p.longitude) - Number(lng)) < 0.0001
      );
      
      if (focusedPlace) {
        // Tính khoảng cách từ pin point đến place này
        const R = 6371;
        const dLat = ((focusedPlace.latitude - pinLat) * Math.PI) / 180;
        const dLon = ((focusedPlace.longitude - pinLng) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((pinLat * Math.PI) / 180) * Math.cos((focusedPlace.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        // Nếu place nằm NGOÀI 5km → xóa khỏi categoryResults
        if (distance > 5) {
          onCategoryResultsChange(prev => 
            prev.filter(p => p.id !== focusedPlace.id)
          );
        }
      }
      
      // Quay về pin location
      mapRef.current?.flyTo({
        center: [pinPointLocation.lng, pinPointLocation.lat],
        zoom: 14,
        essential: true,
      });
    } 
    // ✅ CASE 2: GPS MODE (KHÔNG CÓ PIN)
    else {
      // Tìm place đang focused
      const focusedPlace = categoryResults.find(p => 
        Math.abs(Number(p.latitude) - Number(lat)) < 0.0001 && 
        Math.abs(Number(p.longitude) - Number(lng)) < 0.0001
      );
      
      if (focusedPlace) {
        // Tính khoảng cách từ GPS đến place này
        const [gpsLng, gpsLat] = userCoordsRef.current;
        const R = 6371;
        const dLat = ((focusedPlace.latitude - gpsLat) * Math.PI) / 180;
        const dLon = ((focusedPlace.longitude - gpsLng) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((gpsLat * Math.PI) / 180) * Math.cos((focusedPlace.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        // ✅ FIX NOTE 1: Nếu place nằm NGOÀI 5km GPS → xóa khỏi categoryResults
        if (distance > 5) {
          console.log("🗑️ [MapContainer] Removing place outside 5km from GPS:", focusedPlace.name);
          onCategoryResultsChange(prev => 
            prev.filter(p => p.id !== focusedPlace.id)
          );
        }
      }
      
      // Quay về GPS
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;

        mapRef.current?.flyTo({
          center: [longitude, latitude],
          zoom: 14,
          essential: true,
        });
      });
    }
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
          let clickedPlace = null;

          if (focusedLocation?.id !== undefined && focusedLocation?.id !== null) {
            clickedPlace = categoryResults.find(
              p => String(p.id) === String(focusedLocation.id)
            );
          }

          if (!clickedPlace) {
            clickedPlace = categoryResults.find(p => 
              Math.abs(Number(p.latitude) - Number(lat)) < 0.0001 && 
              Math.abs(Number(p.longitude) - Number(lng)) < 0.0001
            );
          }
          
          if (clickedPlace && clickedPlace.id) {
            onPlaceClick(clickedPlace);
          } else {
            console.log("⚠️ Place not found in categoryResults for coords:", { lat, lng });
          }
        });
      }
    }, 100);

  // CHỈ rerender popup khi:
  // - đổi tọa độ
  // - hoặc có popupRefreshKey (commit update sau khi edit/register)
  // Không phụ thuộc trực tiếp vào name/address để tránh bug mất focus khi đang gõ form.
  }, [focusedLocation?.id, focusedLocation?.lat, focusedLocation?.lng, focusedLocation?.popupRefreshKey, onPlaceClick]);

  return (
    <div className="relative h-full w-full flex-1 z-0">
      <div ref={mapContainerRef} className="h-full w-full" />
      
      {/* ===== TOOLBAR (PIN POINT + RECENTER) ===== */}
      <div 
        className={`absolute bottom-6 max-md:bottom-28 z-40 transition-all duration-300 ${
          showRegisterForm || selectedPlace 
            ? 'right-[420px] max-md:right-6'
            : 'right-6'
        }`}
      >
        <div className="flex items-center gap-2 bg-white rounded-full shadow-xl border border-gray-200 px-2 py-2">
          {/* ===== PIN POINT BUTTON ===== */}
          <div className="relative group">
            <button 
              onClick={pinPointLocation ? handleClearPin : handlePinPointToggle}
              className={`relative p-2.5 rounded-full transition-all active:scale-95 ${
                isPinPointMode 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : pinPointLocation
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
              }`}
              aria-label={pinPointLocation ? "Clear pin point" : isPinPointMode ? "Click map to set pin" : "Set pin point"}
            >
              {/* Icon cây kim (quả bóng đỏ + kim) */}
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                className="w-5 h-5"
              >
                <circle cx="12" cy="6" r="4" className={pinPointLocation || isPinPointMode ? "fill-white" : "fill-red-500"} />
                <path d="M12 10 L12 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              
              {/* Dấu X góc phải trên (chỉ hiện khi pin active hoặc mode active) */}
              {(pinPointLocation || isPinPointMode) && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-md">
                  <X size={10} className="text-red-600" strokeWidth={3} />
                </div>
              )}
            </button>

            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
              <div className="bg-blue-600 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-lg">
                <div className="font-bold mb-0.5">Pin Point</div>
                <div className="text-[10px] opacity-90">
                  {pinPointLocation 
                    ? "Click to clear pin and return to your location"
                    : isPinPointMode
                    ? "Click on map to place pin"
                    : "Explore places in other areas"}
                </div>
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                  <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-600"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-300"></div>

          {/* ===== RECENTER BUTTON ===== */}
          <div className="relative group">
            <button 
              onClick={() => {
                // ✅ Nếu pin đang active → clear pin trước
                if (pinPointLocation) {
                  handleClearPin();
                } else {
                  handleRecenter();
                }
              }}
              className="p-2.5 bg-gray-50 hover:bg-gray-100 text-blue-600 rounded-full transition-all active:scale-95"
              aria-label="Back to my location"
            >
              <Navigation size={18} className="fill-blue-50 group-hover:rotate-45 transition-transform" />
            </button>

            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
              <div className="bg-blue-600 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-lg">
                <div className="font-bold mb-0.5">Recenter</div>
                <div className="text-[10px] opacity-90">
                  {pinPointLocation ? "Clear pin and return to GPS" : "Go back to your location"}
                </div>
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                  <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-600"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ===== BUILDING DETAIL PANEL ===== */}
      {showBuildingDetail && selectedBuildingAddress && (
        <BuildingDetailPanel
          buildingAddress={selectedBuildingAddress}
          initialBuildingName={
            categoryResults.find(p => p.building_address === selectedBuildingAddress)?.building_name || "Building"
          }
          initialSelectedFloor={selectedBuildingInitialFloor}
          activeCategory={activeCategory}
          activeFilters={activeFilters}
          onClose={() => {
            setShowBuildingDetail(false);
            setSelectedBuildingAddress(null);
            setSelectedBuildingInitialFloor(null);
          }}
          onAddPlace={() => {
            const buildingPlaces = categoryResults.filter(
              p => p.place_type === "building" && p.building_address === selectedBuildingAddress
            );
            const firstPlace = buildingPlaces[0];
            setShowBuildingDetail(false);
            setSelectedBuildingInitialFloor(null);
            if (onAddPlaceToBuilding) {
              onAddPlaceToBuilding({
                buildingName: firstPlace?.building_name || "",
                buildingAddress: selectedBuildingAddress,
                buildingCity: firstPlace?.city || "",
                buildingLatitude: firstPlace?.latitude || "",
                buildingLongitude: firstPlace?.longitude || "",
              });
            }
          }}
          onPlaceClick={(place) => {
            setShowBuildingDetail(false);
            setSelectedBuildingInitialFloor(null);
            if (onPlaceClick) onPlaceClick(place, selectedBuildingAddress);
          }}
          onBuildingConverted={() => {
            // ✅ Xóa focused marker + popup cũ (building popup)
            if (focusMarkerRef.current) {
              focusMarkerRef.current.remove();
              focusMarkerRef.current = null;
            }
            
            setShowBuildingDetail(false);
            setSelectedBuildingAddress(null);
            setSelectedBuildingInitialFloor(null);
            
            // ✅ Gọi callback từ MapPage để refresh data
            if (onBuildingConverted) {
              onBuildingConverted();
            }
          }}
        />
      )}
    </div>
  );
}
