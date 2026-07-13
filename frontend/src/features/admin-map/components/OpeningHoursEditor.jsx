import { useState, useEffect } from "react";
import { DAYS_OF_WEEK, TIME_OPTIONS_30MIN, getDefaultSchedule } from "../utils/openingHoursUtils";

export default function OpeningHoursEditor({ value, onChange, disabled = false }) {
  const [schedule, setSchedule] = useState(value || getDefaultSchedule());

  useEffect(() => {
    if (value) {
      setSchedule(value);
    }
  }, [value]);

  const handleToggle = (dayIndex) => {
    const updated = [...schedule];
    updated[dayIndex] = {
      ...updated[dayIndex],
      isOpen: !updated[dayIndex].isOpen,
      openTime: updated[dayIndex].isOpen ? null : "09:00",
      closeTime: updated[dayIndex].isOpen ? null : "22:00"
    };
    setSchedule(updated);
    if (onChange) onChange(updated);
  };

  const handleTimeChange = (dayIndex, field, value) => {
    const updated = [...schedule];
    updated[dayIndex] = {
      ...updated[dayIndex],
      [field]: value
    };
    setSchedule(updated);
    if (onChange) onChange(updated);
  };

  return (
    <div className="space-y-2">
      <label className="block font-medium text-gray-700 mb-2 text-sm">
        Opening Hours
      </label>

      {schedule.map((day, index) => (
        <div key={day.dayOfWeek} className="flex items-center gap-3">
          {/* Day name */}
          <div className="w-24 text-xs font-medium text-gray-700">
            {day.dayOfWeek.charAt(0) + day.dayOfWeek.slice(1).toLowerCase()}
          </div>

          {/* Toggle */}
          <button
            type="button"
            onClick={() => handleToggle(index)}
            disabled={disabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              day.isOpen ? "bg-green-600" : "bg-gray-300"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                day.isOpen ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>

          {/* Status text */}
          <span className={`text-xs font-medium w-12 ${day.isOpen ? "text-green-600" : "text-gray-500"}`}>
            {day.isOpen ? "Open" : "Closed"}
          </span>

          {/* Time dropdowns */}
          {day.isOpen ? (
            <>
              <select
                value={day.openTime || ""}
                onChange={(e) => handleTimeChange(index, "openTime", e.target.value)}
                disabled={disabled}
                className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">Open at</option>
                {TIME_OPTIONS_30MIN.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>

              <span className="text-gray-400 text-xs">-</span>

              <select
                value={day.closeTime || ""}
                onChange={(e) => handleTimeChange(index, "closeTime", e.target.value)}
                disabled={disabled}
                className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">Close at</option>
                {TIME_OPTIONS_30MIN.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </>
          ) : (
            <div className="flex-1"></div>
          )}
        </div>
      ))}

      <p className="text-xs text-gray-500 mt-2">
        💡 Supports overnight hours (e.g., 18:00 - 02:00)
      </p>
    </div>
  );
}