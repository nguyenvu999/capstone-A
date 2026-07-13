import { useState, useEffect } from "react";
import MapContainer from "../components/MapContainer"; 
import MapSidebar from "../components/MapSidebar";
import RegisterPlaceForm from "../components/RegisterPlaceForm";
import Navbar from "../components/Navbar"; 
import { useAuth } from "../../auth/context/AuthContext"; 
import { supabase } from "../../auth/api/supabaseClient"; 
import PlaceDetailModal from "../components/PlaceDetailModal";
import MyPlacesPanel from "../components/MyPlacesPanel";
import { useSearchParams } from "react-router-dom";
import { doesScheduleCoverInterval } from "../utils/openingHoursUtils";

export default function MapPage() {
  const { user, logoutUser } = useAuth(); 
  const [activeCategory, setActiveCategory] = useState(null);
  const [allPlaces, setAllPlaces] = useState([]); 
  const [categoryResults, setCategoryResults] = useState([]); 
  const [focusedLocation, setFocusedLocation] = useState(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [currentUserCoords, setCurrentUserCoords] = useState([106.694945, 10.769034]); // GPS thật
  const [pinPointCoords, setPinPointCoords] = useState(null); // Pin coords (nếu có)
  const [activeCoords, setActiveCoords] = useState([106.694945, 10.769034]); // Coords đang dùng (GPS hoặc Pin)
  const [forceOpenDirectionPlace, setForceOpenDirectionPlace] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showMyPlaces, setShowMyPlaces] = useState(false);
  const [searchParams] = useSearchParams(); 
  const [buildingDataForRegister, setBuildingDataForRegister] = useState(null);
  const [openedFromBuilding, setOpenedFromBuilding] = useState(null);
  const [reopenBuildingAddress, setReopenBuildingAddress] = useState(null);
  const [openedFromBuildingFloor, setOpenedFromBuildingFloor] = useState(null);
  const [reopenBuildingFloor, setReopenBuildingFloor] = useState(null);

  const [activeFilters, setActiveFilters] = useState({
    priceLevels: [],
    ratings: []
  });

  const API_KEYS = [
    "8193e665190bbc1781789003bbe9e009a8",
    "77419a61591781935988168acf687f7dee",
    "e0f1ad1781936067b59fec71b12732236d",
    "11240f01781936110d1c8755abc1f409bf",
    "1781936171b911e2359a65b021d8d9c089",
    "f9fa81781936383165b107982082b1c25c",
  ];
  const [currentKeyIndex, setCurrentKeyIndex] = useState(0);
  const API_KEY = API_KEYS[currentKeyIndex]; // Lấy key hiện tại dựa trên Index

  // Hàm bổ trợ để chủ động chuyển sang Key tiếp theo trong mảng
  const rotateApiKey = () => {
    setCurrentKeyIndex((prevIndex) => {
      const nextIndex = (prevIndex + 1) % API_KEYS.length;
      console.warn(`🔄 [API Key] Key thứ ${prevIndex} gặp sự cố. Tự động chuyển sang key thứ ${nextIndex}: ${API_KEYS[nextIndex]}`);
      return nextIndex;
    });
  };

  // Check URL params để mở My Places
  useEffect(() => {
    const view = searchParams.get("view");
    
    if (view === "myplaces") {
      setShowMyPlaces(true);
      setShowRegisterForm(false);
      setSelectedPlace(null);
    } else {
      // Nếu không có view param → đóng My Places
      setShowMyPlaces(false);
    }
  }, [searchParams]);

  // ===== THÊM: Function mở Register Form + đóng Place Detail =====
  const handleOpenRegisterForm = () => {
    setSelectedPlace(null); // Đóng Place Detail nếu đang mở
    setShowMyPlaces(false);  // Đóng My Places nếu đang mở
    setShowRegisterForm(true); // Mở Register Form
  };

  const sortPlacesByRealRoad = async (placesArray, userCoords) => {
    if (!placesArray || placesArray.length === 0) return [];
    try {
      const [userLng, userLat] = userCoords;
      let coordinatesString = `${userLng},${userLat}`;
      placesArray.forEach(p => { coordinatesString += `;${p.longitude},${p.latitude}`; });

      const response = await fetch(`https://maps.track-asia.com/distance-matrix/v1/moto/${coordinatesString}?sources=0&annotations=distance&key=${API_KEY}`);
      const matrixData = await response.json();

      if (matrixData && matrixData.distances && matrixData.distances[0]) {
        const distancesFromUser = matrixData.distances[0]; 
        const enrichedPlaces = placesArray.map((place, index) => ({
          ...place,
          distance: (distancesFromUser[index + 1] || Infinity) / 1000
        }));
        return enrichedPlaces.sort((a, b) => a.distance - b.distance);
      }
    } catch (e) { console.error("Lỗi khoảng cách matrix:", e); }
    return placesArray;
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; 
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
        
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
  };

  const fetchPlacesFromSupabase = async (userCoords = currentUserCoords, currentCat = activeCategory, filters = activeFilters) => {
    console.log("🔍 [MapPage] fetchPlacesFromSupabase called");
    console.log("   📍 Coords:", userCoords);
    console.log("   🏷️ Category:", currentCat);
    console.log("   🔧 Filters:", filters);
    
    try {
      let query = supabase.from("places").select("*");
      
      if (currentCat) {
        query = query.eq("category", currentCat);
      }

      if (filters.priceLevels.length > 0) {
        query = query.in("price_level", filters.priceLevels);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      console.log("📦 [MapPage] Fetched", data?.length || 0, "places from Supabase");
      
      if (data) {
        const normalized = data.map(item => ({
          id: item.id, 
          name: item.name, 
          latitude: Number(item.latitude), 
          longitude: Number(item.longitude), 
          address: item.address, 
          category: item.category,
          price_level: item.price_level,
          business_status: item.business_status,
          rating: item.rating || 0,
          created_by: item.created_by, 
          created_by_email: item.created_by_email, 
          description: item.description,
          opening_hours: item.opening_hours || null,
          isSupabaseData: true,
          
          // ✅ THÊM: Building fields (với default values an toàn)
          place_type: item.place_type || "standalone",
          building_name: item.building_name || null,
          floor_level: item.floor_level ? String(item.floor_level).toUpperCase() : null,
          building_address: item.building_address || null,
        }));

        const [userLng, userLat] = userCoords;
        const placesWithin5km = normalized.filter(place => {
          const distance = calculateDistance(
            userLat, 
            userLng, 
            place.latitude, 
            place.longitude
          );
          return distance <= 5; 
        });
        
        console.log("📏 [MapPage] Filtered to", placesWithin5km.length, "places within 5km");

        const sorted = await sortPlacesByRealRoad(placesWithin5km, userCoords);
        
        let filtered = sorted;
        if (filters.ratings.length > 0) {
          if (filters.ratings.length === 1) {
            const minRating = filters.ratings[0];
            filtered = sorted.filter(place => (place.rating || 0) >= minRating);
          } else {
            const minRating = Math.min(...filters.ratings);
            const maxRating = Math.max(...filters.ratings);
            
            if (maxRating === 5) {
              filtered = sorted.filter(place => (place.rating || 0) >= minRating);
            } else {
              filtered = sorted.filter(place => {
                const rating = place.rating || 0;
                return rating >= minRating && rating < maxRating;
              });
            }
          }
        }

        // Opening Hours filter
        if (filters.openingHours) {
          const enabledDays = filters.openingHours.filter(d => d.enabled && d.openTime && d.closeTime);
          
          if (enabledDays.length > 0) {
            filtered = filtered.filter(place => {
              if (!place.opening_hours || !Array.isArray(place.opening_hours)) return false;

              return enabledDays.every(filterDay => {
                const dayIndex = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'].indexOf(filterDay.dayOfWeek);
                const placeSchedule = place.opening_hours[dayIndex];
                
                if (!placeSchedule || !placeSchedule.isOpen) return false;
                
                return doesScheduleCoverInterval(placeSchedule, filterDay.openTime, filterDay.closeTime);
              });
            });
          }
        }
        
        console.log("[MapPage] Setting allPlaces + categoryResults (", filtered.length, "places)");
        setAllPlaces(filtered);
        setCategoryResults(filtered);
      }
    } catch (err) { 
      console.error("❌ [MapPage] Fetch places error:", err); 
    }
  };

  const handleFilterChange = (newFilters) => {
    setActiveFilters(newFilters);
    fetchPlacesFromSupabase(activeCoords, activeCategory, newFilters);
  };

  const handleSelectCategory = (category) => {
    const nextCat = activeCategory === category ? null : category;
    setActiveCategory(nextCat);
    setFocusedLocation(null);
    fetchPlacesFromSupabase(activeCoords, nextCat, activeFilters);
  };

  //After register a place successfully it will navigate to the place detail 
  const handlePlaceRegistered = async (newPlace) => {
    await fetchPlacesFromSupabase();
    setShowRegisterForm(false);
    
    // ✅ Sau khi fetch xong, tìm place vừa tạo từ DB để có đầy đủ data
    // Dùng setTimeout nhỏ để đảm bảo state đã update
    setTimeout(() => {
      setSelectedPlace(prev => {
        // Nếu newPlace có id hợp lệ → set selectedPlace để mở PlaceDetailModal
        if (newPlace && newPlace.id) {
          return {
            ...newPlace,
            latitude: newPlace.lat || newPlace.latitude,
            longitude: newPlace.lng || newPlace.longitude,
          };
        }
        return null;
      });
    }, 100);
    
    // ✅ Update focusedLocation để thẻ hiện đúng tên place mới
    if (newPlace && newPlace.lat && newPlace.lng) {
      setFocusedLocation({
        lat: newPlace.lat || newPlace.latitude,
        lng: newPlace.lng || newPlace.longitude,
        name: newPlace.name,
        address: newPlace.address,
        rating: 0,
        isNewCustomPoint: false,
        place_type: newPlace.place_type || "standalone",
        building_name: newPlace.building_name || null,
        floor_level: newPlace.floor_level || null,
      });
    }
  };

  // Handle khi building được convert thành standalone
  const handleBuildingConverted = async () => {
    // Re-fetch places để cập nhật marker icon từ 🏢 → category icon
    await fetchPlacesFromSupabase(activeCoords, activeCategory, activeFilters);
  };

  // Called after a place is edited — update the open modal immediately,
  // then re-fetch so map markers stay in sync
  const handlePlaceUpdated = (updatedPlace) => {
    if (updatedPlace) {
      // ✅ Place được update (không phải delete)
      setSelectedPlace(updatedPlace);
      
      setFocusedLocation(prev => {
        if (
          prev &&
          Math.abs(Number(prev.lat) - Number(updatedPlace.latitude)) < 0.0001 &&
          Math.abs(Number(prev.lng) - Number(updatedPlace.longitude)) < 0.0001
        ) {
          return {
            ...prev,
            name: updatedPlace.name,
            address: updatedPlace.address,
            rating: updatedPlace.rating || 0,

            // ✅ THÊM: building info để popup update luôn
            place_type: updatedPlace.place_type ?? prev.place_type,
            building_name: updatedPlace.building_name ?? prev.building_name,
            floor_level: updatedPlace.floor_level ?? prev.floor_level,

            // ✅ THÊM: key để force popup rebuild
            popupRefreshKey: Date.now(),
          };
        }
        return prev;
      });
    } else {
      // ✅ Place bị DELETE (updatedPlace = undefined/null)
      setFocusedLocation(null);
      setSelectedPlace(null);
    }

    fetchPlacesFromSupabase(activeCoords, activeCategory, activeFilters);
  };

  const handleMyPlaceClick = (place) => {
    console.log("[MapPage] My place clicked:", place);
    
    // ❌ KHÔNG đóng My Places panel
    // ❌ KHÔNG mở Place Detail ngay
    
    // Tính khoảng cách từ GPS
    const [gpsLng, gpsLat] = currentUserCoords;
    const R = 6371;
    const dLat = ((place.latitude - gpsLat) * Math.PI) / 180;
    const dLon = ((place.longitude - gpsLng) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((gpsLat * Math.PI) / 180) * Math.cos((place.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    // Nếu NGOÀI 5km → thêm vào categoryResults
    if (distance > 5) {
      console.log("📍 [MapPage] Place outside 5km, adding to categoryResults");
      const normalizedPlace = {
        ...place,
        latitude: Number(place.latitude),
        longitude: Number(place.longitude),
        isSupabaseData: true,
        distanceText: `${distance.toFixed(1)} km`
      };
      
      setCategoryResults(prev => {
        const existingIds = prev.map(p => p.id);
        if (existingIds.includes(place.id)) {
          return prev;
        }
        return [...prev, normalizedPlace];
      });
    }
    
    // ✅ CHỈ set focused location (hiện marker + popup)
    setFocusedLocation({
      id: place.id || null,
      lat: Number(place.latitude),
      lng: Number(place.longitude),
      name: place.name,
      address: place.address,
      rating: place.rating || 0,
      isNewCustomPoint: false,
      place_type: place.place_type || null,
      building_name: place.building_name || null,
      floor_level: place.floor_level || null,
      popupRefreshKey: Date.now(),
    });
    
    // ❌ KHÔNG mở Place Detail
    // User phải click "See Details" trong popup mới mở
  };

  // Mở Register Form ở building mode "adding" từ Building Detail Panel
  const handleAddPlaceToBuilding = (buildingData) => {
    console.log("🏢 [MapPage] Add place to building:", buildingData);
    setSelectedPlace(null);
    setShowMyPlaces(false);
    setShowRegisterForm(true);
    setBuildingDataForRegister(buildingData);
  };

  const handlePinPointChange = (coords) => {
    console.log("🔴 [MapPage] handlePinPointChange called with coords:", coords);
    
    setPinPointCoords(coords);
    
    if (coords) {
      // ===== BẬT PIN MODE =====
      console.log("✅ [MapPage] PIN MODE ON - Setting activeCoords to:", coords);
      setActiveCoords(coords);
      
      console.log("📍 [MapPage] Fetching places from PIN location...");
      fetchPlacesFromSupabase(coords, activeCategory, activeFilters);
    } else {
      // ===== TẮT PIN MODE =====
      console.log("❌ [MapPage] PIN MODE OFF - Reverting to GPS coords:", currentUserCoords);
      setActiveCoords(currentUserCoords);
      
      console.log("🧭 [MapPage] Fetching places from GPS location...");
      fetchPlacesFromSupabase(currentUserCoords, activeCategory, activeFilters);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden flex flex-col bg-white">
      {/* ===== THAY ĐỔI: Truyền handleOpenRegisterForm thay vì setShowRegisterForm ===== */}
      <Navbar user={user} onSignOut={logoutUser} onRegisterClick={handleOpenRegisterForm} />
      
      <div className="w-full flex-1 relative flex overflow-hidden z-10">
        
        <MapSidebar 
          apiKey={API_KEY} 
          activeCategory={activeCategory} 
          categoryResults={categoryResults}
          onSelectCategory={handleSelectCategory} 
          setCategoryResults={setCategoryResults}
          setFocusedLocation={setFocusedLocation} 
          focusedLocation={focusedLocation} 
          currentUserCoords={activeCoords}
          onTriggerDirectionPanel={(place) => setForceOpenDirectionPlace(place)}
          onFilterChange={handleFilterChange} 
          onPlaceClick={(place) => {
            setShowRegisterForm(false);
            setShowMyPlaces(false);
            setSelectedPlace(place);
          }}
        />
        
        <MapContainer 
          apiKey={API_KEY} 
          activeCategory={activeCategory} 
          focusedLocation={focusedLocation}
          categoryResults={categoryResults.filter(place => place.isSupabaseData === true)} 
          onCategoryResultsChange={setCategoryResults}
          setFocusedLocation={setFocusedLocation} 
          setShowRegisterForm={(value) => {
            if (value) {
              setSelectedPlace(null);
              setShowMyPlaces(false);
            }

            setShowRegisterForm(value);
          }}
          onUserLocationDetected={(coords) => { 
            setCurrentUserCoords(coords); // Lưu GPS thật
            
            if (!pinPointCoords) { 
              // Chưa có pin → dùng GPS thật
              setActiveCoords(coords);
              fetchPlacesFromSupabase(coords, activeCategory, activeFilters);
            }
            // Nếu đã có pin → KHÔNG load lại (giữ nguyên places từ pin)
          }}
          allPlaces={allPlaces} 
          sortPlacesByRealRoad={sortPlacesByRealRoad} 
          currentUserCoords={activeCoords}
          forceOpenDirectionPlace={forceOpenDirectionPlace} 
          setForceOpenDirectionPlace={setForceOpenDirectionPlace}
          onPlaceClick={(place, fromBuildingAddress) => {
            setSelectedPlace(place);
            setShowMyPlaces(false);
            setOpenedFromBuilding(fromBuildingAddress || null);
            setOpenedFromBuildingFloor(place?.floor_level || null);
          }}
          onAddPlaceToBuilding={handleAddPlaceToBuilding}
          showRegisterForm={showRegisterForm}           
          selectedPlace={selectedPlace}                 
          onPinPointChange={handlePinPointChange}       
          activeFilters={activeFilters}
          reopenBuildingAddress={reopenBuildingAddress}
          reopenBuildingFloor={reopenBuildingFloor}
          onReopenBuildingHandled={() => {
            setReopenBuildingAddress(null);
            setReopenBuildingFloor(null);
          }}
          onBuildingConverted={handleBuildingConverted}
        />
      </div>
      
      {showRegisterForm && (
        <RegisterPlaceForm 
          apiKey={API_KEY} 
          focusedLocation={focusedLocation} 
          setFocusedLocation={setFocusedLocation} 
          onClose={() => {
            setShowRegisterForm(false);
            setBuildingDataForRegister(null);
            if (searchParams.get("view")) {
              window.history.replaceState({}, '', '/map');
            }
          }} 
          allPlaces={allPlaces} 
          onSuccess={handlePlaceRegistered}
          currentUserCoords={currentUserCoords}
          buildingDataForRegister={buildingDataForRegister}
        />
      )}

      {/* Place Detail Modal - Giờ đây nằm bên phải giống Register Form */}
      {selectedPlace && (
        <PlaceDetailModal
          place={selectedPlace}
          onClose={() => {
            setSelectedPlace(null);
            setOpenedFromBuilding(null);
            setOpenedFromBuildingFloor(null);
            if (searchParams.get("view")) {
              window.history.replaceState({}, '', '/map');
            }
          }}
          onStatusUpdated={handlePlaceUpdated}
          apiKey={API_KEY}
          openedFromBuilding={openedFromBuilding}
          onBackToBuilding={() => {
            setSelectedPlace(null);
            setReopenBuildingAddress(openedFromBuilding);
            setReopenBuildingFloor(openedFromBuildingFloor);
            setOpenedFromBuilding(null);
            setOpenedFromBuildingFloor(null);
          }}
        />
      )}

      {/* My Places Panel */}
      {showMyPlaces && (
        <MyPlacesPanel
          onClose={() => setShowMyPlaces(false)}
          onPlaceClick={handleMyPlaceClick}
          currentUserCoords={currentUserCoords}
        />
      )}
    </div>
  );
}
