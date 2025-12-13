export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDayIndex = (dateStr: string): number => {
  if (!dateStr) return 0;
  
  // Parse YYYY-MM-DD explicitly to construct local date
  // This avoids the 'new Date(string)' behavior which treats hyphens as UTC,
  // potentially shifting the day backwards in Western timezones.
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date().getDay();
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  
  const date = new Date(year, month - 1, day);
  return date.getDay();
};

export const getDayName = (dayIndex: number): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex] || '';
};