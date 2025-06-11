/**
 * Converts an array of objects to a CSV string and initiates download.
 * @param {Array<Object>} data The array of objects to convert.
 * @param {string} filename The desired filename for the downloaded CSV file.
 */
export const exportDataToCsv = (data, filename = 'export.csv') => {
  if (!data || data.length === 0) {
    console.warn('No data provided to export.');
    // Optionally, alert the user or throw an error
    // alert('Não há dados para exportar.');
    return;
  }

  // Helper to escape CSV special characters
  const escapeCsvValue = (value) => {
    if (value == null) { // Handles undefined and null
      return '';
    }
    const stringValue = String(value);
    // If value contains comma, newline, or double quote, enclose in double quotes
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      // Escape double quotes within the value by doubling them
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Dynamically generate headers from the keys of the first object
  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add header row
  csvRows.push(headers.map(header => escapeCsvValue(header)).join(','));

  // Add data rows
  data.forEach(item => {
    const row = headers.map(header => escapeCsvValue(item[header]));
    csvRows.push(row.join(','));
  });

  const csvString = csvRows.join('\n');

  // Create Blob and trigger download
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url); // Clean up
};

// Example usage (can be removed or kept for testing):
/*
const sampleData = [
  { name: "Alice Smith", age: 30, city: "New York", notes: "Met at conference, interested in product X" },
  { name: "Bob Johnson", age: 24, city: "Los Angeles", notes: "Followed up; no response" },
  { name: "Carol Williams, MD", age: 45, city: "Chicago", notes: "VIP Client, handle with care" }
];
exportDataToCsv(sampleData, "sample_users.csv");
*/
