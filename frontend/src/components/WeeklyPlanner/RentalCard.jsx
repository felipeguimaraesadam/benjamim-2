import React, { useRef, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { User, Users, Wrench } from 'lucide-react';

// Props esperadas:
// locacao: { id, tipo, recurso_nome, valor_pagamento, ...outros dados se necessário }
// onCardClick: função para abrir o modal de detalhes, passando o locacao.id
// onShowContextMenu: função para mostrar o menu de contexto. (locacaoId, event) => void

const LONG_PRESS_DURATION = 500;
const DRAG_THRESHOLD = 5; // pixels

// activeDragItemId: ID of the item currently being dragged in the overlay (passed from WeeklyPlanner)
// isDraggingOverlay: boolean, true if this card instance is rendered inside DragOverlay
function RentalCard({
  locacao,
  onCardClick,
  onShowContextMenu,
  activeDragItemId = null, // ID of the globally dragged item
  isDraggingOverlay = false // Is this instance for the overlay?
}) {
  const { id, tipo, recurso_nome, valor_pagamento } = locacao;
  const draggableId = `rental-${id}`;

  const timerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const longPressOrDragHappenedRef = useRef(false);
  const mouseDownPositionRef = useRef({ x: 0, y: 0 });

  // Only setup draggable if not in overlay
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: dndIsDragging
  } = useDraggable({
    id: draggableId,
    data: { locacao },
    disabled: isDraggingOverlay, // Disable if this card is for the overlay
  });

  // Determine if the original source item is being dragged
  const isSourceItemDragging = dndIsDragging && draggableId === activeDragItemId;

  useEffect(() => {
    if (!isDraggingOverlay && !dndIsDragging) {
      isDraggingRef.current = false;
    }
  }, [dndIsDragging, isDraggingOverlay]);

  let style = {};
  if (isDraggingOverlay) {
    // Style for the card in the DragOverlay
    // The DragOverlay handles transform. We just need visual styles.
    style = {
      cursor: 'grabbing',
      zIndex: 9999, // Ensure overlay card is on top
      // Opacity can be full here, or match the source item's dragging opacity if preferred
      // opacity: 0.75, // Example: if you want the overlay to also be slightly transparent
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', // Example shadow
    };
  } else {
    // Style for the original card
    style = transform ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      zIndex: isSourceItemDragging ? 9999 : 'auto',
      cursor: isSourceItemDragging ? 'grabbing' : 'grab',
      visibility: isSourceItemDragging ? 'hidden' : 'visible', // Hide original when it's being dragged via overlay
    } : {
      cursor: 'grab',
      visibility: 'visible',
    };
  }

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
  // dnd-kit listeners should be spread directly.
  // Our custom handlers will also be on the div.
  // React calls event handlers in order if multiple are attached to the same event type on an element,
  // but for clarity and to ensure dnd-kit's internal logic isn't disrupted,
  // we will call our custom handlers from within dnd-kit's, if dnd-kit provides them,
  // or attach them separately if not.
  // However, the error indicates `listeners.onMouseDown` is not a function to be called.
  // The most robust way is to spread dnd-kit's listeners and then add our own.
  // React will invoke both if they are separate props.

  // Do not attach interactive handlers if this card is in the overlay
  const eventHandlers = isDraggingOverlay ? {} : {
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    onMouseMove: handleMouseMove,
    onClick: handleClick,
    onContextMenu: handleContextMenu,
    ...listeners, // dnd-kit listeners only for the source item
  };

  // Determine class names, applying opacity if it's the source item being dragged
  const currentDndIsDragging = !isDraggingOverlay && dndIsDragging && draggableId === activeDragItemId;
  const opacityClass = currentDndIsDragging ? 'opacity-50' : ''; // Or use style.visibility for complete hiding

  // If using visibility: 'hidden' for the source item, we don't need opacityClass.
  // The style object already sets visibility: 'hidden' for isSourceItemDragging.
  // So, opacityClass can be removed if visibility:hidden is the chosen method.
  // For now, let's rely on style.visibility and remove opacityClass from className.

  return (
    <div
      ref={isDraggingOverlay ? null : setNodeRef} // Only setNodeRef for the actual draggable item
      style={style}
      {...(isDraggingOverlay ? {} : attributes)} // Only spread attributes for the actual draggable item
      {...eventHandlers}
      className={`p-2 m-1 border rounded-lg shadow-sm transition-all duration-150 ease-in-out ${cardColor} ${textColor} ${borderColor} ${!isDraggingOverlay && dndIsDragging ? 'shadow-xl' : 'shadow-md'}`}
      // Removed opacityClass as visibility is handled in style
      role="button"
      tabIndex={isDraggingOverlay ? -1 : 0} // Overlay card is not focusable
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
