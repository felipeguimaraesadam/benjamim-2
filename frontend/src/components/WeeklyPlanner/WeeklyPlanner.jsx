import React from 'react';
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import WeekNavigator from './WeekNavigator';
import DayColumn from './DayColumn';
import { DndContext, DragOverlay } from '@dnd-kit/core';

function WeeklyPlanner({
  currentDate,
  onDateChange,
  itemsPorDia,
  sidebarData,
  isLoading,
  error,
  // Callbacks for interactions
  onItemClick,
  onDayClick,
  onItemContextMenu,
  onAddItem,
  // Render props for customization
  renderItemCard,
  renderSidebar,
  addItemText,
  noItemsText,
  // Drag and Drop handlers provided by parent
  activeDragId,
  activeItem,
  onDragStart,
  onDragEnd,
  onDragCancel,
}) {
  const locale = ptBR;
  const weekStartsOn = 1; // Monday

  const weekStart = startOfWeek(currentDate, { locale, weekStartsOn });
  const daysOfWeek = eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(currentDate, { locale, weekStartsOn }),
  });

  return (
    <DndContext
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div className="p-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
        <WeekNavigator
          currentDate={currentDate}
          onDateChange={onDateChange}
        />

        {isLoading && (
          <div className="text-center p-4 text-gray-600 dark:text-gray-300">
            Carregando dados da semana...
          </div>
        )}
        {error && (
          <div className="text-center p-4 text-red-600 dark:text-red-400">
            Erro: {error}
          </div>
        )}

        {!isLoading && !error && (
          <div className="flex mt-4 overflow-x-auto pb-4 h-full flex-grow">
            {daysOfWeek.map(day => {
              const formattedDayId = format(day, 'yyyy-MM-dd');
              return (
                <div
                  key={formattedDayId}
                  className="flex-1 min-w-[180px] sm:min-w-[200px] md:min-w-[210px]"
                >
                  <DayColumn
                    id={formattedDayId}
                    date={day}
                    items={itemsPorDia[formattedDayId] || []}
                    renderItem={renderItemCard}
                    onAddItem={onAddItem}
                    onItemClick={onItemClick}
                    onShowContextMenu={onItemContextMenu}
                    activeDragItemId={activeDragId}
                    addItemText={addItemText}
                    noItemsText={noItemsText}
                  />
                </div>
              );
            })}

            {renderSidebar && renderSidebar(sidebarData)}
          </div>
        )}

        <DragOverlay dropAnimation={null}>
          {activeDragId && activeItem ? renderItemCard(activeItem, true) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}

export default WeeklyPlanner;
