import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import * as api from '../services/api';
import LocacoesTable from '../components/tables/LocacoesTable';
import LocacaoForm from '../components/forms/LocacaoForm';
import LocacaoDetailModal from '../components/modals/LocacaoDetailModal';
import PaginationControls from '../components/utils/PaginationControls';
import { showSuccessToast, showErrorToast } from '../utils/toastUtils.js';
import SpinnerIcon from '../components/utils/SpinnerIcon';
import { exportPayrollReportToCSV } from '../utils/csvExporter';
import { formatDateToDMY, getStartOfWeek, formatDateToYYYYMMDD } from '../utils/dateUtils.js';
import WeeklyPlanner from '../components/WeeklyPlanner/WeeklyPlanner';

const LocacoesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [locacoes, setLocacoes] = useState([]);
  const [obras, setObras] = useState([]);
  const [equipes, setEquipes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const PAGE_SIZE = 10;
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [currentLocacao, setCurrentLocacao] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [locacaoToDeleteId, setLocacaoToDeleteId] = useState(null);
  const [selectedLocacaoId, setSelectedLocacaoId] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [selectedObraIdForChart, setSelectedObraIdForChart] = useState('');
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [chartError, setChartError] = useState(null);

  const fetchLocacoes = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
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
      const response = await api.getObras();
      const obrasData = response?.data?.results || response?.data || (Array.isArray(response) ? response : []);
      setObras(Array.isArray(obrasData) ? obrasData : []);
    } catch (err) {
      console.error("Fetch Obras for LocacaoForm/Chart Filter Error:", err);
      setObras([]);
    }
  }, []);

  const fetchChartData = useCallback(async (obraId) => {
    setIsLoadingChart(true);
    setChartError(null);
    try {
      const response = await api.getLocacaoCustoDiarioChart(obraId);
      const formattedData = response.data.map(item => ({ ...item }));
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
      const equipesData = response?.data?.results || response?.data || (Array.isArray(response) ? response : []);
      setEquipes(Array.isArray(equipesData) ? equipesData : []);
    } catch (err) {
      console.error("Fetch Equipes for LocacaoForm Error:", err);
      setEquipes([]);
    }
  }, []);

  useEffect(() => {
    fetchObras();
    fetchEquipes();
    fetchChartData(selectedObraIdForChart || null);
  }, [fetchObras, fetchEquipes, fetchChartData, selectedObraIdForChart]);

  useEffect(() => {
    fetchLocacoes(currentPage);
  }, [currentPage, fetchLocacoes]);

  const handleObraFilterChange = (event) => {
    setSelectedObraIdForChart(event.target.value);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
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
    setError(null);
    setShowFormModal(true);
  };

  const handleDelete = (id) => {
    setLocacaoToDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!locacaoToDeleteId) return;
    setIsDeleting(true);
    setError(null);
    try {
      await api.deleteLocacao(locacaoToDeleteId);
      showSuccessToast('Locação excluída com sucesso!');
      setLocacaoToDeleteId(null);
      setShowDeleteConfirm(false);
      if (locacoes.length === 1 && currentPage > 1) {
        fetchLocacoes(currentPage - 1);
      } else {
        fetchLocacoes(currentPage);
      }
    } catch (err) {
      const errorMsg = err.message || 'Falha ao excluir locação.';
      setError(errorMsg);
      showErrorToast(errorMsg);
      console.error("Delete Locação Error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleApiSubmit = async (formData) => {
    setIsLoadingForm(true);
    setError(null);
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
      fetchLocacoes(isEditing ? currentPage : 1);
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
      setError(generalMessage);
      showErrorToast(isEditing ? 'Erro ao atualizar locação.' : 'Erro ao criar locação.');
      console.error("API Submit Locação Error:", err.response?.data || err.message);
      if (backendErrors && typeof backendErrors === 'object') {
        throw { response: { data: backendErrors } };
      }
    } finally {
      setIsLoadingForm(false);
    }
  };

  const handleFormCancel = () => {
    setShowFormModal(false);
    setCurrentLocacao(null);
    setError(null);
  };

  const handleTransferSuccess = useCallback(async () => {
    setShowFormModal(false);
    setCurrentLocacao(null);
    setError(null);
    showSuccessToast('Funcionário transferido com sucesso!');
    fetchLocacoes(currentPage);
  }, [fetchLocacoes, currentPage]);

  const handleViewDetails = (locacaoId) => {
    setSelectedLocacaoId(locacaoId);
  };

  const handleCloseDetailModal = () => {
    setSelectedLocacaoId(null);
  };

  const formatDateTick = (tickItem) => {
    const date = new Date(tickItem + 'T00:00:00');
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

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportStartDate, setReportStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [preCheckAlertDays, setPreCheckAlertDays] = useState([]);
  const [isPreChecking, setIsPreChecking] = useState(false);
  const [preCheckError, setPreCheckError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [step, setStep] = useState(1);
  const [preCheckMedicoesPendentes, setPreCheckMedicoesPendentes] = useState([]);

  const handleWeekSelectorChange = (event) => {
    const selectedWeekOffset = parseInt(event.target.value, 10);
    if (isNaN(selectedWeekOffset)) return;
    const today = new Date();
    const startOfCurrentWeek = getStartOfWeek(today, 1);
    const targetMonday = new Date(startOfCurrentWeek);
    targetMonday.setDate(startOfCurrentWeek.getDate() + (selectedWeekOffset * 7));
    const targetSunday = new Date(targetMonday);
    targetSunday.setDate(targetMonday.getDate() + 6);
    setReportStartDate(formatDateToYYYYMMDD(targetMonday));
    setReportEndDate(formatDateToYYYYMMDD(targetSunday));
  };

  const weekOptions = [
    { label: "Esta Semana", value: 0 }, { label: "Semana Passada", value: -1 },
    { label: "2 Semanas Atrás", value: -2 }, { label: "3 Semanas Atrás", value: -3 },
    { label: "4 Semanas Atrás", value: -4 }, { label: "5 Semanas Atrás", value: -5 },
  ];

  const handleOpenReportModal = () => {
    setShowReportModal(true);
    const today = new Date();
    const sevenDaysAgo = new Date(new Date().setDate(today.getDate() - 6));
    setReportStartDate(formatDateToYYYYMMDD(sevenDaysAgo));
    setReportEndDate(formatDateToYYYYMMDD(today));
    setPreCheckAlertDays([]); setPreCheckMedicoesPendentes([]);
    setReportData(null); setPreCheckError(null); setReportError(null); setStep(1);
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
    setPreCheckAlertDays([]); setPreCheckMedicoesPendentes([]);
    setReportData(null); setPreCheckError(null); setReportError(null); setStep(1);
  };

  const handlePreCheck = async () => {
    if (!reportStartDate || !reportEndDate) {
      setPreCheckError("Por favor, selecione as datas de início e fim."); return;
    }
    setIsPreChecking(true); setPreCheckError(null); setPreCheckMedicoesPendentes([]); setReportData(null);
    try {
      const response = await api.getRelatorioFolhaPagamentoPreCheck(reportStartDate, reportEndDate);
      const diasSemLocacoes = response.data.dias_sem_locacoes || [];
      const medicoesPendentes = response.data.medicoes_pendentes || [];
      setPreCheckAlertDays(diasSemLocacoes); setPreCheckMedicoesPendentes(medicoesPendentes);
      setStep(2);
    } catch (err) {
      setPreCheckError(err.response?.data?.error || err.message || 'Falha ao realizar pré-verificação.'); setStep(1);
    } finally {
      setIsPreChecking(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!reportStartDate || !reportEndDate) {
      setReportError("Por favor, selecione as datas de início e fim."); return;
    }
    setIsGeneratingReport(true); setReportError(null);
    try {
      const obraId = null;
      const response = await api.generateRelatorioFolhaPagamentoCSVData(reportStartDate, reportEndDate, obraId);
      setReportData(response.data); setStep(3);
    } catch (err) {
      setReportError(err.response?.data?.error || err.message || 'Falha ao gerar relatório.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleContinueDespiteAlert = () => handleGenerateReport();

  const handleExportLocacaoPagamentoPDFFromModal = async () => {
    if (!reportStartDate || !reportEndDate) {
      setReportError("Datas de início e fim são obrigatórias para PDF.");
      toast.warn("Datas de início e fim são obrigatórias para PDF."); return;
    }
    setIsGeneratingReport(true); setReportError(null);
    try {
      const obraId = null;
      const response = await api.gerarRelatorioPagamentoLocacoesPDF(reportStartDate, reportEndDate, obraId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `Relatorio_Pagamento_Locacoes_${reportStartDate}_a_${reportEndDate}.pdf`;
      link.setAttribute('download', filename);
      document.body.appendChild(link); link.click(); link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || "Falha ao gerar PDF do relatório de pagamento de locações.";
      setReportError(errorMessage); toast.error("Falha ao gerar PDF: " + errorMessage);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Nova Seção do Weekly Planner (AGORA PRIMEIRO) */}
      {/* Removed min-h-[75vh] to prevent excessive empty space */}
      <div className="mb-8 flex flex-col">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4 flex-shrink-0">Planejamento Semanal de Locações</h2>
        <div className="flex-grow"> {/* This flex-grow is fine if the parent (flex flex-col) doesn't force a huge height */}
          <WeeklyPlanner obras={obras} equipes={equipes} />
        </div>
      </div>

      {/* Chart Section (AGORA SEGUNDO) */}
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
                <option key={obra.id} value={obra.id}>{obra.nome_obra}</option>
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
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={formatDateTick} label={{ value: 'Data (Últimos 30 dias)', position: 'insideBottom', offset: -15, dy:10, fontSize: 12 }} interval={chartData.length > 15 ? Math.floor(chartData.length / 15) : 0} angle={chartData.length > 20 ? -30 : 0} textAnchor={chartData.length > 20 ? 'end' : 'middle'} height={50} />
              <YAxis label={{ value: 'Custo (R$)', angle: -90, position: 'insideLeft', fontSize: 12 }} tickFormatter={(value) => parseFloat(value).toLocaleString('pt-BR')} domain={[0, 'dataMax + 1000']} />
              <Tooltip labelFormatter={formatTooltipLabel} formatter={formatTooltipValue} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="total_cost" name="Custo Total Diário">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.total_cost === 0 && entry.has_locacoes === false ? "#FFCA28" : "#8884d8"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        <div className="mt-4 text-xs text-gray-500 text-center">
          <span className="inline-block w-3 h-3 bg-[#FFCA28] mr-1 align-middle"></span>
          <span className="align-middle">Dias sem locações (ou custo zero). Custo atribuído ao dia de início da locação.</span>
        </div>
      </div>

      {/* Seção da Tabela de Locações (Pode ser removida ou mantida conforme necessidade) */}
      {/* O título e botões abaixo são da listagem antiga, mantidos por enquanto */}
      <div className="flex justify-between items-center mb-6 mt-12">
        <h1 className="text-2xl font-bold text-gray-800">Listagem Detalhada de Locações</h1>
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
            Nova Locação (Lista)
            </button>
        </div>
      </div>

      {error && !isLoading && !showFormModal && !showDeleteConfirm && locacoes.length === 0 && (
         <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4 text-center" role="alert">
          <p className="font-bold">Falha ao Carregar Dados</p>
          <p>{error}</p>
        </div>
      )}

      <LocacoesTable
        locacoes={locacoes}
        obras={obras}
        equipes={equipes}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewDetails={handleViewDetails}
        isLoading={isLoading && locacoes.length === 0}
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
            {error && (
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
              onTransferSuccess={handleTransferSuccess}
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
