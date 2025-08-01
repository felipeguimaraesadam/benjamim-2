// frontend/src/utils/dateUtils.js
export const formatDateToDMY = dateString => {
  if (!dateString) return 'N/A';
  // dateString is expected to be 'YYYY-MM-DD' or a full ISO string from which date part can be extracted.
  // If it's a full ISO string, let's ensure we only take the date part first.
  const actualDateString = dateString.split('T')[0];

  const parts = actualDateString.split('-');
  if (parts.length === 3) {
    // const year = parseInt(parts[0], 10);
    // const month = parseInt(parts[1], 10);
    // const day = parseInt(parts[2], 10);
    // if (isNaN(year) || isNaN(month) || isNaN(day)) return actualDateString; // or 'Invalid Date'
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return actualDateString; // Fallback for unexpected format
};

export const getStartOfWeek = (date, startDay = 1) => {
  // startDay: 1 for Monday, 0 for Sunday
  const d = new Date(date);
  d.setHours(0, 0, 0, 0); // Normalize time to start of day to avoid DST issues with setDate
  const day = d.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6

  // Calculate difference to the target startDay
  let diff = day - startDay;
  if (diff < 0) {
    diff += 7; // If current day is before startDay (e.g. Sunday (0) and startDay is Monday (1)), move to previous week
  }

  d.setDate(d.getDate() - diff);
  return d;
};

export const formatDateToYYYYMMDD = date => {
  if (!date) return '';
  // Ensure 'date' is a Date object. If it's a string, convert it.
  // Be mindful of timezone: new Date('YYYY-MM-DD') can parse as UTC.
  // If 'date' is already a Date object, this is fine.
  const d = date instanceof Date ? new Date(date.valueOf()) : new Date(date);

  // To prevent timezone shifts when only date is relevant, use UTC methods for date parts
  // if the input 'date' could be a string like 'YYYY-MM-DD' interpreted as UTC.
  // However, since getStartOfWeek returns a local Date object, using local getFullYear etc. is okay here.
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const dayString = String(d.getDate()).padStart(2, '0'); // Renamed to avoid conflict
  return `${year}-${month}-${dayString}`;
};
