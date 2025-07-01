import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDroppable } from '@dnd-kit/core';
import RentalCard from './RentalCard';
import { PlusCircle } from 'lucide-react';

// Props esperadas:
// id: string (e.g., '2024-07-01') - usado como ID para o droppable
// date: Date object (para exibir o dia formatado)
// locacoes: array de objetos de locação para este dia
// onOpenLocacaoForm: function(dateString) - para abrir o formulário de nova locação
// onOpenLocacaoDetail: function(locacaoId) - para abrir o modal de detalhes da locação

function DayColumn({ id, date, locacoes, onOpenLocacaoForm, onOpenLocacaoDetail }) {
  const { setNodeRef, isOver } = useDroppable({
    id: id, // ID da coluna, que será a data YYYY-MM-DD
  });

  const dayName = format(date, 'EEEE', { locale: ptBR });
  const dayMonth = format(date, 'dd/MM');

  const handleAddLocacaoClick = () => {
    if (onOpenLocacaoForm) {
      onOpenLocacaoForm(format(date, 'yyyy-MM-dd'));
    }
  };

  return (
    <div
      ref={setNodeRef}
      // Removido flex-1 daqui pois o wrapper no WeeklyPlanner.jsx agora controla isso.
      // Adicionado h-full para que a cor de fundo preencha o espaço dado pelo wrapper.
      className={`flex flex-col h-full min-h-[300px] max-h-[calc(100vh-250px)] rounded-lg shadow-md ${isOver ? 'bg-indigo-100' : 'bg-gray-50'}`}
    >
      {/* Cabeçalho da Coluna */}
      <div className="p-2.5 sticky top-0 bg-gray-100 rounded-t-lg shadow z-10 border-b border-gray-200">
        <h4 className="text-md font-semibold text-center text-gray-700">
          {dayName.charAt(0).toUpperCase() + dayName.slice(1)}
        </h4>
        <p className="text-sm text-center text-gray-500">{dayMonth}</p>
      </div>

      {/* Botão Adicionar Locação */}
      <div className="p-2 border-b border-gray-200">
        <button
          onClick={handleAddLocacaoClick}
          className="w-full flex items-center justify-center p-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-md border border-dashed border-indigo-400 hover:border-indigo-600 transition-colors"
        >
          <PlusCircle size={18} className="mr-2" />
          Adicionar Locação
        </button>
      </div>

      {/* Lista de Cards de Locação */}
      <div className="flex-grow overflow-y-auto p-2 space-y-2">
        {locacoes && locacoes.length > 0 ? (
          locacoes.map((locacao) => (
            <RentalCard
              key={locacao.id}
              locacao={locacao}
              onCardClick={onOpenLocacaoDetail}
            />
          ))
        ) : (
          <div className="text-center text-sm text-gray-400 pt-4">
            Nenhuma locação agendada.
          </div>
        )}
      </div>
    </div>
  );
}

export default DayColumn;
