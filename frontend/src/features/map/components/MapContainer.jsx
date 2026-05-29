import { useEffect, useRef } from "react";
import trackasiagl from "trackasia-gl";
import { Navigation } from "lucide-react"; 

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
  // Tính khoảng cách giữa 2 điểm GPS bằng công thức Haversine
  // Input: mảng places + tọa độ user
  // Output: mảng places có thêm field "distanceText" (ví dụ: "2.5 km")
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

  // --- HELPER FUNCTION 2: Check Duplicate Locations ---
  // Kiểm tra xem 1 địa điểm có bị trùng lặp không
  // Trùng nếu: cùng place_id HOẶC cùng tên + tọa độ gần giống nhau
  const isLocationDuplicate = (item, uniqueList, compareList = []) => {
    const isDupInUnique = uniqueList.some(existing => {
      const sameId = item.place_id && existing.place_id && item.place_id === existing.place_id;
      const sameNameAndCoords = existing.name.toLowerCase() === item.name.toLowerCase() && 
        Math.abs(existing.latitude - item.latitude) < 0.0001 &&
        Math.abs(existing.longitude - item.longitude) < 0.0001;
      return sameId || sameNameAndCoords;
    });
    if (isDupInUnique) return true;

    return compareList.some(sb => {
      const sbLat = Number(sb.latitude);
      const sbLng = Number(sb.longitude);
      return sb.name.toLowerCase() === item.name.toLowerCase() && 
        Math.abs(sbLat - item.latitude) < 0.0001 &&
        Math.abs(sbLng - item.longitude) < 0.0001;
    });
  };

  // Xử lý khi user click nút "Recenter" (quay về vị trí hiện tại)
  const handleRecenter = () => {
    getUserCurrentLocation(true);
  };

  // Lấy vị trí GPS hiện tại của user
  // shouldFlyTo = true → tự động zoom map về vị trí đó
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

        // Nếu yêu cầu zoom về vị trí user
        if (shouldFlyTo) {
          mapRef.current.flyTo({ center: [longitude, latitude], zoom: 14, essential: true });
        }

        // Xóa marker cũ (nếu có) và tạo marker mới cho vị trí user
        if (userLocationMarkerRef.current) userLocationMarkerRef.current.remove();

        const el = document.createElement("div");
        el.className = "user-pulse-marker"; // CSS animation pulse được định nghĩa bên dưới

        userLocationMarkerRef.current = new trackasiagl.Marker({ element: el })
          .setLngLat([longitude, latitude])
          .setPopup(new trackasiagl.Popup({ offset: 10 }).setHTML("<p class='text-xs font-semibold px-1'>Your Location</p>"))
          .addTo(mapRef.current);

        // Tính khoảng cách từ vị trí user tới tất cả places
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

  // Nếu GPS chính xác thất bại, thử lại với độ chính xác thấp hơn
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
  // Khởi tạo bản đồ TrackAsia khi component mount
  useEffect(() => {
    // Thêm CSS animation cho marker vị trí user (hiệu ứng pulse)
    if (!document.getElementById("pulse-marker-style")) {
      const style = document.createElement("style");
      style.id = "pulse-marker-style";
      style.innerHTML = `
        .user-pulse-marker { width: 16px; height: 16px; background: #2563eb; border: 2px solid white; border-radius: 50%; position: relative; box-shadow: 0 0 8px rgba(0,0,0,0.3); }
        .user-pulse-marker::after { content: ''; width: 40px; height: 40px; background: rgba(37, 99, 235, 0.4); border-radius: 50%; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.5); animation: mapPulse 2s infinite ease-out; opacity: 0; }
        @keyframes mapPulse { 0% { transform: translate(-50%, -50%) scale(0.2); opacity: 0; } 50% { opacity: 0.8; } 100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; } }
      `;
      document.head.appendChild(style);
    }

    // Khởi tạo map với TrackAsia API
    mapRef.current = new trackasiagl.Map({
      container: mapContainerRef.current,
      style: `https://maps.track-asia.com/styles/v2/streets.json?key=${apiKey}&detailLevel=none`,
      center: userCoordsRef.current,
      zoom: 13,
    });

    // Sau khi map load xong, lấy vị trí user và zoom vào
    mapRef.current.on("load", () => {
      getUserCurrentLocation(true);
    });

    // Xử lý khi user click vào map
    // → Gọi API geocoding để lấy địa chỉ tại điểm click
    // → Autofill vào register form
    mapRef.current.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      
      // Nếu click vào marker user hoặc marker place thì bỏ qua
      if (e.originalEvent.target.closest('.user-pulse-marker') || e.originalEvent.target.closest('img') || e.originalEvent.target.closest('.rounded-full')) {
        return; 
      }

      // Gọi TrackAsia Geocoding API để lấy địa chỉ từ tọa độ
      fetch(`https://maps.track-asia.com/api/v2/geocode/json?result_type=street_address&latlng=${lat},${lng}&key=${apiKey}&new_admin=true&include_old_admin=true&size=1&radius=100`)
        .then((res) => res.json())
        .then((data) => {
          let detectedAddress = `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          let detectedCity = "";

          if (data.status === "OK" && data.results && data.results.length > 0) {
            const topPlace = data.results[0];
            detectedAddress = topPlace.formatted_address || topPlace.name || detectedAddress;

            // Lấy thông tin thành phố từ address_components
            if (topPlace.address_components) {
              const cityComp = topPlace.address_components.find(comp => 
                comp.types.includes("administrative_area_level_1") || comp.types.includes("province")
              );
              if (cityComp) detectedCity = cityComp.long_name;
            }
            
            // Nếu không có city component, lấy từ formatted_address
            if (!detectedCity && detectedAddress.includes(",")) {
              const parts = detectedAddress.split(",");
              detectedCity = parts[parts.length - 1].trim();
            }
          }

          // Set focused location để autofill register form
          setFocusedLocation({
            lat: lat,
            lng: lng,
            name: "",
            address: detectedAddress,
            city: detectedCity,
            isNewCustomPoint: true // Đánh dấu đây là điểm mới (không phải từ database)
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

    // Cleanup khi component unmount
    return () => {
      mapRef.current?.remove();
      userLocationMarkerRef.current?.remove();
    };
  }, [apiKey]);

  // 2. Fetch Places Logic (API + Supabase)
  // Mỗi khi activeCategory thay đổi → fetch lại places từ TrackAsia API
  useEffect(() => {
    if (!mapRef.current) return;
    const [lng, lat] = userCoordsRef.current;

    // TRƯỜNG HỢP 1: Không có filter category nào được chọn
    // → Hiển thị TẤT CẢ places trong bán kính 5km
    if (!activeCategory) {
      // GIỚI HẠN: Chỉ fetch 6 categories chính theo project spec
      const targetTypes = ["restaurant", "bar", "cafe", "tourist_attraction", "amusement_park"];
      
      const fetchPromises = targetTypes.map(type =>
        fetch(`https://maps.track-asia.com/api/v2/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=${type}&key=${apiKey}`)
          .then(res => res.json())
          .catch(() => ({ results: [] }))
      );

      Promise.all(fetchPromises)
        .then(resultsArray => {
          let combinedApiResults = [];
          resultsArray.forEach(data => {
            if (data.results) combinedApiResults = [...combinedApiResults, ...data.results];
          });

          // Chuẩn hóa dữ liệu (format latitude/longitude)
          const formattedApiItems = combinedApiResults.map(item => {
            const itemLat = Number(item.geometry?.location?.lat || item.lat);
            const itemLng = Number(item.geometry?.location?.lng || item.lng);
            return { ...item, latitude: itemLat, longitude: itemLng };
          }).filter(item => !isNaN(item.latitude) && !isNaN(item.longitude));

          // Loại bỏ duplicate (so sánh với places từ Supabase)
          const uniqueApiItems = [];
          formattedApiItems.forEach(item => {
            if (!isLocationDuplicate(item, uniqueApiItems, allPlaces)) {
              uniqueApiItems.push(item);
            }
          });

          // Ghép kết quả API với places từ Supabase
          const combinedList = [...allPlaces, ...uniqueApiItems];
          onCategoryResultsChange(appendDistanceToPlaces(combinedList, lat, lng));
        })
        .catch((err) => {
          console.error("Background scan error:", err);
          onCategoryResultsChange(appendDistanceToPlaces(allPlaces, lat, lng));
        });
        
      return; 
    }

    // TRƯỜNG HỢP 2: Có filter category được chọn
    // → Chỉ hiển thị places thuộc category đó

    // MAP categories của project sang TrackAsia types
    let trackAsiaType = activeCategory.toLowerCase();
    if (trackAsiaType === "bar") trackAsiaType = "bar"; // Có sẵn trong TrackAsia
    if (trackAsiaType === "beverage") trackAsiaType = "cafe"; // ← MỚI: Map sang cafe
    if (trackAsiaType === "sight") trackAsiaType = "tourist_attraction"; // Map sang tourist_attraction
    if (trackAsiaType === "entertainment") trackAsiaType = "amusement_park"; // Giữ nguyên
    if (trackAsiaType === "team_event") trackAsiaType = "restaurant"; // Team event thường tổ chức ở nhà hàng/venue

    // Fetch places từ TrackAsia API theo category
    fetch(`https://maps.track-asia.com/api/v2/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=${trackAsiaType}&key=${apiKey}`)
      .then(res => res.json())
      .then(data => {
        // Lọc places từ Supabase theo category
        const supabaseFilteredItems = allPlaces.filter(
          item => item.category?.toLowerCase() === activeCategory.toLowerCase()
        );

        if (data.results && data.results.length > 0) {
          // Chuẩn hóa dữ liệu từ API
          const formattedApiItems = data.results.map(item => {
            const itemLat = Number(item.geometry?.location?.lat || item.lat);
            const itemLng = Number(item.geometry?.location?.lng || item.lng);
            return { ...item, latitude: itemLat, longitude: itemLng };
          }).filter(item => !isNaN(item.latitude) && !isNaN(item.longitude));

          // Loại bỏ duplicate
          const uniqueApiItems = [];
          formattedApiItems.forEach(item => {
            if (!isLocationDuplicate(item, uniqueApiItems, supabaseFilteredItems)) {
              uniqueApiItems.push(item);
            }
          });
          
          // Ghép kết quả
          const combinedList = [...supabaseFilteredItems, ...uniqueApiItems];
          onCategoryResultsChange(appendDistanceToPlaces(combinedList, lat, lng));
        } else {
          // Nếu API không trả về kết quả, chỉ hiển thị places từ Supabase
          onCategoryResultsChange(appendDistanceToPlaces(supabaseFilteredItems, lat, lng));
        }
      })
      .catch((err) => {
        console.error("Category filtering error:", err);
        const supabaseFilteredItems = allPlaces.filter(item => item.category?.toLowerCase() === activeCategory.toLowerCase());
        onCategoryResultsChange(appendDistanceToPlaces(supabaseFilteredItems, lat, lng));
      });
  }, [activeCategory, apiKey, allPlaces]);

  // 3. Render Markers on Map Loop
  // Mỗi khi categoryResults thay đổi → xóa markers cũ và vẽ lại markers mới
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Xóa tất cả markers cũ
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    
    if (!categoryResults || categoryResults.length === 0) return;

    // Vẽ marker cho từng place
    categoryResults.forEach(place => {
      const lat = Number(place.latitude);
      const lng = Number(place.longitude);
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

      // Tạo element HTML cho marker
      const el = document.createElement("div");
      el.className = "w-10 h-10 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer group";
      
      const isSupabase = place.id !== undefined; // Kiểm tra xem place có từ Supabase không
      const category = (place.category || "").toLowerCase();
      const types = place.types || []; // Types từ TrackAsia API

      // CẬP NHẬT: Config màu và icon cho 6 categories
      let markerConfig = { bgColor: "#3b82f6", iconHtml: `🏢` }; // Default

      if (category === "restaurant" || types.includes("restaurant") || types.includes("food")) {
        markerConfig = { bgColor: "#fb923c", iconHtml: `<img src="/restaurant-icon.png" class="w-6 h-6 object-contain transition-transform duration-200 group-hover:scale-110" />` };
      } else if (category === "bar" || types.includes("bar") || types.includes("night_club")) {
        markerConfig = { bgColor: "#a855f7", iconHtml: `<span class="text-xl">🍷</span>` };
      } else if (category === "beverage" || types.includes("cafe") || types.includes("coffee_shop")) {
        markerConfig = { bgColor: "#8b5cf6", iconHtml: `<span class="text-xl">☕</span>` }; // ← MỚI THÊM
      } else if (category === "sight" || types.includes("tourist_attraction") || types.includes("point_of_interest")) {
        markerConfig = { bgColor: "#3b82f6", iconHtml: `<span class="text-xl">👁️</span>` };
      } else if (category === "entertainment" || types.includes("amusement_park") || types.includes("casino") || types.includes("movie_theater")) {
        markerConfig = { bgColor: "#ec4899", iconHtml: `<img src="/park_map_icon.png" class="w-6 h-6 object-contain transition-transform duration-200 group-hover:scale-110" />` }; 
      } else if (category === "team_event") {
        markerConfig = { bgColor: "#10b981", iconHtml: `<span class="text-xl">👥</span>` };
      }

      el.style.backgroundColor = markerConfig.bgColor;
      el.innerHTML = markerConfig.iconHtml;

      // Highlight marker nếu là place từ Supabase + category đặc biệt
      if (isSupabase && (category === "team_event" || category === "bar" || category === "sight" || category === "beverage")) {
        el.style.borderColor = "#fbbf24";
        el.style.boxShadow = "0 0 10px rgba(251, 191, 36, 0.6)";
      }

      // Tạo popup hiển thị khi hover vào marker
      const hoverPopup = new trackasiagl.Popup({ offset: [0, -20], closeButton: false, closeOnClick: false })
        .setHTML(`<div class="p-1.5 max-w-xs text-slate-800"><div class="font-bold text-xs line-clamp-1">${place.name || "Location"}</div></div>`);

      el.addEventListener("mouseenter", () => hoverPopup.setLngLat([lng, lat]).addTo(mapRef.current));
      el.addEventListener("mouseleave", () => hoverPopup.remove());

      // Xử lý khi click vào marker
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        hoverPopup.remove(); // Tắt hover popup
        setFocusedLocation({
          lat: lat,
          lng: lng,
          name: place.name,
          address: place.address || place.formatted_address || place.vicinity,
          isNewCustomPoint: false
        });
      });

      // Thêm marker vào map
      const m = new trackasiagl.Marker({ element: el, anchor: "center" }).setLngLat([lng, lat]).addTo(mapRef.current);
      markersRef.current.push(m);
    });
  }, [categoryResults]);

  // 4. Camera Fly to Focused Location
  // Khi focusedLocation thay đổi → zoom map vào địa điểm đó
  useEffect(() => {
    if (!focusedLocation || !focusedLocation.lat || !focusedLocation.lng || !mapRef.current) return;
    const { lat, lng, name, address } = focusedLocation;
    
    // Zoom map vào địa điểm
    mapRef.current.flyTo({ center: [Number(lng), Number(lat)], zoom: 15, essential: true });
    
    // Xóa marker focus cũ (nếu có)
    focusMarkerRef.current?.remove();
    
    // Tạo marker mới (pin đỏ) tại địa điểm focus
    const pin = document.createElement("div");
    pin.className = "w-10 h-10 flex items-center justify-center cursor-pointer drop-shadow-md";
    pin.innerHTML = `<img src="/pin_map_dot.svg" style="width: 100%; height: 100%; object-fit: contain;" />`;
    
    // Thêm nút "See Details" vào popup
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
      .togglePopup(); // Tự động mở popup
    
    // THÊM: Xử lý click nút "See Details"
    setTimeout(() => {
      const seeDetailsBtn = document.querySelector('.see-details-btn');
      if (seeDetailsBtn && onPlaceClick) {
        seeDetailsBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          
          // Tìm place trong categoryResults
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
    <div className="relative h-full w-full">
      <div ref={mapContainerRef} className="h-full w-full" />
      
      {/* Nút "Recenter" để quay về vị trí user */}
      <button 
        onClick={handleRecenter} 
        className="absolute bottom-6 max-md:bottom-28 right-6 z-50 p-3 bg-white hover:bg-gray-50 text-blue-600 rounded-full shadow-xl border border-gray-100 transition-all active:scale-95 group"
      >
        <Navigation size={20} className="fill-blue-50 group-hover:rotate-45 transition-transform" />
      </button>
    </div>
  );
}