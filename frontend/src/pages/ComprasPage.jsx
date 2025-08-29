import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import * as api from '../services/api';

import CompraForm from '../components/forms/CompraForm';
import { showSuccessToast, showErrorToast } from '../utils/toastUtils';
import WeeklyPlanner from '../components/WeeklyPlanner/WeeklyPlanner';
import ObraAutocomplete from '../components/forms/ObraAutocomplete';
import DailyCostChart from '../components/charts/DailyCostChart';
import RentalCard from '../components/WeeklyPlanner/RentalCard'; // Re-using for now, can be generalized later
import { getStartOfWeek } from '../utils/dateUtils';

const ComprasPage = () => {
  const [obras, setObras] = useState([]);
  const [selectedObra, setSelectedObra] = useState(null);

  // State for WeeklyPlanner
  const [currentDate, setCurrentDate] = useState(new Date());
  const [itemsPorDia, setItemsPorDia] = useState({});
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
  const [currentCompra, setCurrentCompra] = useState(null);

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
  }, [currentDate, selectedObra, fetchWeekData]);

  const handleItemClick = (item) => {
    setCurrentCompra(item);
    setShowFormModal(true);
  };

  const handleAddItem = (date) => {
    setCurrentCompra({ data_compra: date, obra: selectedObra ? selectedObra.id : null });
    setShowFormModal(true);
  };

  const handleFormSubmit = async (formData) => {
    setIsLoadingPlanner(true);
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
    } catch (err) {
        showErrorToast(err.message || "Erro ao salvar compra");
    } finally {
        setIsLoadingPlanner(false);
    }
  };

  const renderCompraCard = (item, isDragging) => {
    const cardData = {
      id: item.id,
      recurso_nome: item.fornecedor || 'Fornecedor não especificado',
      details: `R$ ${item.valor_total_liquido}`,
      status: item.tipo,
      tipo: 'compra',
    };
    return <RentalCard locacao={cardData} isDragging={isDragging} onCardClick={() => handleItemClick(item)} />;
  };

  return (
    <div className="container mx-auto px-4 py-6 bg-white dark:bg-gray-900 min-h-screen">
      <div className="mb-8 flex flex-col">
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
            // Drag and drop is disabled for compras for now
            onDragStart={() => {}}
            onDragEnd={() => {}}
            onDragCancel={() => {}}
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

      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
              {currentCompra && currentCompra.id ? 'Editar Compra' : 'Adicionar Nova Compra'}
            </h2>
            <CompraForm
              initialData={currentCompra}
              onSubmit={handleFormSubmit}
              onCancel={() => setShowFormModal(false)}
              isLoading={isLoadingPlanner}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ComprasPage;
