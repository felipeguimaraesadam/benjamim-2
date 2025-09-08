import React from 'react';

const MonthYearSelector = ({ value, onChange, className = '' }) => {
  const handleChange = (e) => {
    const selectedValue = e.target.value;
    if (!selectedValue) return;

    const [year, month] = selectedValue.split('-');
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    
    // Calculate last day of month
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const endDate = `${year}-${month.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

    if (onChange) {
      onChange({
        monthYear: selectedValue,
        startDate,
        endDate,
      });
    }
  };

  // Generate month options for current year and previous year
  const generateMonthOptions = () => {
    const options = [];
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];
    
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    years.forEach(year => {
      for (let month = 1; month <= 12; month++) {
        const monthValue = `${year}-${month.toString().padStart(2, '0')}`;
        const monthLabel = `${monthNames[month - 1]} ${year}`;
        options.push({ value: monthValue, label: monthLabel });
      }
    });

    return options;
  };

  const monthOptions = generateMonthOptions();

  return (
    <select
      value={value || ''}
      onChange={handleChange}
      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${className}`}
    >
      <option value="">Selecione um mês</option>
      {monthOptions.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default MonthYearSelector;