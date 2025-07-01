import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { User, Users, Tool } from 'lucide-react'; // Ícones de lucide-react

// Props esperadas:
// locacao: { id, tipo, recurso_nome, valor_pagamento, ...outros dados se necessário }
// onCardClick: função para abrir o modal de detalhes, passando o locacao.id

function RentalCard({ locacao, onCardClick }) {
  const { id, tipo, recurso_nome, valor_pagamento } = locacao;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `rental-${id}`, // ID único para o draggable
    data: { locacao }, // Passa os dados da locação para o contexto do drag
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 1000 : 'auto',
    cursor: isDragging ? 'grabbing' : 'grab',
  } : {
    cursor: 'grab',
  };

  let IconComponent;
  let cardColor = 'bg-gray-100'; // Cor de fundo padrão
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
    IconComponent = Tool;
    cardColor = 'bg-orange-100 hover:bg-orange-200';
    textColor = 'text-orange-800';
    borderColor = 'border-orange-400';
  }

  const handleClick = () => {
    if (onCardClick) {
      onCardClick(id); // Passa o ID da locação para o handler
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={handleClick} // Adicionado onClick para abrir modal
      className={`p-3 m-1 border rounded-lg shadow-sm transition-all duration-150 ease-in-out ${cardColor} ${textColor} ${borderColor} ${isDragging ? 'opacity-75 shadow-xl' : 'shadow-md'}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
    >
      <div className="flex items-center mb-1">
        {IconComponent && <IconComponent size={18} className="mr-2 flex-shrink-0" />}
        <span className="font-semibold text-sm truncate" title={recurso_nome}>{recurso_nome}</span>
      </div>
      {valor_pagamento != null && ( // Exibir valor apenas se existir
        <div className="text-xs">
          Valor: {Number(valor_pagamento).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>
      )}
    </div>
  );
}

export default RentalCard;
