import React, { useState, useEffect, useCallback } from 'react';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import WeekNavigator from './WeekNavigator';
import DayColumn from './DayColumn';
import LocacaoDetailModal from '../modals/LocacaoDetailModal';
import LocacaoForm from '../forms/LocacaoForm';
import * as api from '../../services/api'; // API service
import { DndContext } from '@dnd-kit/core';
import { toast } from 'react-toastify';

// Adicionado obras e equipes como props
function WeeklyPlanner({ obras, equipes }) {
  const [currentDate, setCurrentDate] = useState(new Date()); // Data de referência para a semana
  const [locacoesPorDia, setLocacoesPorDia] = useState({});
  const [recursosMaisUtilizados, setRecursosMaisUtilizados] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados para modais
  const [selectedLocacaoIdForDetail, setSelectedLocacaoIdForDetail] = useState(null);
  const [showLocacaoFormModal, setShowLocacaoFormModal] = useState(false);
  const [locacaoFormInitialData, setLocacaoFormInitialData] = useState(null);

  // Estados para Drag and Drop Modal
  const [showDragDropConfirmModal, setShowDragDropConfirmModal] = useState(false);
  const [draggedLocacao, setDraggedLocacao] = useState(null);
  const [targetDayId, setTargetDayId] = useState(null);


  const locale = ptBR;
  const weekStartsOn = 1; // Segunda-feira

  const fetchWeekData = useCallback(async (dateForWeek) => {
    setIsLoading(true);
    setError(null);
    const weekStart = startOfWeek(dateForWeek, { locale, weekStartsOn });
    const formattedStartDate = format(weekStart, 'yyyy-MM-dd');

    try {
      const [locacoesRes, recursosRes] = await Promise.all([
        api.getLocacoesDaSemana(formattedStartDate),
        api.getRecursosMaisUtilizadosSemana(formattedStartDate)
      ]);
      setLocacoesPorDia(locacoesRes.data || {});
      setRecursosMaisUtilizados(recursosRes.data || []);
    } catch (err) {
      console.error("Erro ao buscar dados da semana:", err);
      setError(err.message || "Falha ao buscar dados da semana.");
      setLocacoesPorDia({});
      setRecursosMaisUtilizados([]);
      toast.error(`Erro ao carregar dados da semana: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [locale, weekStartsOn]);

  useEffect(() => {
    fetchWeekData(currentDate);
  }, [currentDate, fetchWeekData]);

  const handleDateChange = (newDate) => {
    setCurrentDate(newDate);
  };

  const handleOpenLocacaoDetail = (locacaoId) => {
    setSelectedLocacaoIdForDetail(locacaoId);
  };

  const handleCloseLocacaoDetail = () => {
    setSelectedLocacaoIdForDetail(null);
  };

  const handleOpenLocacaoForm = (dateString = null) => {
    setLocacaoFormInitialData(dateString ? { data_locacao_inicio: dateString, data_locacao_fim: dateString } : null);
    setShowLocacaoFormModal(true);
  };

  const handleCloseLocacaoForm = () => {
    setShowLocacaoFormModal(false);
    setLocacaoFormInitialData(null);
  };

  const handleLocacaoFormSubmitSuccess = () => {
    handleCloseLocacaoForm();
    fetchWeekData(currentDate); // Re-fetch data
    toast.success("Locação salva com sucesso!");
  };

  const handleLocacaoTransferSuccess = () => {
    handleCloseLocacaoForm(); // Fecha o formulário se a transferência foi iniciada por ele
    fetchWeekData(currentDate); // Re-fetch data
    toast.success("Funcionário transferido e nova locação criada com sucesso!");
  };

  // Drag and Drop Handlers
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const locacaoArrastada = active.data.current?.locacao;
      const idColunaDestino = over.id; // YYYY-MM-DD da coluna de destino

      if (!locacaoArrastada || !idColunaDestino) {
        console.warn("Drag end sem dados suficientes:", event);
        return;
      }

      // Não faz nada se soltar na mesma coluna/dia original da locação
      // A data da locação original já está no formato YYYY-MM-DD
      const dataInicioOriginal = locacaoArrastada.data_locacao_inicio;
      if (dataInicioOriginal === idColunaDestino) {
        // console.log("Solto na mesma coluna, nenhuma ação.");
        return;
      }

      setDraggedLocacao(locacaoArrastada);
      setTargetDayId(idColunaDestino);
      setShowDragDropConfirmModal(true);
    }
  };

  const closeDragDropConfirmModal = () => {
    setShowDragDropConfirmModal(false);
    setDraggedLocacao(null);
    setTargetDayId(null);
  };

  const handleMoveLocacao = async () => {
    if (!draggedLocacao || !targetDayId) return;
    setIsLoading(true);
    try {
      // Para "mover", atualizamos a data de início e fim para o novo dia.
      // Se a locação original era de múltiplos dias, ela se torna de um único dia.
      const updatedData = {
        data_locacao_inicio: targetDayId,
        data_locacao_fim: targetDayId, // Simplificação: mover torna a locação de um dia.
      };
      await api.updateLocacao(draggedLocacao.id, updatedData);
      toast.success(`Locação de ${draggedLocacao.recurso_nome} movida para ${format(new Date(targetDayId + 'T00:00:00'), 'dd/MM/yyyy', { locale })}.`);
      fetchWeekData(currentDate); // Recarrega os dados
    } catch (error) {
      console.error("Erro ao mover locação:", error);
      toast.error(`Erro ao mover locação: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsLoading(false);
      closeDragDropConfirmModal();
    }
  };

  const handleDuplicateLocacao = async () => {
    if (!draggedLocacao || !targetDayId) return;
    setIsLoading(true);
    try {
      const { id, obra_nome, equipe_details, status_locacao, tipo, recurso_nome, ...restOfLocacao } = draggedLocacao;

      const newLocacaoData = {
        ...restOfLocacao,
        obra: draggedLocacao.obra.id || draggedLocacao.obra, // Garante que obra seja ID
        data_locacao_inicio: targetDayId,
        data_locacao_fim: targetDayId, // Duplicar para um dia específico cria uma locação de um dia
        // Garante que IDs de relacionamento sejam enviados corretamente
        equipe: draggedLocacao.equipe?.id || null,
        funcionario_locado: draggedLocacao.funcionario_locado?.id || null,
      };
      // Remove campos que não devem ser enviados na criação ou que são apenas de leitura
      delete newLocacaoData.id;
      delete newLocacaoData.obra_nome;
      delete newLocacaoData.equipe_details;
      delete newLocacaoData.equipe_nome;
      delete newLocacaoData.funcionario_locado_nome;
      delete newLocacaoData.status_locacao; // Status é definido no backend
      delete newLocacaoData.tipo; // Campo calculado no serializer
      delete newLocacaoData.recurso_nome; // Campo calculado no serializer


      await api.createLocacao(newLocacaoData);
      toast.success(`Locação de ${draggedLocacao.recurso_nome} duplicada para ${format(new Date(targetDayId + 'T00:00:00'), 'dd/MM/yyyy', { locale })}.`);
      fetchWeekData(currentDate); // Recarrega os dados
    } catch (error) {
      console.error("Erro ao duplicar locação:", error.response?.data || error.message);
      const errorMsg = error.response?.data && typeof error.response.data === 'object'
                       ? Object.values(error.response.data).flat().join('; ')
                       : (error.response?.data?.detail || error.message);
      toast.error(`Erro ao duplicar locação: ${errorMsg}`);
    } finally {
      setIsLoading(false);
      closeDragDropConfirmModal();
    }
  };


  const weekStart = startOfWeek(currentDate, { locale, weekStartsOn });
  const daysOfWeek = eachDayOfInterval({ start: weekStart, end: endOfWeek(currentDate, { locale, weekStartsOn }) });

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="p-4 bg-white shadow-lg rounded-lg">
        <WeekNavigator
          currentDate={currentDate}
          onDateChange={handleDateChange}
        />

        {isLoading && <div className="text-center p-4">Carregando dados da semana...</div>}
        {error && <div className="text-center p-4 text-red-600">Erro: {error}</div>}

        {!isLoading && !error && (
          // Ajustado para preencher a altura e permitir scroll interno se necessário
          <div className="flex mt-4 overflow-x-auto pb-4 h-full flex-grow">
            {/* Colunas dos Dias */}
            {daysOfWeek.map(day => {
              const formattedDayId = format(day, 'yyyy-MM-dd');
              return (
                // Reduzindo um pouco a largura mínima para melhor ajuste em telas menores
                <div key={formattedDayId} className="flex-1 min-w-[180px] sm:min-w-[200px] md:min-w-[210px]">
                  <DayColumn
                    id={formattedDayId}
                    date={day}
                    locacoes={locacoesPorDia[formattedDayId] || []}
                    onOpenLocacaoForm={handleOpenLocacaoForm}
                    onOpenLocacaoDetail={handleOpenLocacaoDetail}
                  />
                </div>
              );
            })}

            {/* Coluna de Análise */}
            <div className="flex flex-col w-64 flex-shrink-0 min-h-[300px] max-h-[calc(100vh-250px)] ml-2 mr-1 rounded-lg shadow-md bg-slate-100">
              <div className="p-3 sticky top-0 bg-slate-200 rounded-t-lg shadow z-10">
                <h4 className="text-md font-semibold text-center text-slate-700">Recursos Mais Utilizados</h4>
                <p className="text-sm text-center text-slate-500">Nesta Semana</p>
              </div>
              <div className="flex-grow overflow-y-auto p-4 space-y-2">
                {recursosMaisUtilizados.length > 0 ? (
                  <ul className="text-sm text-slate-700 space-y-1">
                    {recursosMaisUtilizados.map((recurso, index) => (
                      <li key={index} className="p-2 bg-white rounded shadow-sm">
                        <span className="font-medium">{recurso.recurso_nome}</span>: <span className="font-semibold text-indigo-600">{recurso.ocorrencias}</span> {recurso.ocorrencias > 1 ? 'alocações' : 'alocação'}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center text-sm text-gray-400 pt-4">
                    Nenhum recurso utilizado nesta semana.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedLocacaoIdForDetail && (
          <LocacaoDetailModal
            locacaoId={selectedLocacaoIdForDetail}
            onClose={handleCloseLocacaoDetail}
          />
        )}

        {showLocacaoFormModal && (
          // O LocacaoForm precisa ser encapsulado em um modal aqui
          // Por simplicidade, vou apenas renderizá-lo diretamente, mas idealmente seria um modal
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                {locacaoFormInitialData?.id ? 'Editar Locação' : 'Adicionar Nova Locação'}
              </h3>
              <LocacaoForm
                initialData={locacaoFormInitialData}
                obras={obras || []} // Passa as obras recebidas por props
                equipes={equipes || []} // Passa as equipes recebidas por props
                onSubmit={handleLocacaoFormSubmitSuccess}
                onCancel={handleCloseLocacaoForm}
                isLoading={isLoading} // Pode precisar de um isLoading específico para o form
                onTransferSuccess={handleLocacaoTransferSuccess}
              />
            </div>
          </div>
        )}

        {showDragDropConfirmModal && draggedLocacao && targetDayId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                    <h2 className="text-xl font-semibold mb-4">Confirmar Ação</h2>
                    <p className="mb-6 text-sm text-gray-700">
                        O que deseja fazer com a locação de "{draggedLocacao.recurso_nome}" para o dia {format(new Date(targetDayId + 'T00:00:00'), 'dd/MM/yyyy', { locale })}?
                    </p>
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={closeDragDropConfirmModal}
                            className="py-2 px-4 text-sm font-medium text-gray-800 bg-gray-200 rounded-md hover:bg-gray-300"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleDuplicateLocacao}
                            disabled={isLoading}
                            className="py-2 px-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                        >
                            {isLoading ? 'Duplicando...' : 'Duplicar'}
                        </button>
                        <button
                            onClick={handleMoveLocacao}
                            disabled={isLoading}
                            className="py-2 px-4 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md disabled:opacity-50"
                        >
                            {isLoading ? 'Movendo...' : 'Mover'}
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </DndContext>
  );
}

export default WeeklyPlanner;
