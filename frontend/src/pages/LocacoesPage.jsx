import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import * as api from '../services/api';
import LocacoesTable from '../components/tables/LocacoesTable';
import LocacaoForm from '../components/forms/LocacaoForm';
import LocacaoDetailModal from '../components/modals/LocacaoDetailModal';

const LocacoesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [locacoes, setLocacoes] = useState([]);
  const [obras, setObras] = useState([]);
  const [equipes, setEquipes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [error, setError] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [currentLocacao, setCurrentLocacao] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [locacaoToDeleteId, setLocacaoToDeleteId] = useState(null);

  const [selectedLocacaoId, setSelectedLocacaoId] = useState(null);

  // State for chart
  const [chartData, setChartData] = useState([]);
  const [selectedObraIdForChart, setSelectedObraIdForChart] = useState(''); // Empty string for "All Obras"
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [chartError, setChartError] = useState(null);


  const fetchLocacoes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getLocacoes();
      setLocacoes(response.data);
    } catch (err) {
      setError(err.message || 'Falha ao buscar locações.');
      console.error("Fetch Locações Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchObras = useCallback(async () => { // This fetches obras for the form, might be reused or separated
    try {
      const response = await api.getObras();
      setObras(response.data); // Assuming 'obras' state is already used for forms
    } catch (err) {
      console.error("Fetch Obras for LocacaoForm/Chart Filter Error:", err);
      // Potentially set an error state for the filter if it fails to load
    }
  }, []);

  const fetchChartData = useCallback(async (obraId) => {
    setIsLoadingChart(true);
    setChartError(null);
    try {
      const response = await api.getLocacaoCustoDiarioChart(obraId);
      // Format date for display on Y-axis if needed, e.g., from "YYYY-MM-DD" to "DD/MM"
      const formattedData = response.data.map(item => ({
        ...item,
        // date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        // Keep ISO date for potential sorting or further manipulation, format in tick
      }));
      setChartData(formattedData);
    } catch (err) {
      setChartError(err.message || 'Falha ao buscar dados do gráfico.');
      console.error("Fetch Chart Data Error:", err);
    } finally {
      setIsLoadingChart(false);
    }
  }, []);


  const fetchEquipes = useCallback(async () => {
    try {
      const response = await api.getEquipes();
      setEquipes(response.data);
    } catch (err) {
      console.error("Fetch Equipes for LocacaoForm Error:", err);
    }
  }, []);

  useEffect(() => {
    fetchLocacoes();
    fetchObras(); // Fetches obras for forms and potentially for chart filter
    fetchEquipes();
    fetchChartData(selectedObraIdForChart || null); // Initial chart data load
  }, [fetchLocacoes, fetchObras, fetchEquipes, fetchChartData, selectedObraIdForChart]);

  const handleObraFilterChange = (event) => {
    setSelectedObraIdForChart(event.target.value);
    // Data will be refetched by useEffect due to selectedObraIdForChart dependency change
  };

  const handleAddNew = () => {
    const obraIdFromState = location.state?.obraIdParaNovaAlocacao;
    setCurrentLocacao(obraIdFromState ? { obra: obraIdFromState } : null);
    setError(null);
    setShowFormModal(true);
    if (obraIdFromState) {
        navigate(location.pathname, { replace: true, state: {} });
    }
  };

  const handleEdit = (locacao) => {
    setCurrentLocacao(locacao);
    setError(null); // Clear previous errors when opening for edit
    setShowFormModal(true);
  };

  const handleDelete = (id) => {
    setLocacaoToDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!locacaoToDeleteId) return;
    setIsLoading(true); // Consider a specific loading state for delete if it interferes elsewhere
    setError(null);
    try {
      await api.deleteLocacao(locacaoToDeleteId);
      setLocacaoToDeleteId(null);
      setShowDeleteConfirm(false);
      await fetchLocacoes();
    } catch (err) {
      setError(err.message || 'Falha ao excluir locação.');
      console.error("Delete Locação Error:", err);
    } finally {
      setIsLoading(false); // Reset general loading state
    }
  };

  const handleApiSubmit = async (formData) => {
    setIsLoadingForm(true);
    setError(null);
    try {
      if (currentLocacao && currentLocacao.id) {
        await api.updateLocacao(currentLocacao.id, formData);
      } else {
        await api.createLocacao(formData);
      }
      setShowFormModal(false);
      setCurrentLocacao(null);
      await fetchLocacoes();
    } catch (err) {
      const backendErrors = err.response?.data;
      let generalMessage = err.message || (currentLocacao ? 'Falha ao atualizar locação.' : 'Falha ao criar locação.');

      if (backendErrors && typeof backendErrors === 'object') {
        if (backendErrors.funcionario_locado && backendErrors.conflict_details) {
            generalMessage = typeof backendErrors.funcionario_locado === 'string'
                           ? backendErrors.funcionario_locado
                           : (Array.isArray(backendErrors.funcionario_locado) ? backendErrors.funcionario_locado.join('; ') : "Conflito de locação detectado para funcionário.");
        } else {
            const messages = Object.values(backendErrors).flat().join('; ');
            if (messages) generalMessage = messages;
        }
      }

      setError(generalMessage);
      console.error("API Submit Locação Error:", err.response?.data || err.message);

      if (backendErrors && typeof backendErrors === 'object') {
        throw { response: { data: backendErrors } };
      }
      throw err;
    } finally {
      setIsLoadingForm(false);
    }
  };

  const handleFormCancel = () => {
    setShowFormModal(false);
    setCurrentLocacao(null);
    setError(null); // Clear any errors when form is cancelled
  };

  const handleTransferSuccess = useCallback(async () => {
    setShowFormModal(false);    // Close the main form modal
    setCurrentLocacao(null);    // Clear current locacao being edited/created
    setError(null);           // Clear any top-level errors in LocacoesPage
    await fetchLocacoes();      // Refresh the main list of locações
    // Optionally, add a success message here, e.g., using a toast notification library
    // alert('Funcionário transferido com sucesso!');
  }, [fetchLocacoes]);

  const handleViewDetails = (locacaoId) => {
    setSelectedLocacaoId(locacaoId);
  };

  const handleCloseDetailModal = () => {
    setSelectedLocacaoId(null);
  };

  // Custom Y-axis tick formatter
  const formatYAxisTick = (tickItem) => {
    // Assuming tickItem is the date string "YYYY-MM-DD"
    const date = new Date(tickItem);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };


  return (
    <div className="container mx-auto px-4 py-6">
      {/* Chart Section */}
      <div className="mb-8 p-4 border rounded-lg shadow bg-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-700">Custo Diário de Locações (Últimos 30 dias)</h2>
          <div className="flex items-center">
            <label htmlFor="obraChartFilter" className="mr-2 text-sm font-medium text-gray-700">Filtrar por Obra:</label>
            <select
              id="obraChartFilter"
              value={selectedObraIdForChart}
              onChange={handleObraFilterChange}
              className="block w-full md:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm"
            >
              <option value="">Todas as Obras</option>
              {obras.map((obra) => (
                <option key={obra.id} value={obra.id}>
                  {obra.nome_obra}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoadingChart && <p className="text-center text-gray-500">Carregando gráfico...</p>}
        {chartError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Erro no gráfico: </strong>
            <span className="block sm:inline">{chartError}</span>
          </div>
        )}
        {!isLoadingChart && !chartError && chartData.length === 0 && (
          <p className="text-center text-gray-500">Nenhum dado de locação encontrado para o período ou filtro selecionado.</p>
        )}
        {!isLoadingChart && !chartError && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={chartData}
              layout="vertical" // For horizontal bar chart
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 'dataMax + 1000']} label={{ value: 'Custo Total (R$)', position: 'insideBottomRight', offset: -10, dy:10, fontSize: 12 }} />
              <YAxis
                dataKey="date"
                type="category"
                width={80}
                tickFormatter={formatYAxisTick}
                label={{ value: 'Data', angle: -90, position: 'insideLeft', fontSize: 12 }}
              />
              <Tooltip
                formatter={(value, name, props) => {
                  const formattedValue = `R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                  return [formattedValue, "Custo Total"];
                }}
                labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR', { year: 'numeric', month: 'short', day: 'numeric' })}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="total_cost" name="Custo Total Diário" fill="#8884d8">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.total_cost > 0 ? '#8884d8' : '#FFBB28'} />
                  // Simpler: one color, warning icon handled by custom tick or label
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
         <div className="mt-2 text-xs text-gray-500">
            <span className="inline-block w-3 h-3 bg-[#FFBB28] mr-1"></span> Dias sem locações (ou custo zero). Custo atribuído ao dia de início da locação.
        </div>
      </div>

      {/* Existing Locações Management Section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestão de Locações</h1>
        <button
          onClick={handleAddNew}
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-4 focus:ring-primary-300 disabled:bg-primary-300"
        >
          Nova Locação
        </button>
      </div>

      {error && !showFormModal && !selectedLocacaoId && ( // Only show general page error if no modal is open
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Erro: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <LocacoesTable
        locacoes={locacoes}
        obras={obras} // obras state is used by LocacoesTable and Form
        equipes={equipes}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewDetails={handleViewDetails} // Pass the handler
        isLoading={isLoading}
      />

      {selectedLocacaoId && (
        <LocacaoDetailModal
          locacaoId={selectedLocacaoId}
          onClose={handleCloseDetailModal}
        />
      )}

      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              {currentLocacao && currentLocacao.id ? 'Editar Locação' : 'Adicionar Nova Locação'}
            </h2>
            {error && ( // Error display specific to the modal
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Erro no formulário: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
            <LocacaoForm
              initialData={currentLocacao}
              obras={obras}
              equipes={equipes}
              onSubmit={handleApiSubmit}
              onCancel={handleFormCancel}
              isLoading={isLoadingForm}
              onTransferSuccess={handleTransferSuccess} // New prop
            />
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Confirmar Exclusão</h2>
            <p className="mb-6">Tem certeza que deseja excluir esta locação? Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isLoading}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md focus:ring-4 focus:outline-none focus:ring-gray-300 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md focus:ring-4 focus:outline-none focus:ring-red-300 disabled:opacity-50"
              >
                {isLoading ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocacoesPage;
