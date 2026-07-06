import { useState } from "react";
import { X, Search, UserCheck, UserX } from "lucide-react";
import { MOCK_USERS } from "../../../shared/data/mockPlaces";

export default function AdminPanel({ onClose }) {
  const [users, setUsers] = useState(MOCK_USERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "active" | "inactive"

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleUserStatus = (userId) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === "active" ? "inactive" : "active" }
        : user
    ));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed top-0 md:top-20 right-0 md:right-6 left-0 md:left-auto bottom-0 md:bottom-auto z-[999] w-full md:w-[500px] h-full md:h-auto max-h-full md:max-h-[calc(100vh-120px)] bg-white rounded-none md:rounded-2xl shadow-2xl flex flex-col border border-gray-100 overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <div>
          <h2 className="text-base font-bold text-gray-800">User Management</h2>
          <p className="text-xs text-gray-500 mt-0.5">{filteredUsers.length} users</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Search & Filter */}
      <div className="p-4 border-b border-gray-100 space-y-3 shrink-0">
        {/* Search */}
        <div className="relative flex items-center bg-gray-100 rounded-xl px-3 py-2.5">
          <Search size={16} className="text-gray-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="bg-transparent text-xs text-gray-800 focus:outline-none w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          {["all", "active", "inactive"].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                statusFilter === status
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredUsers.length > 0 ? (
          filteredUsers.map(user => (
            <div key={user.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-all">
              <div className="flex items-start justify-between gap-3">
                {/* User Info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold text-sm shrink-0">
                    {user.full_name.substring(0, 2).toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900 truncate">{user.full_name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        user.status === "active" 
                          ? "bg-green-100 text-green-700" 
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {user.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 truncate">{user.email}</p>
                    
                    {/* Stats */}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>📍 {user.places_created} places</span>
                      <span>⭐ {user.reviews_written} reviews</span>
                    </div>
                    
                    {/* Last Login */}
                    <p className="text-xs text-gray-400 mt-1">
                      Last login: {formatDate(user.last_login)}
                    </p>
                  </div>
                </div>

                {/* Toggle Button */}
                <button
                  onClick={() => toggleUserStatus(user.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    user.status === "active"
                      ? "bg-red-50 text-red-600 hover:bg-red-100"
                      : "bg-green-50 text-green-600 hover:bg-green-100"
                  }`}
                >
                  {user.status === "active" ? (
                    <>
                      <UserX size={14} />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck size={14} />
                      Activate
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-xs text-gray-400">No users found</div>
        )}
      </div>
    </div>
  );
}