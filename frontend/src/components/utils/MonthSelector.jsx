import React, { useState, useEffect } from 'react';

/**
 * Componente Seletor de Mês.
 * Permite ao usuário selecionar um mês/ano e notifica o componente pai
 * com as datas de início e fim do mês selecionado.
 *
 * @param {object} props - As propriedades do componente.
 * @param {string} props.value - O valor atual do seletor no formato "YYYY-MM".
 * @param {function} props.onChange - Função chamada quando o mês é alterado.
 *                                    Recebe um objeto { startDate: "YYYY-MM-01", endDate: "YYYY-MM-DD" }.
 * @param {string} [props.id] - ID opcional para o input.
 * @param {string} [props.name] - Name opcional para o input.
 * @param {string} [props.className] - Classes CSS opcionais para o input.
 */
const MonthSelector = ({ value, onChange, id, name, className }) => {
  const [currentMonthYear, setCurrentMonthYear] = useState('');

  useEffect(() => {
    if (value) {
      setCurrentMonthYear(value);
    } else {
      // Define o valor padrão para o mês e ano atuais se nenhum valor for passado
      const today = new Date();
      const year = today.getFullYear();
      const month = (today.getMonth() + 1).toString().padStart(2, '0'); // Janeiro é 0
      const defaultMonthYear = `${year}-${month}`;
      setCurrentMonthYear(defaultMonthYear);
      // Chama onChange com as datas do mês padrão para inicializar no pai, se necessário
      handleDateChange(defaultMonthYear);
    }
  }, [value]); // Reage a mudanças no valor vindo do pai

  const handleInputChange = event => {
    const newMonthYear = event.target.value;
    setCurrentMonthYear(newMonthYear);
    handleDateChange(newMonthYear);
  };

  const handleDateChange = monthYear => {
    if (monthYear) {
      const [year, month] = monthYear.split('-').map(Number);
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0); // Dia 0 do próximo mês é o último dia do mês atual

      const formatDate = date => {
        const d = new Date(date);
        let day = '' + d.getDate();
        let mo = '' + (d.getMonth() + 1);
        const y = d.getFullYear();

        if (mo.length < 2) mo = '0' + mo;
        if (day.length < 2) day = '0' + day;

        return [y, mo, day].join('-');
      };

      onChange({
        startDate: formatDate(firstDay),
        endDate: formatDate(lastDay),
        monthYear: monthYear, // Também retorna o valor YYYY-MM para o input
      });
    }
  };

  return (
    <input
      type="month"
      id={id}
      name={name}
      value={currentMonthYear}
      onChange={handleInputChange}
      className={`mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${className || ''}`}
    />
  );
};

export default MonthSelector;
