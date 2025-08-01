import React from 'react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'; // Alterado CalendarToday para CalendarDays

function WeekNavigator({ currentDate, onDateChange }) {
  const locale = ptBR;
  const weekStartsOn = 1; // Segunda-feira

  const currentWeekStart = startOfWeek(currentDate, { locale, weekStartsOn });
  const currentWeekEnd = endOfWeek(currentDate, { locale, weekStartsOn });

  const handlePreviousWeek = () => {
    onDateChange(subWeeks(currentWeekStart, 1));
  };

  const handleNextWeek = () => {
    onDateChange(addWeeks(currentWeekStart, 1));
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const formattedWeekRange = () => {
    const startDay = format(currentWeekStart, 'd');
    const startMonth = format(currentWeekStart, 'MMM', { locale });
    const endDay = format(currentWeekEnd, 'd');
    const endMonth = format(currentWeekEnd, 'MMM', { locale });
    const year = format(currentWeekStart, 'yyyy');

    if (startMonth === endMonth) {
      return `${startDay} - ${endDay} de ${startMonth} de ${year}`;
    }
    return `${startDay} de ${startMonth} - ${endDay} de ${endMonth} de ${year}`;
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-100 rounded-t-lg">
      <div className="flex items-center">
        <button
          onClick={handleToday}
          className="p-2 mr-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <CalendarDays size={20} className="mr-1 inline-block" />{' '}
          {/* Alterado CalendarToday para CalendarDays */}
          Hoje
        </button>
        <button
          onClick={handlePreviousWeek}
          className="p-2 text-gray-600 hover:text-gray-800 focus:outline-none"
          aria-label="Semana anterior"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={handleNextWeek}
          className="p-2 text-gray-600 hover:text-gray-800 focus:outline-none"
          aria-label="Próxima semana"
        >
          <ChevronRight size={24} />
        </button>
      </div>
      <div className="text-lg font-semibold text-gray-800">
        {formattedWeekRange()}
      </div>
      {/* Placeholder para manter o espaço à direita, pode ser removido ou usado para outros controles */}
      <div style={{ width: '136px' }}></div>
    </div>
  );
}

export default WeekNavigator;
