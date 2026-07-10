export const DAYS_OF_WEEK = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY"
];

export const TIME_OPTIONS_30MIN = (() => {
  const options = [];
  for (let h = 0; h < 24; h++) {
    options.push(`${String(h).padStart(2, '0')}:00`);
    options.push(`${String(h).padStart(2, '0')}:30`);
  }
  return options;
})();

// ===== DEFAULT SCHEDULE =====

export const getDefaultSchedule = () => {
  return DAYS_OF_WEEK.map(day => ({
    dayOfWeek: day,
    isOpen: false,
    openTime: null,
    closeTime: null
  }));
};

// ===== VALIDATION =====

export const validateOpeningHours = (schedule) => {
  const errors = [];

  schedule.forEach((day, index) => {
    if (!day.isOpen) return; // Closed day không cần validate

    if (!day.openTime || !day.closeTime) {
      errors.push({
        day: day.dayOfWeek,
        message: "Opening time and closing time are required when day is open"
      });
      return;
    }

    if (day.openTime === day.closeTime) {
      errors.push({
        day: day.dayOfWeek,
        message: "Opening time and closing time cannot be identical"
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

// ===== TIME UTILITIES =====

// Convert "HH:MM" to minutes since midnight
const timeToMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

// Check if a time falls within an interval (supports overnight)
export const isTimeInInterval = (currentTime, openTime, closeTime) => {
  const current = timeToMinutes(currentTime);
  const open = timeToMinutes(openTime);
  const close = timeToMinutes(closeTime);

  if (close > open) {
    // Normal interval: 10:00 - 23:00
    return current >= open && current < close;
  } else {
    // Overnight: 18:00 - 02:00
    return current >= open || current < close;
  }
};

// Check if place is open now
export const isPlaceOpenNow = (openingHours) => {
  if (!openingHours || !Array.isArray(openingHours) || openingHours.length === 0) {
    return null; // Unknown
  }

  const now = new Date();
  const currentDayIndex = (now.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // Check current day
  const todaySchedule = openingHours[currentDayIndex];
  if (!todaySchedule) return null;

  if (!todaySchedule.isOpen) {
    // Today is closed, check if it's overnight from yesterday
    const yesterdayIndex = (currentDayIndex - 1 + 7) % 7;
    const yesterdaySchedule = openingHours[yesterdayIndex];

    if (yesterdaySchedule && yesterdaySchedule.isOpen) {
      const closeMinutes = timeToMinutes(yesterdaySchedule.closeTime);
      const openMinutes = timeToMinutes(yesterdaySchedule.openTime);

      if (closeMinutes < openMinutes) {
        // Yesterday was overnight schedule
        const currentMinutes = timeToMinutes(currentTime);
        if (currentMinutes < closeMinutes) {
          return true; // Still open from yesterday
        }
      }
    }

    return false;
  }

  // Today is open
  return isTimeInInterval(currentTime, todaySchedule.openTime, todaySchedule.closeTime);
};

// Check if place schedule covers a requested interval for a specific day
export const doesScheduleCoverInterval = (placeSchedule, requestedOpen, requestedClose) => {
  if (!placeSchedule || !placeSchedule.isOpen) return false;
  if (!placeSchedule.openTime || !placeSchedule.closeTime) return false;

  const placeOpen = timeToMinutes(placeSchedule.openTime);
  const placeClose = timeToMinutes(placeSchedule.closeTime);
  const reqOpen = timeToMinutes(requestedOpen);
  const reqClose = timeToMinutes(requestedClose);

  // Determine if schedules are overnight
  const placeIsOvernight = placeClose < placeOpen;
  const reqIsOvernight = reqClose < reqOpen;

  if (!placeIsOvernight && !reqIsOvernight) {
    // Both normal: place must start <= requested start AND end >= requested end
    return placeOpen <= reqOpen && placeClose >= reqClose;
  }

  if (placeIsOvernight && reqIsOvernight) {
    // Both overnight: place must start <= requested start OR end >= requested end
    return placeOpen <= reqOpen && placeClose >= reqClose;
  }

  if (placeIsOvernight && !reqIsOvernight) {
    // Place overnight, request normal
    // Request must fit entirely within the overnight window
    // This is complex - check if request fits in the "after midnight" part OR "before midnight" part
    if (reqOpen >= placeOpen) {
      // Request starts in evening portion
      return true; // Any normal interval starting after place opens fits
    }
    if (reqClose <= placeClose) {
      // Request ends in morning portion
      return true;
    }
    return false;
  }

  // Place normal, request overnight - impossible to satisfy
  return false;
};

// Format for display
export const formatOpeningHours = (schedule) => {
  if (!schedule || !Array.isArray(schedule)) return [];

  return schedule.map(day => {
    if (!day.isOpen) {
      return {
        day: day.dayOfWeek,
        display: "Closed"
      };
    }

    const isOvernight = timeToMinutes(day.closeTime) < timeToMinutes(day.openTime);

    return {
      day: day.dayOfWeek,
      display: isOvernight
        ? `${day.openTime} - ${day.closeTime} (next day)`
        : `${day.openTime} - ${day.closeTime}`
    };
  });
};

// Get current status text
export const getOpeningStatusText = (openingHours) => {
  const status = isPlaceOpenNow(openingHours);
  if (status === null) return "Hours not available";
  return status ? "Open now" : "Closed now";
};

// Get status color
export const getOpeningStatusColor = (openingHours) => {
  const status = isPlaceOpenNow(openingHours);
  if (status === null) return "text-gray-500";
  return status ? "text-green-600" : "text-red-600";
};