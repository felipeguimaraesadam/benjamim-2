import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDroppable } from '@dnd-kit/core';
import { PlusCircle } from 'lucide-react';

function DayColumn({
  id,
  date,
  items,
  renderItem,
  onAddItem,
  onItemClick,
  onShowContextMenu,
  activeDragItemId,
  addItemText = 'Adicionar Item',
  noItemsText = 'Nenhum item agendado.',
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  const dayName = format(date, 'EEEE', { locale: ptBR });
  const dayMonth = format(date, 'dd/MM');

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col h-full min-h-[400px] rounded-lg shadow-md ${isOver ? 'bg-indigo-100' : 'bg-gray-50'}`}
    >
      <div className="p-2.5 sticky top-0 bg-gray-100 rounded-t-lg shadow z-10 border-b border-gray-200">
        <h4 className="text-md font-semibold text-center text-gray-700">
          {dayName.charAt(0).toUpperCase() + dayName.slice(1)}
        </h4>
        <p className="text-sm text-center text-gray-500">{dayMonth}</p>
      </div>

      <div className="p-2 border-b border-gray-200">
        <button
          onClick={() => onAddItem(id)}
          className="w-full flex items-center justify-center p-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-md border border-dashed border-indigo-400 hover:border-indigo-600 transition-colors"
        >
          <PlusCircle size={18} className="mr-2" />
          {addItemText}
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-2 space-y-2">
        {items && items.length > 0 ? (
          items.map(item => renderItem(item, item.id === activeDragItemId))
        ) : (
          <div className="text-center text-sm text-gray-400 pt-4">
            {noItemsText}
          </div>
        )}
      </div>
    </div>
  );
}

export default DayColumn;
