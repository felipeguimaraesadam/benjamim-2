import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import * as api from '../services/api';
import LocacoesTable from '../components/tables/LocacoesTable';
import LocacaoForm from '../components/forms/LocacaoForm';
import LocacaoDetailModal from '../components/modals/LocacaoDetailModal';
import PaginationControls from '../components/utils/PaginationControls';
import { showSuccessToast, showErrorToast } from '../utils/toastUtils.js'; // Import toast utilities
import SpinnerIcon from '../components/utils/SpinnerIcon'; // Import SpinnerIcon
import { exportPayrollReportToCSV } from '../utils/csvExporter'; // Import CSV exporter

const LocacoesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [locacoes, setLocacoes] = useState([]);
  const [obras, setObras] = useState([]);
  const [equipes, setEquipes] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Page data loading
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const PAGE_SIZE = 10;
  const [isLoadingForm, setIsLoadingForm] = useState(false); // Form submission
  const [isDeleting, setIsDeleting] = useState(false); // Delete operation
  const [error, setError] = useState(null); // General page/form errors
  const [showFormModal, setShowFormModal] = useState(false);
  const [currentLocacao, setCurrentLocacao] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [locacaoToDeleteId, setLocacaoToDeleteId] = useState(null);

  const [selectedLocacaoId, setSelectedLocacaoId] = useState(null); // For detail modal

  // State for chart
  const [chartData, setChartData] = useState([]); // Assuming this is still needed
  const [selectedObraIdForChart, setSelectedObraIdForChart] = useState(''); // Empty string for "All Obras"
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [chartError, setChartError] = useState(null);


  const fetchLocacoes = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      // Pass the page to the API call
      const response = await api.getLocacoes({ page: page });
      setLocacoes(response.data.results);
      setTotalItems(response.data.count);
      setTotalPages(Math.ceil(response.data.count / PAGE_SIZE));
      setCurrentPage(page);
    } catch (err) {
      const errorMsg = err.message || 'Falha ao buscar locações.';
      setError(errorMsg);
      showErrorToast(errorMsg);
      console.error("Fetch Locações Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [PAGE_SIZE]);

  const fetchObras = useCallback(async () => {
    try {
      // For simplicity, assuming obras list for dropdowns doesn't need pagination itself.
      const response = await api.getObras();
      // Ensure obrasData is always an array.
      const obrasData = response?.data?.results || response?.data || (Array.isArray(response) ? response : []);
      setObras(Array.isArray(obrasData) ? obrasData : []);
    } catch (err) {
      console.error("Fetch Obras for LocacaoForm/Chart Filter Error:", err);
      setObras([]); // Set to empty array on error
    }
  }, []);


  const fetchChartData = useCallback(async (obraId) => { // Assuming chart data is not paginated or handled separately
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
      // Ensure equipesData is always an array.
      const equipesData = response?.data?.results || response?.data || (Array.isArray(response) ? response : []);
      setEquipes(Array.isArray(equipesData) ? equipesData : []);
    } catch (err) {
      console.error("Fetch Equipes for LocacaoForm Error:", err);
      setEquipes([]); // Set to empty array on error
    }
  }, []);

  useEffect(() => {
    fetchLocacoes(currentPage); // Fetch locações for the current page
    fetchObras();
    fetchEquipes(); // Assuming equipes also doesn't need pagination for dropdowns
    fetchChartData(selectedObraIdForChart || null);
  }, [fetchObras, fetchEquipes, fetchChartData, selectedObraIdForChart, currentPage, fetchLocacoes]);
  // Removed fetchLocacoes from here and added currentPage to trigger refetchLocacoes directly in its own useEffect or on page change.
  // Re-added fetchLocacoes to ensure it's called when other dependencies change if needed, will be memoized by useCallback.

  // useEffect for initial load and when currentPage changes for locacoes
  useEffect(() => {
    fetchLocacoes(currentPage);
  }, [currentPage, fetchLocacoes]);


  const handleObraFilterChange = (event) => {
    setSelectedObraIdForChart(event.target.value);
    // Chart data will be refetched by its own useEffect dependency.
    // Locacoes list is independent of this filter for now.
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage); // This will trigger the useEffect for fetchLocacoes
    }
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
    setIsDeleting(true);
    setError(null); // Clear general errors
    try {
      await api.deleteLocacao(locacaoToDeleteId);
      showSuccessToast('Locação excluída com sucesso!');
      setLocacaoToDeleteId(null);
      setShowDeleteConfirm(false);
      // Refetch locacoes, adjust page if last item on a page was deleted
      if (locacoes.length === 1 && currentPage > 1) {
        fetchLocacoes(currentPage - 1);
      } else {
        fetchLocacoes(currentPage);
      }
    } catch (err) {
      const errorMsg = err.message || 'Falha ao excluir locação.';
      setError(errorMsg); // Can be shown in a general error display area if needed
      showErrorToast(errorMsg);
      console.error("Delete Locação Error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleApiSubmit = async (formData) => {
    setIsLoadingForm(true);
    setError(null); // Clear previous form-specific errors shown in modal
    const isEditing = currentLocacao && currentLocacao.id;
    try {
      if (isEditing) {
        await api.updateLocacao(currentLocacao.id, formData);
        showSuccessToast('Locação atualizada com sucesso!');
      } else {
        await api.createLocacao(formData);
        showSuccessToast('Locação criada com sucesso!');
      }
      setShowFormModal(false);
      setCurrentLocacao(null);
      fetchLocacoes(isEditing ? currentPage : 1); // Refetch current page on update, or first page on create
    } catch (err) {
      const backendErrors = err.response?.data;
      let generalMessage = err.message || (isEditing ? 'Falha ao atualizar locação.' : 'Falha ao criar locação.');

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

      setError(generalMessage); // This error will be displayed in the modal
      showErrorToast(isEditing ? 'Erro ao atualizar locação.' : 'Erro ao criar locação.'); // General toast
      console.error("API Submit Locação Error:", err.response?.data || err.message);

      // Propagate for LocacaoForm to handle specific field errors if it's designed to
      if (backendErrors && typeof backendErrors === 'object') {
        throw { response: { data: backendErrors } };
      }
      // If not handled by LocacaoForm's internal error display, the setError above will show in modal
      // throw err; // Re-throwing might be redundant if setError and showErrorToast cover feedback
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
    setError(null);
    // Consider showing a success toast for transfer if desired
    showSuccessToast('Funcionário transferido com sucesso!'); // Added toast
    fetchLocacoes(currentPage); // Refresh current page
  }, [fetchLocacoes, currentPage]); // Added currentPage

  const handleViewDetails = (locacaoId) => {
    setSelectedLocacaoId(locacaoId);
  };

  const handleCloseDetailModal = () => {
    setSelectedLocacaoId(null);
  };

  // Custom X-axis tick formatter for vertical chart
  const formatDateTick = (tickItem) => {
    // Assuming tickItem is the date string "YYYY-MM-DD"
    const date = new Date(tickItem + 'T00:00:00'); // Ensure parsing as local date
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const formatTooltipLabel = (label) => {
    const date = new Date(label + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTooltipValue = (value, name, props) => {
    if (props.payload.total_cost === 0 && props.payload.has_locacoes === false) {
      return ["Sem locações", "Status"];
    }
    const formattedValue = `R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return [formattedValue, "Custo Total"];
  };

  // State for Payroll Report
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportStartDate, setReportStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [preCheckAlertDays, setPreCheckAlertDays] = useState([]);
  const [isPreChecking, setIsPreChecking] = useState(false);
  const [preCheckError, setPreCheckError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [step, setStep] = useState(1); // 1: date selection, 2: pre-check alert, 3: report view
  const [preCheckMedicoesPendentes, setPreCheckMedicoesPendentes] = useState([]); // New state

  // Helper function to get the start of a week (Monday)
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay(); // Sunday - 0, Monday - 1, ..., Saturday - 6
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust if Sunday is 0
    return new Date(d.setDate(diff));
  };

  // Helper function to format date to YYYY-MM-DD
  const formatDateToYYYYMMDD = (date) => {
    return date.toISOString().split('T')[0];
  };

  const handleWeekSelectorChange = (event) => {
    const selectedWeekOffset = parseInt(event.target.value, 10);
    if (isNaN(selectedWeekOffset)) {
        return;
    }

    const today = new Date();
    const startOfCurrentWeek = getStartOfWeek(today);

    const targetMonday = new Date(startOfCurrentWeek);
    targetMonday.setDate(startOfCurrentWeek.getDate() + (selectedWeekOffset * 7));

    const targetSunday = new Date(targetMonday);
    targetSunday.setDate(targetMonday.getDate() + 6);

    setReportStartDate(formatDateToYYYYMMDD(targetMonday));
    setReportEndDate(formatDateToYYYYMMDD(targetSunday));
  };

  const weekOptions = [
    { label: "Esta Semana", value: 0 },
    { label: "Semana Passada", value: -1 },
    { label: "2 Semanas Atrás", value: -2 },
    { label: "3 Semanas Atrás", value: -3 },
    { label: "4 Semanas Atrás", value: -4 },
    { label: "5 Semanas Atrás", value: -5 },
  ];

  const handleOpenReportModal = () => {
    setShowReportModal(true);
    setReportStartDate(new Date().toISOString().split('T')[0]);
    const today = new Date();
    const sevenDaysAgo = new Date(today.setDate(today.getDate() - 6)); // Default to a 7-day period ending today
    setReportStartDate(sevenDaysAgo.toISOString().split('T')[0]);
    setReportEndDate(new Date().toISOString().split('T')[0]); // Reset today for end date
    setPreCheckAlertDays([]);
    setPreCheckMedicoesPendentes([]); // Reset new state
    setReportData(null);
    setPreCheckError(null);
    setReportError(null);
    setStep(1);
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
    // Reset all report states
    setPreCheckAlertDays([]);
    setPreCheckMedicoesPendentes([]); // Reset new state
    setReportData(null);
    setPreCheckError(null);
    setReportError(null);
    setStep(1);
  };

  const handlePreCheck = async () => {
    if (!reportStartDate || !reportEndDate) {
        setPreCheckError("Por favor, selecione as datas de início e fim.");
        return;
    }
    setIsPreChecking(true);
    setPreCheckError(null);
    setPreCheckMedicoesPendentes([]);
    setReportData(null); // Clear previous report
    try {
      const response = await api.getRelatorioFolhaPagamentoPreCheck(reportStartDate, reportEndDate);
      const diasSemLocacoes = response.data.dias_sem_locacoes || [];
      const medicoesPendentes = response.data.medicoes_pendentes || [];
      setPreCheckAlertDays(diasSemLocacoes);
      setPreCheckMedicoesPendentes(medicoesPendentes);

      if (diasSemLocacoes.length > 0 || medicoesPendentes.length > 0) {
        setStep(2); // Show alert step
      } else {
        // No alerts, proceed to generate report directly or enable generate button
        setStep(2); // Still go to step 2 to give option to generate if no direct generation
      }
    } catch (err) {
      setPreCheckError(err.response?.data?.error || err.message || 'Falha ao realizar pré-verificação.');
      setStep(1); // Stay on date selection if error
    } finally {
      setIsPreChecking(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!reportStartDate || !reportEndDate) {
        setReportError("Por favor, selecione as datas de início e fim."); // Should not happen if flow is correct
        return;
    }
    setIsGeneratingReport(true);
    setReportError(null);
    try {
      const response = await api.generateRelatorioFolhaPagamento(reportStartDate, reportEndDate);
      setReportData(response.data);
      setStep(3); // Show report view
    } catch (err) {
      setReportError(err.response?.data?.error || err.message || 'Falha ao gerar relatório.');
      // setStep(2); // Or back to date selection if severe
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleContinueDespiteAlert = () => {
    handleGenerateReport(); // Proceed to generate report
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
              margin={{ top: 5, right: 30, left: 20, bottom: 25 }} // Increased bottom margin for XAxis label
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDateTick}
                label={{ value: 'Data (Últimos 30 dias)', position: 'insideBottom', offset: -15, dy:10, fontSize: 12 }}
                interval={chartData.length > 15 ? Math.floor(chartData.length / 15) : 0} // Adjust interval to prevent overlap
                angle={chartData.length > 20 ? -30 : 0} // Angle ticks if many dates
                textAnchor={chartData.length > 20 ? 'end' : 'middle'} // Adjust anchor for angled ticks
                height={50} // Allocate space for angled labels if needed
              />
              <YAxis
                label={{ value: 'Custo (R$)', angle: -90, position: 'insideLeft', fontSize: 12 }}
                tickFormatter={(value) => parseFloat(value).toLocaleString('pt-BR')}
                domain={[0, 'dataMax + 1000']} // Add some padding to max value
              />
              <Tooltip
                labelFormatter={formatTooltipLabel}
                formatter={formatTooltipValue}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="total_cost" name="Custo Total Diário">
                {chartData.map((entry, index) => {
                  if (entry.total_cost === 0 && entry.has_locacoes === false) {
                    // For zero-cost days, render a minimal height bar
                    return <Cell key={`cell-${index}`} fill="#FFCA28" height={3} y={297} />; // y needs to be adjusted based on chart scale or use a custom bar.
                                                                                             // This fixed height approach with Cell is tricky due to y-coordinate.
                                                                                             // A better approach is to use a custom shape for the Bar.
                                                                                             // For now, let's use a different fill color and rely on tooltip.
                  }
                  return <Cell key={`cell-${index}`} fill="#8884d8" />;
                })}
              </Bar>
               {/* This is a simplified approach. For a truly minimal height bar for zero values,
                   you might need a custom <Bar shape={...} /> component or adjust y position carefully.
                   The current Cell approach will color the bar but it will still take normal space if not handled by Bar component itself.
                   Recharts typically handles zero-value bars by not rendering them or rendering at baseline.
                   We will ensure the bar is colored differently and the tooltip indicates "Sem locações".
                */}
            </BarChart>
          </ResponsiveContainer>
        )}
        <div className="mt-4 text-xs text-gray-500 text-center">
            <span className="inline-block w-3 h-3 bg-[#FFCA28] mr-1 align-middle"></span>
            <span className="align-middle">Dias sem locações (ou custo zero). Custo atribuído ao dia de início da locação.</span>
        </div>
      </div>

      {/* Existing Locações Management Section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestão de Locações</h1>
        <div>
            <button
                onClick={handleOpenReportModal}
                className="mr-3 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-4 focus:ring-green-300"
            >
                Relatório de Pagamento
            </button>
            <button
            onClick={handleAddNew}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-4 focus:ring-primary-300 disabled:bg-primary-300"
            >
            Nova Locação
            </button>
        </div>
      </div>

      {/* Page level error, if not related to form/modal context */}
      {error && !isLoading && !showFormModal && !showDeleteConfirm && locacoes.length === 0 && (
         <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4 text-center" role="alert">
          <p className="font-bold">Falha ao Carregar Dados</p>
          <p>{error}</p>
        </div>
      )}

      {/* Payroll Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity duration-300 ease-in-out">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">Relatório de Folha de Pagamento</h2>
                <button onClick={handleCloseReportModal} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>

            {/* Step 1: Date Selection */}
            {step === 1 && (
              <div>
                {/* New Week Selector */}
                <div className="mb-4">
                  <label htmlFor="weekSelector" className="block text-sm font-medium text-gray-700 mb-1">Selecionar Semana (Opcional):</label>
                  <select
                    id="weekSelector"
                    onChange={handleWeekSelectorChange}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    defaultValue=""
                  >
                    <option value="" disabled>Escolha uma semana...</option>
                    {weekOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Existing Date Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="reportStartDate" className="block text-sm font-medium text-gray-700 mb-1">Data de Início:</label>
                    <input
                      type="date"
                      id="reportStartDate"
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="reportEndDate" className="block text-sm font-medium text-gray-700 mb-1">Data de Fim:</label>
                    <input
                      type="date"
                      id="reportEndDate"
                      value={reportEndDate}
                      onChange={(e) => setReportEndDate(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                {preCheckError && <p className="text-red-500 text-sm mb-3">{preCheckError}</p>}
                <button
                  onClick={handlePreCheck}
                  disabled={isPreChecking || !reportStartDate || !reportEndDate}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-4 focus:ring-primary-300 disabled:opacity-50 flex items-center justify-center"
                >
                  {isPreChecking ? <SpinnerIcon className="w-5 h-5 mr-2" /> : null}
                  {isPreChecking ? 'Verificando...' : 'Verificar Disponibilidade de Dias'}
                </button>
              </div>
            )}

            {/* Step 2: Pre-check Alert */}
            {step === 2 && (
              <div className="my-4">
                {preCheckError && <p className="text-red-500 text-sm mb-3">{preCheckError}</p>}

                {(preCheckAlertDays.length > 0 || preCheckMedicoesPendentes.length > 0) ? (
                  <>
                    {preCheckAlertDays.length > 0 && (
                      <div className="p-4 mb-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
                        <h3 className="font-bold mb-2">Alerta: Dias Sem Locações Registradas!</h3>
                        <p className="mb-1">Foram encontrados os seguintes dias dentro do período selecionado que não possuem nenhuma locação ativa registrada:</p>
                        <ul className="list-disc list-inside mb-3">
                          {preCheckAlertDays.map(day => <li key={day}>{new Date(day + 'T00:00:00').toLocaleDateString('pt-BR')}</li>)}
                        </ul>
                      </div>
                    )}

                    {preCheckMedicoesPendentes.length > 0 && (
                      <div className="p-4 mb-4 bg-orange-100 border-l-4 border-orange-500 text-orange-700">
                        <h3 className="font-bold mb-2">Alerta: Medições Pendentes!</h3>
                        <p className="mb-1">As seguintes locações ativas no período possuem valor de pagamento zerado ou não definido e podem precisar de ajuste:</p>
                        <ul className="list-disc list-inside mb-3 text-xs">
                          {preCheckMedicoesPendentes.map(loc => (
                            <li key={loc.locacao_id}>
                              ID: {loc.locacao_id} - {loc.obra_nome} - {loc.recurso_locado} (Início: {new Date(loc.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR')}, Tipo: {loc.tipo_pagamento}, Valor: {loc.valor_pagamento === null ? 'NULO' : parseFloat(loc.valor_pagamento).toFixed(2)})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <p className="mb-3">Deseja gerar o relatório mesmo assim?</p>
                    <div className="flex justify-end space-x-3">
                       <button onClick={() => setStep(1)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md">Voltar/Corrigir Datas</button>
                       <button onClick={handleContinueDespiteAlert} disabled={isGeneratingReport} className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50">
                        {isGeneratingReport ? <SpinnerIcon className="w-5 h-5 mr-2" /> : null}
                        {isGeneratingReport ? 'Gerando...' : 'Continuar Mesmo Assim'}
                       </button>
                    </div>
                  </>
                ) : (
                  <div className="p-4 bg-green-100 border-l-4 border-green-500 text-green-700">
                    <h3 className="font-bold mb-2">Verificação Concluída</h3>
                    <p>Nenhuma pendência (dias sem locações ou medições zeradas) encontrada no período selecionado.</p>
                     <div className="flex justify-end space-x-3 mt-3">
                       <button onClick={() => setStep(1)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md">Voltar</button>
                       <button onClick={handleGenerateReport} disabled={isGeneratingReport} className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50">
                        {isGeneratingReport ? <SpinnerIcon className="w-5 h-5 mr-2" /> : null}
                        {isGeneratingReport ? 'Gerando...' : 'Gerar Relatório'}
                       </button>
                    </div>
                  </div>
                )}
                {reportError && <p className="text-red-500 text-sm mt-3">{reportError}</p>}
              </div>
            )}

            {/* Step 3: Report Display */}
            {step === 3 && reportData && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">Relatório Gerado</h3>
                    <button
                        onClick={() => exportPayrollReportToCSV(reportData, `relatorio_folha_pagamento_${reportStartDate}_a_${reportEndDate}.csv`)}
                        disabled={!reportData || reportData.length === 0}
                        className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-4 focus:ring-green-300 text-sm disabled:opacity-50"
                    >
                        Exportar para CSV
                    </button>
                </div>
                {reportData.length === 0 && <p className="text-gray-600">Nenhuma locação encontrada para o período e critérios selecionados.</p>}

                {reportData.map(obraData => (
                  <div key={obraData.obra_id} className="mb-6 p-4 border border-gray-200 rounded-lg shadow">
                    <div className="flex justify-between items-baseline mb-2">
                        <h4 className="text-lg font-semibold text-blue-700">{obraData.obra_nome}</h4>
                        <p className="text-md font-medium text-gray-700">Total na Obra: <span className="text-green-600 font-bold">R$ {parseFloat(obraData.total_a_pagar_na_obra_periodo).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                    </div>
                    {obraData.locacoes_na_obra.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                    <tr>
                                        <th scope="col" className="px-4 py-2">Funcionário</th>
                                        <th scope="col" className="px-4 py-2">Início</th>
                                        <th scope="col" className="px-4 py-2">Fim</th>
                                        <th scope="col" className="px-4 py-2">Tipo Pag.</th>
                                        <th scope="col" className="px-4 py-2 text-right">Valor Pag. (R$)</th>
                                        <th scope="col" className="px-4 py-2">Data Pag.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {obraData.locacoes_na_obra.map(loc => (
                                    <tr key={loc.locacao_id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-4 py-2">{loc.funcionario_nome || 'N/A'}</td>
                                        <td className="px-4 py-2">{new Date(loc.data_locacao_inicio + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                                        <td className="px-4 py-2">{new Date(loc.data_locacao_fim + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                                        <td className="px-4 py-2">{loc.tipo_pagamento}</td>
                                        <td className="px-4 py-2 text-right">{parseFloat(loc.valor_pagamento).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-2">{loc.data_pagamento ? new Date(loc.data_pagamento + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'}</td>
                                    </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 italic">Nenhuma locação de funcionário a pagar nesta obra para o período.</p>
                    )}
                  </div>
                ))}
                {reportData.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-300">
                        <p className="text-lg font-bold text-right text-gray-800">
                            Total Geral do Relatório:
                            <span className="text-green-700 ml-2">
                                R$ {reportData.reduce((sum, obra) => sum + parseFloat(obra.total_a_pagar_na_obra_periodo), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </p>
                    </div>
                )}
                 <div className="flex justify-end mt-6">
                    <button onClick={() => setStep(1)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md">Gerar Novo Relatório</button>
                 </div>
              </div>
            )}
             {isGeneratingReport && step !==3 && <p className="text-center text-gray-500 mt-4">{isGeneratingReport ? <SpinnerIcon className="w-5 h-5 mr-2 inline" /> : null} Gerando relatório...</p>}
             {reportError && step !== 3 && <p className="text-red-500 text-sm mt-3 text-center">{reportError}</p>}


          </div>
        </div>
      )}


      {error && !showFormModal && !selectedLocacaoId && ( // Only show general page error if no modal is open
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Erro: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <LocacoesTable
        locacoes={locacoes} // Now receives paginated data
        obras={obras}
        equipes={equipes}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewDetails={handleViewDetails}
        isLoading={isLoading && locacoes.length === 0} // Show table loading only if it's initial load or page change with no data yet
      />

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalItems={totalItems}
        itemsPerPage={PAGE_SIZE}
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
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md focus:ring-4 focus:outline-none focus:ring-red-300 disabled:opacity-50 flex items-center justify-center"
              >
                {isDeleting ? <SpinnerIcon className="w-5 h-5 mr-2" /> : null}
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocacoesPage;
