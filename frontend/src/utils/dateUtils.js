// frontend/src/utils/dateUtils.js
export const formatDateToDMY = (dateString) => {
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
