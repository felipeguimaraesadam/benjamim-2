import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import { toast } from 'react-toastify'; // Added toast import
import * as api from '../services/api';
import LocacoesTable from '../components/tables/LocacoesTable';
import LocacaoForm from '../components/forms/LocacaoForm';
import LocacaoDetailModal from '../components/modals/LocacaoDetailModal';
import PaginationControls from '../components/utils/PaginationControls';
import { showSuccessToast, showErrorToast } from '../utils/toastUtils.js';
import SpinnerIcon from '../components/utils/SpinnerIcon';
import { exportPayrollReportToCSV } from '../utils/csvExporter';
import {
  formatDateToDMY,
  getStartOfWeek,
  formatDateToYYYYMMDD,
} from '../utils/dateUtils.js';
import WeeklyPlanner from '../components/WeeklyPlanner/WeeklyPlanner';
import ObraAutocomplete from '../components/forms/ObraAutocomplete';

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
  const [selectedObra, setSelectedObra] = useState(null);

  const fetchLocacoes = useCallback(
    async (page = 1, obraId = null) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = { page };
        if (obraId) {
          params.obra_id = obraId;
        }
        const response = await api.getLocacoes(params);
        setLocacoes(response.data.results);
        setTotalItems(response.data.count);
        setTotalPages(Math.ceil(response.data.count / PAGE_SIZE));
        if (currentPage !== page) {
          setCurrentPage(page);
        }
      } catch (err) {
        const errorMsg = err.message || 'Falha ao buscar locações.';
        setError(errorMsg);
        showErrorToast(errorMsg);
        console.error('Fetch Locações Error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [PAGE_SIZE, currentPage]
  );

  const fetchObras = useCallback(async () => {
    try {
      const response = await api.getObras();
      const obrasData =
        response?.data?.results ||
        response?.data ||
        (Array.isArray(response) ? response : []);
      setObras(Array.isArray(obrasData) ? obrasData : []);
    } catch (err) {
      console.error('Fetch Obras for LocacaoForm/Chart Filter Error:', err);
      setObras([]);
    }
  }, []);

  const fetchChartData = useCallback(async obraId => {
    setIsLoadingChart(true);
    setChartError(null);
    try {
      const response = await api.getLocacaoCustoDiarioChart(obraId);
      const formattedData = response.data.map(item => ({ ...item }));
      setChartData(formattedData);
    } catch (err) {
      setChartError(err.message || 'Falha ao buscar dados do gráfico.');
      console.error('Fetch Chart Data Error:', err);
    } finally {
      setIsLoadingChart(false);
    }
  }, []);

  const fetchEquipes = useCallback(async () => {
    try {
      const response = await api.getEquipes();
      const equipesData =
        response?.data?.results ||
        response?.data ||
        (Array.isArray(response) ? response : []);
      setEquipes(Array.isArray(equipesData) ? equipesData : []);
    } catch (err) {
      console.error('Fetch Equipes for LocacaoForm Error:', err);
      setEquipes([]);
    }
  }, []);

  useEffect(() => {
    fetchObras();
    fetchEquipes();
    fetchChartData(selectedObraIdForChart || null);
  }, [fetchObras, fetchEquipes, fetchChartData, selectedObraIdForChart]);

  useEffect(() => {
    fetchLocacoes(currentPage, selectedObra?.id);
  }, [currentPage, selectedObra, fetchLocacoes]);

  const handleObraFilterChange = event => {
    setSelectedObraIdForChart(event.target.value);
  };

  const handlePageChange = newPage => {
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

  const handleEdit = locacao => {
    setCurrentLocacao(locacao);
    setError(null);
    setShowFormModal(true);
  };

  const handleDelete = id => {
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
      const newPage = locacoes.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      fetchLocacoes(newPage, selectedObra?.id);
    } catch (err) {
      const errorMsg = err.message || 'Falha ao excluir locação.';
      setError(errorMsg);
      showErrorToast(errorMsg);
      console.error('Delete Locação Error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleApiSubmit = async formData => {
    setIsLoadingForm(true);
    setError(null);
    const isEditing = currentLocacao && currentLocacao.id;
    try {
      let response;
      if (isEditing) {
        response = await api.updateLocacao(currentLocacao.id, formData);
        showSuccessToast('Locação atualizada com sucesso!');
      } else {
        response = await api.createLocacao(formData);
        const createdRentals = response.data;
        if (Array.isArray(createdRentals) && createdRentals.length > 1) {
          showSuccessToast(
            `${createdRentals.length} locações criadas com sucesso (uma para cada dia)!`
          );
        } else {
          showSuccessToast('Locação criada com sucesso!');
        }
      }
      setShowFormModal(false);
      setCurrentLocacao(null);
      const pageToFetch = isEditing ? currentPage : 1;
      fetchLocacoes(pageToFetch, selectedObra?.id);
    } catch (err) {
      const backendErrors = err.response?.data;
      let generalMessage =
        err.message ||
        (isEditing ? 'Falha ao atualizar locação.' : 'Falha ao criar locação.');
      if (backendErrors && typeof backendErrors === 'object') {
        if (
          backendErrors.funcionario_locado &&
          backendErrors.conflict_details
        ) {
          generalMessage =
            typeof backendErrors.funcionario_locado === 'string'
              ? backendErrors.funcionario_locado
              : Array.isArray(backendErrors.funcionario_locado)
                ? backendErrors.funcionario_locado.join('; ')
                : 'Conflito de locação detectado para funcionário.';
        } else {
          const messages = Object.values(backendErrors).flat().join('; ');
          if (messages) generalMessage = messages;
        }
      }
      setError(generalMessage);
      showErrorToast(
        isEditing ? 'Erro ao atualizar locação.' : 'Erro ao criar locação.'
      );
      console.error(
        'API Submit Locação Error:',
        err.response?.data || err.message
      );
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
    fetchLocacoes(currentPage, selectedObra?.id);
  }, [fetchLocacoes, currentPage, selectedObra]);

  const handleViewDetails = locacaoId => {
    setSelectedLocacaoId(locacaoId);
  };

  const handleCloseDetailModal = () => {
    setSelectedLocacaoId(null);
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTooltipValue = (value, name, props) => {
    if (
      props.payload.total_cost === 0 &&
      props.payload.has_locacoes === false
    ) {
      return ['Sem locações', 'Status'];
    }
    const formattedValue = `R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return [formattedValue, 'Custo Total'];
  };

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportStartDate, setReportStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [reportEndDate, setReportEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [preCheckAlertDays, setPreCheckAlertDays] = useState([]);
  const [isPreChecking, setIsPreChecking] = useState(false);
  const [preCheckError, setPreCheckError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [step, setStep] = useState(1);
  const [preCheckMedicoesPendentes, setPreCheckMedicoesPendentes] = useState(
    []
  );

  const handleWeekSelectorChange = event => {
    const selectedWeekOffset = parseInt(event.target.value, 10);
    if (isNaN(selectedWeekOffset)) return;
    const today = new Date();
    const startOfCurrentWeek = getStartOfWeek(today, 1);
    const targetMonday = new Date(startOfCurrentWeek);
    targetMonday.setDate(startOfCurrentWeek.getDate() + selectedWeekOffset * 7);
    const targetSunday = new Date(targetMonday);
    targetSunday.setDate(targetMonday.getDate() + 6);
    setReportStartDate(formatDateToYYYYMMDD(targetMonday));
    setReportEndDate(formatDateToYYYYMMDD(targetSunday));
  };

  const weekOptions = [
    { label: 'Esta Semana', value: 0 },
    { label: 'Semana Passada', value: -1 },
    { label: '2 Semanas Atrás', value: -2 },
    { label: '3 Semanas Atrás', value: -3 },
    { label: '4 Semanas Atrás', value: -4 },
    { label: '5 Semanas Atrás', value: -5 },
  ];

  const handleOpenReportModal = () => {
    setShowReportModal(true);
    const today = new Date();
    const sevenDaysAgo = new Date(new Date().setDate(today.getDate() - 6));
    setReportStartDate(formatDateToYYYYMMDD(sevenDaysAgo));
    setReportEndDate(formatDateToYYYYMMDD(today));
    setPreCheckAlertDays([]);
    setPreCheckMedicoesPendentes([]);
    setReportData(null);
    setPreCheckError(null);
    setReportError(null);
    setStep(1);
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
    setPreCheckAlertDays([]);
    setPreCheckMedicoesPendentes([]);
    setReportData(null);
    setPreCheckError(null);
    setReportError(null);
    setStep(1);
  };

  const handlePreCheck = async () => {
    if (!reportStartDate || !reportEndDate) {
      setPreCheckError('Por favor, selecione as datas de início e fim.');
      return;
    }
    setIsPreChecking(true);
    setPreCheckError(null);
    setPreCheckMedicoesPendentes([]);
    setReportData(null);
    try {
      const response = await api.getRelatorioFolhaPagamentoPreCheck(
        reportStartDate,
        reportEndDate
      );
      const diasSemLocacoes = response.data.dias_sem_locacoes || [];
      const medicoesPendentes = response.data.medicoes_pendentes || [];
      setPreCheckAlertDays(diasSemLocacoes);
      setPreCheckMedicoesPendentes(medicoesPendentes);
      setStep(2);
    } catch (err) {
      setPreCheckError(
        err.response?.data?.error ||
          err.message ||
          'Falha ao realizar pré-verificação.'
      );
      setStep(1);
    } finally {
      setIsPreChecking(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!reportStartDate || !reportEndDate) {
      setReportError('Por favor, selecione as datas de início e fim.');
      return;
    }
    setIsGeneratingReport(true);
    setReportError(null);
    try {
      const obraId = null;
      const response = await api.generateRelatorioFolhaPagamentoCSVData(
        reportStartDate,
        reportEndDate,
        obraId
      );
      setReportData(response.data);
      setStep(3);
    } catch (err) {
      setReportError(
        err.response?.data?.error || err.message || 'Falha ao gerar relatório.'
      );
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleContinueDespiteAlert = () => handleGenerateReport();

  const handleExportLocacaoPagamentoPDFFromModal = async () => {
    if (!reportStartDate || !reportEndDate) {
      setReportError('Datas de início e fim são obrigatórias para PDF.');
      toast.warn('Datas de início e fim são obrigatórias para PDF.');
      return;
    }
    setIsGeneratingReport(true);
    setReportError(null);
    try {
      const obraId = null;
      const response = await api.gerarRelatorioPagamentoLocacoesPDF(
        reportStartDate,
        reportEndDate,
        obraId
      );
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `Relatorio_Pagamento_Locacoes_${reportStartDate}_a_${reportEndDate}.pdf`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.message ||
        'Falha ao gerar PDF do relatório de pagamento de locações.';
      setReportError(errorMessage);
      toast.error('Falha ao gerar PDF: ' + errorMessage);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleExportLocacaoPagamentoCSVFromModal = () => {
    if (!reportData || reportData.length === 0) {
      toast.info('Não há dados para exportar para CSV.');
      return;
    }
    // Ensure reportData is in the correct format for exportPayrollReportToCSV
    // exportPayrollReportToCSV expects an array of objects, where each object represents a row.
    // The structure of `reportData` from `generateRelatorioFolhaPagamentoCSVData` is already an array of "obraData" objects.
    exportPayrollReportToCSV(
      reportData,
      `relatorio_folha_pagamento_${reportStartDate}_a_${reportEndDate}.csv`
    );
    toast.success('Relatório CSV exportado!');
  };

  return (
    <div className="container mx-auto px-4 py-6 bg-white dark:bg-gray-900 min-h-screen">
      {/* Nova Seção do Weekly Planner (AGORA PRIMEIRO) */}
      {/* Removed min-h-[75vh] to prevent excessive empty space */}
      <div className="mb-8 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 flex-shrink-0">
            Planejamento Semanal de Locações
          </h2>
          <div className="w-1/3">
            <ObraAutocomplete
              value={selectedObra}
              onObraSelect={obra => {
                setSelectedObra(obra);
                if (currentPage !== 1) {
                  setCurrentPage(1);
                }
              }}
              placeholder="Filtrar por obra..."
            />
          </div>
        </div>
        <div className="flex-grow">
          {' '}
          {/* This flex-grow is fine if the parent (flex flex-col) doesn't force a huge height */}
          <WeeklyPlanner selectedObra={selectedObra} />
        </div>
      </div>

      {/* Chart Section (AGORA SEGUNDO) */}
      <div className="mb-8 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow bg-white dark:bg-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
            Custo Diário de Locações (Últimos 30 dias)
          </h2>
          <div className="flex items-center">
            <label
              htmlFor="obraChartFilter"
              className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Filtrar por Obra:
            </label>
            <select
              id="obraChartFilter"
              value={selectedObraIdForChart}
              onChange={handleObraFilterChange}
              className="block w-full md:w-auto pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm"
            >
              <option value="">Todas as Obras</option>
              {obras.map(obra => (
                <option key={obra.id} value={obra.id}>
                  {obra.nome_obra}
                </option>
              ))}
            </select>
          </div>
        </div>
        {isLoadingChart && (
          <p className="text-center text-gray-500 dark:text-gray-400">
            Carregando gráfico...
          </p>
        )}
        {chartError && (
          <div
            className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-200 px-4 py-3 rounded relative"
            role="alert"
          >
            <strong className="font-bold">Erro no gráfico: </strong>
            <span className="block sm:inline">{chartError}</span>
          </div>
        )}
        {!isLoadingChart && !chartError && chartData.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400">
            Nenhum dado de locação encontrado para o período ou filtro
            selecionado.
          </p>
        )}
        {!isLoadingChart && !chartError && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDateTick}
                label={{
                  value: 'Data (Últimos 30 dias)',
                  position: 'insideBottom',
                  offset: -15,
                  dy: 10,
                  fontSize: 12,
                }}
                interval={
                  chartData.length > 15 ? Math.floor(chartData.length / 15) : 0
                }
                angle={chartData.length > 20 ? -30 : 0}
                textAnchor={chartData.length > 20 ? 'end' : 'middle'}
                height={50}
              />
              <YAxis
                label={{
                  value: 'Custo (R$)',
                  angle: -90,
                  position: 'insideLeft',
                  fontSize: 12,
                }}
                tickFormatter={value =>
                  parseFloat(value).toLocaleString('pt-BR')
                }
                domain={[0, 'dataMax + 1000']}
              />
              <Tooltip
                labelFormatter={formatTooltipLabel}
                formatter={formatTooltipValue}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="total_cost" name="Custo Total Diário">
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.total_cost === 0 && entry.has_locacoes === false
                        ? '#FFCA28'
                        : '#8884d8'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
          <span className="inline-block w-3 h-3 bg-[#FFCA28] mr-1 align-middle"></span>
          <span className="align-middle">
            Dias sem locações (ou custo zero). Custo atribuído ao dia de início
            da locação.
          </span>
        </div>
      </div>

      {/* Seção da Tabela de Locações (Pode ser removida ou mantida conforme necessidade) */}
      {/* O título e botões abaixo são da listagem antiga, mantidos por enquanto */}
      <div className="flex justify-between items-center mb-6 mt-12">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Listagem Detalhada de Locações
        </h1>
        <div>
          <button
            onClick={handleOpenReportModal}
            className="mr-3 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-400"
          >
            Relatório de Pagamento
          </button>
          <button
            onClick={handleAddNew}
            className="bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-400 disabled:bg-primary-300 dark:disabled:bg-primary-700"
          >
            Nova Locação (Lista)
          </button>
        </div>
      </div>

      {error &&
        !isLoading &&
        !showFormModal &&
        !showDeleteConfirm &&
        locacoes.length === 0 && (
          <div
            className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 dark:border-red-400 text-red-700 dark:text-red-200 p-4 my-4 text-center"
            role="alert"
          >
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
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
              {currentLocacao && currentLocacao.id
                ? 'Editar Locação'
                : 'Adicionar Nova Locação'}
            </h2>
            {error && (
              <div
                className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-4"
                role="alert"
              >
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
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
              Confirmar Exclusão
            </h2>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Tem certeza que deseja excluir esta locação? Esta ação não pode
              ser desfeita.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isLoading}
                className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-md focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-500 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-400 disabled:opacity-50 flex items-center justify-center"
              >
                {isDeleting ? <SpinnerIcon className="w-5 h-5 mr-2" /> : null}
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for "Relatório de Pagamento" (copied and adapted from RelatoriosPage rplModal) */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity duration-300 ease-in-out">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                Relatório de Pagamento de Locações
              </h2>
              <button
                onClick={handleCloseReportModal}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl"
              >
                &times;
              </button>
            </div>

            {/* Step 1: Date Selection */}
            {step === 1 && (
              <div>
                <div className="mb-4">
                  <label
                    htmlFor="locWeekSelector"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Selecionar Semana (Opcional):
                  </label>
                  <select
                    id="locWeekSelector"
                    onChange={handleWeekSelectorChange} // Use existing handler from LocacoesPage
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Escolha uma semana...
                    </option>
                    {weekOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label
                      htmlFor="locReportStartDate"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Data de Início{' '}
                      <span className="text-red-500 dark:text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      id="locReportStartDate"
                      value={reportStartDate}
                      onChange={e => setReportStartDate(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="locReportEndDate"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Data de Fim{' '}
                      <span className="text-red-500 dark:text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      id="locReportEndDate"
                      value={reportEndDate}
                      onChange={e => setReportEndDate(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                {preCheckError && (
                  <p className="text-red-500 dark:text-red-400 text-sm mb-3">
                    {preCheckError}
                  </p>
                )}
                <button
                  onClick={handlePreCheck}
                  disabled={isPreChecking || !reportStartDate || !reportEndDate}
                  className="w-full bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-400 disabled:opacity-50 flex items-center justify-center"
                >
                  {isPreChecking && <SpinnerIcon className="w-5 h-5 mr-2" />}
                  {isPreChecking
                    ? 'Verificando...'
                    : 'Verificar Disponibilidade de Dias'}
                </button>
              </div>
            )}

            {/* Step 2: Pre-check Alert */}
            {step === 2 && (
              <div className="my-4">
                {preCheckError && (
                  <p className="text-red-500 dark:text-red-400 text-sm mb-3">
                    {preCheckError}
                  </p>
                )}

                {preCheckAlertDays.length > 0 ||
                preCheckMedicoesPendentes.length > 0 ? (
                  <>
                    {preCheckAlertDays.length > 0 && (
                      <div className="p-4 mb-4 bg-yellow-100 dark:bg-yellow-900 border-l-4 border-yellow-500 dark:border-yellow-400 text-yellow-700 dark:text-yellow-200">
                        <h3 className="font-bold mb-2">
                          Alerta: Dias Sem Locações Registradas!
                        </h3>
                        <p className="mb-1">
                          Foram encontrados os seguintes dias dentro do período
                          selecionado que não possuem nenhuma locação ativa
                          registrada:
                        </p>
                        <ul className="list-disc list-inside mb-3">
                          {preCheckAlertDays.map(day => (
                            <li key={day}>
                              {new Date(day + 'T00:00:00Z').toLocaleDateString(
                                'pt-BR',
                                { timeZone: 'UTC' }
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {preCheckMedicoesPendentes.length > 0 && (
                      <div className="p-4 mb-4 bg-orange-100 dark:bg-orange-900 border-l-4 border-orange-500 dark:border-orange-400 text-orange-700 dark:text-orange-200">
                        <h3 className="font-bold mb-2">
                          Alerta: Medições Pendentes!
                        </h3>
                        <p className="mb-1">
                          As seguintes locações ativas no período possuem valor
                          de pagamento zerado ou não definido e podem precisar
                          de ajuste:
                        </p>
                        <ul className="list-disc list-inside mb-3 text-xs">
                          {preCheckMedicoesPendentes.map(loc => (
                            <li key={loc.locacao_id}>
                              ID: {loc.locacao_id} - {loc.obra_nome} -{' '}
                              {loc.recurso_locado} (Início:{' '}
                              {new Date(
                                loc.data_inicio + 'T00:00:00Z'
                              ).toLocaleDateString('pt-BR', {
                                timeZone: 'UTC',
                              })}
                              , Tipo: {loc.tipo_pagamento}, Valor:{' '}
                              {loc.valor_pagamento === null
                                ? 'NULO'
                                : parseFloat(loc.valor_pagamento).toFixed(2)}
                              )
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p className="mb-3 text-gray-700 dark:text-gray-300">
                      Deseja gerar o relatório mesmo assim?
                    </p>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setStep(1)}
                        className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium py-2 px-4 rounded-md"
                      >
                        Voltar/Corrigir Datas
                      </button>
                      <button
                        onClick={handleContinueDespiteAlert}
                        disabled={isGeneratingReport}
                        className="bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
                      >
                        {isGeneratingReport && (
                          <SpinnerIcon className="w-5 h-5 mr-2" />
                        )}
                        {isGeneratingReport
                          ? 'Gerando Dados...'
                          : 'Continuar e Preparar Dados'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-4 bg-green-100 dark:bg-green-900 border-l-4 border-green-500 dark:border-green-400 text-green-700 dark:text-green-200">
                    <h3 className="font-bold mb-2">Verificação Concluída</h3>
                    <p>
                      Nenhuma pendência (dias sem locações ou medições zeradas)
                      encontrada no período selecionado.
                    </p>
                    <div className="flex justify-end space-x-3 mt-3">
                      <button
                        onClick={() => setStep(1)}
                        className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium py-2 px-4 rounded-md"
                      >
                        Voltar
                      </button>
                      <button
                        onClick={handleGenerateReport}
                        disabled={isGeneratingReport}
                        className="bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
                      >
                        {isGeneratingReport && (
                          <SpinnerIcon className="w-5 h-5 mr-2" />
                        )}
                        {isGeneratingReport
                          ? 'Gerando Dados...'
                          : 'Preparar Dados do Relatório'}
                      </button>
                    </div>
                  </div>
                )}
                {reportError && !isGeneratingReport && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-3">
                    {reportError}
                  </p>
                )}
              </div>
            )}

            {/* Step 3: Report Display and Export Options */}
            {step === 3 && reportData && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                    Relatório Gerado
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleExportLocacaoPagamentoCSVFromModal} // Use new CSV handler
                      disabled={
                        !reportData ||
                        reportData.length === 0 ||
                        isGeneratingReport
                      }
                      className="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-400 text-sm disabled:opacity-50"
                    >
                      <SpinnerIcon
                        className={`w-4 h-4 mr-1 ${isGeneratingReport && reportError === null ? 'inline-block' : 'hidden'}`}
                      />
                      Exportar para CSV
                    </button>
                    <button
                      onClick={handleExportLocacaoPagamentoPDFFromModal} // Use existing PDF handler
                      disabled={
                        !reportData ||
                        reportData.length === 0 ||
                        isGeneratingReport
                      }
                      className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-4 focus:ring-red-300 dark:focus:ring-red-400 text-sm disabled:opacity-50"
                    >
                      <SpinnerIcon
                        className={`w-4 h-4 mr-1 ${isGeneratingReport && reportError === null ? 'inline-block' : 'hidden'}`}
                      />
                      Exportar para PDF
                    </button>
                  </div>
                </div>
                {reportError && (
                  <p className="text-red-500 dark:text-red-400 text-sm mb-3">
                    {reportError}
                  </p>
                )}
                {reportData.length === 0 && (
                  <p className="text-gray-600 dark:text-gray-400">
                    Nenhuma locação encontrada para o período e critérios
                    selecionados.
                  </p>
                )}

                {reportData.map(obraData => (
                  <div
                    key={obraData.obra_id || obraData.obra_nome}
                    className="mb-8 p-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg shadow"
                  >
                    <h4 className="text-xl font-semibold text-blue-700 dark:text-blue-400 mb-3">
                      {obraData.obra_nome}
                    </h4>
                    {obraData.dias.map(diaData => (
                      <div
                        key={diaData.data}
                        className="mb-4 pl-4 border-l-2 border-blue-200 dark:border-blue-600"
                      >
                        <p className="text-md font-semibold text-gray-700 dark:text-gray-300">
                          Data: {formatDateToDMY(diaData.data)} - Total Dia:{' '}
                          <span className="text-blue-600 dark:text-blue-400 font-bold">
                            {parseFloat(diaData.total_dia_obra).toLocaleString(
                              'pt-BR',
                              { style: 'currency', currency: 'BRL' }
                            )}
                          </span>
                        </p>
                        {diaData.locacoes_no_dia.length > 0 ? (
                          <div className="overflow-x-auto mt-2">
                            <table className="min-w-full text-xs text-left text-gray-600 dark:text-gray-400">
                              <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700">
                                <tr>
                                  <th scope="col" className="px-3 py-2">
                                    Recurso
                                  </th>
                                  <th scope="col" className="px-3 py-2">
                                    Tipo Pag.
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-3 py-2 text-right"
                                  >
                                    Valor Dia (R$)
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-3 py-2 text-right"
                                  >
                                    Valor Total Loc. (R$)
                                  </th>
                                  <th scope="col" className="px-3 py-2">
                                    Início Loc.
                                  </th>
                                  <th scope="col" className="px-3 py-2">
                                    Fim Loc.
                                  </th>
                                  <th scope="col" className="px-3 py-2">
                                    Data Pag. Prev.
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {diaData.locacoes_no_dia.map(loc => (
                                  <tr
                                    key={loc.locacao_id}
                                    className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                                  >
                                    <td className="px-3 py-2">
                                      {loc.recurso_nome}
                                    </td>
                                    <td className="px-3 py-2">
                                      {loc.tipo_pagamento_display}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      {parseFloat(
                                        loc.valor_diario_atribuido
                                      ).toLocaleString('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                      })}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      {parseFloat(
                                        loc.valor_pagamento_total_locacao
                                      ).toLocaleString('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                      })}
                                    </td>
                                    <td className="px-3 py-2">
                                      {formatDateToDMY(
                                        loc.data_locacao_original_inicio
                                      )}
                                    </td>
                                    <td className="px-3 py-2">
                                      {formatDateToDMY(
                                        loc.data_locacao_original_fim
                                      )}
                                    </td>
                                    <td className="px-3 py-2">
                                      {loc.data_pagamento_prevista
                                        ? formatDateToDMY(
                                            loc.data_pagamento_prevista
                                          )
                                        : 'N/A'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-1">
                            Nenhuma locação com custo atribuído a este dia.
                          </p>
                        )}
                      </div>
                    ))}
                    <p className="text-lg font-semibold text-right text-blue-700 dark:text-blue-400 mt-4 pt-2 border-t border-blue-200 dark:border-blue-600">
                      Total para {obraData.obra_nome} no Período:{' '}
                      <span className="text-green-600 dark:text-green-400 font-bold">
                        {parseFloat(obraData.total_obra_periodo).toLocaleString(
                          'pt-BR',
                          { style: 'currency', currency: 'BRL' }
                        )}
                      </span>
                    </p>
                  </div>
                ))}
                {reportData.length > 0 && (
                  <div className="mt-8 pt-4 border-t-2 border-gray-300 dark:border-gray-600">
                    <p className="text-xl font-bold text-right text-gray-800 dark:text-gray-100">
                      Total Geral do Relatório:
                      <span className="text-green-700 dark:text-green-400 ml-2">
                        {reportData
                          .reduce(
                            (sum, obra) =>
                              sum + parseFloat(obra.total_obra_periodo),
                            0
                          )
                          .toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                      </span>
                    </p>
                  </div>
                )}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
                  >
                    Gerar Novo Relatório
                  </button>
                </div>
              </div>
            )}
            {isGeneratingReport && step !== 3 && (
              <p className="text-center text-gray-500 dark:text-gray-400 mt-4">
                <SpinnerIcon className="w-5 h-5 mr-2 inline" /> Gerando...
              </p>
            )}
            {reportError && step !== 3 && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-3 text-center">
                {reportError}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocacoesPage;
