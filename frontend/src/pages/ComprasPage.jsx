import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import * as api from '../services/api';

import CompraForm from '../components/forms/CompraForm';
import CompraDetailModal from '../components/modals/CompraDetailModal';
import MoveOrDuplicateModal from '../components/modals/MoveOrDuplicateModal';
import ContextMenu from '../components/utils/ContextMenu';
import CompraCard from '../components/WeeklyPlanner/CompraCard';
import { showSuccessToast, showErrorToast } from '../utils/toastUtils';
import WeeklyPlanner from '../components/WeeklyPlanner/WeeklyPlanner';
import ObraAutocomplete from '../components/forms/ObraAutocomplete';
import DailyCostChart from '../components/charts/DailyCostChart';
import { getStartOfWeek } from '../utils/dateUtils';
import ComprasTable from '../components/tables/ComprasTable';

const ComprasPage = () => {
  const [obras, setObras] = useState([]);
  const [selectedObra, setSelectedObra] = useState(null);

  // State for the paginated list of all compras
  const [comprasList, setComprasList] = useState([]);
  const [paginationData, setPaginationData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, item: null });


  // State for WeeklyPlanner
  const [currentDate, setCurrentDate] = useState(new Date());
  const [itemsPorDia, setItemsPorDia] = useState({});
  const [isLoadingPlanner, setIsLoadingPlanner] = useState(false);
  const [plannerError, setPlannerError] = useState(null);
  const [activeDragId, setActiveDragId] = useState(null);
  const [activeItem, setActiveItem] = useState(null);

  const handleDragStart = (event) => {
    setActiveDragId(event.active.id);
    const item = Object.values(itemsPorDia).flat().find(i => `compra-${i.id}` === event.active.id);
    setActiveItem(item);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveDragId(null);
    setActiveItem(null);

    if (over && active.data.current.longPressOrDragHappenedRef.current) {
      if (active.id !== over.id) {
        const item = Object.values(itemsPorDia).flat().find(i => `compra-${i.id}` === active.id);
        const newDate = over.id;
        setMoveOrDuplicateModal({ visible: true, item, newDate });
      }
    }
  };

  const handleDragCancel = () => {
    setActiveDragId(null);
    setActiveItem(null);
  };

  // State for Chart
  const [chartData, setChartData] = useState([]);
  const [selectedObraIdForChart, setSelectedObraIdForChart] = useState('');
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [chartError, setChartError] = useState(null);

  // State for Modals and Forms
  const [showFormModal, setShowFormModal] = useState(false);
  const [currentCompra, setCurrentCompra] = useState(null);
  const [selectedCompraId, setSelectedCompraId] = useState(null);
  const [moveOrDuplicateModal, setMoveOrDuplicateModal] = useState({ visible: false, item: null, newDate: null });

  const handleMove = async (item, newDate) => {
    const originalState = { ...itemsPorDia };
    const optimisticState = { ...originalState };

    // Find and remove from old date
    Object.keys(optimisticState).forEach(date => {
      if (optimisticState[date].find(i => i.id === item.id)) {
        optimisticState[date] = optimisticState[date].filter(i => i.id !== item.id);
      }
    });

    // Add to new date
    const updatedItem = { ...item, data_compra: newDate };
    if (optimisticState[newDate]) {
      optimisticState[newDate].push(updatedItem);
    } else {
      optimisticState[newDate] = [updatedItem];
    }

    setItemsPorDia(optimisticState);

    try {
      await api.updateCompraStatus(item.id, { data_compra: newDate });
      showSuccessToast('Compra movida com sucesso!');
      fetchChartData(selectedObraIdForChart || null);
      fetchComprasList(currentPage, selectedObra?.id);
    } catch (err) {
      showErrorToast(err.message || 'Erro ao mover a compra.');
      setItemsPorDia(originalState); // Revert on error
    }
  };

  const handleDuplicate = async (item, newDate) => {
    setIsLoadingPlanner(true); // Show loader for duplication as it's a new item
    try {
      await api.duplicateCompra(item.id, newDate);
      showSuccessToast('Compra duplicada com sucesso!');
      fetchWeekData(currentDate, selectedObra?.id); // Refetch to get the new item
      fetchChartData(selectedObraIdForChart || null);
      fetchComprasList(currentPage, selectedObra?.id);
    } catch (err) {
      showErrorToast(err.message || 'Erro ao duplicar a compra.');
    } finally {
      setIsLoadingPlanner(false);
    }
  };

  const fetchObras = useCallback(async () => {
    try {
      const response = await api.getObras();
      setObras(response.data?.results || response.data || []);
    } catch (err) {
      console.error('Fetch Obras Error:', err);
      setObras([]);
    }
  }, []);

  const fetchWeekData = useCallback(async (dateForWeek, obraId) => {
    setIsLoadingPlanner(true);
    setPlannerError(null);
    const startDate = format(getStartOfWeek(dateForWeek), 'yyyy-MM-dd');
    try {
      const response = await api.getComprasDaSemana(startDate, obraId);
      setItemsPorDia(response.data || {});
    } catch (err) {
      setPlannerError(err.message || 'Falha ao buscar dados da semana.');
    } finally {
      setIsLoadingPlanner(false);
    }
  }, []);

  const fetchComprasList = useCallback(async (page, obraId) => {
    setIsLoadingList(true);
    setListError(null);
    try {
      const params = { page: page, page_size: 15 };
      if (obraId) {
        params.obra = obraId;
      }
      const response = await api.getCompras(params);
      setComprasList(response.data.results);
      setPaginationData({
        count: response.data.count,
        totalPages: Math.ceil(response.data.count / 15),
        currentPage: page,
        hasNext: !!response.data.next,
        hasPrevious: !!response.data.previous,
      });
    } catch (err) {
      setListError(err.message || 'Falha ao buscar lista de compras.');
      showErrorToast('Não foi possível carregar a lista de compras.');
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  const fetchChartData = useCallback(async (obraId) => {
    setIsLoadingChart(true);
    setChartError(null);
    try {
      const response = await api.getCompraCustoDiarioChart(obraId);
      const formattedData = response.data.map(item => ({ ...item, has_data: item.has_compras }));
      setChartData(formattedData);
    } catch (err) {
      setChartError(err.message || 'Falha ao buscar dados do gráfico.');
    } finally {
      setIsLoadingChart(false);
    }
  }, []);

  useEffect(() => {
    fetchObras();
  }, [fetchObras]);

  useEffect(() => {
    fetchChartData(selectedObraIdForChart || null);
  }, [fetchChartData, selectedObraIdForChart]);

  useEffect(() => {
    fetchWeekData(currentDate, selectedObra?.id);
    fetchComprasList(currentPage, selectedObra?.id);
  }, [currentDate, selectedObra, fetchWeekData, currentPage, fetchComprasList]);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        if (window.confirm('Tem certeza que deseja fechar o formulário? As alterações não salvas serão perdidas.')) {
          setShowFormModal(false);
        }
      }
    };

    if (showFormModal) {
      window.addEventListener('keydown', handleEsc);
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [showFormModal]);

  const handleAddItem = (date) => {
    setCurrentCompra({ data_compra: date, obra: selectedObra ? selectedObra.id : null });
    setShowFormModal(true);
  };

  const handleFormSubmit = async (formData) => {
    setIsLoadingPlanner(true);
    setIsLoadingList(true);
    const isEditing = formData.id;
    try {
        if (isEditing) {
            await api.updateCompra(formData.id, formData);
            showSuccessToast('Compra atualizada com sucesso!');
        } else {
            await api.createCompra(formData);
            showSuccessToast('Compra criada com sucesso!');
        }
        setShowFormModal(false);
        fetchWeekData(currentDate, selectedObra?.id);
        fetchChartData(selectedObraIdForChart || null);
        fetchComprasList(isEditing ? currentPage : 1, selectedObra?.id);
    } catch (err) {
        showErrorToast(err.message || "Erro ao salvar compra");
    } finally {
        setIsLoadingPlanner(false);
        setIsLoadingList(false);
    }
  };

    const handleDeleteCompra = async (compraId) => {
        if (window.confirm('Tem certeza que deseja excluir esta compra?')) {
            try {
                await api.deleteCompra(compraId);
                showSuccessToast('Compra excluída com sucesso!');
                fetchWeekData(currentDate, selectedObra?.id);
                fetchChartData(selectedObraIdForChart || null);
                fetchComprasList(currentPage, selectedObra?.id);
            } catch (err) {
                showErrorToast(err.message || 'Erro ao excluir a compra.');
            }
        }
    };

    const handleApproveOrcamento = async (compraId) => {
        try {
            await api.approveOrcamento(compraId);
            showSuccessToast('Orçamento aprovado com sucesso!');
            fetchWeekData(currentDate, selectedObra?.id);
            fetchChartData(selectedObraIdForChart || null);
            fetchComprasList(currentPage, selectedObra?.id);
        } catch (err) {
            showErrorToast(err.message || 'Erro ao aprovar orçamento.');
        }
    };

  const renderCompraCard = (item, isDragging) => (
    <CompraCard
      compra={item}
      isDragging={isDragging}
      onCardClick={() => setSelectedCompraId(item.id)}
      onShowContextMenu={(itemId, e) => {
        const item = Object.values(itemsPorDia).flat().find(i => i.id === itemId);
        setContextMenu({ visible: true, x: e.clientX, y: e.clientY, item: item });
      }}
    />
  );

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

    const handleTableRowContextMenu = (event, compra) => {
        event.preventDefault();
        setContextMenu({ visible: true, x: event.clientX, y: event.clientY, item: compra });
    };

    const getContextMenuOptions = () => {
        const item = contextMenu.item;
        if (!item) return [];

        const options = [
            { label: 'Ver Detalhes', action: () => setSelectedCompraId(item.id) },
            { label: 'Editar', action: () => { setCurrentCompra(item); setShowFormModal(true); } },
        ];

        if (item.tipo === 'ORCAMENTO') {
            options.push({ label: 'Aprovar Orçamento', action: () => handleApproveOrcamento(item.id) });
        }

        options.push({ label: 'Excluir', action: () => handleDeleteCompra(item.id) });

        return options;
    };

  return (
    <div className="container mx-auto px-4 py-6 bg-white dark:bg-gray-900 min-h-screen">
       {contextMenu.visible && (
                <ContextMenu
                    position={{ top: contextMenu.y, left: contextMenu.x }}
                    options={getContextMenuOptions()}
                    onClose={() => setContextMenu({ visible: false })}
                />
        )}
      <div className="mb-8 flex flex-col">
        {moveOrDuplicateModal.visible && (
          <MoveOrDuplicateModal
            onMove={() => {
              const { item, newDate } = moveOrDuplicateModal;
              handleMove(item, newDate);
              setMoveOrDuplicateModal({ visible: false, item: null, newDate: null });
            }}
            onDuplicate={() => {
              const { item, newDate } = moveOrDuplicateModal;
              handleDuplicate(item, newDate);
              setMoveOrDuplicateModal({ visible: false, item: null, newDate: null });
            }}
            onCancel={() => setMoveOrDuplicateModal({ visible: false, item: null, newDate: null })}
          />
        )}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 flex-shrink-0">
            Planejamento Semanal de Compras
          </h2>
          <div className="flex items-center space-x-4">
            <div className="w-96">
              <ObraAutocomplete
                value={selectedObra}
                onObraSelect={obra => setSelectedObra(obra)}
                placeholder="Filtrar por obra..."
              />
            </div>
          </div>
        </div>
        <div className="flex-grow">
          <WeeklyPlanner
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            itemsPorDia={itemsPorDia}
            isLoading={isLoadingPlanner}
            error={plannerError}
            renderItemCard={renderCompraCard}
            onAddItem={handleAddItem}
            addItemText="Adicionar Compra"
            noItemsText="Nenhuma compra agendada."
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
            activeDragId={activeDragId}
            activeItem={activeItem}
          />
        </div>
      </div>

      <DailyCostChart
        title="Custo Diário de Compras (Últimos 30 dias)"
        data={chartData}
        isLoading={isLoadingChart}
        error={chartError}
        obras={obras}
        selectedObraId={selectedObraIdForChart}
        onObraFilterChange={(e) => setSelectedObraIdForChart(e.target.value)}
        dataKey="total_cost"
        hasDataKey="has_compras"
        yAxisLabel="Custo (R$)"
      />

      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
          Lista de Todas as Compras
        </h2>
        <ComprasTable
          compras={comprasList}
          isLoading={isLoadingList}
          onEdit={(compra) => { setCurrentCompra(compra); setShowFormModal(true); }}
          onDelete={handleDeleteCompra}
          onViewDetails={(id) => setSelectedCompraId(id)}
          onApprove={handleApproveOrcamento}
          onRowContextMenu={handleTableRowContextMenu}
          pagination={paginationData}
          onPageChange={handlePageChange}
        />
      </div>

      {selectedCompraId && (
        <CompraDetailModal
          compraId={selectedCompraId}
          onClose={() => setSelectedCompraId(null)}
          onUpdate={() => fetchComprasList(currentPage, selectedObra?.id)}
        />
      )}

      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
              {currentCompra && currentCompra.id ? 'Editar Compra' : 'Adicionar Nova Compra'}
            </h2>
            <CompraForm
              initialData={currentCompra}
              onSubmit={handleFormSubmit}
              onCancel={() => setShowFormModal(false)}
              isLoading={isLoadingPlanner || isLoadingList}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ComprasPage;
