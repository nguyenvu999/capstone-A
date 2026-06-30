// Validation và utility functions cho Floor Level input
// Hỗ trợ: Basement (B1-B3) và Normal floors (1-99)

/**
 * Validate floor level input
 * @param {string} input - User input (e.g., "1", "B1", "15")
 * @returns {object} { isValid: boolean, error: string | null, normalized: string | null }
 */
export const validateFloorLevel = (input) => {
  if (!input || input.trim() === "") {
    return { isValid: false, error: "Floor level is required", normalized: null };
  }

  const trimmed = input.trim().toUpperCase();

  // Check max length
  if (trimmed.length > 2) {
    return { isValid: false, error: "Max 2 characters", normalized: null };
  }

  // Reject "0" or "00"
  if (trimmed === "0" || trimmed === "00") {
    return { isValid: false, error: "Floor level cannot be 0", normalized: null };
  }

  // Check basement format (B1, B2, B3)
  if (trimmed.startsWith("B")) {
    const basementNum = trimmed.substring(1);
    
    if (basementNum === "") {
      return { isValid: false, error: "Invalid basement format (use B1-B3)", normalized: null };
    }

    if (!/^\d+$/.test(basementNum)) {
      return { isValid: false, error: "Invalid basement format (use B1-B3)", normalized: null };
    }

    const level = parseInt(basementNum, 10);
    
    if (level < 1 || level > 3) {
      return { isValid: false, error: "Basement only supports B1 to B3", normalized: null };
    }

    return { isValid: true, error: null, normalized: `B${level}` };
  }

  // Check normal floor format (1-99)
  if (!/^\d+$/.test(trimmed)) {
    return { isValid: false, error: "Invalid format (use 1-99 or B1-B3)", normalized: null };
  }

  const floorNum = parseInt(trimmed, 10);

  if (floorNum < 1 || floorNum > 99) {
    return { isValid: false, error: "Floor must be between 1 and 99", normalized: null };
  }

  // Normalize: "01" -> "1", "05" -> "5"
  return { isValid: true, error: null, normalized: String(floorNum) };
};

/**
 * Format floor level for display
 * @param {string} floorLevel - Floor level from DB (e.g., "1", "B1")
 * @returns {string} Formatted string (e.g., "Level 1", "Level B1")
 */
export const formatFloorDisplay = (floorLevel) => {
  if (!floorLevel) return "";
  return `Level ${floorLevel}`;
};

/**
 * Sort floor levels (basement first, then ascending)
 * @param {array} floors - Array of floor level strings
 * @returns {array} Sorted array
 */
export const sortFloorLevels = (floors) => {
  return floors.sort((a, b) => {
    const aIsBasement = String(a).startsWith("B");
    const bIsBasement = String(b).startsWith("B");

    // Both basement: B3, B2, B1 (descending)
    if (aIsBasement && bIsBasement) {
      const aNum = parseInt(String(a).substring(1), 10);
      const bNum = parseInt(String(b).substring(1), 10);
      return bNum - aNum; // Descending
    }

    // a is basement, b is not -> a comes first
    if (aIsBasement && !bIsBasement) return -1;
    if (!aIsBasement && bIsBasement) return 1;

    // Both normal floors: ascending
    return parseInt(a, 10) - parseInt(b, 10);
  });
};