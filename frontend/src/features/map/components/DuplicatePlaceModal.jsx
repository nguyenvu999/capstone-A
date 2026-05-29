import { X, AlertTriangle, MapPin, Navigation } from "lucide-react";

// Modal cảnh báo khi phát hiện địa điểm duplicate
// existingPlace: thông tin place đã tồn tại trong database
// onClose: đóng modal
// onViewPlace: chuyển đến xem place đã tồn tại
export default function DuplicatePlaceModal({ existingPlace, onClose, onViewPlace }) {
  if (!existingPlace) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-amber-50 border-b border-amber-100 p-4 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Duplicate Place Detected</h3>
              <p className="text-xs text-gray-600 mt-0.5">This place may already exist in the database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-amber-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Existing Place Info */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Existing Place</p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-800">{existingPlace.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{existingPlace.address}</p>
                </div>
              </div>
              {existingPlace.distance && (
                <div className="flex items-center gap-2 mt-2">
                  <Navigation size={12} className="text-gray-400" />
                  <p className="text-xs text-gray-500">
                    <span className="font-semibold text-blue-600">{existingPlace.distance.toFixed(1)} km</span> away from your location
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs text-amber-800 leading-relaxed">
              ⚠️ The place you're trying to register appears to be very similar to an existing entry. 
              To avoid duplicates, please check if this is the same location.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 border-t border-gray-100 p-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (onViewPlace) onViewPlace(existingPlace);
              onClose();
            }}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm"
          >
            View Existing Place
          </button>
        </div>
      </div>
    </div>
  );
}