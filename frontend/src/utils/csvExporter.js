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
  // Using semicolon as separator for better compatibility with Excel in some regions (e.g., Brazil)
  csvRows.push(headers.map(header => escapeCsvValue(header)).join(';'));

  // Add data rows
  data.forEach(item => {
    const row = headers.map(header => escapeCsvValue(item[header]));
    csvRows.push(row.join(';'));
  });

  const csvString = csvRows.join('\r\n'); // Use CRLF for row endings

  // Create Blob and trigger download
  // Adding BOM for UTF-8 to help Excel open CSVs with special characters correctly
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvString], { type: 'text/csv;charset=utf-8;' });
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

import { formatDateToDMY } from './dateUtils'; // Ensure this path is correct relative to where dateUtils is

/**
 * Exports Payroll Report data to a CSV file.
 * Uses semicolon as delimiter and includes BOM for UTF-8 for Excel compatibility.
 * @param {Array<Object>} reportData - The report data, array of obra objects.
 * @param {string} filename - The desired filename for the CSV.
 */
export const exportPayrollReportToCSV = (reportData, filename = 'relatorio_folha_pagamento.csv') => {
  if (!reportData || reportData.length === 0) {
    console.warn('No data provided for payroll report export.');
    alert('Não há dados para exportar.');
    return;
  }

  const headers = [
    "Obra",
    "Funcionário",
    "Data Início Locação",
    "Data Fim Locação",
    "Tipo Pagamento",
    "Valor Pagamento (R$)",
    "Data Pagamento Prevista"
  ];

  // Using semicolon as a delimiter
  let csvContent = headers.join(";") + "\r\n";

  reportData.forEach(obraData => {
    if (obraData.locacoes_na_obra && obraData.locacoes_na_obra.length > 0) {
      obraData.locacoes_na_obra.forEach(loc => {
        // Helper to safely format values and escape for CSV
        const formatValue = (value, isNumeric = false) => {
          if (value === null || value === undefined) return '';
          let strValue = String(value);
          if (isNumeric) { // For numbers, use dot as decimal separator for CSV standard
            strValue = String(Number(value).toFixed(2)).replace('.', ',');
          }
          // Escape double quotes and enclose in double quotes if value contains separator, newline or quote
          if (strValue.includes(';') || strValue.includes('\n') || strValue.includes('"')) {
            return `"${strValue.replace(/"/g, '""')}"`;
          }
          return strValue;
        };

        const row = [
          formatValue(obraData.obra_nome),
          formatValue(loc.funcionario_nome || 'N/A'),
          loc.data_locacao_inicio ? formatDateToDMY(loc.data_locacao_inicio) : '',
          loc.data_locacao_fim ? formatDateToDMY(loc.data_locacao_fim) : '',
          formatValue(loc.tipo_pagamento || 'N/A'),
          // For currency, ensure it's a string that Excel can interpret as a number if needed,
          // or keep it as a formatted string like in the UI.
          // Using toLocaleString might introduce currency symbols or different decimal separators
          // depending on locale, which might not be ideal for raw CSV data.
          // Standardizing to a dot decimal for data, or comma if target is pt-BR Excel.
          String(parseFloat(loc.valor_pagamento).toFixed(2)).replace('.', ','), // pt-BR Excel likes comma
          loc.data_pagamento ? formatDateToDMY(loc.data_pagamento) : ''
        ];
        csvContent += row.join(";") + "\r\n";
      });
    }
    // Optional: Obra Total Row
    const obraTotalRow = [
        `"Total para ${obraData.obra_nome.replace(/"/g, '""')}"`,
        "", "", "", "", // Empty cells
        String(parseFloat(obraData.total_a_pagar_na_obra_periodo).toFixed(2)).replace('.', ','),
        ""
    ];
    csvContent += obraTotalRow.join(";") + "\r\n";
    csvContent += "\r\n"; // Add an empty line between obras for readability
  });

  // Optional: Grand Total Row
  const grandTotal = reportData.reduce((sum, obra) => sum + parseFloat(obra.total_a_pagar_na_obra_periodo), 0);
  const grandTotalRow = [
    "TOTAL GERAL DO RELATÓRIO", "", "", "", "",
    String(grandTotal.toFixed(2)).replace('.', ','),
    ""
  ];
  csvContent += grandTotalRow.join(";") + "\r\n";

  // Adding BOM for UTF-8 to help Excel open CSVs with special characters correctly
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};
