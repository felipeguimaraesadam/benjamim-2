import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { format, isToday, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus } from 'lucide-react';
import CompraCard from './CompraCard';
import SpinnerIcon from '../utils/SpinnerIcon';

const ComprasDayColumn = ({
  date,
  compras,
  onAddCompra,
  onCompraClick,
  onContextMenu,
  isLoading,
}) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  const { isOver, setNodeRef } = useDroppable({
    id: dateStr,
  });

  const handleAddCompraClick = () => {
    onAddCompra(date);
  };

  const handleCompraClick = (compraId) => {
    onCompraClick(compraId);
  };

  const handleCompraContextMenu = (event, compraId) => {
    onContextMenu(event, compraId);
  };

  const dayName = format(date, 'EEEE', { locale: ptBR });
  const dayNumber = format(date, 'd');
  const monthName = format(date, 'MMM', { locale: ptBR });

  const isCurrentDay = isToday(date);
  const totalValue = compras.reduce((sum, compra) => sum + (parseFloat(compra.valor_total) || 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col h-full min-h-[500px] border border-gray-200 dark:border-gray-700 rounded-lg
        bg-white dark:bg-gray-800 transition-colors duration-200
        ${isOver ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600' : ''}
        ${isCurrentDay ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}
      `}
    >
      {/* Cabeçalho do Dia */}
      <div className={`
        p-3 border-b border-gray-200 dark:border-gray-700 rounded-t-lg
        ${isCurrentDay ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-gray-50 dark:bg-gray-700'}
      `}>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              {dayName}
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`
                text-lg font-bold
                ${isCurrentDay ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}
              `}>
                {dayNumber}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {monthName}
              </span>
            </div>
          </div>
          <button
            onClick={handleAddCompraClick}
            className="
              p-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400
              hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1
            "
            title="Adicionar compra"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        {/* Total do Dia */}
        {compras.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Total: <span className="font-semibold text-green-600 dark:text-green-400">
                {totalValue.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {compras.length} compra{compras.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      {/* Lista de Compras */}
      <div className="flex-1 p-2 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-20">
            <SpinnerIcon className="w-5 h-5 text-primary-600" />
          </div>
        ) : (
          <div className="space-y-2">
            {compras.map(compra => (
              <CompraCard
                key={compra.id}
                compra={compra}
                onClick={() => handleCompraClick(compra.id)}
                onContextMenu={(event) => handleCompraContextMenu(event, compra.id)}
              />
            ))}
            
            {compras.length === 0 && (
              <div className="flex flex-col items-center justify-center h-20 text-gray-400 dark:text-gray-500">
                <div className="text-sm text-center">
                  Nenhuma compra
                </div>
                <div className="text-xs text-center mt-1">
                  Clique em + para adicionar
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Indicador de Drop Zone */}
      {isOver && (
        <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 border-2 border-dashed border-blue-400 dark:border-blue-500 rounded-lg flex items-center justify-center">
          <div className="text-blue-600 dark:text-blue-400 font-medium text-sm">
            Solte aqui para mover
          </div>
        </div>
      )}
    </div>
  );
};

export default ComprasDayColumn;