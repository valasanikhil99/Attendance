/**
 * Returns today's date in YYYY-MM-DD format (local time)
 */
export const getTodayDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns day index (0 = Sunday ... 6 = Saturday)
 * from a YYYY-MM-DD string using local time.
 */
export const getDayIndex = (dateStr?: string): number => {
  // Default to today
  if (!dateStr) {
    return new Date().getDay();
  }

  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    return new Date().getDay();
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  // Validate ranges
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 || month > 12 ||
    day < 1 || day > 31
  ) {
    return new Date().getDay();
  }

  const date = new Date(year, month - 1, day);

  // Extra guard against invalid dates like 2025-02-31
  if (isNaN(date.getTime())) {
    return new Date().getDay();
  }

  return date.getDay();
};

/**
 * Returns day name from index
 */
export const getDayName = (dayIndex: number): string => {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ];

  return days[dayIndex] ?? 'Unknown';
};
