import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../auth/api/supabaseClient";

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
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
        .select("id, email, role, is_active, updated_at")
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

  if (loading) return <div className="p-6 text-center">Loading users...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header section with Back Button */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">User Management Console</h1>
        
        <button
          onClick={() => navigate("/admin")}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-300 shadow-sm"
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
            {users.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-10 text-center text-sm text-gray-500">
                  No standard users found in the system registry.
                </td>
              </tr>
            ) : (
              users.map((item) => (
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
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
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
}