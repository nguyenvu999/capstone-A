import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../auth/api/supabaseClient";
import { Search, UserCheck, UserX, Loader2 } from "lucide-react";
import AdminNavbar from "../../admin-map/components/AdminNavbar";

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
      
      // Giữ nguyên filter .eq("role", "user") để chỉ lấy tài khoản user tiêu chuẩn
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

  // --- Logic tính toán thống kê dựa trên dữ liệu thật ---
  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.is_active).length;
  const deactivatedUsers = users.filter((user) => !user.is_active).length;

  // Lọc danh sách theo email dựa trên searchQuery nhập vào
  const filteredUsers = users.filter((user) =>
    user.email?.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-gray-50">
      {/* 1. Tích hợp thanh Admin Thượng tầng */}
      <AdminNavbar pendingRequestsCount={0} />

      {/* Vùng nội dung cuộn độc lập mượt mà */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          
          {/* Header section với nút Back Dashboard của bạn */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">User Management Console</h1>
              <p className="text-sm text-gray-500 mt-1">Manage active or deactivated standard user accounts</p>
            </div>
            
            <button
              onClick={() => navigate("/admin")}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-200 shadow-sm cursor-pointer"
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

          {/* 2. Thêm các thẻ thống kê trực quan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <p className="text-xs font-medium text-gray-500">Total Users</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{totalUsers}</p>
              <p className="mt-1 text-xs text-gray-400">Standard users in system</p>
            </div>

            <div className="bg-white rounded-xl border border-green-200 p-4 shadow-sm">
              <p className="text-xs font-medium text-green-600">Active Users</p>
              <p className="mt-2 text-2xl font-bold text-green-700">{activeUsers}</p>
              <p className="mt-1 text-xs text-green-500">Accounts activated</p>
            </div>

            <div className="bg-white rounded-xl border border-red-200 p-4 shadow-sm">
              <p className="text-xs font-medium text-red-600">Deactivated Users</p>
              <p className="mt-2 text-2xl font-bold text-red-700">{deactivatedUsers}</p>
              <p className="mt-1 text-xs text-red-500">Accounts disabled</p>
            </div>
          </div>

          {/* 3. Thanh ô tìm kiếm Search theo Email */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Cấu trúc bảng hiển thị danh sách của bạn */}
          <div className="bg-white shadow rounded-xl overflow-hidden border border-gray-200">
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
                {/* Đưa trạng thái Loading vào trong body table để không bị vỡ Layout trang */}
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-sm text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        <span>Loading user registry...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-10 text-center text-sm text-gray-500">
                      No standard users found in the system registry.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 uppercase">
                          {item.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.is_active ? "Active" : "Deactivated"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => toggleUserStatus(item.id, item.is_active)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                            item.is_active 
                              ? "bg-red-50 text-red-600 hover:bg-red-100" 
                              : "bg-green-50 text-green-600 hover:bg-green-100"
                          }`}
                        >
                          {item.is_active ? (
                            <>
                              <UserX size={12} />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck size={12} />
                              Activate
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}