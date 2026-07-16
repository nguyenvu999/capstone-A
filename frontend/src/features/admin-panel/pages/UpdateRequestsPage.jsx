import { useState, useEffect } from "react";
import { ArrowLeft, Check, X, FileText, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../auth/api/supabaseClient"; 
import AdminNavbar from "../../admin-map/components/AdminNavbar";

export default function UpdateRequestsPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [showApproveModal, setShowApproveModal] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [expandedRequestId, setExpandedRequestId] = useState(null);

  // FETCH REQUESTS AND JOIN WITH LIVE PLACES DATA
  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Thực hiện lấy dữ liệu request đồng thời lấy thông tin thực tế hiện tại của địa điểm từ bảng places
      const { data, error } = await supabase
        .from("place_update_requests")
        .select(`
          *,
          places:place_id (
            name,
            address,
            category,
            price_level,
            business_status,
            description,
            opening_hours
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching requests:", error.message);
      alert("Failed to load update requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredRequests = requests.filter(r => r.status === activeTab);
  const pendingCount = requests.filter(r => r.status === "pending").length;

  const getPriceLabel = (level) => {
    const priceMap = { 1: "Budget ($)", 2: "Moderate ($$)", 3: "Expensive ($$$)", 4: "Ultra Luxe ($$$$)" };
    return priceMap[level] || "N/A";
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      open: "Open",
      temporarily_closed: "Temporarily Closed",
      closed: "Permanently Closed"
    };
    return statusMap[status] || status;
  };

  const getCategoryLabel = (cat) => {
    const catMap = {
      restaurant: "Restaurant", bar: "Bar", beverage: "Beverage",
      sight: "Sight", entertainment: "Entertainment", team_event: "Team Event", vegetarian: "Vegetarian"
    };
    return catMap[cat] || cat;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // ===== HANDLE APPROVE =====
  const handleApprove = async (requestId) => {
    const targetRequest = requests.find(r => r.id === requestId);
    if (!targetRequest) return;

    try {
      const { error: placeError } = await supabase
        .from("places")
        .update({
          name: targetRequest.proposed_data.name,
          address: targetRequest.proposed_data.address,
          category: targetRequest.proposed_data.category,
          price_level: targetRequest.proposed_data.price_level,
          business_status: targetRequest.proposed_data.business_status,
          description: targetRequest.proposed_data.description,
          opening_hours: targetRequest.proposed_data.opening_hours, 
          updated_at: new Date().toISOString()
        })
        .eq("id", targetRequest.place_id);

      if (placeError) throw placeError;

      const { error: requestError } = await supabase
        .from("place_update_requests")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", requestId);

      if (requestError) throw requestError;

      setRequests(prev => prev.map(r =>
        r.id === requestId ? { ...r, status: "approved" } : r
      ));
      
      setShowApproveModal(null);
      alert("Request approved! Changes have been successfully applied to the place.");
    } catch (error) {
      console.error("Approve error:", error.message);
      alert(`Failed to approve request: ${error.message}`);
    }
  };

  // ===== HANDLE REJECT =====
  const handleReject = async (requestId) => {
    try {
      const { error } = await supabase
        .from("place_update_requests")
        .update({ 
          status: "rejected", 
          reject_reason: rejectReason.trim() || null,
          updated_at: new Date().toISOString() 
        })
        .eq("id", requestId);

      if (error) throw error;

      setRequests(prev => prev.map(r =>
        r.id === requestId ? { ...r, status: "rejected", reject_reason: rejectReason.trim() } : r
      ));

      setShowRejectModal(null);
      setRejectReason("");
      alert("Request rejected.");
    } catch (error) {
      console.error("Reject error:", error.message);
      alert(`Failed to reject request: ${error.message}`);
    }
  };

  // SO SÁNH GIỮA DATA LIVE THỰC TẾ VÀ DATA ĐỀ XUẤT MỚI
  const getChangedFields = (liveData, originalSnapshot, proposed) => {
    const fields = [];
    // Ưu tiên dùng dữ liệu live thực tế từ bảng places, nếu trống mới dùng fallback snapshot cũ
    const baseData = liveData || originalSnapshot || {};
    
    const allKeys = [...new Set([...Object.keys(baseData), ...Object.keys(proposed || {})])];
    
    allKeys.forEach(key => {
      const oldVal = baseData[key];
      const newVal = proposed?.[key];
      
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        fields.push({ key, oldVal, newVal, changed: true });
      } else {
        fields.push({ key, oldVal, newVal, changed: false });
      }
    });
    
    return fields;
  };

  // ĐỊNH DẠNG TEXT CHO MẢNG LỊCH TRÌNH ĐỂ KHÔNG BỊ LỖI [object Object]
  const formatFieldValue = (key, value) => {
    if (key === "price_level") return getPriceLabel(value);
    if (key === "business_status") return getStatusLabel(value);
    if (key === "category") return getCategoryLabel(value);
    
    if (key === "opening_hours") {
      if (!value) return "No schedule set";
      
      // Nếu là String (do DB trả về hoặc fallback text)
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) value = parsed;
        } catch (e) {
          return value;
        }
      }
      
      // Xử lý render mảng lịch trình tường minh
      if (Array.isArray(value)) {
        if (value.length === 0) return "No schedule set";
        return value
          .map((day) => {
            const dayName = day.dayOfWeek ? (day.dayOfWeek.charAt(0) + day.dayOfWeek.slice(1).toLowerCase()) : "Day";
            if (!day.isOpen) return `${dayName}: Closed`;
            return `${dayName}: ${day.openTime || "N/A"} - ${day.closeTime || "N/A"}`;
          })
          .join(" | ");
      }
    }
    
    return typeof value === "object" ? JSON.stringify(value) : (value || "N/A");
  };

  const formatFieldLabel = (key) => {
    const labels = {
      name: "Name",
      address: "Address",
      category: "Category",
      price_level: "Price Level",
      business_status: "Business Status",
      description: "Description",
      opening_hours: "Opening Hours", 
    };
    return labels[key] || key;
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-gray-50">
      <AdminNavbar pendingRequestsCount={pendingCount} />
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          
          <div className="mb-6">
            <button
              onClick={() => navigate("/admin")}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-3 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Map
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Place Update Requests</h1>
            <p className="text-sm text-gray-500 mt-1">Review and manage update requests from users</p>
          </div>

          <div className="flex gap-2 mb-6">
            {["pending", "approved", "rejected"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === tab
                    ? tab === "pending" ? "bg-amber-600 text-white shadow-sm"
                    : tab === "approved" ? "bg-green-600 text-white shadow-sm"
                    : "bg-red-600 text-white shadow-sm"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === "pending" && pendingCount > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === tab ? "bg-white/30 text-white" : "bg-amber-100 text-amber-700"
                  }`}>
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Loading requests...</p>
            </div>
          ) : filteredRequests.length > 0 ? (
            <div className="space-y-4">
              {filteredRequests.map(request => {
                // TRUYỀN DỮ LIỆU THỰC TẾ LIVE TỪ BẢNG PLACES VÀO ĐỂ SO SÁNH
                const livePlaceData = request.places;
                const changedFields = getChangedFields(livePlaceData, request.original_data, request.proposed_data);
                const isExpanded = expandedRequestId === request.id;
                
                return (
                  <div key={request.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in-50 duration-200">
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 font-mono">#{request.id}</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${
                          request.status === "pending" ? "bg-amber-100 text-amber-700"
                          : request.status === "approved" ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                        }`}>
                          {request.status}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-gray-900 mb-2">📍 {request.place_name}</h3>
                      <div className="space-y-1 text-xs text-gray-500">
                        <p>👤 Requester: {request.requested_by_email}</p>
                        <p>📅 Created at: {formatDate(request.created_at)}</p>
                      </div>
                      
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-xs font-medium text-blue-800 mb-1">📝 Reason for update:</p>
                        <p className="text-sm text-blue-700 leading-relaxed">{request.reason}</p>
                      </div>

                      {request.status === "rejected" && request.reject_reason && (
                        <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-100">
                          <p className="text-xs font-medium text-red-800 mb-1">❌ Rejection Reason:</p>
                          <p className="text-sm text-red-700 leading-relaxed">{request.reject_reason}</p>
                        </div>
                      )}

                      <div className="flex justify-end mt-3">
                        <button
                          onClick={() => setExpandedRequestId(isExpanded ? null : request.id)}
                          className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1"
                        >
                          {isExpanded ? "Hide Details ▲" : "See Details ▼"}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <>
                        <div className="px-5 pb-5 border-t border-gray-100 pt-4 bg-gray-50/50">
                          <h4 className="text-sm font-bold text-gray-900 mb-3">Proposed Changes Comparison</h4>
                          <div className="space-y-3">
                            {changedFields.map(field => (
                              <div key={field.key} className={`rounded-lg p-3 bg-white border ${field.changed ? "border-amber-300 shadow-sm" : "border-gray-200 opacity-75"}`}>
                                <p className="text-xs font-medium text-gray-500 mb-1.5">{formatFieldLabel(field.key)}</p>
                                {field.changed ? (
                                  <div className="grid grid-cols-1 gap-2">
                                    <div className="p-2 bg-red-50/70 rounded border border-red-100 flex items-start gap-1.5">
                                      <span className="text-xs text-red-600 font-bold shrink-0 mt-0.5">Old:</span>
                                      <span className="text-xs text-red-700 break-words overflow-hidden">{formatFieldValue(field.key, field.oldVal)}</span>
                                    </div>
                                    <div className="p-2 bg-green-50/70 rounded border border-green-100 flex items-start gap-1.5">
                                      <span className="text-xs text-green-600 font-bold shrink-0 mt-0.5">New:</span>
                                      <span className="text-xs text-green-700 font-semibold break-words overflow-hidden">{formatFieldValue(field.key, field.newVal)}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-600 italic">✓ No change ({formatFieldValue(field.key, field.oldVal)})</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {request.status === "pending" && (
                          <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
                            <button
                              onClick={() => setShowApproveModal(request)}
                              className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                            >
                              <Check size={16} />
                              Approve Request
                            </button>
                            <button
                              onClick={() => setShowRejectModal(request)}
                              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                            >
                              <X size={16} />
                              Reject Request
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <FileText size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No {activeTab} requests found</p>
            </div>
          )}
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Approve Request</h3>
            <p className="text-sm text-gray-600 mb-6">
              Apply the proposed changes to "<strong>{showApproveModal.place_name}</strong>"? This will update the map data immediately.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowApproveModal(null)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={() => handleApprove(showApproveModal.id)}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors">Approve</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reject Request</h3>
            <p className="text-sm text-gray-600 mb-4">
              Reject the update request for "<strong>{showRejectModal.place_name}</strong>"?
            </p>
            <div className="mb-4 text-left">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Reason for rejection <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Explain why this request is being rejected..."
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-red-500 focus:bg-white resize-none transition-all"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowRejectModal(null); setRejectReason(""); }}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={() => handleReject(showRejectModal.id)}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}