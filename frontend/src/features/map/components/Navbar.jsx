import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Map, Plus, Menu, X, BookMarked } from "lucide-react";

export default function Navbar({ user, onSignOut, onRegisterClick }) {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Lấy 2 chữ cái đầu của tên hoặc email để làm Avatar
  const getAvatarLetters = () => {
    if (!user || !user.email) return "U";
    const namePart = user.user_metadata?.full_name || user.email.split("@")[0];
    const words = namePart.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return namePart.substring(0, 2).toUpperCase();
  };

  // Tự động đóng dropdown khi nhấn click ra ngoài vùng menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-[3000] h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 md:px-6 flex items-center justify-between shadow-sm select-none">
      {/* Cột trái: Tên ứng dụng & Logo */}
      <div
        onClick={() => navigate("/map")}
        className="group flex items-center gap-2 cursor-pointer hover:bg-emerald-50 px-3 py-2 rounded-full transition-colors"
      >
        <Map className="w-5 h-5 md:w-6 md:h-6 text-emerald-700 group-hover:text-emerald-900 transition-colors" />
        <span className="font-bold text-lg md:text-xl bg-gradient-to-r from-emerald-800 to-emerald-600 bg-clip-text text-transparent">
          Netsuggest
        </span>
      </div>

      {/* Cột phải: Nút hành động & Menu Profile cá nhân */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Nút Đăng ký địa điểm - Responsive text layout */}
        <button
          onClick={onRegisterClick}
          className="cursor-pointer flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2 bg-[#2d5a1e] hover:bg-[#234617] text-white font-medium text-xs md:text-sm rounded-full shadow-sm transition-all active:scale-95"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Register Place</span>
          <span className="inline sm:hidden">Register</span>
        </button>

        {/* Nút bấm tròn hiển thị chữ cái đại diện của Avatar */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
           className="cursor-pointer w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#e2f0d9] text-[#4a7c35] border border-gray-200 font-semibold text-xs md:text-sm flex items-center justify-center shadow-inner hover:bg-[#d5e8c8] hover:scale-105 hover:shadow-md transition-all duration-200 focus:outline-none"
          >
            {getAvatarLetters()}
          </button>

          {/* Hộp thoại Dropdown Menu hiển thị thông tin chi tiết */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 md:w-72 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-[3100] animate-in fade-in slide-in-from-top-3 duration-150 origin-top-right">
              {/* Khu vực hiển thị Email */}
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="font-bold text-sm text-gray-800 truncate">
                  {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Người dùng"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 break-all whitespace-normal">
                  {user?.email || "Chưa cập nhật email"}
                </p>
              </div>

              {/* Danh sách các link chuyển hướng */}
              <div className="py-1">
                <button 
                  onClick={() => { setIsDropdownOpen(false); navigate("/map"); }}
                  className="w-full cursor-pointer text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2 transition-colors"
                >
                  <Map size={16} className="text-gray-400" />
                  <span>Map</span>
                </button>
                
                <button
                  onClick={() => { setIsDropdownOpen(false); navigate("/itineraries"); }}
                   className="w-full cursor-pointer text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2 transition-colors"
                >
                  <BookMarked size={16} className="text-gray-400" />
                  <span>Itineraries</span>
                </button>
                
                <button
                  onClick={() => { 
                    setIsDropdownOpen(false); 
                    // Force navigate với timestamp để trigger re-render
                    navigate(`/map?view=myplaces&t=${Date.now()}`); 
                  }}
                  className="w-full cursor-pointer text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2 transition-colors"
                >
                  <Plus size={16} className="text-gray-400" />
                  <span>My Places</span>
                </button>
              </div>

              <div className="border-t border-gray-100 my-1"></div>

              {/* Nút Đăng xuất */}
              <div className="px-1">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    if (onSignOut) onSignOut();
                  }}
                  className="w-full cursor-pointer text-left px-3 py-2 text-sm text-red-500 font-medium hover:bg-red-50/60 rounded-xl flex items-center gap-2 transition-colors"
                >
                  <LogOut size={16} />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
