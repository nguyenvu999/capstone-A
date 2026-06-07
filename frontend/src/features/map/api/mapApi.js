const BASE_URL = "https://maps.track-asia.com";

/**
 * 1. API Nearby Search - Tìm kiếm địa điểm xung quanh một tọa độ
 * @param {number} lat - Vĩ độ trung tâm
 * @param {number} lng - Kinh độ trung tâm
 * @param {string} keyword - Từ khóa loại hình (restaurant, hotel, hospital...)
 * @param {string} apiKey - TrackAsia Public Key
 */
export const fetchNearbyPlaces = async (lat, lng, keyword, apiKey) => {
  try {
    const params = new URLSearchParams({
      location: `${lat},${lng}`,
      radius: "2000", // Bán kính tìm kiếm (mét), ví dụ 2km
      keyword: keyword,
      key: apiKey
    });
    const res = await fetch(`${BASE_URL}/api/v2/place/nearbysearch/json?${params}`);
    return await res.json();
  } catch (err) {
    console.error("Lỗi API Nearby Search:", err);
    return null;
  }
};

/**
 * 2. API Place Detail - Lấy thông tin chi tiết của một địa điểm theo ID
 */
export const fetchPlaceDetails = async (placeId, apiKey) => {
  try {
    const params = new URLSearchParams({
      place_id: placeId,
      key: apiKey
    });
    const res = await fetch(`${BASE_URL}/api/v2/place/details/json?${params}`);
    return await res.json();
  } catch (err) {
    console.error("Lỗi API Place Detail:", err);
    return null;
  }
};

/**
 * 3. API Directions - Tìm đường đi giữa các điểm
 * @param {string} coordinates - Chuỗi tọa độ dạng 'lng,lat;lng,lat'
 */
export const fetchDirections = async (coordinates, apiKey) => {
  try {
    const res = await fetch(`${BASE_URL}/route/v2/directions/json?point=${coordinates}&key=${apiKey}`);
    return await res.json();
  } catch (err) {
    console.error("Lỗi API Directions:", err);
    return null;
  }
};

/**
 * 4. API Distance Matrix - Tính toán ma trận khoảng cách và thời gian di chuyển
 * @param {string} profile - Phương tiện (driving, walking, v.v.)
 * @param {string} coordinates - Chuỗi tọa độ các điểm 'lng,lat;lng,lat'
 */
export const fetchDistanceMatrix = async (profile = "driving", coordinates, apiKey) => {
  try {
    const res = await fetch(`${BASE_URL}/distance-matrix/v1/${profile}/${coordinates}?key=${apiKey}`);
    return await res.json();
  } catch (err) {
    console.error("Lỗi API Distance Matrix:", err);
    return null;
  }
};