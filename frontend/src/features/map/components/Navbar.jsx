import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Map, Plus, BookMarked, Eye, EyeOff } from "lucide-react";
import { useAccessibility } from "../../../shared/context/AccessibilityContext";

export default function Navbar({ user, onSignOut, onRegisterClick }) {
  const navigate = useNavigate();
  const { isAccessibilityMode, toggleAccessibilityMode } = useAccessibility();
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

  const navClasses = isAccessibilityMode
    ? "border-[#f59e0b] shadow-[0_8px_30px_rgba(15,23,42,0.35)]"
    : "border-gray-100 shadow-sm";

  return (
    <nav className={`absolute top-0 left-0 right-0 z-[100] h-16 backdrop-blur-md border-b px-4 md:px-6 flex items-center justify-between select-none transition-colors duration-200 bg-[var(--nav-bg)] ${navClasses}`}>
      {/* Cột trái: Tên ứng dụng & Logo */}
      <div
        onClick={() => navigate("/map")}
        className="group flex items-center gap-2 cursor-pointer hover:bg-emerald-50 px-3 py-2 rounded-full transition-colors"
      >
        <Map className={`w-5 h-5 md:w-6 md:h-6 ${isAccessibilityMode ? "text-[#f59e0b]" : "text-emerald-700"}`} />
        <span className={`font-bold text-lg md:text-xl ${isAccessibilityMode ? "text-[#f8fafc]" : "bg-gradient-to-r from-emerald-800 to-emerald-600 bg-clip-text text-transparent"}`}>
          Netsuggest
        </span>
      </div>

      {/* Cột phải: Nút hành động & Menu Profile cá nhân */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Nút Đăng ký địa điểm - Responsive text layout */}
        <button
          onClick={onRegisterClick}
          className={`flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2 font-medium text-xs md:text-sm rounded-full shadow-sm transition-all active:scale-95 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-text)]`}
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Register Place</span>
          <span className="inline sm:hidden">Register</span>
        </button>

        {/* Nút bấm tròn hiển thị chữ cái đại diện của Avatar */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
           className={`w-9 h-9 md:w-10 md:h-10 rounded-full border font-semibold text-xs md:text-sm flex items-center justify-center shadow-inner transition-all focus:outline-none bg-[var(--avatar-bg)] text-[var(--avatar-text)] border-[var(--border)] hover:brightness-95`}
          >
            {getAvatarLetters()}
          </button>

          {/* Hộp thoại Dropdown Menu hiển thị thông tin chi tiết */}
          {isDropdownOpen && (
            <div className={`absolute right-0 mt-2 w-64 md:w-72 border rounded-2xl py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-150 origin-top-right bg-[var(--dropdown-bg)] border-[var(--dropdown-border)] shadow-[var(--dropdown-shadow)]`}>
              {/* Khu vực hiển thị Email */}
              <div className={`px-4 py-3 border-b border-[var(--border)]`}>
                <p className={`font-bold text-sm truncate text-[var(--text-primary)]`}>
                  {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Người dùng"}
                </p>
                <p className={`text-xs mt-0.5 break-all whitespace-normal text-[var(--text-secondary)]`}>
                  {user?.email || "Chưa cập nhật email"}
                </p>
              </div>

              <div className="px-3 py-2">
                <button
                  type="button"
                  onClick={toggleAccessibilityMode}
                  aria-pressed={isAccessibilityMode}
                  className={`w-full flex items-center justify-between rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${isAccessibilityMode ? "border-[#f59e0b] bg-[#1f2937] text-[#f8fafc]" : "border-gray-200 bg-gray-50 text-gray-800"}`}
                >
                  <span className="flex items-center gap-2">
                    {isAccessibilityMode ? <Eye size={16} /> : <EyeOff size={16} />}
                    <span>Accessibility mode</span>
                  </span>
                  <span className={`text-xs ${isAccessibilityMode ? "text-[#fbbf24]" : "text-gray-500"}`}>
                    {isAccessibilityMode ? "On" : "Off"}
                  </span>
                </button>
                <p className={`mt-2 text-xs text-[var(--text-secondary)]`}>
                  High contrast visuals for easier reading and clearer focus.
                </p>
              </div>

              {/* Danh sách các link chuyển hướng */}
              <div className="py-1">
                <button 
                  onClick={() => { setIsDropdownOpen(false); navigate("/map"); }}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors text-[var(--text-primary)] hover:bg-[var(--bg-hover)]`}
                >
                  <Map size={16} className="text-[var(--text-muted)]" />
                  <span>Map</span>
                </button>
                
                <button
                  onClick={() => { setIsDropdownOpen(false); navigate("/itineraries"); }}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors text-[var(--text-primary)] hover:bg-[var(--bg-hover)]`}
                >
                  <BookMarked size={16} className="text-[var(--text-muted)]" />
                  <span>Itineraries</span>
                </button>
                
                <button
                  onClick={() => { 
                    setIsDropdownOpen(false); 
                    // Force navigate với timestamp để trigger re-render
                    navigate(`/map?view=myplaces&t=${Date.now()}`); 
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors text-[var(--text-primary)] hover:bg-[var(--bg-hover)]`}
                >
                  <Plus size={16} className="text-[var(--text-muted)]" />
                  <span>My Places</span>
                </button>
              </div>

              <div className={`border-t my-1 border-[var(--border)]`}></div>

              {/* Nút Đăng xuất */}
              <div className="px-1">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    if (onSignOut) onSignOut();
                  }}
                  className={`w-full text-left px-3 py-2 text-sm font-medium rounded-xl flex items-center gap-2 transition-colors text-[var(--text-danger)] hover:bg-[var(--bg-danger-hover)]`}
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
