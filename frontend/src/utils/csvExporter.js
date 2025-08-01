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
  const escapeCsvValue = value => {
    if (value == null) {
      // Handles undefined and null
      return '';
    }
    const stringValue = String(value);
    // If value contains comma, newline, or double quote, enclose in double quotes
    if (
      stringValue.includes(',') ||
      stringValue.includes('\n') ||
      stringValue.includes('"')
    ) {
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
export const exportPayrollReportToCSV = (
  reportData,
  filename = 'relatorio_folha_pagamento.csv'
) => {
  if (!reportData || reportData.length === 0) {
    console.warn('No data provided for payroll report export.');
    alert('Não há dados para exportar.');
    return;
  }

  const headers = [
    'Obra',
    'Data Específica do Relatório',
    'Recurso Locado',
    'Tipo Pagamento',
    'Valor Atribuído ao Dia (R$)',
    'Valor Total Original da Locação (R$)',
    'Data Início Locação Original',
    'Data Fim Locação Original',
    'Data Pagamento Prevista',
  ];

  let csvContent = headers.join(';') + '\r\n';

  // Helper to safely format values and escape for CSV
  const formatValue = value => {
    if (value === null || value === undefined) return '';
    let strValue = String(value);
    // Escape double quotes and enclose in double quotes if value contains separator, newline or quote
    if (
      strValue.includes(';') ||
      strValue.includes('\n') ||
      strValue.includes('"')
    ) {
      return `"${strValue.replace(/"/g, '""')}"`;
    }
    return strValue;
  };

  const formatCurrencyForCSV = value => {
    if (value === null || value === undefined) return '';
    return String(parseFloat(value).toFixed(2)).replace('.', ',');
  };

  reportData.forEach(obraData => {
    csvContent += `"${formatValue(obraData.obra_nome)}";;;;;;;\r\n`; // Obra Name Header Row

    if (obraData.dias && obraData.dias.length > 0) {
      obraData.dias.forEach(diaData => {
        // Daily summary row (optional, can be commented out if too much detail)
        // csvContent += `;"Data: ${formatDateToDMY(diaData.data)}";"Total Dia:";"${formatCurrencyForCSV(diaData.total_dia_obra)}";;;;;\r\n`;

        if (diaData.locacoes_no_dia && diaData.locacoes_no_dia.length > 0) {
          diaData.locacoes_no_dia.forEach(loc => {
            const row = [
              `"${formatValue(obraData.obra_nome)}"`, // Repeat Obra for each locacao row for easier filtering in Excel
              formatDateToDMY(diaData.data),
              formatValue(loc.recurso_nome),
              formatValue(loc.tipo_pagamento_display),
              formatCurrencyForCSV(loc.valor_diario_atribuido),
              formatCurrencyForCSV(loc.valor_pagamento_total_locacao),
              formatDateToDMY(loc.data_locacao_original_inicio),
              formatDateToDMY(loc.data_locacao_original_fim),
              loc.data_pagamento_prevista
                ? formatDateToDMY(loc.data_pagamento_prevista)
                : '',
            ];
            csvContent += row.join(';') + '\r\n';
          });
        }
        // Daily total row
        csvContent += `;"Total Dia ${formatDateToDMY(diaData.data)}";"";"";"${formatCurrencyForCSV(diaData.total_dia_obra)}";"";"";"";""\r\n`;
      });
    }
    // Obra Total Row
    const obraTotalRow = [
      `"Total para ${formatValue(obraData.obra_nome)}"`,
      '',
      '',
      '',
      '', // Empty cells
      formatCurrencyForCSV(obraData.total_obra_periodo), // Total obra
      '',
      '',
      '',
    ];
    csvContent += obraTotalRow.join(';') + '\r\n';
    csvContent += '\r\n'; // Add an empty line between obras for readability
  });

  // Grand Total Row
  const grandTotal = reportData.reduce(
    (sum, obra) => sum + parseFloat(obra.total_obra_periodo),
    0
  );
  const grandTotalRow = [
    'TOTAL GERAL DO RELATÓRIO',
    '',
    '',
    '',
    '',
    String(grandTotal.toFixed(2)).replace('.', ','),
    '',
  ];
  csvContent += grandTotalRow.join(';') + '\r\n';

  // Adding BOM for UTF-8 to help Excel open CSVs with special characters correctly
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  const link = document.createElement('a');

  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

// Helper to safely format values and escape for CSV, used by Material Payments Report
const formatCsvValue = value => {
  if (value === null || value === undefined) return '';
  let strValue = String(value);
  if (
    strValue.includes(';') ||
    strValue.includes('\n') ||
    strValue.includes('"')
  ) {
    return `"${strValue.replace(/"/g, '""')}"`;
  }
  return strValue;
};

export const exportMaterialPaymentsReportToCSV = (
  reportPayload,
  filename = 'relatorio_pagamento_materiais.csv'
) => {
  if (
    !reportPayload ||
    !reportPayload.report_data ||
    reportPayload.report_data.length === 0
  ) {
    alert('Não há dados para exportar.');
    return;
  }
  const obrasData = reportPayload.report_data;

  const headers = [
    'Obra',
    'Fornecedor',
    'ID Compra',
    'Data Compra',
    'Data Pagamento',
    'Nota Fiscal',
    'Valor Líquido Pago (R$)',
  ];

  let csvRows = [headers.join(';')];

  obrasData.forEach(obra => {
    obra.fornecedores.forEach(fornecedor => {
      fornecedor.compras_a_pagar.forEach(compra => {
        const row = [
          formatCsvValue(obra.obra_nome),
          formatCsvValue(fornecedor.fornecedor_nome),
          compra.id,
          compra.data_compra ? formatDateToDMY(compra.data_compra) : '',
          compra.data_pagamento ? formatDateToDMY(compra.data_pagamento) : '', // This is data_pagamento from Compra itself
          formatCsvValue(compra.nota_fiscal),
          String(parseFloat(compra.valor_total_liquido).toFixed(2)).replace(
            '.',
            ','
          ),
        ];
        csvRows.push(row.join(';'));
      });
    });
  });

  // Add totals at the end
  csvRows.push(''); // Blank line
  obrasData.forEach(obra => {
    obra.fornecedores.forEach(fornecedor => {
      csvRows.push(
        `Total para ${formatCsvValue(obra.obra_nome)} - ${formatCsvValue(fornecedor.fornecedor_nome)};;;;;;${String(parseFloat(fornecedor.total_fornecedor_na_obra).toFixed(2)).replace('.', ',')}`
      );
    });
    csvRows.push(
      `Total Geral para Obra ${formatCsvValue(obra.obra_nome)};;;;;;${String(parseFloat(obra.total_obra).toFixed(2)).replace('.', ',')}`
    );
    csvRows.push(''); // Blank line
  });
  csvRows.push(
    `TOTAL GERAL DO RELATÓRIO;;;;;;${String(parseFloat(reportPayload.total_geral_relatorio).toFixed(2)).replace('.', ',')}`
  );

  const bom = '\uFEFF';
  const csvString = csvRows.join('\r\n');
  const blob = new Blob([bom + csvString], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};
