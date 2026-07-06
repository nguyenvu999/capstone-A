import { useState } from "react";
import { ArrowLeft, Check, X, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MOCK_UPDATE_REQUESTS } from "../../../shared/data/mockPlaces";
import AdminNavbar from "../../admin-map/components/AdminNavbar";

export default function UpdateRequestsPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState(MOCK_UPDATE_REQUESTS);
  const [activeTab, setActiveTab] = useState("pending");
  const [showApproveModal, setShowApproveModal] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [expandedRequestId, setExpandedRequestId] = useState(null);

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
      sight: "Sight", entertainment: "Entertainment", team_event: "Team Event"
    };
    return catMap[cat] || cat;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const handleApprove = (requestId) => {
    setRequests(prev => prev.map(r =>
      r.id === requestId ? { ...r, status: "approved" } : r
    ));
    setShowApproveModal(null);
    alert("Request approved! Changes have been applied to the place.");
  };

  const handleReject = (requestId) => {
    setRequests(prev => prev.map(r =>
      r.id === requestId ? { ...r, status: "rejected" } : r
    ));
    setShowRejectModal(null);
    setRejectReason("");
    alert("Request rejected.");
  };

  const getChangedFields = (original, proposed) => {
    const fields = [];
    const allKeys = [...new Set([...Object.keys(original || {}), ...Object.keys(proposed || {})])];
    
    allKeys.forEach(key => {
      const oldVal = original?.[key];
      const newVal = proposed?.[key];
      
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        fields.push({ key, oldVal, newVal, changed: true });
      } else {
        fields.push({ key, oldVal, newVal, changed: false });
      }
    });
    
    return fields;
  };

  const formatFieldValue = (key, value) => {
    if (key === "price_level") return getPriceLabel(value);
    if (key === "business_status") return getStatusLabel(value);
    if (key === "category") return getCategoryLabel(value);
    return value || "N/A";
  };

  const formatFieldLabel = (key) => {
    const labels = {
      name: "Name",
      address: "Address",
      category: "Category",
      price_level: "Price Level",
      business_status: "Business Status",
      description: "Description",
    };
    return labels[key] || key;
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-gray-50">
      
      {/* Navbar */}
      <AdminNavbar pendingRequestsCount={pendingCount} />
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate("/admin")}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-3"
            >
              <ArrowLeft size={16} />
              Back to Map
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Place Update Requests</h1>
            <p className="text-sm text-gray-500 mt-1">Review and manage update requests from users</p>
          </div>

          {/* Tabs */}
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

          {/* Request Cards */}
          {filteredRequests.length > 0 ? (
            <div className="space-y-4">
              {filteredRequests.map(request => {
                const changedFields = getChangedFields(request.original_data, request.proposed_data);
                const isExpanded = expandedRequestId === request.id;
                
                return (
                  <div key={request.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Compact Card Header */}
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 font-mono">#{request.id}</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          request.status === "pending" ? "bg-amber-100 text-amber-700"
                          : request.status === "approved" ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                        }`}>
                          {request.status}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-gray-900 mb-2">📍 {request.place_name}</h3>
                      <div className="space-y-1 text-xs text-gray-500">
                        <p>👤 {request.requested_by_email}</p>
                        <p>📅 {formatDate(request.created_at)}</p>
                      </div>
                      
                      {/* Reason */}
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-xs font-medium text-blue-800 mb-1">📝 Reason for update:</p>
                        <p className="text-sm text-blue-700 leading-relaxed">{request.reason}</p>
                      </div>

                      {/* See Detail Button */}
                      <div className="flex justify-end mt-3">
                        <button
                          onClick={() => setExpandedRequestId(isExpanded ? null : request.id)}
                          className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1"
                        >
                          {isExpanded ? "Hide Details ▲" : "See Details ▼"}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Detail Section */}
                    {isExpanded && (
                      <>
                        {/* Proposed Changes */}
                        <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                          <h4 className="text-sm font-bold text-gray-900 mb-3">Proposed Changes</h4>
                          <div className="space-y-3">
                            {changedFields.map(field => (
                              <div key={field.key} className={`rounded-lg p-3 ${field.changed ? "bg-amber-50 border border-amber-200" : "bg-gray-50 border border-gray-200"}`}>
                                <p className="text-xs font-medium text-gray-600 mb-1.5">{formatFieldLabel(field.key)}</p>
                                {field.changed ? (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-red-600 font-medium">❌ Old:</span>
                                      <span className="text-sm text-red-700 line-through">{formatFieldValue(field.key, field.oldVal)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-green-600 font-medium">✅ New:</span>
                                      <span className="text-sm text-green-700 font-semibold">{formatFieldValue(field.key, field.newVal)}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-600">✓ No change ({formatFieldValue(field.key, field.oldVal)})</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Action Buttons (only for pending) */}
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
              <p className="text-sm text-gray-500">No {activeTab} requests</p>
            </div>
          )}
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Approve Request</h3>
            <p className="text-sm text-gray-600 mb-6">
              Apply the proposed changes to "<strong>{showApproveModal.place_name}</strong>"? This will update the place immediately.
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reject Request</h3>
            <p className="text-sm text-gray-600 mb-4">
              Reject the update request for "<strong>{showRejectModal.place_name}</strong>"?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
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