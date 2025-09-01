import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import * as api from '../services/api';

import LocacaoForm from '../components/forms/LocacaoForm';
import LocacaoDetailModal from '../components/modals/LocacaoDetailModal';
import ContextMenu from '../components/utils/ContextMenu';
import RentalCard from '../components/WeeklyPlanner/RentalCard';
import { showSuccessToast, showErrorToast } from '../utils/toastUtils';
import { getStartOfWeek, formatDateToYYYYMMDD } from '../utils/dateUtils.js';
import WeeklyPlanner from '../components/WeeklyPlanner/WeeklyPlanner';
import ObraAutocomplete from '../components/forms/ObraAutocomplete';
import DailyCostChart from '../components/charts/DailyCostChart';
import MoveOrDuplicateModal from '../components/modals/MoveOrDuplicateModal';


const LocacoesPage = () => {
  const [obras, setObras] = useState([]);
  const [equipes, setEquipes] = useState([]);
  const [selectedObra, setSelectedObra] = useState(null);

  const [filtroTipo, setFiltroTipo] = useState('equipe_funcionario');

  // State for WeeklyPlanner
  const [currentDate, setCurrentDate] = useState(new Date());
  const [locacoesPorDia, setLocacoesPorDia] = useState({});
  const [recursosMaisUtilizados, setRecursosMaisUtilizados] = useState([]);
  const [isLoadingPlanner, setIsLoadingPlanner] = useState(false);
  const [plannerError, setPlannerError] = useState(null);
  const [activeDragId, setActiveDragId] = useState(null);
  const [activeItem, setActiveItem] = useState(null);

  // State for Chart
  const [chartData, setChartData] = useState([]);
  const [selectedObraIdForChart, setSelectedObraIdForChart] = useState('');
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [chartError, setChartError] = useState(null);

  // State for Modals and Forms
  const [showFormModal, setShowFormModal] = useState(false);
  const [currentLocacao, setCurrentLocacao] = useState(null);
  const [selectedLocacaoId, setSelectedLocacaoId] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, item: null });
  const [moveOrDuplicateModal, setMoveOrDuplicateModal] = useState({ visible: false, item: null, newDate: null });


  const fetchWeekData = useCallback(async (dateForWeek, obraId, filtro) => {
    setIsLoadingPlanner(true);
    setPlannerError(null);
    const startDate = format(getStartOfWeek(dateForWeek), 'yyyy-MM-dd');
    try {
      const [locacoesRes, recursosRes] = await Promise.all([
        api.getLocacoesDaSemana(startDate, obraId, filtro),
        api.getRecursosMaisUtilizadosSemana(startDate, obraId),
      ]);
      setLocacoesPorDia(locacoesRes.data || {});
      setRecursosMaisUtilizados(recursosRes.data || []);
    } catch (err) {
      setPlannerError(err.message || 'Falha ao buscar dados da semana.');
    } finally {
      setIsLoadingPlanner(false);
    }
  }, []);

  const handleMove = async (item, newDate) => {
    const originalState = { ...locacoesPorDia };
    const optimisticState = { ...originalState };

    Object.keys(optimisticState).forEach(date => {
        if (optimisticState[date].find(i => i.id === item.id)) {
            optimisticState[date] = optimisticState[date].filter(i => i.id !== item.id);
        }
    });

    const updatedItem = { ...item, data_locacao_inicio: newDate, data_locacao_fim: newDate };
    if (optimisticState[newDate]) {
        optimisticState[newDate].push(updatedItem);
    } else {
        optimisticState[newDate] = [updatedItem];
    }

    setLocacoesPorDia(optimisticState);

    try {
        await api.updateLocacao(item.id, { data_locacao_inicio: newDate, data_locacao_fim: newDate });
        showSuccessToast('Locação movida com sucesso!');
        fetchChartData(selectedObraIdForChart || null, filtroTipo);
    } catch (err) {
        showErrorToast(err.message || 'Erro ao mover a locação.');
        setLocacoesPorDia(originalState);
    }
  };

  const handleDuplicate = async (item, newDate) => {
      if (item.tipo !== 'servico_externo' && item.data_locacao_inicio === newDate) {
          showErrorToast('Funcionários e equipes não podem ser duplicados no mesmo dia.');
          return;
      }

      setIsLoadingPlanner(true);
      try {
          await api.duplicateLocacao(item.id, newDate);
          showSuccessToast('Locação duplicada com sucesso!');
          fetchWeekData(currentDate, selectedObra?.id, filtroTipo);
          fetchChartData(selectedObraIdForChart || null, filtroTipo);
      } catch (err) {
          showErrorToast(err.message || 'Erro ao duplicar a locação.');
      } finally {
          setIsLoadingPlanner(false);
      }
  };

  const fetchChartData = useCallback(async (obraId, filtro) => {
    setIsLoadingChart(true);
    setChartError(null);
    try {
      const response = await api.getLocacaoCustoDiarioChart(obraId, filtro);
      const formattedData = response.data.map(item => ({ ...item, has_data: item.has_locacoes }));
      setChartData(formattedData);
    } catch (err) {
      setChartError(err.message || 'Falha ao buscar dados do gráfico.');
    } finally {
      setIsLoadingChart(false);
    }
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
        try {
            const [obrasRes, equipesRes] = await Promise.all([
                api.getObras(),
                api.getEquipes()
            ]);
            setObras(obrasRes.data?.results || obrasRes.data || []);
            setEquipes(equipesRes.data?.results || equipesRes.data || []);
        } catch (error) {
            showErrorToast('Erro ao carregar dados iniciais.');
        }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchChartData(selectedObraIdForChart || null, filtroTipo);
  }, [fetchChartData, selectedObraIdForChart, filtroTipo]);

  useEffect(() => {
    fetchWeekData(currentDate, selectedObra?.id, filtroTipo);
  }, [currentDate, selectedObra, fetchWeekData, filtroTipo]);

  const handleDragStart = (event) => {
    setActiveDragId(event.active.id);
    const item = Object.values(locacoesPorDia).flat().find(i => `rental-${i.id}` === event.active.id);
    setActiveItem(item);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveDragId(null);
    setActiveItem(null);

    if (over && active.data.current.longPressOrDragHappenedRef.current) {
        if (active.id !== over.id) {
            const item = Object.values(locacoesPorDia).flat().find(i => `rental-${i.id}` === active.id);
            const newDate = over.id;
            setMoveOrDuplicateModal({ visible: true, item, newDate });
        }
    }
  };

  const handleDragCancel = () => {
    setActiveDragId(null);
    setActiveItem(null);
  };

  const handleDeleteLocacao = async (locacaoId) => {
    if (window.confirm('Tem certeza que deseja excluir esta locação?')) {
        try {
            await api.deleteLocacao(locacaoId);
            showSuccessToast('Locação excluída com sucesso!');
            fetchWeekData(currentDate, selectedObra?.id, filtroTipo);
            fetchChartData(selectedObraIdForChart || null, filtroTipo);
        } catch (err) {
            showErrorToast(err.message || 'Erro ao excluir a locação.');
        }
    }
  };

  const getContextMenuOptions = () => {
    const item = contextMenu.item;
    if (!item) return [];

    const options = [
        { label: 'Ver Detalhes', action: () => setSelectedLocacaoId(item.id) },
        { label: 'Editar', action: () => { setCurrentLocacao(item); setShowFormModal(true); } },
    ];

    if (item.tipo === 'servico_externo') {
        options.push({ label: 'Duplicar', action: () => handleDuplicate(item, item.data_locacao_inicio) });
    }

    options.push({ label: 'Excluir', action: () => handleDeleteLocacao(item.id) });

    return options;
  };

  const renderLocacaoCard = (locacao, isDragging) => (
    <RentalCard
      locacao={locacao}
      isDragging={isDragging}
      onCardClick={() => setSelectedLocacaoId(locacao.id)}
      onShowContextMenu={(itemId, e) => {
        const item = Object.values(locacoesPorDia).flat().find(i => i.id === itemId);
        setContextMenu({ visible: true, x: e.clientX, y: e.clientY, item: item });
      }}
    />
  );

  const renderSidebar = (data) => (
    <div className="flex flex-col w-64 flex-shrink-0 min-h-[300px] max-h-[calc(100vh-250px)] ml-2 mr-1 rounded-lg shadow-md bg-slate-100 dark:bg-gray-700">
      <div className="p-3 sticky top-0 bg-slate-200 dark:bg-gray-600 rounded-t-lg shadow z-10">
        <h4 className="text-md font-semibold text-center text-slate-700 dark:text-gray-200">
          Recursos Mais Utilizados
        </h4>
        <p className="text-sm text-center text-slate-500 dark:text-gray-300">
          Nesta Semana
        </p>
      </div>
      <div className="flex-grow overflow-y-auto p-4 space-y-2">
        {data.length > 0 ? (
          <ul className="text-sm text-slate-700 dark:text-gray-200 space-y-1">
            {data.map((recurso, index) => (
              <li key={index} className="p-2 bg-white dark:bg-gray-600 rounded shadow-sm">
                <span className="font-medium">{recurso.recurso_nome}</span>: {' '}
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">{recurso.ocorrencias}</span>{' '}
                {recurso.ocorrencias > 1 ? 'alocações' : 'alocação'}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center text-sm text-gray-400 dark:text-gray-500 pt-4">
            Nenhum recurso utilizado nesta semana.
          </div>
        )}
      </div>
    </div>
  );

  const handleAddItem = (date) => {
    setCurrentLocacao({ data_locacao_inicio: date, obra: selectedObra ? selectedObra.id : '' });
    setShowFormModal(true);
  };

  const handleFormSubmit = async (formData, anexos) => {
    setIsLoadingPlanner(true);
    const isEditing = formData.id;
    try {
        if (isEditing) {
            await api.updateLocacao(formData.id, formData, anexos);
            showSuccessToast('Locação atualizada com sucesso!');
        } else {
            await api.createLocacao(formData, anexos);
            showSuccessToast('Locação criada com sucesso!');
        }
        setShowFormModal(false);
        fetchWeekData(currentDate, selectedObra?.id, filtroTipo);
        fetchChartData(selectedObraIdForChart || null, filtroTipo);
    } catch (err) {
        showErrorToast(err.message || "Erro ao salvar locação");
    } finally {
        setIsLoadingPlanner(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 bg-white dark:bg-gray-900 min-h-screen">
      {contextMenu.visible && (
                <ContextMenu
                    position={{ top: contextMenu.y, left: contextMenu.x }}
                    options={getContextMenuOptions()}
                    onClose={() => setContextMenu({ visible: false, item: null })}
                />
        )}
        {moveOrDuplicateModal.visible && (
            <MoveOrDuplicateModal
                onMove={() => {
                    handleMove(moveOrDuplicateModal.item, moveOrDuplicateModal.newDate);
                    setMoveOrDuplicateModal({ visible: false, item: null, newDate: null });
                }}
                onDuplicate={() => {
                    handleDuplicate(moveOrDuplicateModal.item, moveOrDuplicateModal.newDate);
                    setMoveOrDuplicateModal({ visible: false, item: null, newDate: null });
                }}
                onCancel={() => setMoveOrDuplicateModal({ visible: false, item: null, newDate: null })}
                itemType="Locação"
                isDuplicateDisabled={moveOrDuplicateModal.item?.tipo !== 'servico_externo' && moveOrDuplicateModal.item?.data_locacao_inicio === moveOrDuplicateModal.newDate}
            />
        )}
      <div className="mb-8 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 flex-shrink-0">
            Planejamento Semanal de Locações
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
        <div className="flex justify-center space-x-4 mb-4">
            <button
              onClick={() => setFiltroTipo('equipe_funcionario')}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                filtroTipo === 'equipe_funcionario'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              Equipes e Funcionários
            </button>
            <button
              onClick={() => setFiltroTipo('servico_externo')}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                filtroTipo === 'servico_externo'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg scale-105'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              Serviços Externos
            </button>
        </div>
        <div className="flex-grow">
          <WeeklyPlanner
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            itemsPorDia={locacoesPorDia}
            sidebarData={recursosMaisUtilizados}
            isLoading={isLoadingPlanner}
            error={plannerError}
            renderItemCard={renderLocacaoCard}
            renderSidebar={renderSidebar}
            activeDragId={activeDragId}
            activeItem={activeItem}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
            onAddItem={handleAddItem}
            addItemText="Adicionar Locação"
            noItemsText="Nenhuma locação agendada."
          />
        </div>
      </div>

      <DailyCostChart
        title="Custo Diário de Locações (Últimos 30 dias)"
        data={chartData}
        isLoading={isLoadingChart}
        error={chartError}
        obras={obras}
        selectedObraId={selectedObraIdForChart}
        onObraFilterChange={(e) => setSelectedObraIdForChart(e.target.value)}
        dataKey="total_cost"
        hasDataKey="has_locacoes"
        yAxisLabel="Custo (R$)"
      />

      {selectedLocacaoId && (
        <LocacaoDetailModal
          locacaoId={selectedLocacaoId}
          onClose={() => setSelectedLocacaoId(null)}
        />
      )}

      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
                    {currentLocacao && currentLocacao.id ? 'Editar Locação' : 'Adicionar Nova Locação'}
                </h2>
                <LocacaoForm
                    initialData={currentLocacao}
                    obras={obras}
                    equipes={equipes}
                    onSubmit={handleFormSubmit}
                    onCancel={() => setShowFormModal(false)}
                    isLoading={isLoadingPlanner}
                    onTransferSuccess={() => {
                        setShowFormModal(false);
                        fetchWeekData(currentDate, selectedObra?.id, filtroTipo);
                        fetchChartData(selectedObraIdForChart || null, filtroTipo);
                    }}
                />
            </div>
        </div>
      )}
    </div>
  );
};

export default LocacoesPage;
