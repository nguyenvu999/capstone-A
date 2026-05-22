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

  // 2. Quét API Track-Asia ngoài đồng bộ
  useEffect(() => {
    if (!mapRef.current) return;

    const [lng, lat] = userCoordsRef.current;

    // TRƯỜNG HỢP A: Khi mới tải trang / Không chọn danh mục -> Quét toàn bộ điểm xung quanh 5km
    if (!activeCategory) {
      fetch(`https://maps.track-asia.com/api/v2/place/nearbysearch/json?location=${lat},${lng}&radius=5000&key=${apiKey}`)
        .then(res => res.json())
        .then(data => {
          if (data.results) {
            const apiItems = data.results.filter(
              apiItem => !allPlaces.some(sb => sb.name.toLowerCase() === apiItem.name.toLowerCase())
            );
            onCategoryResultsChange([...allPlaces, ...apiItems]);
          }
        })
        .catch((err) => console.error("Lỗi quét tổng hợp Track-Asia:", err));
        
      return; 
    }

    // TRƯỜNG HỢP B: Khi click chọn danh mục rõ ràng
    let trackAsiaType = activeCategory;
    if (activeCategory === "entertainment") trackAsiaType = "amusement_park";
    if (activeCategory === "government") trackAsiaType = "local_government_office";
    if (activeCategory === "education") trackAsiaType = "school";

    fetch(`https://maps.track-asia.com/api/v2/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=${trackAsiaType}&key=${apiKey}`)
      .then(res => res.json())
      .then(data => {
        if (data.results) {
          const supabaseFilteredItems = allPlaces.filter(
            item => item.category?.toLowerCase() === activeCategory.toLowerCase()
          );
          
          const apiItems = data.results.filter(
            apiItem => !supabaseFilteredItems.some(sb => sb.name.toLowerCase() === apiItem.name.toLowerCase())
          );
          
          onCategoryResultsChange([...supabaseFilteredItems, ...apiItems]);
        }
      })
      .catch((err) => console.error("Lỗi lọc danh mục Track-Asia:", err));

  }, [activeCategory, apiKey, allPlaces]);

  // 3. Vòng lặp dựng Marker lên bản đồ
  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (!categoryResults || categoryResults.length === 0) return;

    categoryResults.forEach(place => {
      const lat = Number(place.latitude || place.geometry?.location?.lat);
      const lng = Number(place.longitude || place.geometry?.location?.lng);

      if (!lat || !lng) return;

      const el = document.createElement("div");
      el.className = "w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-110";
      
      const isSupabase = place.latitude !== undefined;
      const category = (place.category || "").toLowerCase();
      const isTrackAsiaRestaurant = place.types?.includes("restaurant") || place.types?.includes("food");

      // KIỂM TRA ĐIỀU KIỆN RESTAURANT ĐỂ ĐỔI ICON ẢNH
      if (category === "restaurant" || (!isSupabase && isTrackAsiaRestaurant)) {
        el.style.backgroundColor = "#ea580c"; 
        el.innerHTML = `<img src="/restaurant-icon.jpg" style="width: 18px; height: 18px; object-fit: contain;" />`;
      } 
      else {
        if (isSupabase) {
          el.innerHTML = `📍`;
          el.style.backgroundColor = "#ef4444"; 
          el.style.fontSize = "12px";
        } else {
          el.style.backgroundColor = place.icon_background_color || "#3b82f6"; 
          if (place.icon) {
            el.innerHTML = `<img src="${place.icon}" style="width:14px; filter:brightness(0) invert(1)" />`;
          } else {
            el.innerHTML = `🏢`;
          }
        }
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

  // 4. Di chuyển camera đến vị trí đang chọn (ĐÃ FIX: Dùng lại pin_map_dot.svg từ thư mục public)
  useEffect(() => {
    if (!focusedLocation || !focusedLocation.lat || !focusedLocation.lng || !mapRef.current) return;
    const { lat, lng, name, address } = focusedLocation;
    
    mapRef.current.flyTo({ center: [Number(lng), Number(lat)], zoom: 15, essential: true });
    focusMarkerRef.current?.remove();
    
    // Tạo cấu trúc thẻ div chứa ảnh SVG thay thế cho emoji 🎯 cũ
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