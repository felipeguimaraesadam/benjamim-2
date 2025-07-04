import React, { useState, useEffect, useCallback } from 'react';
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import WeekNavigator from './WeekNavigator';
import DayColumn from './DayColumn';
import LocacaoDetailModal from '../modals/LocacaoDetailModal';
import LocacaoForm from '../forms/LocacaoForm';
import ContextMenu from '../utils/ContextMenu';
import RentalCard from './RentalCard'; // Import RentalCard for DragOverlay
import * as api from '../../services/api';
import { DndContext, DragOverlay } from '@dnd-kit/core'; // Import DragOverlay
import { toast } from 'react-toastify';

function WeeklyPlanner({ obras, equipes }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [locacoesPorDia, setLocacoesPorDia] = useState({});
  const [recursosMaisUtilizados, setRecursosMaisUtilizados] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedLocacaoIdForDetail, setSelectedLocacaoIdForDetail] = useState(null);
  const [showLocacaoFormModal, setShowLocacaoFormModal] = useState(false);
  const [locacaoFormInitialData, setLocacaoFormInitialData] = useState(null);

  const [showDragDropConfirmModal, setShowDragDropConfirmModal] = useState(false);
  // draggedLocacao and targetDayId will be managed by the main drag end logic,
  // but activeRental is for the DragOverlay specifically.
  const [draggedLocacaoDataForModal, setDraggedLocacaoDataForModal] = useState(null); // Renamed from draggedLocacao to avoid confusion
  const [targetDayIdForModal, setTargetDayIdForModal] = useState(null); // Renamed from targetDayId

  // State for DragOverlay
  const [activeDragId, setActiveDragId] = useState(null);
  const [activeRental, setActiveRental] = useState(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    position: { top: 0, left: 0 },
    locacaoId: null,
  });

  const locale = ptBR;
  const weekStartsOn = 1; // Segunda-feira

  const fetchWeekData = useCallback(async (dateForWeek) => {
    setIsLoading(true);
    setError(null);
    const weekStart = startOfWeek(dateForWeek, { locale, weekStartsOn });
    const formattedStartDate = format(weekStart, 'yyyy-MM-dd');
    console.log('[WeeklyPlanner] fetchWeekData - StartDate para API:', formattedStartDate); // LOG 1

    try {
      const [locacoesRes, recursosRes] = await Promise.all([
        api.getLocacoesDaSemana(formattedStartDate),
        api.getRecursosMaisUtilizadosSemana(formattedStartDate)
      ]);
      console.log('[WeeklyPlanner] fetchWeekData - Locações recebidas:', locacoesRes.data); // LOG 2
      setLocacoesPorDia(locacoesRes.data || {});
      setRecursosMaisUtilizados(recursosRes.data || []);
    } catch (err) {
      console.error("[WeeklyPlanner] Erro ao buscar dados da semana:", err); // LOG Erro
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

  const handleLocacaoFormSubmitSuccess = () => { // Renomear para indicar que é APÓS o submit real
    handleCloseLocacaoForm();
    console.log('[WeeklyPlanner] handleLocacaoFormSubmitSuccess - Chamando fetchWeekData com currentDate:', currentDate); // LOG 3
    fetchWeekData(currentDate); // Re-fetch data
    // O toast de sucesso será movido para handleActualFormSubmit
  };

  // Nova função para lidar com o submit real do LocacaoForm
  const handleActualFormSubmit = async (formDataFromForm) => {
    setIsLoading(true); // Usar isLoading geral ou um específico para o form
    setError(null);

    // Determinar se é criação ou edição baseado em locacaoFormInitialData
    const isEditing = locacaoFormInitialData && locacaoFormInitialData.id;

    try {
      if (isEditing) {
        await api.updateLocacao(locacaoFormInitialData.id, formDataFromForm);
        toast.success("Locação atualizada com sucesso!");
      } else {
        await api.createLocacao(formDataFromForm);
        toast.success("Locação criada com sucesso!");
      }
      handleLocacaoFormSubmitSuccess(); // Fecha modal e recarrega
    } catch (err) {
      console.error("[WeeklyPlanner] Erro ao salvar locação (handleActualFormSubmit):", err.response?.data || err.message);
      const errorMsg = err.response?.data && typeof err.response.data === 'object'
                       ? Object.values(err.response.data).flat().join('; ')
                       : (err.response?.data?.detail || err.message || "Erro desconhecido ao salvar.");
      toast.error(`Falha ao salvar locação: ${errorMsg}`);
      setError(errorMsg); // Pode ser útil mostrar o erro no formulário ou no planner
      // Não fechar o modal automaticamente em caso de erro, para o usuário ver.
      // A prop isLoadingForm no LocacaoForm pode ser usada para reabilitar o botão de submit.
    } finally {
      setIsLoading(false); // Resetar o estado de loading
    }
  };

  const handleLocacaoTransferSuccess = () => {
    handleCloseLocacaoForm(); // Fecha o formulário se a transferência foi iniciada por ele
    fetchWeekData(currentDate); // Re-fetch data
    toast.success("Funcionário transferido e nova locação criada com sucesso!");
  };

  // Drag and Drop Handlers
  const handleDragStart = (event) => {
    setActiveDragId(event.active.id);
    setActiveRental(event.active.data.current?.locacao);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const locacaoArrastada = active.data.current?.locacao;
      const idColunaDestino = over.id;

      if (!locacaoArrastada || !idColunaDestino) {
        console.warn("Drag end sem dados suficientes:", event);
        setActiveDragId(null); // Reset active drag state
        setActiveRental(null);
        return;
      }

      const dataInicioOriginal = locacaoArrastada.data_locacao_inicio;
      if (dataInicioOriginal === idColunaDestino) {
        setActiveDragId(null); // Reset active drag state
        setActiveRental(null);
        return;
      }

      setDraggedLocacaoDataForModal(locacaoArrastada);
      setTargetDayIdForModal(idColunaDestino);
      setShowDragDropConfirmModal(true);
    }

    // Reset active drag state regardless of whether the modal is shown
    setActiveDragId(null);
    setActiveRental(null);
  };

  const handleDragCancel = () => {
    setActiveDragId(null);
    setActiveRental(null);
  };

  const closeDragDropConfirmModal = () => {
    setShowDragDropConfirmModal(false);
    setDraggedLocacaoDataForModal(null);
    setTargetDayIdForModal(null);
  };

  const handleMoveLocacao = async () => {
    if (!draggedLocacaoDataForModal || !targetDayIdForModal) return;
    setIsLoading(true);
    try {
      const updatedData = {
        data_locacao_inicio: targetDayIdForModal,
        data_locacao_fim: targetDayIdForModal,
      };
      await api.updateLocacao(draggedLocacaoDataForModal.id, updatedData);
      toast.success(`Locação de ${draggedLocacaoDataForModal.recurso_nome} movida para ${format(new Date(targetDayIdForModal + 'T00:00:00'), 'dd/MM/yyyy', { locale })}.`);
      fetchWeekData(currentDate);
    } catch (error) {
      console.error("Erro ao mover locação:", error);
      toast.error(`Erro ao mover locação: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsLoading(false);
      closeDragDropConfirmModal();
    }
  };

  const handleDuplicateLocacao = async () => {
    if (!draggedLocacaoDataForModal || !targetDayIdForModal) return;
    setIsLoading(true);
    try {
      const { id, obra_nome, equipe_details, status_locacao, tipo, recurso_nome, ...restOfLocacao } = draggedLocacaoDataForModal;

      const newLocacaoData = {
        ...restOfLocacao,
        obra: draggedLocacaoDataForModal.obra.id || draggedLocacaoDataForModal.obra,
        data_locacao_inicio: targetDayIdForModal,
        data_locacao_fim: targetDayIdForModal,
        equipe: draggedLocacaoDataForModal.equipe?.id || null,
        funcionario_locado: draggedLocacaoDataForModal.funcionario_locado?.id || null,
      };
      delete newLocacaoData.id;
      delete newLocacaoData.obra_nome;
      delete newLocacaoData.equipe_details;
      delete newLocacaoData.equipe_nome;
      delete newLocacaoData.funcionario_locado_nome;
      delete newLocacaoData.status_locacao;
      delete newLocacaoData.tipo;
      delete newLocacaoData.recurso_nome;

      await api.createLocacao(newLocacaoData);
      toast.success(`Locação de ${draggedLocacaoDataForModal.recurso_nome} duplicada para ${format(new Date(targetDayIdForModal + 'T00:00:00'), 'dd/MM/yyyy', { locale })}.`);
      fetchWeekData(currentDate);
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

  // Context Menu Handlers
  const handleShowContextMenu = (locacaoId, event) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      position: { top: event.clientY, left: event.clientX },
      locacaoId: locacaoId,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu({ ...contextMenu, visible: false, locacaoId: null });
  };

  const handleDeleteLocacao = async (locacaoIdToDelete) => {
    if (!locacaoIdToDelete) return;

    // eslint-disable-next-line no-restricted-globals
    if (confirm('Tem certeza que deseja excluir esta locação?')) {
      setIsLoading(true);
      try {
        await api.deleteLocacao(locacaoIdToDelete);
        toast.success('Locação excluída com sucesso!');
        fetchWeekData(currentDate); // Refresh data
      } catch (err) {
        console.error("Erro ao excluir locação:", err);
        toast.error(`Falha ao excluir locação: ${err.response?.data?.detail || err.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const contextMenuOptions = contextMenu.locacaoId ? [
    {
      label: 'Detalhes',
      action: () => {
        handleOpenLocacaoDetail(contextMenu.locacaoId);
        handleCloseContextMenu();
      },
    },
    {
      label: 'Editar',
      action: () => {
        // Find the full locacao object to pass as initialData
        let locacaoParaEditar = null;
        for (const dayKey in locacoesPorDia) {
          const found = locacoesPorDia[dayKey].find(l => l.id === contextMenu.locacaoId);
          if (found) {
            locacaoParaEditar = found;
            break;
          }
        }
        if (locacaoParaEditar) {
          setLocacaoFormInitialData(locacaoParaEditar);
          setShowLocacaoFormModal(true);
        } else {
          toast.error("Não foi possível encontrar os dados da locação para edição.");
        }
        handleCloseContextMenu();
      },
    },
    {
      label: 'Excluir',
      action: () => {
        handleDeleteLocacao(contextMenu.locacaoId);
        handleCloseContextMenu();
      },
    },
  ] : [];


  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="p-4 bg-white shadow-lg rounded-lg">
        <WeekNavigator
          currentDate={currentDate}
          onDateChange={handleDateChange}
        />

        {isLoading && <div className="text-center p-4">Carregando dados da semana...</div>}
        {error && <div className="text-center p-4 text-red-600">Erro: {error}</div>}

        {!isLoading && !error && (
          <div className="flex mt-4 overflow-x-auto pb-4 h-full flex-grow">
            {daysOfWeek.map(day => {
              const formattedDayId = format(day, 'yyyy-MM-dd');
              return (
                <div key={formattedDayId} className="flex-1 min-w-[180px] sm:min-w-[200px] md:min-w-[210px]">
                  <DayColumn
                    id={formattedDayId}
                    date={day}
                    locacoes={locacoesPorDia[formattedDayId] || []}
                    onOpenLocacaoForm={handleOpenLocacaoForm}
                    onOpenLocacaoDetail={handleOpenLocacaoDetail}
                    onShowContextMenu={handleShowContextMenu}
                    activeDragItemId={activeDragId} // Pass activeDragId to DayColumn
                  />
                </div>
              );
            })}

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
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                {locacaoFormInitialData?.id ? 'Editar Locação' : 'Adicionar Nova Locação'}
              </h3>
              <LocacaoForm
                initialData={locacaoFormInitialData}
                obras={obras || []}
                equipes={equipes || []}
                onSubmit={handleActualFormSubmit}
                onCancel={handleCloseLocacaoForm}
                isLoading={isLoading}
                onTransferSuccess={handleLocacaoTransferSuccess}
              />
            </div>
          </div>
        )}

        {showDragDropConfirmModal && draggedLocacaoDataForModal && targetDayIdForModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                    <h2 className="text-xl font-semibold mb-4">Confirmar Ação</h2>
                    <p className="mb-6 text-sm text-gray-700">
                        O que deseja fazer com a locação de "{draggedLocacaoDataForModal.recurso_nome}" para o dia {format(new Date(targetDayIdForModal + 'T00:00:00'), 'dd/MM/yyyy', { locale })}?
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

        {/* Render ContextMenu */}
        {contextMenu.visible && (
          <ContextMenu
            position={contextMenu.position}
            options={contextMenuOptions}
            onClose={handleCloseContextMenu}
          />
        )}

        <DragOverlay dropAnimation={null}>
          {activeDragId && activeRental ? (
            <RentalCard
              locacao={activeRental}
              isDraggingOverlay={true} // Custom prop to indicate this card is in the overlay
            />
          ) : null}
        </DragOverlay>

      </div>
    </DndContext>
  );
}

export default WeeklyPlanner;
