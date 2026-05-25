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
  allPlaces
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
      alert("Trình duyệt không hỗ trợ định vị.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        userCoordsRef.current = [longitude, latitude]; 
        
        if (onUserLocationDetected) {
          onUserLocationDetected([longitude, latitude]);
        }

        if (!mapRef.current) return;

        if (shouldFlyTo) {
          mapRef.current.flyTo({
            center: [longitude, latitude],
            zoom: 14,
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
          .setPopup(new trackasiagl.Popup({ offset: 10 }).setHTML("<p class='text-xs font-semibold px-1'>Vị trí của bạn</p>"))
          .addTo(mapRef.current);
      },
      (error) => {
        console.error("Lỗi định vị:", error);
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
        userLocationMarkerRef.current = new trackasiagl.Marker({ element: el })
          .setLngLat([longitude, latitude])
          .addTo(mapRef.current);
      },
      (err) => console.error("Cứu hộ định vị thất bại:", err),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: Infinity }
    );
  };

  // 1. Khởi tạo Bản đồ & Cập nhật Logic Click để tự lấy Địa chỉ từ Tọa độ
  useEffect(() => {
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

    mapRef.current = new trackasiagl.Map({
      container: mapContainerRef.current,
      style: `https://maps.track-asia.com/styles/v2/streets.json?key=${apiKey}&detailLevel=none`,
      center: userCoordsRef.current,
      zoom: 13,
    });

    mapRef.current.on("load", () => {
      getUserCurrentLocation(true);
    });

    // ĐÃ FIX: Click Bản đồ tự động gọi API Geocode tìm địa chỉ chữ thực tế gần nhất
    mapRef.current.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      if (e.originalEvent.target.closest('.user-pulse-marker') || e.originalEvent.target.closest('img') || e.originalEvent.target.closest('.rounded-full')) {
        return; 
      }

      // Gọi API Geocode của Track-Asia theo chuẩn tài liệu cung cấp
      fetch(`https://maps.track-asia.com/api/v2/geocode/json?result_type=street_address&latlng=${lat},${lng}&key=${apiKey}&new_admin=true&include_old_admin=true&size=1&radius=100`)
        .then((res) => res.json())
        .then((data) => {
          let detectedAddress = `Tọa độ: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          let detectedCity = "";

          if (data.status === "OK" && data.results && data.results.length > 0) {
            const topPlace = data.results[0];
            detectedAddress = topPlace.formatted_address || topPlace.name || detectedAddress;

            // Vòng lặp bóc tách tên Thành phố / Tỉnh từ mảng components nếu có
            if (topPlace.address_components) {
              const cityComp = topPlace.address_components.find(comp => 
                comp.types.includes("administrative_area_level_1") || comp.types.includes("province")
              );
              if (cityComp) detectedCity = cityComp.long_name;
            }
            
            // Fallback nếu không bóc được từ components thì lấy cụm từ cuối của chuỗi address
            if (!detectedCity && detectedAddress.includes(",")) {
              const parts = detectedAddress.split(",");
              detectedCity = parts[parts.length - 1].trim();
            }
          }

          // Cập nhật State chuyển giao dữ liệu hoàn chỉnh cho Form nhận diện liền
          setFocusedLocation({
            lat: lat,
            lng: lng,
            name: "",
            address: detectedAddress,
            city: detectedCity
          });
          setShowRegisterForm(true);
        })
        .catch((err) => {
          console.error("Geocoding click error:", err);
          // Fallback khi mất mạng hoặc API lỗi
          setFocusedLocation({
            lat: lat,
            lng: lng,
            name: "",
            address: `Tọa độ: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            city: ""
          });
          setShowRegisterForm(true);
        });
    });

    return () => {
      mapRef.current?.remove();
      userLocationMarkerRef.current?.remove();
    };
  }, [apiKey]);

  // 2. Logic gọi ngầm đồng bộ đa danh mục (Giữ nguyên)
  useEffect(() => {
    if (!mapRef.current) return;
    const [lng, lat] = userCoordsRef.current;

    if (!activeCategory) {
      const targetTypes = ["restaurant", "hotel", "supermarket", "pharmacy", "amusement_park", "local_government_office", "school", "bank"];
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

          const formattedApiItems = combinedApiResults.map(item => {
            const itemLat = Number(item.geometry?.location?.lat || item.lat);
            const itemLng = Number(item.geometry?.location?.lng || item.lng);
            return { ...item, latitude: itemLat, longitude: itemLng };
          }).filter(item => !isNaN(item.latitude) && !isNaN(item.longitude));

          const uniqueApiItems = [];
          formattedApiItems.forEach(item => {
            const isDuplicate = uniqueApiItems.some(existing => existing.place_id === item.place_id || (existing.name.toLowerCase() === item.name.toLowerCase() && Math.abs(existing.latitude - item.latitude) < 0.0001))
              || allPlaces.some(sb => sb.name.toLowerCase() === item.name.toLowerCase() && Math.abs(Number(sb.latitude) - item.latitude) < 0.0001);
            
            if (!isDuplicate) uniqueApiItems.push(item);
          });

          onCategoryResultsChange([...allPlaces, ...uniqueApiItems]);
        })
        .catch((err) => {
          console.error("Lỗi quét ngầm đa danh mục:", err);
          onCategoryResultsChange(allPlaces);
        });
        
      return; 
    }

    let trackAsiaType = activeCategory.toLowerCase();
    if (trackAsiaType === "entertainment") trackAsiaType = "amusement_park";
    if (trackAsiaType === "government") trackAsiaType = "local_government_office";
    if (trackAsiaType === "education") trackAsiaType = "school";

    fetch(`https://maps.track-asia.com/api/v2/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=${trackAsiaType}&key=${apiKey}`)
      .then(res => res.json())
      .then(data => {
        const supabaseFilteredItems = allPlaces.filter(
          item => item.category?.toLowerCase() === activeCategory.toLowerCase() || 
                  (activeCategory.toLowerCase() === "government" && item.category?.toLowerCase() === "local_government_office")
        );

        if (data.results) {
          const formattedApiItems = data.results.map(item => {
            const itemLat = Number(item.geometry?.location?.lat || item.lat);
            const itemLng = Number(item.geometry?.location?.lng || item.lng);
            return { ...item, latitude: itemLat, longitude: itemLng };
          }).filter(item => !isNaN(item.latitude) && !isNaN(item.longitude));

          const apiItems = formattedApiItems.filter(
            apiItem => !supabaseFilteredItems.some(sb => sb.name.toLowerCase() === apiItem.name.toLowerCase())
          );
          
          onCategoryResultsChange([...supabaseFilteredItems, ...apiItems]);
        } else {
          onCategoryResultsChange(supabaseFilteredItems);
        }
      })
      .catch((err) => {
        console.error("Lỗi lọc danh mục đơn lẻ Track-Asia:", err);
        const supabaseFilteredItems = allPlaces.filter(
          item => item.category?.toLowerCase() === activeCategory.toLowerCase()
        );
        onCategoryResultsChange(supabaseFilteredItems);
      });
  }, [activeCategory, apiKey, allPlaces]);

  // 3. Vòng lặp dựng Marker lên bản đồ (Giữ nguyên)
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
      el.className = "w-10 h-10 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer group";
      
      const isSupabase = place.id !== undefined; 
      const category = (place.category || "").toLowerCase();
      const types = place.types || [];

      let markerConfig = { bgColor: "#3b82f6", iconHtml: `🏢` };

      if (category === "restaurant" || types.includes("restaurant") || types.includes("food")) {
        markerConfig = { bgColor: "#fb923c", iconHtml: `<img src="/restaurant-icon.png" class="w-6 h-6 object-contain transition-transform duration-200 group-hover:scale-110" />` };
      } else if (category === "education" || types.includes("school") || types.includes("university")) {
        markerConfig = { bgColor: "#8b5cf6", iconHtml: `<img src="/education-icon.png" class="w-6 h-6 object-contain transition-transform duration-200 group-hover:scale-110" />` };
      } else if (category === "pharmacy" || types.includes("pharmacy") || category === "hospital" || types.includes("hospital") || types.includes("health")) {
        markerConfig = { bgColor: "#10b981", iconHtml: `<img src="/medical_map_icon.png" class="w-6 h-6 object-contain transition-transform duration-200 group-hover:scale-110" />` }; 
      } else if (category === "entertainment" || types.includes("amusement_park") || types.includes("tourist_attraction")) {
        markerConfig = { bgColor: "#ec4899", iconHtml: `<img src="/park_map_icon.png" class="w-6 h-6 object-contain transition-transform duration-200 group-hover:scale-110" />` }; 
      } else if (category === "hotel" || category === "lodging" || types.includes("lodging") || types.includes("hotel")) {
        markerConfig = { bgColor: "#87CEEB", iconHtml: `<img src="/lodging_map_icon.png" class="w-6 h-6 object-contain transition-transform duration-200 group-hover:scale-110" />` }; 
      } else if (category === "government" || category === "local_government_office" || types.includes("local_government_office")) {
        markerConfig = { bgColor: "#64748b", iconHtml: `<img src="/local_government_icon.png" class="w-6 h-6 object-contain transition-transform duration-200 group-hover:scale-110" />` }; 
      } else if (category === "supermarket" || types.includes("supermarket") || types.includes("grocery_or_supermarket") || types.includes("shopping_mall")) {
        markerConfig = { bgColor: "#a855f7", iconHtml: `<img src="/supermarket_icon.png" class="w-6 h-6 object-contain transition-transform duration-200 group-hover:scale-110" alt="Supermarket"/>` };
      } else if (category === "bank" || types.includes("bank") || types.includes("atm")) {
        markerConfig = { bgColor: "#FFE74A", iconHtml: `<img src="/bank_icon.png" class="w-6 h-6 object-contain transition-transform duration-200 group-hover:scale-110" alt="Bank"/>` };
      }

      el.style.backgroundColor = markerConfig.bgColor;
      el.innerHTML = markerConfig.iconHtml;

      if (isSupabase && category === "education") {
        el.style.borderColor = "#fbbf24";
        el.style.boxShadow = "0 0 10px rgba(251, 191, 36, 0.6)";
      }

      const hoverPopup = new trackasiagl.Popup({ 
        offset: [0, -20], closeButton: false, closeOnClick: false 
      }).setHTML(`
        <div class="p-1.5 max-w-xs text-slate-800">
          <div class="font-bold text-xs line-clamp-1">${place.name || "Địa điểm"}</div>
          <div class="text-[10px] text-gray-500 mt-0.5 line-clamp-2">${place.address || place.formatted_address || place.vicinity || ""}</div>
        </div>
      `);

      el.addEventListener("mouseenter", () => hoverPopup.setLngLat([lng, lat]).addTo(mapRef.current));
      el.addEventListener("mouseleave", () => hoverPopup.remove());
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        hoverPopup.remove();
        setFocusedLocation({
          lat: lat,
          lng: lng,
          name: place.name,
          address: place.address || place.formatted_address || place.vicinity
        });
      });

      const m = new trackasiagl.Marker({ element: el, anchor: "center" }).setLngLat([lng, lat]).addTo(mapRef.current);
      markersRef.current.push(m);
    });
  }, [categoryResults]);

  // 4. Camera di chuyển đến vị trí Focus (Giữ nguyên)
  useEffect(() => {
    if (!focusedLocation || !focusedLocation.lat || !focusedLocation.lng || !mapRef.current) return;
    const { lat, lng, name, address } = focusedLocation;
    
    mapRef.current.flyTo({ center: [Number(lng), Number(lat)], zoom: 15, essential: true });
    focusMarkerRef.current?.remove();
    
    const pin = document.createElement("div");
    pin.className = "w-10 h-10 flex items-center justify-center cursor-pointer drop-shadow-md transition-transform";
    pin.innerHTML = `<img src="/pin_map_dot.svg" style="width: 100%; height: 100%; object-fit: contain;" />`;
    
    focusMarkerRef.current = new trackasiagl.Marker({ element: pin, anchor: "bottom" })
      .setLngLat([Number(lng), Number(lat)])
      .setPopup(new trackasiagl.Popup({ offset: [0, -32] }).setHTML(`<b>${name || "Điểm Đang Chọn"}</b><br/>${address || ""}`))
      .addTo(mapRef.current)
      .togglePopup();
  }, [focusedLocation?.lat, focusedLocation?.lng]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainerRef} className="h-full w-full" />
      <button onClick={handleRecenter} className="absolute bottom-6 right-6 z-50 p-3 bg-white hover:bg-gray-50 text-blue-600 rounded-full shadow-xl border border-gray-100 transition-all active:scale-95 group">
        <Navigation size={20} className="fill-blue-50 group-hover:rotate-45 transition-transform" />
      </button>
    </div>
  );
}