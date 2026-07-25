import { useState, useEffect, useRef } from "react";
import { Bell, Clock, Map, Users, FileText, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/context/AuthContext";
import { supabase } from "../../auth/api/supabaseClient";
import Logo from "../../../shared/ui/Logo";

// ✅ MỚI: "đã xem" phải sống sót qua việc chuyển trang (AdminNavbar bị mount lại
// ở mỗi trang admin), nên lưu vào localStorage thay vì chỉ giữ trong state.
const SEEN_STORAGE_KEY = "admin_notif_seen_request_ids";

const loadSeenIds = () => {
  try {
    const raw = localStorage.getItem(SEEN_STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

const saveSeenIds = (set) => {
  try {
    localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // localStorage không khả dụng (private mode, quota...) — bỏ qua, không crash app
  }
};

export default function AdminNavbar() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // ✅ MỚI: tập id các request mà admin đã "xem" (mở dropdown / bấm vào).
  // Tách biệt hoàn toàn khỏi trạng thái pending/approved/rejected trên server —
  // chỉ dùng để quyết định số hiển thị trên chuông, KHÔNG ảnh hưởng dữ liệu request.
  // Khởi tạo từ localStorage để không bị mất khi component remount lúc chuyển trang.
  const [seenIds, setSeenIds] = useState(() => loadSeenIds());

  const notifRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { logoutUser } = useAuth();

  // ✅ MỚI: unreadCount tính động = số request pending mà admin CHƯA xem qua chuông
  const unreadCount = notifications.filter(n => !seenIds.has(n.id)).length;

  // ✅ MỚI: helper — vừa update state vừa ghi xuống localStorage cùng lúc
  const markAsSeen = (ids) => {
    setSeenIds(prev => {
      const updated = new Set(prev);
      ids.forEach(id => updated.add(id));
      saveSeenIds(updated);
      return updated;
    });
  };

  // 1. Fetch ONLY pending requests from the database
  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("place_update_requests")
        .select("id, place_name, status, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      const pending = data || [];
      setNotifications(pending);
      // ❌ Không set unreadCount ở đây nữa — nó được tính từ notifications + seenIds

      // ✅ MỚI: dọn rác — id nào đã approve/reject rồi (không còn pending) thì
      // bỏ khỏi seenIds trong localStorage, tránh phình to vô hạn theo thời gian.
      const pendingIds = new Set(pending.map(n => n.id));
      setSeenIds(prev => {
        let changed = false;
        const trimmed = new Set();
        prev.forEach(id => {
          if (pendingIds.has(id)) {
            trimmed.add(id);
          } else {
            changed = true;
          }
        });
        if (changed) saveSeenIds(trimmed);
        return changed ? trimmed : prev;
      });
    } catch (err) {
      console.error("Error fetching notifications:", err.message);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // 2. Realtime listener: Refreshes list automatically when a request changes
    const channel = supabase
      .channel("admin_navbar_realtime_notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "place_update_requests",
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Close notifications dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    if (confirm("Are you sure you want to sign out?")) {
      try {
        await logoutUser();
      } catch (err) {
        console.error("Administrative signout execution exception:", err.message);
      }
    }
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

  // ✅ MỚI: Bấm mở chuông → đánh dấu toàn bộ notification hiện có là "đã xem" ngay,
  // số trên chuông giảm về 0 ngay lập tức mà không cần chờ admin approve/reject.
  // Dùng markAsSeen nên trạng thái này được lưu localStorage, sống sót qua điều hướng trang.
  const handleToggleNotifications = () => {
    setShowNotifications(prev => {
      const next = !prev;
      if (next) {
        markAsSeen(notifications.map(n => n.id));
      }
      return next;
    });
  };

  // ✅ MỚI: Bấm vào từng notification cụ thể — đánh dấu seen (phòng trường hợp bấm
  // nhanh trước khi handleToggleNotifications kịp cập nhật) rồi điều hướng như cũ.
  const handleNotificationItemClick = (notif) => {
    markAsSeen([notif.id]);
    navigate("/admin/requests");
    setShowNotifications(false);
  };

  // Main navigation links visible directly on the navbar
  const navItems = [
    { path: "/admin", label: "Map View", icon: Map },
    { path: "/admin/users", label: "User Management", icon: Users },
    { path: "/admin/requests", label: "Update Requests", icon: FileText },
  ];

  return (
    <nav className="w-full bg-white border-b border-gray-200 shadow-sm z-50 relative">
      <div className="mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        
        {/* Left Side: Clickable Logo area that navigates to Map View */}
        <div 
          onClick={() => navigate("/admin")} 
          className="cursor-pointer flex items-center gap-2 hover:opacity-90 transition-opacity"
          title="Go to Map View"
        >
          <Logo />
          <div className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[10px] font-bold tracking-wide uppercase">
            Admin
          </div>
        </div>

        {/* Center/Right: Flat Navigation Links visible inline */}
        <div className="hidden lg:flex items-center gap-1 flex-1 justify-center max-w-2xl px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isActive 
                    ? "bg-blue-50 text-blue-600 font-semibold" 
                    : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {/* ❌ ĐÃ XOÁ: badge số pending request trên tab Update Requests.
                    Số lượng chưa xem giờ chỉ hiển thị trên icon chuông. */}
              </button>
            );
          })}
        </div>

        {/* Right Side Actions: Notification Bell & Logout */}
        <div className="flex items-center gap-4">
          
          {/* Mobile responsive navigation indicators fallback (visible below lg breakpoint) */}
          <div className="flex lg:hidden items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`p-2 rounded-lg relative cursor-pointer ${
                    isActive ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-blue-600"
                  }`}
                  title={item.label}
                >
                  <Icon size={18} />
                  {/* ❌ ĐÃ XOÁ: chấm đỏ báo pending trên icon mobile của Update Requests */}
                </button>
              );
            })}
          </div>

          <div className="h-6 w-[1px] bg-gray-200 hidden sm:block"></div>

          {/* REALTIME PENDING NOTIFICATION BELL (FACEBOOK STYLE) */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={handleToggleNotifications}
              className={`relative p-2 rounded-full transition-all cursor-pointer focus:outline-none ${
                showNotifications ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:text-blue-600 hover:bg-gray-100"
              }`}
              title="Notifications"
            >
              <Bell size={20} className={unreadCount > 0 ? "animate-swing" : ""} />
              
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* FACEBOOK STYLE DROPDOWN FEED */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 flex flex-col max-h-[480px]">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="font-bold text-gray-900 text-base">Notifications</span>
                  <button 
                    onClick={() => { navigate("/admin/requests"); setShowNotifications(false); }}
                    className="text-xs font-medium text-blue-600 hover:underline cursor-pointer"
                  >
                    See all
                  </button>
                </div>

                {/* Notifications List */}
                <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-500">
                      No pending requests available.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationItemClick(notif)}
                        className="p-3 hover:bg-gray-50 bg-blue-50/60 flex gap-3 items-start transition-colors cursor-pointer"
                      >
                        <div className="mt-0.5">
                          <Clock size={18} className="text-amber-500" />
                        </div>

                        <div className="flex-1">
                          <p className="text-sm text-gray-800 leading-tight">
                            New edit request submitted for <span className="font-semibold">{notif.place_name}</span> requires your verification.
                          </p>
                          <span className="text-[11px] text-gray-400 mt-1 block">
                            {timeAgo(notif.created_at)}
                          </span>
                        </div>

                        <span className="w-2 h-2 rounded-full bg-blue-600 mt-2 self-center flex-shrink-0"></span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Explicit Logout Button */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-white hover:bg-red-500 border border-red-200 hover:border-red-500 rounded-lg transition-all cursor-pointer"
            title="Sign Out"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>

        </div>
      </div>
    </nav>
  );
}