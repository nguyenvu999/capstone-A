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

  // 1. Khởi tạo Bản đồ
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

    mapRef.current.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      if (e.originalEvent.target.closest('.user-pulse-marker') || e.originalEvent.target.closest('img') || e.originalEvent.target.closest('.rounded-full')) {
        return; 
      }
      setFocusedLocation({
        lat: lat,
        lng: lng,
        name: "",
        address: `Tọa độ: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
      });
      setShowRegisterForm(true);
    });

    return () => {
      mapRef.current?.remove();
      userLocationMarkerRef.current?.remove();
    };
  }, [apiKey]);

  // 2. Logic gọi ngầm đồng bộ đa danh mục khi hiển thị Tất cả (Display All) hoặc danh mục cụ thể
  useEffect(() => {
    if (!mapRef.current) return;

    const [lng, lat] = userCoordsRef.current;

    // TRƯỜNG HỢP A: DISPLAY ALL (activeCategory trống)
    if (!activeCategory) {
      // Bổ sung đầy đủ 8 đầu mục tìm kiếm tương đương cấu trúc dữ liệu bản đồ toàn hệ thống
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
            
            if (!isDuplicate) {
              uniqueApiItems.push(item);
            }
          });

          onCategoryResultsChange([...allPlaces, ...uniqueApiItems]);
        })
        .catch((err) => {
          console.error("Lỗi quét ngầm đa danh mục:", err);
          onCategoryResultsChange(allPlaces);
        });
        
      return; 
    }

    // TRƯỜNG HỢP B: Khi một danh mục cụ thể được bấm chọn
    let trackAsiaType = activeCategory.toLowerCase();
    if (trackAsiaType === "entertainment") trackAsiaType = "amusement_park";
    if (trackAsiaType === "government") trackAsiaType = "local_government_office";
    if (trackAsiaType === "education") trackAsiaType = "school";

    fetch(`https://maps.track-asia.com/api/v2/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=${trackAsiaType}&key=${apiKey}`)
      .then(res => res.json())
      .then(data => {
        // Đồng bộ hóa việc tìm kiếm của Supabase cho chính xác định danh danh mục (chấp nhận cả chuỗi con)
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

  // 3. VÒNG LẶP DỰNG MARKER LÊN BẢN ĐỒ
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
      el.className = "w-10 h-10 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-110";
      
      const isSupabase = place.id !== undefined; 
      const category = (place.category || "").toLowerCase();
      const types = place.types || [];

      // Định nghĩa cấu hình hiển thị mặc định
      let markerConfig = {
        bgColor: "#3b82f6", 
        iconHtml: `🏢`
      };

      // PHÂN LOẠI LOGIC CHÈN HÌNH ẢNH ĐÚNG PHÂN HỆ
      // A. Nhà hàng / Ẩm thực
      if (category === "restaurant" || types.includes("restaurant") || types.includes("food")) {
        markerConfig = { bgColor: "#fb923c", iconHtml: `<img src="/restaurant-icon.png" style="width: 24px; height: 24px; object-fit: contain;" />` };
      } 
      // B. Giáo dục (Giữ nguyên Emoji và Màu Tím)
      else if (category === "education" || types.includes("school") || types.includes("university")) {
        markerConfig = { bgColor: "#8b5cf6", iconHtml: `<img src="/education-icon.png" style="width: 24px; height: 24px; object-fit: contain;" />` };
      } 
      // C. Y tế / Nhà thuốc
      else if (category === "pharmacy" || types.includes("pharmacy") || category === "hospital" || types.includes("hospital") || types.includes("health")) {
        markerConfig = { bgColor: "#10b981", iconHtml: `<img src="/medical_map_icon.png" style="width: 24px; height: 24px; object-fit: contain;" />` }; 
      } 
      // D. Giải trí / Công viên / Khu vui chơi
      else if (category === "entertainment" || types.includes("amusement_park") || types.includes("tourist_attraction")) {
        markerConfig = { bgColor: "#ec4899", iconHtml: `<img src="/park_map_icon.png" style="width: 24px; height: 24px; object-fit: contain;" />` }; 
      } 
      // E. Khách sạn / Nơi lưu trú
      else if (category === "hotel" || category === "lodging" || types.includes("lodging") || types.includes("hotel")) {
        markerConfig = { bgColor: "#87CEEB", iconHtml: `<img src="/lodging_map_icon.png" style="width: 24px; height: 24px; object-fit: contain;" />` }; 
      } 
      // F. Cơ quan hành chính / Nhà nước
      else if (category === "government" || category === "local_government_office" || types.includes("local_government_office")) {
        markerConfig = { bgColor: "#64748b", iconHtml: `<img src="/local_government_icon.png" style="width: 24px; height: 24px; object-fit: contain;" />` }; 
      }
      // G. Siêu thị / Trung tâm mua sắm (Dùng ảnh tương tự như nhà hàng)
      else if (category === "supermarket" || types.includes("supermarket") || types.includes("grocery_or_supermarket") || types.includes("shopping_mall")) {
        markerConfig = { bgColor: "#a855f7", iconHtml: `<img src="/supermarket_icon.png" style="width: 24px; height: 24px; object-fit: contain;" alt="Supermarket"/>` };
      }
      // H. Ngân hàng / ATM (Dùng ảnh tương tự như nhà hàng)
      else if (category === "bank" || types.includes("bank") || types.includes("atm")) {
        markerConfig = { bgColor: "#EEE8AA", iconHtml: `<img src="/bank_icon.png" style="width: 24px; height: 24px; object-fit: contain;" alt="Bank"/>` };
      }

      // Áp dụng CSS style và HTML icon
      el.style.backgroundColor = markerConfig.bgColor;
      el.innerHTML = markerConfig.iconHtml;

      // Phân biệt viền vàng cho các điểm VIP lưu trong Supabase (Chỉ áp dụng với điểm Giáo dục giữ emoji)
      if (isSupabase && category === "education") {
        el.style.borderColor = "#fbbf24";
        el.style.boxShadow = "0 0 10px rgba(251, 191, 36, 0.6)";
      }

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        setFocusedLocation({
          lat: lat,
          lng: lng,
          name: place.name,
          address: place.address || place.formatted_address || place.vicinity
        });
      });

      const m = new trackasiagl.Marker({ element: el }).setLngLat([lng, lat]).addTo(mapRef.current);
      markersRef.current.push(m);
    });
  }, [categoryResults]);

  // 4. Camera di chuyển đến vị trí Focus (Giữ nguyên pin_map_dot.svg)
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