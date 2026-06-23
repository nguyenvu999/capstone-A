import { X, AlertTriangle, Building2 } from "lucide-react";

// Modal cảnh báo khi phát hiện địa điểm duplicate
// modalType: "SIMPLE_DUPLICATE" | "CONVERT_TO_BUILDING" | "ADD_TO_BUILDING"
export default function DuplicatePlaceModal({ 
  existingPlace, 
  onClose, 
  onViewPlace,
  modalType = "SIMPLE_DUPLICATE", // Default: duplicate warning cũ
  onConfirmBuilding = null // Callback khi user confirm "Yes, This is a Building"
}) {
  if (!existingPlace) return null;

  // Xác định icon + color dựa vào modal type
  const getModalConfig = () => {
    switch(modalType) {
      case "CONVERT_TO_BUILDING":
        return {
          icon: AlertTriangle,
          iconBg: "bg-amber-100",
          iconColor: "text-amber-600",
          title: "Place Already Exists",
          message: "This address already has a place registered. Is this a building with multiple places inside?",
          confirmText: "Yes, This is a Building",
          confirmClass: "bg-blue-600 hover:bg-blue-700"
        };
      
      case "ADD_TO_BUILDING":
        return {
          icon: Building2,
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
          title: "Building Detected",
          message: `This address is registered as a building. Would you like to add a place to this building?`,
          confirmText: "Yes, Add Place",
          confirmClass: "bg-blue-600 hover:bg-blue-700"
        };
      
      default: // SIMPLE_DUPLICATE
        return {
          icon: AlertTriangle,
          iconBg: "bg-amber-100",
          iconColor: "text-amber-600",
          title: "Place Already Exists",
          message: "This place has already been registered in the database. Please check the existing entry before adding a new one.",
          confirmText: "View Existing Place",
          confirmClass: "bg-blue-600 hover:bg-blue-700"
        };
    }
  };

  const config = getModalConfig();
  const IconComponent = config.icon;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header với icon */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex flex-col items-center text-center">
            <div className={`w-16 h-16 rounded-full ${config.iconBg} flex items-center justify-center mb-4`}>
              <IconComponent size={32} className={config.iconColor} strokeWidth={2} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{config.title}</h3>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Message chính */}
          <p className="text-sm text-gray-700 text-center leading-relaxed">
            {config.message}
          </p>

          {/* Thông tin place đã tồn tại */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm font-bold text-gray-900 mb-1">
              {modalType === "ADD_TO_BUILDING" && existingPlace.building_name 
                ? `🏢 ${existingPlace.building_name}`
                : `📍 ${existingPlace.name}`
              }
            </p>
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
              if (modalType === "SIMPLE_DUPLICATE") {
                // Behavior cũ: View existing place
                if (onViewPlace) onViewPlace(existingPlace);
                onClose();
              } else {
                // Behavior mới: Confirm building conversion/adding
                if (onConfirmBuilding) onConfirmBuilding(existingPlace);
                onClose();
              }
            }}
            className={`flex-1 px-4 py-2.5 text-white rounded-lg font-medium text-sm transition-colors ${config.confirmClass}`}
          >
            {config.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}