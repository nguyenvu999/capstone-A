import { X, AlertTriangle } from "lucide-react";

// Modal cảnh báo khi phát hiện địa điểm duplicate
// existingPlace: thông tin place đã tồn tại trong database
// onClose: đóng modal
// onViewPlace: chuyển đến xem place đã tồn tại
export default function DuplicatePlaceModal({ existingPlace, onClose, onViewPlace }) {
  if (!existingPlace) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header với icon warning */}
        <div className="bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle size={24} className="text-amber-600" strokeWidth={2} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Place Already Exists</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Body - Message đơn giản */}
        <div className="p-6 space-y-4">
          {/* Message chính */}
          <p className="text-gray-700 leading-relaxed">
            This place has already been registered in the database. Please check the existing entry before adding a new one.
          </p>

          {/* Thông tin place đã tồn tại */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm font-bold text-gray-900 mb-1">{existingPlace.name}</p>
            <p className="text-xs text-gray-600">{existingPlace.address}</p>
            {existingPlace.distance && (
              <p className="text-xs text-gray-500 mt-2">
                Distance: <span className="font-semibold text-blue-600">{existingPlace.distance.toFixed(1)} km</span>
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (onViewPlace) onViewPlace(existingPlace);
              onClose();
            }}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
          >
            View Existing Place
          </button>
        </div>
      </div>
    </div>
  );
}