import { useState, useEffect, useRef } from "react";
import trackasiagl from "trackasia-gl";
import { Navigation } from "lucide-react";
import "trackasia-gl/dist/trackasia-gl.css";
import BuildingDetailPanel from "./BuildingDetailPanel";

export default function MapContainer({ 
  apiKey,
  activeCategory,
  focusedLocation,
  categoryResults,
  setFocusedLocation,
  onPlaceClick,
  selectedPlace,
  reopenBuildingAddress,
  reopenBuildingFloor,
  onReopenBuildingHandled,
  activeFilters,
  onBuildingConverted,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const focusMarkerRef = useRef(null);
  const isSwitchingLocationRef = useRef(false);

  const DEFAULT_CENTER = [106.694945, 10.769034];
  const DEFAULT_ZOOM = 13;

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

  const handleRecenter = () => {
    if (!mapRef.current) return;

    mapRef.current.flyTo({
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      essential: true,
    });
  };

  // 1. Initialize Map & Click Event Handling (Giữ nguyên)
    useEffect(() => {
      if (!document.getElementById("pulse-marker-style")) {
      const style = document.createElement("style");
      style.id = "pulse-marker-style";
      style.innerHTML = `
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
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    return () => {
      mapRef.current?.remove();
    };
  }, [apiKey]);

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

        buildingPopup.on("close", () => {
          if (isSwitchingLocationRef.current) return;

          if (focusMarkerRef.current) {
            focusMarkerRef.current.remove();
            focusMarkerRef.current = null;
          }

          setFocusedLocation(null);
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

  useEffect(() => {
    if (focusedLocation === null) {
      if (focusMarkerRef.current) {
        focusMarkerRef.current.remove();
        focusMarkerRef.current = null;
      }
    }
  }, [focusedLocation]);

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
    
  focusPopup.on("close", () => {
    if (isSwitchingLocationRef.current) {
      return;
    }

    if (focusMarkerRef.current) {
      focusMarkerRef.current.remove();
      focusMarkerRef.current = null;
    }

    setFocusedLocation(null);
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
          selectedPlace ? 'right-[420px] max-md:right-6' : 'right-6'
        }`}
      >
        <div className="flex items-center gap-2 bg-white rounded-full shadow-xl border border-gray-200 px-2 py-2">
          <div className="relative group">
            <button 
              onClick={handleRecenter}
              className="p-2.5 bg-gray-50 hover:bg-gray-100 text-blue-600 rounded-full transition-all active:scale-95"
              aria-label="Recenter map"
            >
              <Navigation size={18} className="fill-blue-50 group-hover:rotate-45 transition-transform" />
            </button>

            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
              <div className="bg-blue-600 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-lg">
                <div className="font-bold mb-0.5">Recenter</div>
                <div className="text-[10px] opacity-90">
                  Go back to default center
                </div>
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