// Mock data cho places
// Sau này sẽ thay bằng API call thật
export const mockPlaces = [
  {
    id: "1",
    name: "Pizza 4P's",
    categories: ["Restaurant", "Bar"],
    categoryColors: { Restaurant: "#F97316", Bar: "#8B5CF6" },
    price: "$$$",
    rating: 4.5,
    reviewCount: 12,
    location: "District 1, HCMC",
    distance: "0.4 km",
    businessStatus: "open",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop",
  },
  {
    id: "2",
    name: "Bep Me In",
    categories: ["Restaurant"],
    categoryColors: { Restaurant: "#F97316" },
    price: "$$",
    rating: 4.2,
    reviewCount: 8,
    location: "District 3, HCMC",
    distance: "1.2 km",
    businessStatus: "open",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop",
  },
  {
    id: "3",
    name: "The Workshop",
    categories: ["Bar"],
    categoryColors: { Bar: "#8B5CF6" },
    price: "$$",
    rating: 4.0,
    reviewCount: 15,
    location: "District 1, HCMC",
    distance: "0.8 km",
    businessStatus: "temporarily_closed",
    image: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=400&h=300&fit=crop",
  },
  {
    id: "4",
    name: "War Remnants Museum",
    categories: ["Sight"],
    categoryColors: { Sight: "#3B82F6" },
    price: "$",
    rating: 4.7,
    reviewCount: 24,
    location: "District 3, HCMC",
    distance: "2.1 km",
    businessStatus: "open",
    image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=300&fit=crop",
  },
  {
    id: "5",
    name: "Old Compass Cafe",
    categories: ["Restaurant", "Entertainment"],
    categoryColors: { Restaurant: "#F97316", Entertainment: "#EC4899" },
    price: "$$",
    rating: 3.9,
    reviewCount: 6,
    location: "District 1, HCMC",
    distance: "0.6 km",
    businessStatus: "permanently_closed",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop",
  },
]

// Category definitions
export const categoryDefinitions = [
  { id: "restaurant", label: "Restaurants", icon: "Utensils", color: "#F97316" },
  { id: "bar", label: "Bars", icon: "Wine", color: "#8B5CF6" },
  { id: "sight", label: "Sights", icon: "Eye", color: "#3B82F6" },
  { id: "entertainment", label: "Entertainment", icon: "Gamepad2", color: "#EC4899" },
  { id: "team_event", label: "Team Events", icon: "Users", color: "#10B981" },
]

export const priceLevels = ["$", "$$", "$$$", "$$$$"]

export const businessStatuses = [
  { value: "open", label: "Open now", dotColor: "#16a34a", bgColor: "#f0fdf4", textColor: "#166534" },
  { value: "temporarily_closed", label: "Temporarily closed", dotColor: "#d97706", bgColor: "#fffbeb", textColor: "#92400e" },
  { value: "permanently_closed", label: "Permanently closed", dotColor: "#dc2626", bgColor: "#fef2f2", textColor: "#991b1b" },
]