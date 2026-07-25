import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Map, Plus, BookMarked, Eye, EyeOff, Bell, Clock } from "lucide-react";
import { useAccessibility } from "../../../shared/context/AccessibilityContext";
// CHÚ Ý: Sửa đường dẫn dưới đây cho đúng với vị trí thực tế của file supabaseClient.js trong máy bạn
import { supabase } from "../../auth/api/supabaseClient";

export default function Navbar({ user, onSignOut, onRegisterClick, onNotificationClick }) {
  const navigate = useNavigate();
  const { isAccessibilityMode, toggleAccessibilityMode } = useAccessibility();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  // --- LOGIC SUPABASE ---
  useEffect(() => {
    if (!user) return;

    // 1. Fetch dữ liệu thông báo ban đầu
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id) // Lọc theo user của bạn
        .order("created_at", { ascending: false })
        .limit(10);

      if (data) setNotifications(data);
    };

    fetchNotifications();

    // 2. Lắng nghe Real-time
    const channel = supabase
      .channel("notifications_channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // --- CÁC HÀM CŨ ---
  const getAvatarLetters = () => {
    if (!user || !user.email) return "U";
    const namePart = user.user_metadata?.full_name || user.email.split("@")[0];
    const words = namePart.trim().split(/\s+/);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return namePart.substring(0, 2).toUpperCase();
  };

  const timeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifications(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navClasses = isAccessibilityMode
    ? "border-[#f59e0b] shadow-[0_8px_30px_rgba(15,23,42,0.35)]"
    : "border-gray-100 shadow-sm";

  // ✅ MỚI: Bấm vào 1 notification cụ thể → đóng dropdown + báo cho MapPage mở đúng place đó
  // Bảng "notifications" không có cột place_id riêng, nên place_id được lưu tạm
  // trong cột "link" có sẵn (xem UpdateRequestsPage.jsx phía admin, hàm sendNotification).
  const handleNotificationItemClick = (notif) => {
    setShowNotifications(false);
    if (onNotificationClick && notif.link) {
      onNotificationClick(notif.link);
    }
  };

  return (
    <nav className={`absolute top-0 left-0 right-0 z-[100] h-16 backdrop-blur-md border-b px-4 md:px-6 flex items-center justify-between select-none transition-colors duration-200 bg-[var(--nav-bg)] ${navClasses}`}>
      
      {/* Cột trái: Logo */}
      <div
        onClick={() => navigate("/map")}
        className="group flex items-center gap-2 cursor-pointer hover:bg-emerald-50 px-3 py-2 rounded-full transition-colors"
      >
        <Map className={`w-5 h-5 md:w-6 md:h-6 ${isAccessibilityMode ? "text-[#f59e0b]" : "text-emerald-700"}`} />
        <span className={`font-bold text-lg md:text-xl ${isAccessibilityMode ? "text-[#f8fafc]" : "bg-gradient-to-r from-emerald-800 to-emerald-600 bg-clip-text text-transparent"}`}>
          Netsuggest
        </span>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        
        {/* 1. Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors relative"
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </button>

          {showNotifications && (
            <div className={`absolute right-0 mt-2 w-72 md:w-80 border rounded-2xl z-50 animate-in fade-in slide-in-from-top-3 duration-150 bg-[var(--dropdown-bg)] border-[var(--dropdown-border)] shadow-[var(--dropdown-shadow)]`}>
              <div className="px-4 py-3 border-b border-[var(--border)] font-bold text-sm text-[var(--text-primary)]">
                Notifications
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-4 text-xs text-center text-[var(--text-secondary)]">No new notifications</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationItemClick(notif)}
                      className="px-4 py-3 hover:bg-[var(--bg-hover)] cursor-pointer flex gap-3 items-start border-b border-[var(--border)] last:border-0"
                    >
                      <Clock size={16} className="text-amber-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-[var(--text-primary)]">{notif.message}</p>
                        <span className="text-[10px] text-[var(--text-secondary)]">{timeAgo(notif.created_at)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 2. Register Place Button */}
        <button
          onClick={onRegisterClick}
          className={`flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2 font-medium text-xs md:text-sm rounded-full shadow-sm transition-all active:scale-95 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-text)]`}
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Register Place</span>
        </button>

        {/* 3. User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`w-9 h-9 md:w-10 md:h-10 rounded-full border font-semibold text-xs md:text-sm flex items-center justify-center shadow-inner transition-all focus:outline-none bg-[var(--avatar-bg)] text-[var(--avatar-text)] border-[var(--border)] hover:brightness-95`}
          >
            {getAvatarLetters()}
          </button>

          {isDropdownOpen && (
            <div className={`absolute right-0 mt-2 w-64 md:w-72 border rounded-2xl py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-150 origin-top-right bg-[var(--dropdown-bg)] border-[var(--dropdown-border)] shadow-[var(--dropdown-shadow)]`}>
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
              </div>

              <div className="py-1">
                <button onClick={() => { setIsDropdownOpen(false); navigate("/map"); }} className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors text-[var(--text-primary)] hover:bg-[var(--bg-hover)]`}>
                  <Map size={16} className="text-[var(--text-muted)]" /> <span>Map</span>
                </button>
                <button onClick={() => { setIsDropdownOpen(false); navigate("/itineraries"); }} className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors text-[var(--text-primary)] hover:bg-[var(--bg-hover)]`}>
                  <BookMarked size={16} className="text-[var(--text-muted)]" /> <span>Itineraries</span>
                </button>
                <button onClick={() => { setIsDropdownOpen(false); navigate(`/map?view=myplaces&t=${Date.now()}`); }} className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors text-[var(--text-primary)] hover:bg-[var(--bg-hover)]`}>
                  <Plus size={16} className="text-[var(--text-muted)]" /> <span>My Places</span>
                </button>
              </div>

              <div className={`border-t my-1 border-[var(--border)]`}></div>

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