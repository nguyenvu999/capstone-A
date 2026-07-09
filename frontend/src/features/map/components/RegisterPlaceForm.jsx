import { useState, useEffect, useRef } from "react";
import { supabase } from "../../auth/api/supabaseClient";
import { X, Check, Search, MapPin } from "lucide-react";
import { useToast } from "../../../shared/ui/Toast";
import { checkDuplicatePlace, checkAddressForBuilding, checkBuildingDuplicate } from "../utils/duplicateDetection";
import DuplicatePlaceModal from "./DuplicatePlaceModal";
import { validateFloorLevel } from "../utils/floorLevelValidation";

// CẬP NHẬT: 6 categories đồng bộ với MapSidebar + MapContainer
const CATEGORIES = [
  { id: "restaurant", name: "Restaurant", icon: "/restaurant-icon.png", bgColor: "#fb923c" },
  { id: "bar", name: "Bar", emoji: "🍷", bgColor: "#a855f7" },
  { id: "beverage", name: "Beverage", emoji: "☕", bgColor: "#8b5cf6" },
  { id: "sight", name: "Sight", emoji: "👁️", bgColor: "#3b82f6" },
  { id: "entertainment", name: "Entertainment", icon: "/park_map_icon.png", bgColor: "#ec4899" },
  { id: "team_event", name: "Team Event", emoji: "👥", bgColor: "#10b981" },
  { id: "vegetarian", name: "Vegetarian", emoji: "🥗", bgColor: "#22c55e" }
];

// THÊM: prop currentUserCoords nhận từ MapPage truyền xuống
export default function RegisterPlaceForm({ apiKey, focusedLocation, setFocusedLocation, onClose, allPlaces = [], onSuccess, currentUserCoords, buildingDataForRegister = null }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    latitude: "",
    longitude: "",
    price_level: 1,
    source: "manual",
    category: "restaurant",
  });
  
  const [addressQuery, setAddressQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [duplicatePlace, setDuplicatePlace] = useState(null); // Lưu place trùng nếu phát hiện
  const [showDuplicateModal, setShowDuplicateModal] = useState(false); // Hiển thị modal cảnh báo
  const [duplicateModalType, setDuplicateModalType] = useState("SIMPLE_DUPLICATE");
  const suggestionRef = useRef(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const MAX_IMAGE_COUNT = 3;
    // ===== BUILDING FEATURE STATE =====
  const [placeType, setPlaceType] = useState("standalone"); // "standalone" | "building"
  const [buildingMode, setBuildingMode] = useState(null); // null | "first" | "converting" | "adding"
  const [buildingInfo, setBuildingInfo] = useState({
    buildingName: "",
    buildingAddress: "",
    buildingCity: "",
    buildingLatitude: "",
    buildingLongitude: "",
  });
  const [floorLevel, setFloorLevel] = useState("1");
  const [floorLevelError, setFloorLevelError] = useState(null);
  const MAX_IMAGE_SIZE_MB = 5;
  const MAX_IMAGE_SIZE_BYTES =
    MAX_IMAGE_SIZE_MB * 1024 * 1024;
  
  // THÊM: useToast hook
  const { showToast, ToastComponent } = useToast();

  // THÊM LOGIC: Hàm bổ trợ thực hiện Geocode ngược từ tọa độ của user thành tên địa chỉ
  const fetchUserCurrentAddress = (lng, lat) => {
    fetch(`https://maps.track-asia.com/api/v2/geocode/json?result_type=street_address&latlng=${lat},${lng}&key=${apiKey}&size=1`)
      .then((res) => res.json())
      .then((data) => {
        let detectedAddress = `Coordinates: ${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`;
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
        }

        setFormData((prev) => ({
          ...prev,
          address: detectedAddress,
          city: detectedCity || prev.city,
          latitude: lat,
          longitude: lng,
        }));
        setAddressQuery(detectedAddress);
      })
      .catch((err) => {
        console.error("Geocoding current user location error:", err);
        const fallbackAddress = `Coordinates: ${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`;
        setFormData((prev) => ({
          ...prev,
          address: fallbackAddress,
          latitude: lat,
          longitude: lng,
        }));
        setAddressQuery(fallbackAddress);
      });
  };

  // CẬP NHẬT LOGIC: Xử lý autofill đồng bộ theo focusedLocation hoặc currentUserCoords
  useEffect(() => {
    if (focusedLocation) {
      setFormData((prev) => ({
        ...prev,
        name: focusedLocation.name || prev.name,
        address: focusedLocation.address || prev.address,
        city: focusedLocation.city || prev.city, 
        latitude: focusedLocation.lat || prev.latitude,
        longitude: focusedLocation.lng || prev.longitude,
        category: focusedLocation.category || prev.category, 
      }));
      
      if (focusedLocation.address) {
        setAddressQuery(focusedLocation.address);
      }
    } else if (currentUserCoords && currentUserCoords.length === 2) {
      // Khi user bỏ chọn vị trí trên map (focusedLocation === null) -> Tự động quay về vị trí hiện tại của user
      const [lng, lat] = currentUserCoords;
      fetchUserCurrentAddress(lng, lat);
    }
  }, [focusedLocation, currentUserCoords]);

  // Track-Asia Autocomplete logic
  // Gợi ý địa chỉ khi user gõ vào search box
  useEffect(() => {
    // Minimum 2 characters cho search 
    if (addressQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(() => {
      fetch(`https://maps.track-asia.com/api/v2/place/autocomplete/json?input=${encodeURIComponent(addressQuery)}&key=${apiKey}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.predictions) setSuggestions(data.predictions);
        })
        .catch((err) => {
          console.error("Autocomplete error:", err);
          // THÊM: Error handling
          showToast("Failed to load address suggestions", "error");
        });
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [addressQuery, apiKey]);

  // Đóng dropdown gợi ý khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Khi nhận building data từ "Add More Place" button
  useEffect(() => {
    if (!buildingDataForRegister) return;
    
    console.log("🏢 [RegisterForm] Received building data:", buildingDataForRegister);
    
    // Chuyển sang building mode "adding"
    setPlaceType("building");
    setBuildingMode("adding");
    
    // Set building info (tất cả locked)
    setBuildingInfo({
      buildingName: buildingDataForRegister.buildingName,
      buildingAddress: buildingDataForRegister.buildingAddress,
      buildingCity: buildingDataForRegister.buildingCity,
      buildingLatitude: buildingDataForRegister.buildingLatitude,
      buildingLongitude: buildingDataForRegister.buildingLongitude,
    });
    
    // Reset place info để user nhập mới
    setFormData(prev => ({
      ...prev,
      name: "",
      description: "",
      address: buildingDataForRegister.buildingAddress,
      city: buildingDataForRegister.buildingCity,
      latitude: buildingDataForRegister.buildingLatitude,
      longitude: buildingDataForRegister.buildingLongitude,
    }));
    
      setFloorLevel("1");
      setFloorLevelError(null);
  }, [buildingDataForRegister]);

  // Xử lý khi user chọn 1 gợi ý địa chỉ
  const handleSelectSuggestion = (prediction) => {
    setAddressQuery(prediction.description);
    setShowSuggestions(false);

    // Gọi API lấy chi tiết địa điểm (lat/lng)
    fetch(`https://maps.track-asia.com/api/v2/place/details/json?place_id=${prediction.place_id}&key=${apiKey}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.result && data.result.geometry) {
          const loc = data.result.geometry.location;
          const chosenName = formData.name || data.result.name;
          const formattedAddress = data.result.formatted_address || prediction.description;
          
          // Cập nhật form với tọa độ mới
          setFormData((prev) => ({
            ...prev,
            address: formattedAddress,
            latitude: Number(loc.lat),
            longitude: Number(loc.lng),
          }));

          // Cập nhật map focus
          setFocusedLocation({
            lat: Number(loc.lat),
            lng: Number(loc.lng),
            name: chosenName,
            address: formattedAddress,
            category: formData.category, 
          });
        }
      })
      .catch((err) => {
        console.error("Place details error:", err);
        // THÊM: Error handling
        showToast("Failed to load place details", "error");
      });
  };

  // Xử lý khi user thay đổi input trong form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle floor level input change
  const handleFloorLevelChange = (e) => {
    const value = e.target.value.toUpperCase(); // Auto-convert to uppercase
    
    // Allow empty for typing
    if (value === "") {
      setFloorLevel("");
      setFloorLevelError(null);
      return;
    }

    // Max 2 characters
    if (value.length > 2) return;

    setFloorLevel(value);

    // Validate on change
    const validation = validateFloorLevel(value);
    if (!validation.isValid) {
      setFloorLevelError(validation.error);
    } else {
      setFloorLevelError(null);
    }
  };

  // Handle Place Type change
  const handlePlaceTypeChange = (newType) => {
    setPlaceType(newType);
    
    if (newType === "standalone") {
      // Reset building-related state
      setBuildingMode(null);
      setBuildingInfo({
        buildingName: "",
        buildingAddress: "",
        buildingCity: "",
        buildingLatitude: "",
        buildingLongitude: "",
      });
      setFloorLevel("1");
      setFloorLevelError(null);
    } else if (newType === "building") {
      // Set building mode to "first" (user registering new building)
      setBuildingMode("first");
    }
  };

  // Xử lý khi user chọn category
  const handleCategorySelect = (categoryId) => {
    setFormData((prev) => ({ ...prev, category: categoryId }));
    
    // ✅ CHỈ CẬP NHẬT marker category khi đã có focusedLocation từ map click
    // KHÔNG tự động tạo marker mới khi đang ở chế độ GPS autofill
    if (focusedLocation && focusedLocation.lat && focusedLocation.lng) {
      setFocusedLocation({
        ...focusedLocation,
        category: categoryId,
      });
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    if (!files.length) return;

    if (imageFiles.length + files.length > MAX_IMAGE_COUNT) {
      showToast(
        `Maximum ${MAX_IMAGE_COUNT} images allowed`,
        "warning"
      );

      e.target.value = "";
      return;
    }

    const validFiles = [];
    const previews = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        showToast("Only images are allowed", "warning");
        continue;
      }

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        showToast(
          `Each image must be under ${MAX_IMAGE_SIZE_MB}MB`,
          "warning"
        );
        continue;
      }

      validFiles.push(file);
      previews.push(URL.createObjectURL(file));
    }

    setImageFiles((prev) => [...prev, ...validFiles]);
    setImagePreviews((prev) => [...prev, ...previews]);

    e.target.value = "";
  };
  
  // Xử lý xoá ảnh 
  const handleRemoveImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);

    setImageFiles((prev) =>
      prev.filter((_, i) => i !== index)
    );

    setImagePreviews((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  // Xử lý submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ===== VALIDATION: BUILDING MODE =====
    if (placeType === "building") {
      // Validate place name
      if (!formData.name.trim()) {
        showToast("Please enter place name", "warning");
        return;
      }

      if (formData.name.trim().length < 3) {
        showToast("Place name must be at least 3 characters", "warning");
        return;
      }

      // Validate building info
      if (buildingMode === "first" || buildingMode === "converting") {
        if (!buildingInfo.buildingName.trim()) {
          showToast("Please enter building name", "warning");
          return;
        }

        if (buildingMode === "first") {
          if (!formData.address.trim()) {
            showToast("Please search for building address", "warning");
            return;
          }

          if (!formData.latitude || !formData.longitude) {
            showToast("Please select a valid address from suggestions", "warning");
            return;
          }
        }
      }

      // Validate floor level
      const floorValidation = validateFloorLevel(floorLevel);
      if (!floorValidation.isValid) {
        showToast(floorValidation.error, "warning");
        return;
      }

      // buildingMode = "adding" không cần validate building info (đã có sẵn)
    } else {
      // ===== VALIDATION: STANDALONE MODE (giữ nguyên logic cũ) =====
      if (!formData.name.trim()) {
        showToast("Please enter place name", "warning");
        return;
      }

      if (!formData.address.trim()) {
        showToast("Please enter or search for an address", "warning");
        return;
      }

      if (!formData.city.trim()) {
        showToast("Please enter city name", "warning");
        return;
      }

      if (!formData.latitude || !formData.longitude) {
        showToast("Please select a valid address from suggestions or click on the map", "warning");
        return;
      }

      if (formData.name.trim().length < 3) {
        showToast("Place name must be at least 3 characters", "warning");
        return;
      }
    }

    setLoading(true);

    try {
      // ===== BUILDING FEATURE: DUPLICATE CHECK =====
      
      // ===== DUPLICATE CHECK LOGIC =====
      if (buildingMode === "converting" || buildingMode === "adding") {
        // ✅ ĐANG TRONG BUILDING MODE → CHECK DUPLICATE BÊN TRONG BUILDING
        const buildingAddr = buildingMode === "converting" 
          ? (buildingInfo.buildingAddress || formData.address)
          : buildingInfo.buildingAddress;

        // Lấy tất cả places trong building này
        const { data: buildingPlaces, error: fetchError } = await supabase
          .from("places")
          .select("*")
          .eq("building_address", buildingAddr)
          .eq("place_type", "building");

        if (!fetchError && buildingPlaces && buildingPlaces.length > 0) {
          const buildingDup = checkBuildingDuplicate(
            { name: formData.name, floor_level: floorLevel },
            buildingPlaces
          );

          if (buildingDup) {
            if (buildingDup.reason === "SAME_FLOOR_DUPLICATE") {
              showToast(
                `"${buildingDup.name}" already exists on Floor ${buildingDup.floor_level}. Please use a different name or floor.`,
                "warning"
              );
            } else {
              showToast(
                `A place with nearly identical name "${buildingDup.name}" already exists in this building (Floor ${buildingDup.floor_level}).`,
                "warning"
              );
            }
            setLoading(false);
            return;
          }
        }
      } else if (buildingMode === "first") {
        // ✅ FIRST BUILDING MODE → CHECK ADDRESS DUPLICATE BÌNH THƯỜNG
        const existingBuilding = await checkAddressForBuilding(
          { name: formData.name, address: formData.address, latitude: formData.latitude, longitude: formData.longitude },
          allPlaces
        );

        if (existingBuilding) {
          setDuplicatePlace(existingBuilding);
          setDuplicateModalType("ADD_TO_BUILDING");
          setShowDuplicateModal(true);
          setLoading(false);
          return;
        }

        const duplicate = await checkDuplicatePlace(
          { name: formData.name, address: formData.address, latitude: formData.latitude, longitude: formData.longitude },
          allPlaces
        );

        if (duplicate) {
          setDuplicatePlace(duplicate);
          setDuplicateModalType("CONVERT_TO_BUILDING");
          setShowDuplicateModal(true);
          setLoading(false);
          return;
        }
      } else {
        // ✅ STANDALONE MODE → CHECK DUPLICATE BÌNH THƯỜNG
        const existingBuilding = await checkAddressForBuilding(
          { name: formData.name, address: formData.address, latitude: formData.latitude, longitude: formData.longitude },
          allPlaces
        );

        if (existingBuilding) {
          setDuplicatePlace(existingBuilding);
          setDuplicateModalType("ADD_TO_BUILDING");
          setShowDuplicateModal(true);
          setLoading(false);
          return;
        }

        const duplicate = await checkDuplicatePlace(
          { name: formData.name, address: formData.address, latitude: formData.latitude, longitude: formData.longitude },
          allPlaces
        );

        if (duplicate) {
          setDuplicatePlace(duplicate);
          setDuplicateModalType("CONVERT_TO_BUILDING");
          setShowDuplicateModal(true);
          setLoading(false);
          return;
        }
      }
      
      // ✅ NẾU Ở CONVERTING/ADDING MODE → BỎ QUA DUPLICATE CHECK, TIẾP TỤC INSERT

      // Lấy thông tin user hiện tại (nếu có)
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) console.warn("Auth context warning:", authError.message);

      // upload many images
      const uploadedImageUrls = [];
      for (const imageFile of imageFiles) {
        const fileExt =
          imageFile.name
            .split(".")
            .pop();

        const fileName =
          `${Date.now()}-${Math.random()}.${fileExt}`;

        const filePath =
          `places/${fileName}`;

        const { error: uploadError } =
          await supabase.storage
            .from("place-images")
            .upload(
              filePath,
              imageFile
            );

        if (uploadError)
          throw uploadError;

        const { data } =
          supabase.storage
            .from("place-images")
            .getPublicUrl(
              filePath
            );

        uploadedImageUrls.push(
          data.publicUrl
        );
      }
      
      // ===== INSERT LOGIC: BUILDING vs STANDALONE =====
      if (placeType === "building") {
        // ===== BUILDING MODE =====
        
        // Xác định building address (tùy vào mode)
        const finalBuildingAddress = buildingMode === "first" 
          ? formData.address 
          : buildingInfo.buildingAddress;

        const finalBuildingName = buildingInfo.buildingName;

        // CASE 1: Converting standalone → building
        if (buildingMode === "converting") {
          // Step 1: Update existing place (place A) thành building
          const { error: updateError } = await supabase
            .from("places")
            .update({
              place_type: "building",
              building_name: finalBuildingName,
              building_address: finalBuildingAddress,
              floor_level: "1", // Default floor 1
            })
            .eq("id", duplicatePlace.id); // duplicatePlace = place A

          if (updateError) {
            console.error("Failed to convert existing place to building:", updateError);
            throw new Error("Failed to update existing place");
          }

          console.log("✅ Converted existing place to building (floor 1)");
        }

        // Step 2: Insert new place (place B or C)
        const { data: insertedData, error } = await supabase
          .from("places")
          .insert([
            {
              name: formData.name,
              description: formData.description,
              address: finalBuildingAddress, // Building address, không phải place address
              city: buildingMode === "first" ? formData.city : buildingInfo.buildingCity,
              latitude: buildingMode === "first" ? Number(formData.latitude) : Number(buildingInfo.buildingLatitude),
              longitude: buildingMode === "first" ? Number(formData.longitude) : Number(buildingInfo.buildingLongitude),
              price_level: Number(formData.price_level),
              business_status: "open",
              source: formData.source,
              category: formData.category,
              created_by: user ? user.id : null,
              created_by_email: user ? user.email : null,
              
              // ===== BUILDING FIELDS =====
              place_type: "building",
              building_name: finalBuildingName,
              building_address: finalBuildingAddress,
              floor_level: validateFloorLevel(floorLevel).normalized,

            },
          ])
          .select();

        if (error) throw error;

        const savedPlace = insertedData && insertedData[0] ? insertedData[0] : null;

        // Save images (same logic as standalone)
        if (uploadedImageUrls.length > 0 && savedPlace) {
          const imageRows = uploadedImageUrls.map((url, index) => ({
            place_id: String(savedPlace.id),
            url,
            sort_order: index + 1,
          }));
          
          const { error: imageInsertError } = await supabase
            .from("place_images")
            .insert(imageRows);

          if (imageInsertError) throw imageInsertError;
        }

        // Success message
        if (buildingMode === "converting") {
          showToast(`Building "${finalBuildingName}" created! Existing place moved to floor 1.`, "success");
        } else if (buildingMode === "adding") {
          showToast(`Place added to ${finalBuildingName} (Floor ${floorLevel})`, "success");
        } else {
          showToast(`Building "${finalBuildingName}" registered!`, "success");
        }

        // Trigger map refresh
        const newPlace = {
          id: savedPlace ? savedPlace.id : Date.now(),
          lat: buildingMode === "first" ? Number(formData.latitude) : Number(buildingInfo.buildingLatitude),
          lng: buildingMode === "first" ? Number(formData.longitude) : Number(buildingInfo.buildingLongitude),
          name: formData.name,
          address: finalBuildingAddress,
          category: formData.category,
          place_type: "building",
          building_name: finalBuildingName,
          floor_level: validateFloorLevel(floorLevel).normalized,
          isConfirmed: true,
          created_by: user ? user.id : null,
          created_by_email: user ? user.email : null,
        };

        setFocusedLocation(null); // Clear focused location sau khi register
        if (onSuccess) onSuccess(newPlace);

      } else {
        // ===== STANDALONE MODE (GIỮ NGUYÊN LOGIC CŨ) =====
        const { data: insertedData, error } = await supabase
          .from("places")
          .insert([
            {
              name: formData.name,
              description: formData.description,
              address: formData.address,
              city: formData.city,
              latitude: Number(formData.latitude),
              longitude: Number(formData.longitude),
              price_level: Number(formData.price_level),
              business_status: "open",
              source: formData.source,
              category: formData.category,
              created_by: user ? user.id : null,
              created_by_email: user ? user.email : null,
            },
          ])
          .select();

        if (error) throw error;

        const savedPlace = insertedData && insertedData[0] ? insertedData[0] : null;

        // Save images
        if (uploadedImageUrls.length > 0 && savedPlace) {
          const imageRows = uploadedImageUrls.map((url, index) => ({
            place_id: String(savedPlace.id),
            url,
            sort_order: index + 1,
          }));
          
          const { error: imageInsertError } = await supabase
            .from("place_images")
            .insert(imageRows);

          if (imageInsertError) throw imageInsertError;
        }

        showToast("Place registered successfully!", "success");

        const newPlace = {
          id: savedPlace ? savedPlace.id : Date.now(),
          lat: Number(formData.latitude),
          lng: Number(formData.longitude),
          name: formData.name,
          address: formData.address,
          category: formData.category,
          isConfirmed: true,
          created_by: user ? user.id : null,
          created_by_email: user ? user.email : null,
        };

        setFocusedLocation(null); // Clear focused location sau khi register
        if (onSuccess) onSuccess(newPlace);
      }
      
    }
    catch (error) {
      console.error("Insert error:", error.message);
      // THÊM: Error toast
      showToast(`Failed to register place: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi user muốn xem place đã tồn tại
  const handleViewExistingPlace = (place) => {
    setFocusedLocation({
      lat: Number(place.latitude),
      lng: Number(place.longitude),
      name: place.name,
      address: place.address,
      category: place.category,
    });
    showToast("Navigated to existing place", "success");
    if (onClose) onClose();
  };

  // Handle khi user confirm building conversion/adding
  const handleConfirmBuilding = (existingPlace) => {
    console.log("🏢 [RegisterForm] Building confirmed:", existingPlace);
    
    if (duplicateModalType === "CONVERT_TO_BUILDING") {
      // User xác nhận đây là building → Convert standalone place
      setBuildingMode("converting");
      setPlaceType("building");
      
      // Lock building info với data từ existing place
      setBuildingInfo({
        buildingName: "", // User phải nhập building name
        buildingAddress: existingPlace.address,
        buildingCity: existingPlace.city || formData.city,
        buildingLatitude: existingPlace.latitude,
        buildingLongitude: existingPlace.longitude,
      });
      
      // Cập nhật formData để giữ place name user đã nhập
      setFormData(prev => ({
        ...prev,
        address: existingPlace.address,
        city: existingPlace.city || prev.city,
        latitude: existingPlace.latitude,
        longitude: existingPlace.longitude,
      }));
      
      showToast("Please enter building name to continue", "info");
      
    } else if (duplicateModalType === "ADD_TO_BUILDING") {
      // User xác nhận thêm place vào building đã tồn tại
      setBuildingMode("adding");
      setPlaceType("building");
      
      // Lock tất cả building info
      setBuildingInfo({
        buildingName: existingPlace.building_name,
        buildingAddress: existingPlace.building_address || existingPlace.address,
        buildingCity: existingPlace.city || formData.city,
        buildingLatitude: existingPlace.latitude,
        buildingLongitude: existingPlace.longitude,
      });
      
      // Cập nhật formData
      setFormData(prev => ({
        ...prev,
        address: existingPlace.building_address || existingPlace.address,
        city: existingPlace.city || prev.city,
        latitude: existingPlace.latitude,
        longitude: existingPlace.longitude,
      }));
      
      showToast(`Adding place to ${existingPlace.building_name}`, "info");
    }
  };

  return (
    <>
      {/* THÊM: Toast Component */}
      {ToastComponent}

      {/* THÊM: Duplicate Modal */}
      {showDuplicateModal && (
        <DuplicatePlaceModal
          existingPlace={duplicatePlace}
          modalType={duplicateModalType}
          onClose={() => setShowDuplicateModal(false)}
          onViewPlace={handleViewExistingPlace}
          onConfirmBuilding={handleConfirmBuilding}
        />
      )}

      {/* Container Form Chính: Mobile Fullscreen, Desktop Floating Card */}
      <div className="fixed top-16 md:top-20 right-0 md:right-6 left-0 md:left-auto bottom-0 md:bottom-auto z-40 w-full md:w-[400px] h-full md:h-auto max-h-full md:max-h-[calc(100vh-120px)] bg-white rounded-none md:rounded-2xl shadow-2xl flex flex-col border border-gray-100 overflow-hidden transition-all duration-300 ease-out animate-in slide-in-from-bottom-10 md:slide-in-from-right-10">
      {/* Close Button UI optimized for fingers */}
        <button 
          type="button" 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-[1000] focus:outline-none"
          aria-label="Close form"
        >
          <X size={20} />
        </button>

        <form onSubmit={handleSubmit} className="p-5 md:p-6 overflow-y-auto space-y-4 text-sm text-gray-700 h-full custom-scrollbar pb-12 md:pb-6">
          
          <div className="pb-1 mt-2 md:mt-0">
            <h2 className="text-lg md:text-base font-bold text-gray-800">Register Place</h2>
          </div>

                    {/* ===== PLACE TYPE SELECTOR (NEW) ===== */}
          <div>
            <label className="block font-medium text-gray-700 mb-1.5 text-sm">
              Place Type <span className="text-red-500">*</span>
            </label>
            <select
              value={placeType}
              onChange={(e) => handlePlaceTypeChange(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 md:p-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer transition-all"
            >
              <option value="standalone">🏠 Standalone Place</option>
              <option value="building">🏢 Place in Building</option>
            </select>
            
            {placeType === "standalone" && (
              <p className="text-xs text-gray-500 mt-1.5">
                Single location (e.g., street-side cafe)
              </p>
            )}
            {placeType === "building" && (
              <p className="text-xs text-blue-600 mt-1.5">
                📍 This place is inside a multi-tenant building
              </p>
            )}
          </div>

          {/* ===== CONDITIONAL FORM RENDERING ===== */}
          {placeType === "standalone" ? (
            // ===== STANDALONE MODE: GIỮ NGUYÊN FORM CŨ =====
            <>
              {/* Place Name */}
              <div>
                <label className="block font-medium text-gray-700 mb-1.5">
                  Place Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Highlands Coffee"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 md:p-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              {/* Category Grid - 2 cols on mobile and desktop */}
              <div>
                <label className="block font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-[160px] md:max-h-none overflow-y-auto pr-1 md:pr-0">
                  {CATEGORIES.map((cat) => {
                    const isSelected = formData.category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategorySelect(cat.id)}
                        className={`flex items-center gap-2 p-2.5 md:p-2 rounded-xl border text-left transition-all ${
                          isSelected 
                            ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20 font-semibold" 
                            : "border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-300"
                        }`}
                      >
                        <div 
                          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-white"
                          style={{ backgroundColor: cat.bgColor }}
                        >
                          {cat.icon ? (
                            <img src={cat.icon} alt={cat.name} className="w-4 h-4 object-contain" />
                          ) : (
                            <span className="text-sm">{cat.emoji}</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-700 truncate">{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search Address */}
              <div className="relative" ref={suggestionRef}>
                <label className="block font-medium text-gray-700 mb-1.5">
                  Search Address <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 md:py-2.5 focus-within:border-blue-500 focus-within:bg-white transition-all">
                  <Search size={16} className="text-gray-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    placeholder="Type to search address..."
                    className="bg-transparent focus:outline-none w-full text-sm"
                    value={addressQuery}
                    onChange={(e) => {
                      setAddressQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                  />
                </div>

                {/* Dropdown gợi ý địa chỉ */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-2xl max-h-[180px] overflow-y-auto z-50">
                    {suggestions.map((item) => (
                      <div
                        key={item.place_id}
                        onClick={() => handleSelectSuggestion(item)}
                        className="flex items-start gap-2.5 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none"
                      >
                        <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                        <div className="overflow-hidden">
                          <p className="font-medium text-gray-800 truncate text-xs md:text-sm">
                            {item.structured_formatting?.main_text || item.description}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {item.structured_formatting?.secondary_text || item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* City */}
              <div>
                <label className="block font-medium text-gray-700 mb-1.5">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  required
                  placeholder="e.g. Ho Chi Minh City"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 md:p-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>

              {/* Latitude & Longitude */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    required
                    disabled
                    className="w-full bg-gray-100 border border-gray-150 rounded-xl p-3 md:p-2.5 text-xs text-gray-400 cursor-not-allowed select-none"
                    value={formData.latitude}
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    required
                    disabled
                    className="w-full bg-gray-100 border border-gray-150 rounded-xl p-3 md:p-2.5 text-xs text-gray-400 cursor-not-allowed select-none"
                    value={formData.longitude}
                  />
                </div>
              </div>

              {/* Price Level */}
              <div>
                <label className="block font-medium text-gray-700 mb-1.5">Price Level</label>
                <select
                  name="price_level"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 md:p-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white cursor-pointer transition-all"
                  value={formData.price_level}
                  onChange={handleChange}
                >
                  <option value={1}>1 - Budget</option>
                  <option value={2}>2 - Moderate</option>
                  <option value={3}>3 - Expensive</option>
                  <option value={4}>4 - Ultra Luxe</option>
                </select>
              </div>

              {/* Place Image */}
              <div>
                <label className="block font-medium text-gray-700 mb-1.5">
                  Place Image
                </label>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="cursor-pointer w-full bg-gray-50 border border-gray-200 rounded-xl p-3 hover:border-blue-500 hover:bg-blue-50 transition"
                />

                <p className="text-xs text-gray-400 mt-1">
                  Max 3 images • Max 5MB each
                </p>

                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img src={preview} className="w-full h-28 object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 text-white bg-black/40 hover:bg-black/70 rounded p-0.5 cursor-pointer transition-all"
                          aria-label="Remove image"
                        >
                          <X size={11} strokeWidth={3}/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Write some notes or details about this place..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 md:p-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white resize-none transition-all"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-[#1b5e20] hover:bg-[#2e7d32] text-white font-bold p-3.5 md:p-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all disabled:bg-[#a5d6a7] disabled:cursor-not-allowed text-sm"
              >
                <span>{loading ? "Registering place..." : "Register Place"}</span>
              </button>
            </>
          ) : (
            // ===== BUILDING MODE: FORM MỚI =====
            <>
              {/* SECTION 1: BUILDING INFORMATION */}
              <div className="pb-4 mb-4 border-b border-gray-200">
                <h3 className="text-base font-bold text-gray-800 mb-3">
                  Building Information
                </h3>
                
                <div className="space-y-3">
                  {/* Building Name */}
                  <div>
                    <label className="block font-medium text-gray-700 mb-1.5 text-sm">
                      Building Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Landmark 81"
                      disabled={buildingMode === "adding"}
                      className={`w-full border rounded-xl p-3 md:p-2.5 text-sm focus:outline-none transition-all ${
                        buildingMode === "adding"
                          ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                          : buildingMode === "converting" && !buildingInfo.buildingName
                          ? "bg-white border-red-300 focus:border-red-500"
                          : "bg-gray-50 border-gray-200 focus:border-blue-500 focus:bg-white"
                      }`}
                      value={buildingInfo.buildingName}
                      onChange={(e) => setBuildingInfo(prev => ({ ...prev, buildingName: e.target.value }))}
                    />
                    {buildingMode === "converting" && !buildingInfo.buildingName && (
                      <p className="text-xs text-red-600 mt-1">Please provide building name</p>
                    )}
                  </div>

                  {/* Building Address (Search) */}
                  <div className="relative">
                    <label className="block font-medium text-gray-700 mb-1.5 text-sm">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <div className={`relative flex items-center border rounded-xl px-3 py-3 md:py-2.5 transition-all ${
                      buildingMode === "converting" || buildingMode === "adding"
                        ? "bg-gray-100 border-gray-200 cursor-not-allowed"
                        : "bg-gray-50 border-gray-200 focus-within:border-blue-500 focus-within:bg-white"
                    }`}>
                      <Search size={16} className="text-gray-400 mr-2 shrink-0" />
                      <input
                        type="text"
                        placeholder={buildingMode === "first" ? "Search building address..." : "Address locked"}
                        disabled={buildingMode === "converting" || buildingMode === "adding"}
                        className="bg-transparent focus:outline-none w-full text-sm"
                        value={buildingMode === "first" ? addressQuery : buildingInfo.buildingAddress}
                        onChange={(e) => {
                          if (buildingMode === "first") {
                            setAddressQuery(e.target.value);
                            setShowSuggestions(true);
                          }
                        }}
                        onFocus={() => {
                          if (buildingMode === "first") setShowSuggestions(true);
                        }}
                      />
                    </div>

                    {/* Autocomplete suggestions (chỉ hiện khi buildingMode = "first") */}
                    {buildingMode === "first" && showSuggestions && suggestions.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-2xl max-h-[180px] overflow-y-auto z-50">
                        {suggestions.map((item) => (
                          <div
                            key={item.place_id}
                            onClick={() => handleSelectSuggestion(item)}
                            className="flex items-start gap-2.5 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none"
                          >
                            <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                            <div className="overflow-hidden">
                              <p className="font-medium text-gray-800 truncate text-xs md:text-sm">
                                {item.structured_formatting?.main_text || item.description}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {item.structured_formatting?.secondary_text || item.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* City */}
                  <div>
                    <label className="block font-medium text-gray-700 mb-1.5 text-sm">City</label>
                    <input
                      type="text"
                      placeholder="Ho Chi Minh City"
                      disabled={buildingMode === "converting" || buildingMode === "adding"}
                      className={`w-full border rounded-xl p-3 md:p-2.5 text-sm focus:outline-none transition-all ${
                        buildingMode === "converting" || buildingMode === "adding"
                          ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-gray-50 border-gray-200 focus:border-blue-500 focus:bg-white"
                      }`}
                      value={buildingMode === "first" ? formData.city : buildingInfo.buildingCity}
                      onChange={(e) => {
                        if (buildingMode === "first") {
                          handleChange(e);
                        }
                      }}
                    />
                  </div>

                  {/* Latitude & Longitude */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-gray-700 mb-1.5 text-sm">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        disabled
                        className="w-full bg-gray-100 border border-gray-150 rounded-xl p-3 md:p-2.5 text-xs text-gray-400 cursor-not-allowed"
                        value={buildingMode === "first" ? formData.latitude : buildingInfo.buildingLatitude}
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1.5 text-sm">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        disabled
                        className="w-full bg-gray-100 border border-gray-150 rounded-xl p-3 md:p-2.5 text-xs text-gray-400 cursor-not-allowed"
                        value={buildingMode === "first" ? formData.longitude : buildingInfo.buildingLongitude}
                      />
                    </div>
                  </div>

                  {/* Info Banner (chỉ hiện khi converting hoặc adding) */}
                  {(buildingMode === "converting" || buildingMode === "adding") && (
                    <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                      <span className="text-blue-600 text-sm shrink-0">ℹ️</span>
                      <p className="text-xs text-blue-700">
                        {buildingMode === "converting" 
                          ? "Address locked - adding to existing location" 
                          : "Adding to existing building"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 2: PLACE INFORMATION */}
              <div>
                <h3 className="text-base font-bold text-gray-800 mb-3">
                  Place Information
                </h3>
                
                <div className="space-y-3">
                  {/* Place Name */}
                  <div>
                    <label className="block font-medium text-gray-700 mb-1.5 text-sm">
                      Place Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Pizza 4P's"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 md:p-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Floor Level */}
                  <div>
                    <label className="block font-medium text-gray-700 mb-1.5 text-sm">
                      Floor Level <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      value={floorLevel}
                      onChange={handleFloorLevelChange}
                      placeholder="e.g. 1, 15, B1"
                      className={`w-full bg-gray-50 border rounded-xl p-3 md:p-2.5 text-sm focus:outline-none transition-all uppercase ${
                        floorLevelError
                          ? "border-red-300 focus:border-red-500 bg-red-50"
                          : "border-gray-200 focus:border-blue-500 focus:bg-white"
                      }`}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      eg: 01 or 1 → 99
                      <br />
                      Basement: B1 → B3
                    </p>
                    {floorLevelError && (
                      <p className="text-xs text-red-600 mt-1">{floorLevelError}</p>
                    )}
                  </div>

                  {/* Category Grid */}
                  <div>
                    <label className="block font-medium text-gray-700 mb-2 text-sm">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-[160px] md:max-h-none overflow-y-auto pr-1 md:pr-0">
                      {CATEGORIES.map((cat) => {
                        const isSelected = formData.category === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleCategorySelect(cat.id)}
                            className={`flex items-center gap-2 p-2.5 md:p-2 rounded-xl border text-left transition-all ${
                              isSelected 
                                ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20 font-semibold" 
                                : "border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-300"
                            }`}
                          >
                            <div 
                              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-white"
                              style={{ backgroundColor: cat.bgColor }}
                            >
                              {cat.icon ? (
                                <img src={cat.icon} alt={cat.name} className="w-4 h-4 object-contain" />
                              ) : (
                                <span className="text-sm">{cat.emoji}</span>
                              )}
                            </div>
                            <span className="text-xs text-gray-700 truncate">{cat.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Price Level */}
                  <div>
                    <label className="block font-medium text-gray-700 mb-1.5 text-sm">Price Level</label>
                    <select
                      name="price_level"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 md:p-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white cursor-pointer transition-all"
                      value={formData.price_level}
                      onChange={handleChange}
                    >
                      <option value={1}>1 - Budget</option>
                      <option value={2}>2 - Moderate</option>
                      <option value={3}>3 - Expensive</option>
                      <option value={4}>4 - Ultra Luxe</option>
                    </select>
                  </div>

                  {/* Place Image */}
                  <div>
                    <label className="block font-medium text-gray-700 mb-1.5 text-sm">
                      Place Image
                    </label>

                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="cursor-pointer w-full bg-gray-50 border border-gray-200 rounded-xl p-3 hover:border-blue-500 hover:bg-blue-50 transition"
                    />

                    <p className="text-xs text-gray-400 mt-1">
                      Max 3 images • Max 5MB each
                    </p>

                    {imagePreviews.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative">
                            <img src={preview} className="w-full h-28 object-cover rounded-lg" />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-1 right-1 text-white bg-black/40 hover:bg-black/70 rounded p-0.5 cursor-pointer transition-all"
                              aria-label="Remove image"
                            >
                              <X size={11} strokeWidth={3}/>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block font-medium text-gray-700 mb-1.5 text-sm">Description</label>
                    <textarea
                      name="description"
                      rows={3}
                      placeholder="Write some notes or details about this place..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 md:p-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white resize-none transition-all"
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-4 bg-[#1b5e20] hover:bg-[#2e7d32] text-white font-bold p-3.5 md:p-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all disabled:bg-[#a5d6a7] disabled:cursor-not-allowed text-sm"
                  >
                    <span>{loading ? "Registering place..." : buildingMode === "first" ? "Register Place" : "Add Place to Building"}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </form>
      </div>
    </>
  );
}