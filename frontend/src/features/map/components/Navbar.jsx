import { useState, useEffect, useRef } from "react";
import { LogOut, Map, Plus } from "lucide-react";

export default function Navbar({ user, onSignOut, onRegisterClick }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Lấy 2 chữ cái đầu của tên hoặc email để làm Avatar (Ví dụ: Vu Vu -> VV)
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
    <nav className="absolute top-0 left-0 right-0 z-[100] h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 flex items-center justify-between shadow-sm select-none">
      {/* Cột trái: Tên ứng dụng & Logo */}
      <div className="flex items-center gap-2 cursor-pointer">
        <Map className="w-6 h-6 text-emerald-700" />
        <span className="font-bold text-xl bg-gradient-to-r from-emerald-800 to-emerald-600 bg-clip-text text-transparent">
          Netsuggest
        </span>
      </div>

      {/* Cột phải: Nút hành động & Menu Profile cá nhân */}
      <div className="flex items-center gap-4">
        {/* Nút Đăng ký địa điểm chuẩn thiết kế xanh lá đậm bo tròn */}
        <button
          onClick={onRegisterClick}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#2d5a1e] hover:bg-[#234617] text-white font-medium text-sm rounded-full shadow-sm transition-all active:scale-95"
        >
          <Plus size={16} />
          <span>Register Place</span>
        </button>

        {/* Nút bấm tròn hiển thị chữ cái đại diện của Avatar */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-10 h-10 rounded-full bg-[#e2f0d9] text-[#4a7c35] border border-gray-200 font-semibold text-sm flex items-center justify-center shadow-inner hover:brightness-95 transition-all focus:outline-none"
          >
            {getAvatarLetters()}
          </button>

          {/* Hộp thoại Dropdown Menu hiển thị thông tin chi tiết */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-150">
              {/* Khu vực hiển thị Email */}
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="font-bold text-sm text-gray-800">
                  {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Người dùng"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 break-all">
                  {user?.email || "Chưa cập nhật email"}
                </p>
              </div>

              {/* Danh sách các link chuyển hướng */}
              <div className="py-1">
                <button 
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                >
                  <Map size={16} className="text-gray-400" />
                  <span>Map</span>
                </button>
                
                <div className="w-full text-left px-4 py-2.5 text-sm text-gray-300 flex items-center gap-2 select-none">
                  <Plus size={16} className="text-gray-200" />
                  <span>My Places <span className="text-[10px] text-gray-400 font-normal italic">(coming soon)</span></span>
                </div>
              </div>

              <div className="border-t border-gray-100 my-1"></div>

              {/* Nút Đăng xuất màu đỏ */}
              <div className="px-1">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    if (onSignOut) onSignOut();
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-500 font-medium hover:bg-red-50/60 rounded-xl flex items-center gap-2 transition-colors"
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