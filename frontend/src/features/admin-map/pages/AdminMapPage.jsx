import { useState, useEffect } from "react";
import AdminNavbar from "../components/AdminNavbar";
import MapContainer from "../components/MapContainer";
import AllPlacesSidebar from "../components/AllPlacesSidebar";
import PlaceDetailModal from "../components/PlaceDetailModal";
import { supabase } from "../../auth/api/supabaseClient";

const API_KEYS = [
  "8193e665190bbc1781789003bbe9e009a8",
  "77419a61591781935988168acf687f7dee",
  "e0f1ad1781936067b59fec71b12732236d",
  "11240f01781936110d1c8755abc1f409bf",
  "1781936171b911e2359a65b021d8d9c089",
  "f9fa81781936383165b107982082b1c25c",
];

export default function AdminMapPage() {
  const [allPlaces, setAllPlaces] = useState([]);
  const [categoryResults, setCategoryResults] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [focusedLocation, setFocusedLocation] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [currentKeyIndex, setCurrentKeyIndex] = useState(0);
  const [openedFromBuilding, setOpenedFromBuilding] = useState(null);
  const [reopenBuildingAddress, setReopenBuildingAddress] = useState(null);

  const [activeFilters, setActiveFilters] = useState({
    priceLevels: [],
    ratings: [],
  });

  const API_KEY = API_KEYS[currentKeyIndex];

  // ===== FETCH ALL PLACES FROM SUPABASE (NO 5KM LIMIT) =====
  const fetchAllPlaces = async (currentCat = activeCategory, filters = activeFilters) => {
    try {
      let query = supabase.from("places").select("*");

      // Category filter (server-side)
      if (currentCat) {
        query = query.eq("category", currentCat);
      }

      // Price filter (server-side)
      if (filters.priceLevels.length > 0) {
        query = query.in("price_level", filters.priceLevels);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data) {
        const normalized = data.map((item) => ({
          id: item.id,
          name: item.name,
          latitude: Number(item.latitude),
          longitude: Number(item.longitude),
          address: item.address,
          city: item.city,
          category: item.category,
          price_level: item.price_level,
          business_status: item.business_status,
          rating: item.rating || 0,
          review_count: item.review_count || 0,
          created_by: item.created_by,
          created_by_email: item.created_by_email,
          description: item.description,
          source: item.source,
          isSupabaseData: true,
          place_type: item.place_type || "standalone",
          building_name: item.building_name || null,
          floor_level: item.floor_level ? String(item.floor_level).toUpperCase() : null,
          building_address: item.building_address || null,
          updated_by: item.updated_by || null,
          updated_by_email: item.updated_by_email || null,
          updated_at: item.updated_at || null,
          created_at: item.created_at || null,
        }));

        // Rating filter (client-side — same logic as User Web MapPage)
        let filtered = normalized;
        if (filters.ratings.length > 0) {
          if (filters.ratings.length === 1) {
            const minRating = filters.ratings[0];
            filtered = normalized.filter((place) => (place.rating || 0) >= minRating);
          } else {
            const minRating = Math.min(...filters.ratings);
            const maxRating = Math.max(...filters.ratings);
            if (maxRating === 5) {
              filtered = normalized.filter((place) => (place.rating || 0) >= minRating);
            } else {
              filtered = normalized.filter((place) => {
                const rating = place.rating || 0;
                return rating >= minRating && rating < maxRating;
              });
            }
          }
        }

        setAllPlaces(filtered);
        setCategoryResults(filtered);
      }
    } catch (err) {
      console.error("Failed to load places:", err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAllPlaces();
  }, []);

  // ===== HANDLERS =====

  const handleSelectCategory = (category) => {
    const nextCat = activeCategory === category ? null : category;
    setActiveCategory(nextCat);
    setFocusedLocation(null);
    fetchAllPlaces(nextCat, activeFilters);
  };

  const handleFilterChange = (newFilters) => {
    setActiveFilters(newFilters);
    fetchAllPlaces(activeCategory, newFilters);
  };

  const handlePlaceClick = (place, fromBuildingAddress) => {
    setSelectedPlace(place);
    setOpenedFromBuilding(fromBuildingAddress || null);
    
    setFocusedLocation({
      lat: Number(place.latitude),
      lng: Number(place.longitude),
      name: place.name,
      address: place.address,
      rating: place.rating || 0,
      isNewCustomPoint: false,
      place_type: place.place_type,
      building_name: place.building_name,
      floor_level: place.floor_level,
    });
  };

  const handlePlaceUpdated = (updatedPlace) => {
    if (updatedPlace) {
      setSelectedPlace(updatedPlace);

      setFocusedLocation((prev) => {
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
            place_type: updatedPlace.place_type ?? prev.place_type,
            building_name: updatedPlace.building_name ?? prev.building_name,
            floor_level: updatedPlace.floor_level ?? prev.floor_level,
            popupRefreshKey: Date.now(),
          };
        }
        return prev;
      });
    } else {
      // Place was deleted
      setFocusedLocation(null);
      setSelectedPlace(null);
    }

    fetchAllPlaces(activeCategory, activeFilters);
  };

  const handleBuildingConverted = async () => {
    await fetchAllPlaces(activeCategory, activeFilters);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden flex flex-col bg-white">
      <AdminNavbar pendingRequestsCount={0} />

      <div className="w-full flex-1 relative flex overflow-hidden z-10">
        <AllPlacesSidebar
          apiKey={API_KEY}
          activeCategory={activeCategory}
          categoryResults={categoryResults}
          onSelectCategory={handleSelectCategory}
          setCategoryResults={setCategoryResults}
          setFocusedLocation={setFocusedLocation}
          focusedLocation={focusedLocation}
          onFilterChange={handleFilterChange}
          onPlaceClick={(place) => {
            setSelectedPlace(place);
            setOpenedFromBuilding(null);
          }}
        />

        <MapContainer
          apiKey={API_KEY}
          focusedLocation={focusedLocation}
          categoryResults={categoryResults.filter((place) => place.isSupabaseData === true)}
          setFocusedLocation={setFocusedLocation}
          onPlaceClick={(place, fromBuildingAddress) => {
            setSelectedPlace(place);
            setOpenedFromBuilding(fromBuildingAddress || null);
          }}
          selectedPlace={selectedPlace}
          reopenBuildingAddress={reopenBuildingAddress}
          onReopenBuildingHandled={() => setReopenBuildingAddress(null)}
          activeFilters={activeFilters}
          onBuildingConverted={handleBuildingConverted}
        />
      </div>

      {/* Place Detail Modal */}
      {selectedPlace && (
        <PlaceDetailModal
          place={selectedPlace}
          onClose={() => {
            setSelectedPlace(null);
            setOpenedFromBuilding(null);
          }}
          onStatusUpdated={handlePlaceUpdated}
          apiKey={API_KEY}
          openedFromBuilding={openedFromBuilding}
          onBackToBuilding={() => {
            setSelectedPlace(null);
            setReopenBuildingAddress(openedFromBuilding);
            setOpenedFromBuilding(null);
          }}
          onDuplicateViewPlace={(duplicatePlace) => {
            setSelectedPlace(duplicatePlace);
            setFocusedLocation({
              lat: Number(duplicatePlace.latitude),
              lng: Number(duplicatePlace.longitude),
              name: duplicatePlace.name,
              address: duplicatePlace.address,
              rating: duplicatePlace.rating || 0,
              isNewCustomPoint: false,
              place_type: duplicatePlace.place_type,
              building_name: duplicatePlace.building_name,
              floor_level: duplicatePlace.floor_level,
            });
            setOpenedFromBuilding(
              duplicatePlace.place_type === "building"
                ? duplicatePlace.building_address
                : null
            );
          }}
        />
      )}
    </div>
  );
}