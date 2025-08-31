import React, { useRef, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { ShoppingCart } from 'lucide-react';

// Props esperadas:
// compra: { id, fornecedor, valor_total_liquido, tipo, ...outros dados }
// onCardClick: função para abrir o modal de detalhes
// onShowContextMenu: função para mostrar o menu de contexto

const LONG_PRESS_DURATION = 500;
const DRAG_THRESHOLD = 5; // pixels

function CompraCard({
  compra,
  onCardClick,
  onShowContextMenu,
  activeDragItemId = null,
  isDraggingOverlay = false,
}) {
  const { id, fornecedor, valor_total_liquido, tipo } = compra;
  const draggableId = `compra-${id}`;

  const timerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const longPressOrDragHappenedRef = useRef(false);
  const mouseDownPositionRef = useRef({ x: 0, y: 0 });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: dndIsDragging,
  } = useDraggable({
    id: draggableId,
    data: { compra, longPressOrDragHappenedRef },
    disabled: isDraggingOverlay,
  });

  const isSourceItemDragging = dndIsDragging && draggableId === activeDragItemId;

  useEffect(() => {
    if (!isDraggingOverlay && !dndIsDragging) {
      isDraggingRef.current = false;
    }
  }, [dndIsDragging, isDraggingOverlay]);

  let style = {};
  if (isDraggingOverlay) {
    style = {
      cursor: 'grabbing',
      zIndex: 9999,
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    };
  } else {
    style = transform
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          zIndex: isSourceItemDragging ? 9999 : 'auto',
          cursor: isSourceItemDragging ? 'grabbing' : 'grab',
          visibility: isSourceItemDragging ? 'hidden' : 'visible',
        }
      : {
          cursor: 'grab',
          visibility: 'visible',
        };
  }

  const isOrcamento = tipo === 'ORCAMENTO';

  const cardColor = isOrcamento
    ? 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/40'
    : 'bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/40';

  const textColor = isOrcamento
    ? 'text-blue-800 dark:text-blue-200'
    : 'text-purple-800 dark:text-purple-200';

  const borderColor = isOrcamento
    ? 'border-blue-400 dark:border-blue-600'
    : 'border-purple-400 dark:border-purple-600';

  const handleMouseDown = event => {
    if (event.button !== 0) return;
    isDraggingRef.current = false;
    longPressOrDragHappenedRef.current = false;
    mouseDownPositionRef.current = { x: event.clientX, y: event.clientY };
    timerRef.current = setTimeout(() => {
      if (!isDraggingRef.current) {
        longPressOrDragHappenedRef.current = true;
      }
    }, LONG_PRESS_DURATION);
  };

  const handleMouseUp = event => {
    if (event.button !== 0) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const handleMouseMove = event => {
    if (timerRef.current || dndIsDragging) {
      const deltaX = Math.abs(event.clientX - mouseDownPositionRef.current.x);
      const deltaY = Math.abs(event.clientY - mouseDownPositionRef.current.y);
      if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
        isDraggingRef.current = true;
        longPressOrDragHappenedRef.current = true;
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleClick = event => {
    if (dndIsDragging || isDraggingRef.current) {
      longPressOrDragHappenedRef.current = true;
    }
    if (!longPressOrDragHappenedRef.current && onCardClick) {
      onCardClick(id);
    }
    setTimeout(() => {
      longPressOrDragHappenedRef.current = false;
      isDraggingRef.current = false;
    }, 0);
  };

  const handleContextMenu = event => {
    event.preventDefault();
    if (onShowContextMenu) {
      onShowContextMenu(id, event);
    }
  };

  const eventHandlers = isDraggingOverlay
    ? {}
    : {
        onMouseDown: handleMouseDown,
        onMouseUp: handleMouseUp,
        onMouseMove: handleMouseMove,
        onClick: handleClick,
        onContextMenu: handleContextMenu,
        ...listeners,
      };

  return (
    <div
      ref={isDraggingOverlay ? null : setNodeRef}
      style={style}
      {...(isDraggingOverlay ? {} : attributes)}
      {...eventHandlers}
      className={`p-2 m-1 border rounded-lg shadow-sm transition-all duration-150 ease-in-out ${cardColor} ${textColor} ${borderColor} ${!isDraggingOverlay && dndIsDragging ? 'shadow-xl' : 'shadow-md'}`}
      role="button"
      tabIndex={isDraggingOverlay ? -1 : 0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e);
        }
      }}
    >
      <div className="flex items-center mb-1">
        <ShoppingCart size={18} className="mr-2 flex-shrink-0" />
        <span className="font-semibold text-sm truncate" title={fornecedor}>
          {fornecedor || 'Fornecedor não informado'}
        </span>
      </div>
      {valor_total_liquido != null && (
        <div className="text-xs">
          Valor:{' '}
          {Number(valor_total_liquido).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })}
        </div>
      )}
      {tipo && (
        <div className="text-xs mt-1 capitalize">
          <span className="font-semibold">Tipo:</span> {tipo.replace(/_/g, ' ')}
        </div>
      )}
    </div>
  );
}

export default CompraCard;
