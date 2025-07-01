import React, { useRef, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { User, Users, Wrench } from 'lucide-react';

// Props esperadas:
// locacao: { id, tipo, recurso_nome, valor_pagamento, ...outros dados se necessário }
// onCardClick: função para abrir o modal de detalhes, passando o locacao.id
// onShowContextMenu: função para mostrar o menu de contexto. (locacaoId, event) => void

const LONG_PRESS_DURATION = 500;
const DRAG_THRESHOLD = 5; // pixels

function RentalCard({ locacao, onCardClick, onShowContextMenu }) {
  const { id, tipo, recurso_nome, valor_pagamento } = locacao;

  const timerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const longPressOrDragHappenedRef = useRef(false);
  const mouseDownPositionRef = useRef({ x: 0, y: 0 });

  const { attributes, listeners, setNodeRef, transform, isDragging: dndIsDragging } = useDraggable({
    id: `rental-${id}`,
    data: { locacao },
  });

  // Reset refs when dndIsDragging changes from true to false (drag end)
  useEffect(() => {
    if (!dndIsDragging) {
      isDraggingRef.current = false;
      // longPressOrDragHappenedRef is reset onMouseUp
    }
  }, [dndIsDragging]);

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: dndIsDragging ? 1000 : 'auto',
    cursor: dndIsDragging ? 'grabbing' : 'grab',
  } : {
    cursor: 'grab',
  };

  let IconComponent;
  let cardColor = 'bg-gray-100';
  let textColor = 'text-gray-800';
  let borderColor = 'border-gray-300';

  if (tipo === 'funcionario') {
    IconComponent = User;
    cardColor = 'bg-blue-100 hover:bg-blue-200';
    textColor = 'text-blue-800';
    borderColor = 'border-blue-400';
  } else if (tipo === 'equipe') {
    IconComponent = Users;
    cardColor = 'bg-green-100 hover:bg-green-200';
    textColor = 'text-green-800';
    borderColor = 'border-green-400';
  } else if (tipo === 'servico_externo') {
    IconComponent = Wrench;
    cardColor = 'bg-orange-100 hover:bg-orange-200';
    textColor = 'text-orange-800';
    borderColor = 'border-orange-400';
  }

  const handleMouseDown = (event) => {
    // Ignore if not left click
    if (event.button !== 0) return;

    isDraggingRef.current = false;
    longPressOrDragHappenedRef.current = false;
    mouseDownPositionRef.current = { x: event.clientX, y: event.clientY };

    timerRef.current = setTimeout(() => {
      if (!isDraggingRef.current && onShowContextMenu) {
        longPressOrDragHappenedRef.current = true;
        onShowContextMenu(id, event);
      }
    }, LONG_PRESS_DURATION);
  };

  const handleMouseUp = (event) => {
    // Ignore if not left click
    if (event.button !== 0) return;

    clearTimeout(timerRef.current);
    timerRef.current = null;
    // Do not reset longPressOrDragHappenedRef here, it's used by handleClick
    // isDraggingRef is reset by dnd-kit or handleMouseMove if drag didn't start
  };

  const handleMouseMove = (event) => {
    if (timerRef.current || dndIsDragging) { // Only check if timer is active or dnd is already dragging
      const deltaX = Math.abs(event.clientX - mouseDownPositionRef.current.x);
      const deltaY = Math.abs(event.clientY - mouseDownPositionRef.current.y);

      if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
        isDraggingRef.current = true;
        longPressOrDragHappenedRef.current = true; // A drag implies the long press/drag flag
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleClick = (event) => {
    // This click is part of the dnd-kit listeners, so it might fire after drag
    // We rely on longPressOrDragHappenedRef which is set by our mouse listeners or dndIsDragging effect
    if (dndIsDragging || isDraggingRef.current) { // If dnd is active or our local drag detection is true
      longPressOrDragHappenedRef.current = true;
    }

    if (!longPressOrDragHappenedRef.current && onCardClick) {
      onCardClick(id);
    }
    // Reset for next interaction cycle, typically after mouseup would have cleared timer
    // Needs to be reset here for cases where click happens without a full mouseup/down cycle (e.g. programmatic click or edge cases)
    // However, mouseUp should be the primary point for resetting for the next full interaction.
    // Let's ensure it's reset after any click processing.
    // setTimeout is used to ensure this reset happens after any potential event propagation for this click.
    setTimeout(() => {
        longPressOrDragHappenedRef.current = false;
        isDraggingRef.current = false; // also reset isDraggingRef
    }, 0);
  };

  const handleContextMenu = (event) => {
    event.preventDefault();
    if (onShowContextMenu) {
      onShowContextMenu(id, event);
    }
  };


  // Combine dnd-kit listeners with our custom mouse event handlers
  // Our handlers (handleMouseDown, handleMouseUp, handleMouseMove) are for long-press detection.
  // dnd-kit listeners are for drag and drop.
  // onClick is for regular clicks.
  // onContextMenu is for right-clicks.
  const combinedListeners = {
    ...listeners, // dnd-kit's drag listeners
    onMouseDown: (e) => {
      listeners.onMouseDown(e); // Call dnd-kit's onMouseDown
      handleMouseDown(e);     // Call our onMouseDown
    },
    onMouseUp: (e) => {
      // dnd-kit doesn't have onMouseUp in its listeners object directly.
      // It handles mouseup internally. We add our own for clearing timers.
      handleMouseUp(e);
    },
    onMouseMove: (e) => {
      // dnd-kit doesn't have onMouseMove in its listeners object directly for the draggable element.
      // It's handled at the DndContext level. We add our own for drag detection for long press cancellation.
      handleMouseMove(e);
    },
    // onClick is handled separately via the prop
    onContextMenu: handleContextMenu, // For right-click
  };


  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes} // dnd-kit's attributes (e.g. role, aria-pressed)
      {...combinedListeners} // Our combined event handlers
      onClick={handleClick} // Regular click handler
      className={`p-2 m-1 border rounded-lg shadow-sm transition-all duration-150 ease-in-out ${cardColor} ${textColor} ${borderColor} ${dndIsDragging ? 'opacity-75 shadow-xl' : 'shadow-md'}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault(); // Prevent scrolling if space is pressed
          handleClick(e);
        }
        // Consider adding context menu key support (e.g., Shift+F10 or Menu key)
        // if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
        //   e.preventDefault();
        //   handleContextMenu(e); // This would need coordinates, maybe center of element?
        // }
      }}
    >
      <div className="flex items-center mb-1">
        {IconComponent && <IconComponent size={18} className="mr-2 flex-shrink-0" />}
        <span className="font-semibold text-sm truncate" title={recurso_nome}>{recurso_nome}</span>
      </div>
      {valor_pagamento != null && (
        <div className="text-xs">
          Valor: {Number(valor_pagamento).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>
      )}
    </div>
  );
}

export default RentalCard;
