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
    <div className="w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-5">
        <label className="block text-lg font-semibold text-gray-800">
          Opening Hours
        </label>

        <p className="mt-1 text-sm text-gray-500">
          Select the days and operating hours for this place.
        </p>
      </div>

      {/* Days */}
      <div className="divide-y divide-gray-100">
        {schedule.map((day, index) => {
          const dayName =
            day.dayOfWeek.charAt(0).toUpperCase() +
            day.dayOfWeek.slice(1).toLowerCase();

          return (
            <div
              key={day.dayOfWeek}
              className={`py-4 transition-colors ${
                day.isOpen ? "bg-white" : "bg-gray-50/50"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                {/* Day name */}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">
                    {dayName}
                  </p>

                  <p
                    className={`mt-0.5 text-xs ${
                      day.isOpen ? "text-green-600" : "text-gray-400"
                    }`}
                  >
                    {day.isOpen
                      ? `${day.openTime || "09:00"} – ${
                          day.closeTime || "22:00"
                        }`
                      : "Not operating"}
                  </p>
                </div>

                {/* Toggle and status */}
                <div className="flex flex-shrink-0 items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={day.isOpen}
                    aria-label={`Toggle ${dayName} opening hours`}
                    onClick={() => handleToggle(index)}
                    disabled={disabled}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      day.isOpen
                        ? "bg-green-500 shadow-sm"
                        : "bg-gray-300"
                    } ${
                      disabled
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        day.isOpen
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>

                  <span
                    className={`w-14 rounded-full px-2.5 py-1 text-center text-xs font-semibold ${
                      day.isOpen
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {day.isOpen ? "Open" : "Closed"}
                  </span>
                </div>
              </div>

              {/* Time selectors */}
              {day.isOpen && (
                <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div>
                    <label
                      htmlFor={`open-time-${index}`}
                      className="mb-1.5 block text-xs font-medium text-gray-500"
                    >
                      Opening time
                    </label>

                    <select
                      id={`open-time-${index}`}
                      value={day.openTime || ""}
                      onChange={(e) =>
                        handleTimeChange(
                          index,
                          "openTime",
                          e.target.value
                        )
                      }
                      disabled={disabled}
                      className="w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                    >
                      <option value="">Select time</option>

                      {TIME_OPTIONS_30MIN.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>

                  <span className="mt-5 text-sm font-medium text-gray-400">
                    to
                  </span>

                  <div>
                    <label
                      htmlFor={`close-time-${index}`}
                      className="mb-1.5 block text-xs font-medium text-gray-500"
                    >
                      Closing time
                    </label>

                    <select
                      id={`close-time-${index}`}
                      value={day.closeTime || ""}
                      onChange={(e) =>
                        handleTimeChange(
                          index,
                          "closeTime",
                          e.target.value
                        )
                      }
                      disabled={disabled}
                      className="w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                    >
                      <option value="">Select time</option>

                      {TIME_OPTIONS_30MIN.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Information */}
      <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
        <p className="text-xs leading-5 text-blue-700">
          Overnight operating hours are supported, such as 18:00 to
          02:00.
        </p>
      </div>
    </div>
  );}