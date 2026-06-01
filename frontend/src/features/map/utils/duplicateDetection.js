// Tính khoảng cách giữa 2 điểm GPS bằng công thức Haversine
// Trả về khoảng cách tính bằng km
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Bán kính Trái Đất (km)
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
}

// Chuẩn hóa chuỗi để so sánh (lowercase, bỏ dấu, bỏ khoảng trắng thừa)
export function normalizeString(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ") // Thay nhiều khoảng trắng thành 1
    .normalize("NFD") // Bỏ dấu tiếng Việt
    .replace(/[\u0300-\u036f]/g, "");
}

// Tính độ tương đồng giữa 2 chuỗi (0-1)
// Sử dụng Levenshtein distance
export function stringSimilarity(str1, str2) {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  const matrix = [];
  
  // Khởi tạo ma trận
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }
  
  // Tính Levenshtein distance
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  const maxLength = Math.max(s1.length, s2.length);
  return 1 - matrix[s2.length][s1.length] / maxLength;
}


// Trả về place trùng nếu tìm thấy, null nếu không
export async function checkDuplicatePlace(newPlace, existingPlaces) {
  // Ngưỡng cho các điều kiện
  const NAME_THRESHOLD = 0.8;
  const ADDRESS_THRESHOLD = 0.7;
  const DISTANCE_THRESHOLD = 0.05; // 50 meters
  const SAME_LOCATION_THRESHOLD = 0.01; // 10 meters
  const EXACT_COORDS_PRECISION = 0.00001; // ~1 mét

  for (const existing of existingPlaces) {
    // Tính độ tương đồng tên
    const nameSimilarity = stringSimilarity(newPlace.name, existing.name);
    
    // Tính độ tương đồng địa chỉ
    const addressSimilarity = stringSimilarity(newPlace.address, existing.address);
    
    // Tính khoảng cách GPS
    const distance = calculateDistance(
      Number(newPlace.latitude),
      Number(newPlace.longitude),
      Number(existing.latitude),
      Number(existing.longitude)
    );

    // ĐIỀU KIỆN 1: SAME_LOCATION (ưu tiên cao nhất)
    // Nếu cùng địa chỉ + cùng vị trí GPS (< 10m) → CHẮC CHẮN duplicate
    // BẤT KỂ tên có khác gì (để chống spam đổi tên)
    if (distance <= SAME_LOCATION_THRESHOLD && addressSimilarity >= ADDRESS_THRESHOLD) {
      return { 
        ...existing, 
        distance,
        reason: "SAME_LOCATION" // Debug info
      };
    }

    // ĐIỀU KIỆN 2: EXACT_COORDS
    // Nếu tọa độ HOÀN TOÀN giống nhau (đến 5 chữ số thập phân)
    // → CHẮC CHẮN duplicate, bất kể tên/địa chỉ
    const latDiff = Math.abs(Number(newPlace.latitude) - Number(existing.latitude));
    const lngDiff = Math.abs(Number(newPlace.longitude) - Number(existing.longitude));
    
    if (latDiff < EXACT_COORDS_PRECISION && lngDiff < EXACT_COORDS_PRECISION) {
      return { 
        ...existing, 
        distance,
        reason: "EXACT_COORDS"
      };
    }

    // ĐIỀU KIỆN 3: SAME_PLACE (logic cũ - giữ nguyên)
    // Tên giống + Địa chỉ giống + Khoảng cách gần
    if (
      nameSimilarity >= NAME_THRESHOLD &&
      addressSimilarity >= ADDRESS_THRESHOLD &&
      distance <= DISTANCE_THRESHOLD
    ) {
      return { 
        ...existing, 
        distance,
        reason: "SAME_PLACE"
      };
    }
  }

  return null; // Không tìm thấy duplicate
}