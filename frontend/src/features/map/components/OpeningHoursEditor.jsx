import { useState, useEffect, useRef } from "react";
import { DAYS_OF_WEEK, TIME_OPTIONS_30MIN, getDefaultSchedule } from "../utils/openingHoursUtils";

function TimeDropdown({
        value,
        placeholder,
        options,
        onChange,
        disabled = false,
      }) {
        const [isOpen, setIsOpen] = useState(false);
        const dropdownRef = useRef(null);

        useEffect(() => {
          const handleOutsideClick = (event) => {
            if (
              dropdownRef.current &&
              !dropdownRef.current.contains(event.target)
            ) {
              setIsOpen(false);
            }
          };

          document.addEventListener("mousedown", handleOutsideClick);

          return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
          };
        }, []);

        return (
          <div ref={dropdownRef} className="relative w-full">
            <button
              type="button"
              disabled={disabled}
              onClick={() => setIsOpen((previous) => !previous)}
              className={`flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
                disabled
                  ? "cursor-not-allowed bg-gray-100 text-gray-400"
                  : "cursor-pointer"
              }`}
            >
              <span>{value || placeholder}</span>

              <svg
                className={`h-4 w-4 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.22 7.22a.75.75 0 011.06 0L10 10.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 8.28a.75.75 0 010-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {isOpen && !disabled && (
              <div className="absolute left-0 top-full z-[100] mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
                {/* Short list with internal scrolling */}
                <div className="max-h-36 overflow-y-auto py-1">
                  {options.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => {
                        onChange(time);
                        setIsOpen(false);
                      }}
                      className={`block w-full px-3 py-2 text-left text-sm transition hover:bg-blue-50 hover:text-blue-700 ${
                        value === time
                          ? "bg-blue-50 font-semibold text-blue-700"
                          : "text-gray-700"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }
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

                      <TimeDropdown
                      value={day.openTime || ""}
                      placeholder="Select time"
                      options={TIME_OPTIONS_30MIN}
                      disabled={disabled}
                      onChange={(time) =>
                        handleTimeChange(index, "openTime", time)
                      }
                    />
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

                      <TimeDropdown
                      value={day.closeTime || ""}
                      placeholder="Select time"
                      options={TIME_OPTIONS_30MIN}
                      disabled={disabled}
                      onChange={(time) =>
                        handleTimeChange(index, "closeTime", time)
                      }
                    />
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