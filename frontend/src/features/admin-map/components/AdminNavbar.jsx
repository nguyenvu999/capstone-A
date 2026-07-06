import { useState, useEffect, useRef } from "react";
import { Menu, LogOut, Map, Users, FileText } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "../../../shared/ui/Logo";

export default function AdminNavbar({ pendingRequestsCount = 0 }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    if (confirm("Are you sure you want to sign out?")) {
      alert("Signed out successfully!");
    }
    setShowDropdown(false);
  };

  const menuItems = [
    { 
      path: "/admin", 
      label: "Map View", 
      icon: Map,
      description: "View all places on map"
    },
    { 
      path: "/admin/users", 
      label: "User Management", 
      icon: Users,
      description: "Manage user accounts"
    },
    { 
      path: "/admin/requests", 
      label: "Update Requests", 
      icon: FileText,
      description: "Review place update requests",
      badge: pendingRequestsCount
    },
  ];

  return (
    <nav className="w-full bg-white border-b border-gray-200 shadow-sm z-50 relative">
      <div className="mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Logo />

        {/* Right side */}
        <div className="flex items-center gap-2">
          
          {/* Admin Badge */}
          <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
            ADMIN
          </div>

          {/* Menu Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Menu size={18} />
              <span className="hidden md:inline">Menu</span>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setShowDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 ${
                        isActive ? "bg-blue-50" : ""
                      }`}
                    >
                      <Icon size={18} className={isActive ? "text-blue-600" : "text-gray-400"} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${isActive ? "text-blue-600" : "text-gray-700"}`}>
                            {item.label}
                          </span>
                          {item.badge > 0 && (
                            <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                      </div>
                    </button>
                  );
                })}

                {/* Divider */}
                <div className="border-t border-gray-100 my-1"></div>

                {/* Sign Out */}
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-3 hover:bg-red-50 transition-colors flex items-start gap-3"
                >
                  <LogOut size={18} className="text-red-500" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-red-600">Sign Out</span>
                    <p className="text-xs text-red-400 mt-0.5">Log out of admin panel</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}