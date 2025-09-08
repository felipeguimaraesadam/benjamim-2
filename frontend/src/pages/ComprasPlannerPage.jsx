import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { toast } from 'react-toastify';
import * as api from '../services/api';
import ComprasTable from '../components/tables/ComprasTable';
import CompraForm from '../components/forms/CompraForm';
import CompraDetailModal from '../components/modals/CompraDetailModal';
import PaginationControls from '../components/utils/PaginationControls';
import { showSuccessToast, showErrorToast } from '../utils/toastUtils.js';
import SpinnerIcon from '../components/utils/SpinnerIcon';
import { exportPayrollReportToCSV } from '../utils/csvExporter';
import {
  formatDateToDMY,
  getStartOfWeek,
  formatDateToYYYYMMDD,
} from '../utils/dateUtils.js';
import ComprasWeeklyPlanner from '../components/WeeklyPlanner/ComprasWeeklyPlanner';
import ObraAutocomplete from '../components/forms/ObraAutocomplete';

const ComprasPlannerPage = () => {
  const [compras, setCompras] = useState([]);
  const [obras, setObras] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [currentCompra, setCurrentCompra] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [compraToDeleteId, setCompraToDeleteId] = useState(null);
  const [selectedCompraId, setSelectedCompraId] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [selectedObraIdForChart, setSelectedObraIdForChart] = useState('');
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [chartError, setChartError] = useState(null);
  const [selectedObra, setSelectedObra] = useState(null);

  const fetchCompras = useCallback(
    async (page = 1, obraId = null) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = { page };
        if (obraId) {
          params.obra_id = obraId;
        }
        const response = await api.getCompras(params);
        setCompras(response.data.results);
        if (currentPage !== page) {
          setCurrentPage(page);
        }
      } catch (err) {
        const errorMsg = err.message || 'Falha ao buscar compras.';
        setError(errorMsg);
        showErrorToast(errorMsg);
        console.error('Fetch Compras Error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [PAGE_SIZE, currentPage]
  );

  const fetchObras = useCallback(async () => {
    try {
      const response = await api.getObras();
      console.log('Obras response:', response);
      const obrasData =
        response?.data?.results ||
        response?.data ||
        (Array.isArray(response) ? response : []);
      setObras(Array.isArray(obrasData) ? obrasData : []);
    } catch (err) {
      console.error('Fetch Obras for CompraForm/Chart Filter Error:', err);
      setObras([]);
    }
  }, []);

  const fetchChartData = useCallback(async obraId => {
    setIsLoadingChart(true);
    setChartError(null);
    try {
      const response = await api.getCompraCustoDiarioChart(obraId);
      const formattedData = response.data.map(item => ({ ...item }));
      setChartData(formattedData);
    } catch (err) {
      setChartError(err.message || 'Falha ao buscar dados do gráfico.');
      console.error('Fetch Chart Data Error:', err);
    } finally {
      setIsLoadingChart(false);
    }
  }, []);

  const fetchFornecedores = useCallback(async () => {
    try {
      const response = await api.getFornecedores();
      const fornecedoresData =
        response?.data?.results ||
        response?.data ||
        (Array.isArray(response) ? response : []);
      setFornecedores(Array.isArray(fornecedoresData) ? fornecedoresData : []);
    } catch (err) {
      console.error('Fetch Fornecedores for CompraForm Error:', err);
      setFornecedores([]);
    }
  }, []);

  useEffect(() => {
    fetchObras();
    fetchFornecedores();
    fetchChartData(selectedObraIdForChart || null);
  }, [fetchObras, fetchFornecedores, fetchChartData, selectedObraIdForChart]);

  useEffect(() => {
    fetchCompras(currentPage, selectedObra?.id);
  }, [currentPage, selectedObra, fetchCompras]);

  const handleObraFilterChange = event => {
    setSelectedObraIdForChart(event.target.value);
  };

  const confirmDelete = async () => {
    if (!compraToDeleteId) return;
    setIsDeleting(true);
    setError(null);
    try {
      await api.deleteCompra(compraToDeleteId);
      showSuccessToast('Compra excluída com sucesso!');
      setCompraToDeleteId(null);
      setShowDeleteConfirm(false);
      const newPage =
        compras.length === 1 && currentPage > 1
          ? currentPage - 1
          : currentPage;
      fetchCompras(newPage, selectedObra?.id);
    } catch (err) {
      const errorMsg = err.message || 'Falha ao excluir compra.';
      setError(errorMsg);
      showErrorToast(errorMsg);
      console.error('Delete Compra Error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleApiSubmit = async (formData, anexos) => {
    setIsLoadingForm(true);
    setError(null);
    const isEditing = currentCompra && currentCompra.id;

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== undefined) {
        data.append(key, formData[key]);
      }
    });

    if (anexos && anexos.length > 0) {
      anexos.forEach(anexo => {
        data.append('anexos', anexo);
      });
    }

    try {
      let response;
      if (isEditing) {
        response = await api.updateCompra(currentCompra.id, data);
        showSuccessToast('Compra atualizada com sucesso!');
      } else {
        response = await api.createCompra(data);
        showSuccessToast('Compra criada com sucesso!');
      }
      setShowFormModal(false);
      setCurrentCompra(null);
      const pageToFetch = isEditing ? currentPage : 1;
      fetchCompras(pageToFetch, selectedObra?.id);
      fetchChartData(selectedObraIdForChart || null);
    } catch (err) {
      const errorMsg = err.message || 'Falha ao salvar compra.';
      setError(errorMsg);
      showErrorToast(errorMsg);
      console.error('Submit Compra Error:', err);
    } finally {
      setIsLoadingForm(false);
    }
  };

  const handleEdit = compra => {
    setCurrentCompra(compra);
    setShowFormModal(true);
  };

  const handleDelete = compraId => {
    setCompraToDeleteId(compraId);
    setShowDeleteConfirm(true);
  };

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setCurrentCompra(null);
  };

  const handleCloseDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setCompraToDeleteId(null);
  };

  const handleOpenDetailModal = compraId => {
    setSelectedCompraId(compraId);
  };

  const handleCloseDetailModal = () => {
    setSelectedCompraId(null);
  };

  const formatDateTick = tickItem => {
    const date = new Date(tickItem + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const formatTooltipLabel = label => {
    const date = new Date(label + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTooltipValue = (value, name) => {
    if (name === 'total_cost') {
      return [
        Number(value).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }),
        'Custo Total',
      ];
    }
    return [value, name];
  };

  const dataMax =
    chartData.length > 0 ? Math.max(...chartData.map(d => d.total_cost)) : 0;
  const yAxisDomainMax = dataMax > 0 ? dataMax + 1000 : 100;

  const displayData = chartData.map(entry => {
    if (entry.total_cost === 0 && entry.has_compras === false) {
      return { ...entry, barValue: yAxisDomainMax };
    }
    return { ...entry, barValue: entry.total_cost };
  });

  const handlePageChange = page => {
    setCurrentPage(page);
  };

  const totalPages = Math.ceil(compras.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const currentCompras = compras.slice(startIndex, endIndex);

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Planejador de Compras
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie e visualize suas compras de forma eficiente
          </p>
        </div>

        {/* Filtro por Obra */}
        <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow bg-white dark:bg-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filtrar por Obra:
              </label>
              <ObraAutocomplete
                obras={obras}
                selectedObra={selectedObra}
                onObraChange={setSelectedObra}
                placeholder="Selecione uma obra para filtrar..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFormModal(true)}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors duration-200 font-medium"
              >
                Nova Compra
              </button>
            </div>
          </div>
        </div>

        {/* Weekly Planner Section */}
        <div className="mb-8 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow bg-white dark:bg-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
              Planejador Semanal de Compras
            </h2>
          </div>
          <div className="h-[600px] flex flex-col">
            <ComprasWeeklyPlanner selectedObra={selectedObra} />
          </div>
        </div>

        {/* Chart Section */}
        <div className="mb-8 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow bg-white dark:bg-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
              Custo Diário de Compras (Últimos 30 dias)
            </h2>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filtrar por Obra:
              </label>
              <select
                value={selectedObraIdForChart}
                onChange={handleObraFilterChange}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value="">Todas as Obras</option>
                {obras.map(obra => (
                  <option key={obra.id} value={obra.id}>
                    {obra.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoadingChart && (
            <div className="flex justify-center items-center h-64">
              <SpinnerIcon className="w-8 h-8 text-primary-600" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                Carregando dados do gráfico...
              </span>
            </div>
          )}

          {chartError && (
            <div className="text-center p-4 text-red-600 dark:text-red-400">
              Erro: {chartError}
            </div>
          )}

          {!isLoadingChart && !chartError && (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={displayData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDateTick}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    domain={[0, yAxisDomainMax]}
                    tickFormatter={value =>
                      Number(value).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })
                    }
                  />
                  <Tooltip
                    labelFormatter={formatTooltipLabel}
                    formatter={formatTooltipValue}
                  />
                  <Legend />
                  <Bar dataKey="barValue" name="Custo Total">
                    {displayData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.total_cost === 0 && entry.has_compras === false
                            ? '#FFCA28'
                            : '#8884d8'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Table Section */}
        <div className="mb-8 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow bg-white dark:bg-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
              Lista de Compras
            </h2>
          </div>

          {isLoading && (
            <div className="flex justify-center items-center h-32">
              <SpinnerIcon className="w-8 h-8 text-primary-600" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                Carregando compras...
              </span>
            </div>
          )}

          {error && (
            <div className="text-center p-4 text-red-600 dark:text-red-400">
              Erro: {error}
            </div>
          )}

          {!isLoading && !error && (
            <>
              <ComprasTable
                compras={currentCompras}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onOpenDetail={handleOpenDetailModal}
              />
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>

        {/* Form Modal */}
        {showFormModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-4">
                {currentCompra ? 'Editar Compra' : 'Nova Compra'}
              </h3>
              <CompraForm
                initialData={currentCompra}
                obras={obras}
                fornecedores={fornecedores}
                onSubmit={handleApiSubmit}
                onCancel={handleCloseFormModal}
                isLoading={isLoadingForm}
              />
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-4">
                Confirmar Exclusão
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Tem certeza de que deseja excluir esta compra? Esta ação não pode ser desfeita.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCloseDeleteConfirm}
                  className="py-2 px-4 text-sm font-medium text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="py-2 px-4 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
                >
                  {isDeleting ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {selectedCompraId && (
          <CompraDetailModal
            compraId={selectedCompraId}
            onClose={handleCloseDetailModal}
          />
        )}
      </div>
    </div>
  );
};

export default ComprasPlannerPage;