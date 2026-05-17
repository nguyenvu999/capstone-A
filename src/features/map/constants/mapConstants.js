// mapConstants.js
// Các hằng số dùng cho map feature

// Danh sách categories
// Dùng để render checkboxes trong FilterSidebar và category selector trong RegisterPlaceDrawer
export const CATEGORY_DEFINITIONS = [
  { id: "restaurant", label: "Restaurants", icon: "Utensils", color: "#F97316" },
  { id: "bar", label: "Bars", icon: "Wine", color: "#8B5CF6" },
  { id: "sight", label: "Sights", icon: "Eye", color: "#3B82F6" },
  { id: "entertainment", label: "Entertainment", icon: "Gamepad2", color: "#EC4899" },
  { id: "team_event", label: "Team Events", icon: "Users", color: "#10B981" },
]

// Danh sách mức giá
export const PRICE_LEVELS = ["$", "$$", "$$$", "$$$$"]

// Danh sách trạng thái hoạt động
export const BUSINESS_STATUSES = [
  { 
    value: "open", 
    label: "Open now", 
    dotColor: "#16a34a", 
    bgColor: "#f0fdf4", 
    textColor: "#166534" 
  },
  { 
    value: "temporarily_closed", 
    label: "Temporarily closed", 
    dotColor: "#d97706", 
    bgColor: "#fffbeb", 
    textColor: "#92400e" 
  },
  { 
    value: "permanently_closed", 
    label: "Permanently closed", 
    dotColor: "#dc2626", 
    bgColor: "#fef2f2", 
    textColor: "#991b1b" 
  },
]

// Cấu hình map mặc định
export const DEFAULT_MAP_CENTER = {
  lat: 10.7769,   // HCMC
  lng: 106.7009,
}

export const DEFAULT_MAP_ZOOM = 14
export const DEFAULT_NEARBY_RADIUS = 5000  // 5km

// Pagination
export const PLACES_PER_PAGE = 20
export const REVIEWS_PER_PAGE = 15