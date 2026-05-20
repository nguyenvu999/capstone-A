// MapNavbar.jsx
// Navbar cho map page với search địa điểm, register place button, user dropdown

import { useMemo, useState } from "react";
import { ChevronDown, LogOut, MapPin, Search, Plus } from "lucide-react";
import { useAuth } from "../../auth/context/AuthContext";

function MapNavbar({ onRegisterPlaceClick, onSearch }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const { user, logoutUser } = useAuth();

  // Lấy tên hiển thị từ user profile
  const displayName = user?.name || user?.preferred_username || "User";
  const userEmail = user?.email || user?.preferred_username || "";

  // Logic xử lý Initials theo yêu cầu:
  // 1 tên (Sơn) -> S
  // 2 tên (Vu Vu) -> VV
  // 3 tên (Khang Pham Nguyen) -> KP (2 chữ đầu của 2 từ đầu)
  const initials = useMemo(() => {
    if (!displayName || displayName === "User") return "U";

    const words = displayName.trim().split(/\s+/);

    if (words.length === 1) {
      return words[0][0].toUpperCase();
    }

    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }

    return "U";
  }, [displayName]);

  // Search địa điểm qua Nominatim API (OpenStreetMap)
  const handleSearchInput = async (query) => {
    setSearchQuery(query);
    
    if (query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    try {
      // Gọi Nominatim API để search địa điểm
      const response = await fetch(
        `https://corsproxy.io/?${encodeURIComponent(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=5&countrycodes=vn`)}`
      );
      const data = await response.json();
      setSearchResults(data);
      setShowResults(true);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  // Khi user chọn 1 kết quả search
  const handleSelectResult = (result) => {
    if (onSearch) {
      onSearch({
        name: result.display_name,
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
      });
    }
    setSearchQuery(result.display_name);
    setShowResults(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#D4E5C4] bg-white">
      <div className="mx-auto flex h-16 items-center gap-4 px-4 lg:px-6">
        
        {/* Logo Section */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#dce8c8]">
            <MapPin className="h-5 w-5 text-[#355e1d]" />
          </div>
          <span className="text-xl font-semibold text-black">NetSuggest</span>
        </div>

        {/* Search Bar */}
        <div className="mx-auto hidden max-w-md flex-1 md:flex relative">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]" size={18} />
            <input
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              placeholder="Search places on map..."
              className="h-10 w-full rounded-full border-0 bg-[#F0F5ED] pl-11 pr-4 text-sm outline-none"
            />
          </div>

          {/* Search results dropdown */}
          {showResults && searchResults.length > 0 && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowResults(false)} />
              <div className="absolute top-12 left-0 right-0 z-50 max-h-64 overflow-y-auto rounded-lg border border-[#D4E5C4] bg-white shadow-xl">
                {searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectResult(result)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-[#F0F5ED] border-b border-[#D4E5C4] last:border-0"
                  >
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="mt-1 shrink-0 text-[#355e1d]" />
                      <span className="text-[#001910]">{result.display_name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onRegisterPlaceClick}
          className="hidden items-center gap-2 rounded-full bg-[#355e1d] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2d4f18] sm:flex"
        >
          <Plus size={18} />
          Register Place
        </button>

        {/* User Dropdown Section */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex items-center gap-1 rounded-full px-2 py-1 transition hover:bg-[#F0F5ED]"
          >
            {/* AVATAR BOX */}
            <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#dce8c8] text-sm font-bold text-[#355e1d] border-2 border-white shadow-sm">
              
              {/* Lớp chữ cái đầu (Initials) luôn nằm dưới */}
              <span className="absolute">{initials}</span>

              {/* Lớp ảnh (Picture) nằm trên, nếu lỗi sẽ ẩn đi để hiện lớp chữ */}
              {user?.picture && (
                <img
                  src={user.picture}
                  alt="profile"
                  className="relative z-10 h-full w-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
            </div>
            <ChevronDown className="h-4 w-4 text-[#64748B]" />
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
              <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-[#D4E5C4] bg-white shadow-xl">
                <div className="border-b border-[#D4E5C4] px-4 py-3 bg-[#FBFDF9]">
                  <p className="truncate text-sm font-bold text-[#001910]">{displayName}</p>
                  <p className="truncate text-xs text-[#64748B]">{userEmail}</p>
                </div>
                
                <div className="py-1">
                  <button className="block w-full px-4 py-2.5 text-left text-sm text-[#001910] hover:bg-[#F0F5ED]">
                    Map
                  </button>
                  <button className="block w-full px-4 py-2.5 text-left text-sm text-[#64748B] hover:bg-[#F0F5ED]" disabled>
                    My Places (coming soon)
                  </button>
                </div>

                <div className="border-t border-[#D4E5C4]" />
                <button
                  onClick={logoutUser}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default MapNavbar;