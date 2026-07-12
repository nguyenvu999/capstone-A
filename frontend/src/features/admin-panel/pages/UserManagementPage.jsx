import {
  Search,
  UserCheck,
  UserX,
} from "lucide-react";
import AdminNavbar from "../../admin-map/components/AdminNavbar";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../auth/api/supabaseClient";
import { useState, useEffect } from "react";

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Fetch all users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Added filter .eq("role", "user") to isolate standard accounts and hide administrative entries
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, role, is_active, updated_at")
        .eq("role", "user")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error("Failed to fetch users registry:", err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggles the active/inactive status of a target user account
   * @param {string} userId - The unique identifier of the user
   * @param {boolean} currentStatus - The current is_active value
   */
  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const nextStatus = !currentStatus;

      const { error } = await supabase
        .from("profiles")
        .update({ 
          is_active: nextStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", userId);

      if (error) throw error;

      // Optimistically update local component state
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === userId ? { ...u, is_active: nextStatus } : u))
      );
    } catch (err) {
      console.error("Authorization status update failure:", err.message);
      alert("Error: Unable to update user activation state.");
    }
  };

  //Display all of teh users in system 
    const totalUsers = users.length;

    const activeUsers = users.filter(
      (user) => user.is_active
    ).length;

    const deactivatedUsers = users.filter(
      (user) => !user.is_active
    ).length;

    const filteredUsers = users.filter((user) =>
      user.full_name
        ?.toLowerCase()
        .includes(searchQuery.trim().toLowerCase())
    );

  
    if (loading) return <div className="p-6 text-center">Loading users...</div>;

    return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header section with Back Button */}
      <div className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-3 cursor-pointer ml-auto">
        <h1 className="text-2xl font-bold text-gray-800">User Management Console</h1>
        
        <button
          onClick={() => navigate("/admin")}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-300 shadow-sm cursor-pointer"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={2} 
            stroke="currentColor" 
            className="w-4 h-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3m0 0l7.5-7.5M3 19.5h18" />
          </svg>
          Back to Dashboard
        </button>
      </div>

      {/* User statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">
            Total Users
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {totalUsers}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Standard users in the system
          </p>
        </div>

        <div className="bg-white rounded-xl border border-green-200 p-4 shadow-sm">
          <p className="text-xs font-medium text-green-600">
            Active Users
          </p>

          <p className="mt-2 text-2xl font-bold text-green-700">
            {activeUsers}
          </p>

          <p className="mt-1 text-xs text-green-500">
            Accounts currently activated
          </p>
        </div>

        <div className="bg-white rounded-xl border border-red-200 p-4 shadow-sm">
          <p className="text-xs font-medium text-red-600">
            Deactivated Users
          </p>

          <p className="mt-2 text-2xl font-bold text-red-700">
            {deactivatedUsers}
          </p>

          <p className="mt-1 text-xs text-red-500">
            Accounts currently disabled
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search users by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-10 text-center text-sm text-gray-500">
                  No standard users found in the system registry.
                </td>
              </tr>
            ) : (
              filteredUsers.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {item.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {item.is_active ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => toggleUserStatus(item.id, item.is_active)}
                     className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      item.is_active
                        ? "bg-red-50 text-red-600 hover:bg-red-100"
                        : "bg-green-50 text-green-600 hover:bg-green-100"
                    }`}
                    >
                      {item.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};