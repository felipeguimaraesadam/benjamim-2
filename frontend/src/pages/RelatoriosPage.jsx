import React, { useState, useEffect, useCallback } from 'react';
import Autocomplete from '../components/forms/Autocomplete';
import * as api from '../services/api';
import {
  exportDataToCsv,
  exportMaterialPaymentsReportToCSV,
  exportPayrollReportToCSV,
} from '../utils/csvExporter'; // Import CSV exporter
import SpinnerIcon from '../components/utils/SpinnerIcon'; // Assuming SpinnerIcon is needed
import {
  formatDateToDMY,
  getStartOfWeek,
  formatDateToYYYYMMDD,
} from '../utils/dateUtils.js'; // Import date utils
import MonthSelector from '../components/utils/MonthSelector'; // Importado MonthSelector
import { toast } from 'react-toastify'; // For displaying error messages

const RelatoriosPage = () => {
  const [obras, setObras] = useState([]); // Used for various dropdowns
  const [materiais, setMateriais] = useState([]); // Used for Geral de Compras report dropdown
  const [equipes, setEquipes] = useState([]); // Used for Desempenho Equipe report dropdown
  const [activeTab, setActiveTab] = useState('financeiroObra'); // Renomeado de reportType

  // Estado unificado para filtros
  const [filters, setFilters] = useState({
    obra_id: '',
    material_id: '',
    equipe_id: '',
    data_inicio: '',
    data_fim: '',
    // Para controlar o valor do MonthSelector diretamente, se necessário
    // ou para manter o valor YYYY-MM para o input type="month"
    selected_month: '',
  });

  const [reportData, setReportData] = useState(null); // For main page reports
  const [isLoading, setIsLoading] = useState(false); // For main page report generation
  const [error, setError] = useState(null); // For main page errors

  // State for Material Payments Report Modal
  const [showMaterialPayModal, setShowMaterialPayModal] = useState(false);
  const [mpStartDate, setMpStartDate] = useState('');
  const [mpEndDate, setMpEndDate] = useState('');
  const [mpObraId, setMpObraId] = useState('');
  const [mpFornecedor, setMpFornecedor] = useState('');
  // mpObras state is removed as general 'obras' will be used.

  const [mpPreCheckData, setMpPreCheckData] = useState(null);
  const [mpIsPreChecking, setMpIsPreChecking] = useState(false);
  const [mpPreCheckError, setMpPreCheckError] = useState(null);

  const [mpReportData, setMpReportData] = useState(null);
  const [mpIsGeneratingReport, setMpIsGeneratingReport] = useState(false);
  const [mpReportError, setMpReportError] = useState(null);
  const [mpStep, setMpStep] = useState(1); // 1: filters, 2: pre-check, 3: report

  // State for NEW Relatório de Pagamento de Locações Modal (similar to LocacoesPage)
  const [showRplModal, setShowRplModal] = useState(false);
  const [rplStartDate, setRplStartDate] = useState('');
  const [rplEndDate, setRplEndDate] = useState('');
  // const [rplObraId, setRplObraId] = useState(''); // Não haverá filtro de obra neste modal, conforme LocacoesPage
  const [rplPreCheckAlertDays, setRplPreCheckAlertDays] = useState([]);
  const [rplPreCheckMedicoesPendentes, setRplPreCheckMedicoesPendentes] =
    useState([]);
  const [rplIsPreChecking, setRplIsPreChecking] = useState(false);
  const [rplPreCheckError, setRplPreCheckError] = useState(null);
  const [rplReportData, setRplReportData] = useState(null); // Para os dados processados do CSV/PDF
  const [rplIsGeneratingReport, setRplIsGeneratingReport] = useState(false); // Para CSV e PDF
  const [rplReportError, setRplReportError] = useState(null);
  const [rplStep, setRplStep] = useState(1); // 1: date selection, 2: pre-check alert, 3: report view/export

  // Unified initial loading for all dropdowns
  const [isInitialLoading, setIsInitialLoading] = useState(true); // Set to true initially

  const weekOptions = [
    { label: 'Esta Semana', value: 0 },
    { label: 'Semana Passada', value: -1 },
    { label: '2 Semanas Atrás', value: -2 },
    { label: '3 Semanas Atrás', value: -3 },
    { label: '4 Semanas Atrás', value: -4 },
    { label: '5 Semanas Atrás', value: -5 },
  ];

  const handleMaterialPayWeekSelectorChange = event => {
    const selectedWeekOffset = parseInt(event.target.value, 10);
    if (isNaN(selectedWeekOffset)) {
      return;
    }

    const today = new Date();
    const startOfCurrentWeek = getStartOfWeek(today, 1); // Monday as startDay = 1

    const targetMonday = new Date(startOfCurrentWeek);
    targetMonday.setDate(startOfCurrentWeek.getDate() + selectedWeekOffset * 7);

    const targetSunday = new Date(targetMonday);
    targetSunday.setDate(targetMonday.getDate() + 6); // Sunday is 6 days after Monday

    setMpStartDate(formatDateToYYYYMMDD(targetMonday));
    setMpEndDate(formatDateToYYYYMMDD(targetSunday));
  };

  // Generic week selector handler for modals (handleModalWeekSelectorChange) foi removido pois era usado apenas pelo modal de locações.

  const fetchDropdownData = useCallback(async () => {
    // setIsInitialLoading(true); // Already set to true initially, and managed in finally
    try {
      const [obrasRes, materiaisRes, equipesRes] = await Promise.all([
        api.getObras({ page_size: 1000 }),
        api.getMateriais({ page_size: 1000 }),
        api.getEquipes({ page_size: 1000 }),
      ]);

      const getSafeData = response => {
        const data =
          response?.data?.results ||
          response?.data ||
          (Array.isArray(response) ? response : []);
        return Array.isArray(data) ? data : [];
      };

      setObras(getSafeData(obrasRes));
      // setMpObras(getSafeData(obrasRes)); // mpObras removed, using general 'obras'
      setMateriais(getSafeData(materiaisRes));
      setEquipes(getSafeData(equipesRes));
    } catch (err) {
      console.error('Failed to fetch dropdown data:', err);
      setError('Falha ao carregar dados iniciais para filtros.');
      setObras([]);
      // setMpObras([]); // mpObras removed
      setMateriais([]);
      setEquipes([]);
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDropdownData();
  }, [fetchDropdownData]);

  // Atualizada para usar o estado unificado 'filters'
  const handleFilterChange = (field, value) => {
    setError(null);
    setReportData(null);
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Handler específico para o MonthSelector
  const handleMonthChange = dateInfo => {
    setError(null);
    setReportData(null);
    setFilters(prev => ({
      ...prev,
      data_inicio: dateInfo.startDate,
      data_fim: dateInfo.endDate,
      selected_month: dateInfo.monthYear, // Atualiza o valor YYYY-MM para o input
    }));
  };

  // Inicializa selected_month e data_inicio/data_fim no carregamento da página
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const currentMonthYear = `${year}-${month}`;

    const firstDay = new Date(year, today.getMonth(), 1);
    const lastDay = new Date(year, today.getMonth() + 1, 0);

    const formatDate = date => {
      const d = new Date(date);
      let day = '' + d.getDate();
      let mo = '' + (d.getMonth() + 1);
      const y = d.getFullYear();

      if (mo.length < 2) mo = '0' + mo;
      if (day.length < 2) day = '0' + day;

      return [y, mo, day].join('-');
    };

    setFilters(prev => ({
      ...prev,
      data_inicio: formatDate(firstDay),
      data_fim: formatDate(lastDay),
      selected_month: currentMonthYear,
    }));
  }, []);

  // Atualizada para usar o estado unificado 'filters' e o 'activeTab'
  const validateFilters = () => {
    let isValid = true;
    let currentError = null;
    switch (activeTab) {
      case 'financeiroObra':
        if (!filters.obra_id) currentError = 'Obra é obrigatória.';
        else if (!filters.data_inicio)
          currentError = 'Mês (Data de Início) é obrigatória.';
        else if (!filters.data_fim)
          currentError = 'Mês (Data de Fim) é obrigatória.';
        // Validação de data_inicio > data_fim não é mais necessária com MonthSelector
        break;
      case 'geralCompras':
        if (!filters.data_inicio)
          currentError = 'Mês (Data de Início) é obrigatória.';
        else if (!filters.data_fim)
          currentError = 'Mês (Data de Fim) é obrigatória.';
        break;
      case 'desempenhoEquipe': // Mantém data_inicio e data_fim opcionais
        if (!filters.equipe_id) currentError = 'Equipe é obrigatória.';
        else if (
          filters.data_inicio &&
          filters.data_fim &&
          new Date(filters.data_inicio) > new Date(filters.data_fim)
        ) {
          currentError = 'Data de Início não pode ser posterior à Data de Fim.';
        }
        break;
      case 'custoGeral':
        if (!filters.data_inicio)
          currentError = 'Mês (Data de Início) é obrigatória.';
        else if (!filters.data_fim)
          currentError = 'Mês (Data de Fim) é obrigatória.';
        break;
      default:
        isValid = false; // Should not happen
    }
    if (currentError) {
      setError(currentError);
      toast.warn(currentError);
      isValid = false;
    }
    return isValid;
  };

  // Renomeado para handleGenerateReport e atualizado para usar 'filters' e 'activeTab'
  const handleGenerateReport = async () => {
    if (!validateFilters()) return;

    setError(null);
    setReportData(null);
    setIsLoading(true);

    try {
      let response;
      let params = {
        data_inicio: filters.data_inicio,
        data_fim: filters.data_fim,
      };

      switch (activeTab) {
        case 'financeiroObra':
          params.obra_id = filters.obra_id;
          response = await api.getRelatorioFinanceiroObra(params);
          break;
        case 'geralCompras':
          if (filters.obra_id) params.obra_id = filters.obra_id;
          if (filters.material_id) params.material_id = filters.material_id;
          response = await api.getRelatorioGeralCompras(params);
          break;
        case 'desempenhoEquipe':
          params = { equipe_id: filters.equipe_id }; // Começa com params limpo para este caso
          if (filters.data_inicio) params.data_inicio = filters.data_inicio;
          if (filters.data_fim) params.data_fim = filters.data_fim;
          response = await api.getRelatorioDesempenhoEquipe(params);
          break;
        case 'custoGeral':
          // params já tem data_inicio e data_fim
          response = await api.getRelatorioCustoGeral(params);
          break;
        default:
          throw new Error('Tipo de relatório desconhecido.');
      }
      setReportData({ type: activeTab, data: response.data });
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        err.message ||
        'Falha ao gerar relatório.';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error(`Relatorio ${activeTab} Error:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString + 'T00:00:00Z');
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  const formatCurrency = value => {
    if (value === null || value === undefined) return 'N/A';
    return parseFloat(value).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const renderReportForm = () => {
    if (isInitialLoading)
      return (
        <p className="text-center text-gray-600 dark:text-gray-400">
          Carregando filtros...
        </p>
      );

    switch (
      activeTab // Modificado de reportType para activeTab
    ) {
      case 'financeiroObra':
        return (
          <form
            key="form-financeiro-obra"
            onSubmit={e => {
              e.preventDefault();
              handleGenerateReport();
            }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6 space-y-4"
          >
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
              Relatório Financeiro da Obra
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="obra_id_fin"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Obra <span className="text-red-500">*</span>
                </label>
                <Autocomplete
                  fetchSuggestions={async query => {
                    const response = await api.searchObras(query);
                    return response.data.map(obra => ({
                      value: obra.id,
                      label: obra.nome_obra,
                    }));
                  }}
                  onSelect={selection =>
                    handleFilterChange('obra_id', selection ? selection.value : '')
                  }
                  placeholder="Digite para buscar uma obra..."
                />
              </div>
              <div>
                <label
                  htmlFor="month_selector_fin"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Mês do Relatório <span className="text-red-500">*</span>
                </label>
                <MonthSelector
                  id="month_selector_fin"
                  name="selected_month"
                  value={filters.selected_month}
                  onChange={handleMonthChange}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading || !filters.obra_id}
              className="w-full md:w-auto mt-2 px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-75 disabled:opacity-50"
            >
              {isLoading ? (
                <SpinnerIcon className="w-5 h-5 mr-2 inline-block" />
              ) : null}
              {isLoading ? 'Gerando...' : 'Gerar Relatório'}
            </button>
          </form>
        );
      case 'geralCompras':
        return (
          <form
            key="form-geral-compras"
            onSubmit={e => {
              e.preventDefault();
              handleGenerateReport();
            }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6 space-y-4"
          >
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
              Relatório Geral de Compras
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="month_selector_comp"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Mês do Relatório <span className="text-red-500">*</span>
                </label>
                <MonthSelector
                  id="month_selector_comp"
                  name="selected_month"
                  value={filters.selected_month}
                  onChange={handleMonthChange}
                />
              </div>
              <div>
                <label
                  htmlFor="obra_id_comp"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Obra (Opcional)
                </label>
                <Autocomplete
                  fetchSuggestions={async query => {
                    const response = await api.searchObras(query);
                    return response.data.map(obra => ({
                      value: obra.id,
                      label: obra.nome_obra,
                    }));
                  }}
                  onSelect={selection =>
                    handleFilterChange('obra_id', selection ? selection.value : '')
                  }
                  placeholder="Digite para buscar uma obra..."
                />
              </div>
              <div>
                <label
                  htmlFor="material_id_comp"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Material (Opcional)
                </label>
                <select
                  id="material_id_comp"
                  name="material_id"
                  value={filters.material_id}
                  onChange={e =>
                    handleFilterChange('material_id', e.target.value)
                  }
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Todos os Materiais</option>
                  {materiais.map(material => (
                    <option key={material.id} value={material.id}>
                      {material.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full md:w-auto mt-4 px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-75 disabled:opacity-50"
            >
              {isLoading ? (
                <SpinnerIcon className="w-5 h-5 mr-2 inline-block" />
              ) : null}
              {isLoading ? 'Gerando...' : 'Gerar Relatório'}
            </button>
          </form>
        );
      case 'desempenhoEquipe':
        return (
          <form
            key="form-desempenho-equipe"
            onSubmit={e => {
              e.preventDefault();
              handleGenerateReport();
            }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6 space-y-4"
          >
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
              Relatório de Desempenho de Equipes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div>
                <label
                  htmlFor="equipe_id_des"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Equipe <span className="text-red-500">*</span>
                </label>
                <select
                  id="equipe_id_des"
                  name="equipe_id"
                  value={filters.equipe_id}
                  onChange={e =>
                    handleFilterChange('equipe_id', e.target.value)
                  }
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Selecione uma Equipe</option>
                  {equipes.map(equipe => (
                    <option key={equipe.id} value={equipe.id}>
                      {equipe.nome_equipe}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="data_inicio_des"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Data Início (Opcional)
                </label>
                <input
                  type="date"
                  id="data_inicio_des"
                  name="data_inicio"
                  value={filters.data_inicio}
                  onChange={e =>
                    handleFilterChange('data_inicio', e.target.value)
                  }
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="data_fim_des"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Data Fim (Opcional)
                </label>
                <input
                  type="date"
                  id="data_fim_des"
                  name="data_fim"
                  value={filters.data_fim}
                  onChange={e => handleFilterChange('data_fim', e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !filters.equipe_id}
                className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-75 disabled:opacity-50"
              >
                {isLoading ? (
                  <SpinnerIcon className="w-5 h-5 mr-2 inline-block" />
                ) : null}
                {isLoading ? 'Gerando...' : 'Gerar Relatório'}
              </button>
            </div>
          </form>
        );
      case 'custoGeral':
        return (
          <form
            key="form-custo-geral"
            onSubmit={e => {
              e.preventDefault();
              handleGenerateReport();
            }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6 space-y-4"
          >
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
              Relatório Geral de Custos do Sistema
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <label
                  htmlFor="month_selector_cg"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Mês do Relatório <span className="text-red-500">*</span>
                </label>
                <MonthSelector
                  id="month_selector_cg"
                  name="selected_month"
                  value={filters.selected_month}
                  onChange={handleMonthChange}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="self-end px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-75 disabled:opacity-50"
              >
                {isLoading ? (
                  <SpinnerIcon className="w-5 h-5 mr-2 inline-block" />
                ) : null}
                {isLoading ? 'Gerando...' : 'Gerar Relatório'}
              </button>
            </div>
          </form>
        );
      // Add case for 'pagamentoMateriais' if its form is different or managed here.
      // For now, it will have its own modal.
      default:
        return null;
    }
  };

  // --- Handlers for Material Payments Report Modal ---
  const handleOpenMaterialPayModal = () => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    );

    setMpStartDate(firstDayOfMonth.toISOString().split('T')[0]);
    setMpEndDate(lastDayOfMonth.toISOString().split('T')[0]);
    setMpObraId('');
    setMpFornecedor('');
    setMpPreCheckData(null);
    setMpReportData(null);
    setMpPreCheckError(null);
    setMpReportError(null);
    setMpStep(1);
    setShowMaterialPayModal(true);
    // Obras (mpObras) are fetched once on page load by fetchDropdownData
  };

  const handleCloseMaterialPayModal = () => {
    setShowMaterialPayModal(false);
  };

  const handleMpPreCheck = async () => {
    if (!mpStartDate || !mpEndDate) {
      setMpPreCheckError('Datas de início e fim são obrigatórias.');
      return;
    }
    setMpIsPreChecking(true);
    setMpPreCheckError(null);
    setMpReportData(null);
    try {
      const params = { start_date: mpStartDate, end_date: mpEndDate };
      if (mpObraId) params.obra_id = mpObraId;
      if (mpFornecedor) params.fornecedor = mpFornecedor;
      const response = await api.getRelatorioPagamentoMateriaisPreCheck(params);
      setMpPreCheckData(response.data);
      setMpStep(2);
    } catch (err) {
      setMpPreCheckError(
        err.response?.data?.error || err.message || 'Falha na pré-verificação.'
      );
    } finally {
      setMpIsPreChecking(false);
    }
  };

  const handleMpGenerateReport = async () => {
    setMpIsGeneratingReport(true);
    setMpReportError(null);
    try {
      const params = { start_date: mpStartDate, end_date: mpEndDate };
      if (mpObraId) params.obra_id = mpObraId;
      if (mpFornecedor) params.fornecedor = mpFornecedor;
      const response = await api.generateRelatorioPagamentoMateriais(params);
      setMpReportData(response.data);
      setMpStep(3);
    } catch (err) {
      setMpReportError(
        err.response?.data?.error || err.message || 'Falha ao gerar relatório.'
      );
    } finally {
      setMpIsGeneratingReport(false);
    }
  };



  // --- Handlers for Locacao Payments Report Modal --- foram removidos

  // --- Handlers for NEW Relatório de Pagamento de Locações Modal ---
  const handleRplWeekSelectorChange = event => {
    const selectedWeekOffset = parseInt(event.target.value, 10);
    if (isNaN(selectedWeekOffset)) {
      return;
    }
    const today = new Date();
    const startOfCurrentWeek = getStartOfWeek(today, 1); // Use imported function

    const targetMonday = new Date(startOfCurrentWeek);
    targetMonday.setDate(startOfCurrentWeek.getDate() + selectedWeekOffset * 7);
    const targetSunday = new Date(targetMonday);
    targetSunday.setDate(targetMonday.getDate() + 6);

    setRplStartDate(formatDateToYYYYMMDD(targetMonday));
    setRplEndDate(formatDateToYYYYMMDD(targetSunday));
  };

  const handleOpenRplModal = () => {
    setShowRplModal(true);
    const today = new Date();
    // Default to a 7-day period ending today, similar to LocacoesPage logic
    const sevenDaysAgo = new Date(new Date().setDate(today.getDate() - 6));
    setRplStartDate(formatDateToYYYYMMDD(sevenDaysAgo));
    setRplEndDate(formatDateToYYYYMMDD(today));

    setRplPreCheckAlertDays([]);
    setRplPreCheckMedicoesPendentes([]);
    setRplReportData(null);
    setRplPreCheckError(null);
    setRplReportError(null);
    setRplStep(1);
  };

  const handleCloseRplModal = () => {
    setShowRplModal(false);
    // Reset states when closing
    setRplPreCheckAlertDays([]);
    setRplPreCheckMedicoesPendentes([]);
    setRplReportData(null);
    setRplPreCheckError(null);
    setRplReportError(null);
    setRplStep(1);
  };

  const handleRplPreCheck = async () => {
    if (!rplStartDate || !rplEndDate) {
      setRplPreCheckError('Por favor, selecione as datas de início e fim.');
      toast.warn('Por favor, selecione as datas de início e fim.');
      return;
    }
    setRplIsPreChecking(true);
    setRplPreCheckError(null);
    setRplPreCheckMedicoesPendentes([]);
    setRplReportData(null);
    try {
      const response = await api.getRelatorioFolhaPagamentoPreCheck(
        rplStartDate,
        rplEndDate
      );
      const diasSemLocacoes = response.data.dias_sem_locacoes || [];
      const medicoesPendentes = response.data.medicoes_pendentes || [];
      setRplPreCheckAlertDays(diasSemLocacoes);
      setRplPreCheckMedicoesPendentes(medicoesPendentes);

      if (diasSemLocacoes.length > 0 || medicoesPendentes.length > 0) {
        setRplStep(2); // Show alert step
      } else {
        setRplStep(2); // Still go to step 2 (which will show "Verificação Concluída")
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.message ||
        'Falha ao realizar pré-verificação.';
      setRplPreCheckError(errorMsg);
      toast.error(errorMsg);
      setRplStep(1);
    } finally {
      setRplIsPreChecking(false);
    }
  };

  const handleRplContinueDespiteAlert = () => {
    // No `LocacoesPage`, o "Continuar Mesmo Assim" levava a gerar o relatório (CSV/PDF).
    // Aqui, como teremos botões separados para CSV e PDF na etapa 3 do modal,
    // esta função pode apenas avançar para a etapa 3 se quisermos um passo intermediário,
    // ou podemos remover essa função e os botões de CSV/PDF chamarem suas lógicas diretamente.
    // Por simplicidade e para espelhar que o usuário está ciente dos alertas, vamos para a etapa 3
    // onde os botões de exportação estarão disponíveis.
    setRplStep(3);
    // A geração de dados (chamada a generateRelatorioFolhaPagamentoCSVData)
    // acontecerá quando o usuário clicar em Exportar CSV na etapa 3.
    // Ou, podemos carregar os dados aqui e ter a etapa 3 apenas para visualização/exportação.
    // Vamos seguir o fluxo de LocacoesPage: pré-check -> alerta -> visualização/exportação.
    // A chamada para `api.generateRelatorioFolhaPagamentoCSVData` será feita ANTES de ir para a etapa 3,
    // para que os dados estejam prontos para visualização/exportação.
    // No entanto, o usuário pode querer apenas o PDF.
    // Vamos ajustar: `handleRplContinueDespiteAlert` não fará nada por si só.
    // Os botões de exportar CSV/PDF na etapa 2 (se houver alerta) ou etapa 3 (se não houver) farão as chamadas.
    // Para manter o fluxo de LocacoesPage, onde `handleContinueDespiteAlert` chama `handleGenerateReport`,
    // vamos criar uma função `handleRplPrepareReportData` que é chamada aqui e ao passar direto do precheck.
    // Esta função buscará os dados para o CSV, que também são a base para a visualização.
    handleRplPrepareAndShowReportData();
  };

  const handleRplPrepareAndShowReportData = async () => {
    if (!rplStartDate || !rplEndDate) {
      setRplReportError('Datas de início e fim são obrigatórias.');
      toast.warn('Datas de início e fim são obrigatórias.');
      return;
    }
    setRplIsGeneratingReport(true);
    setRplReportError(null);
    try {
      const response = await api.generateRelatorioFolhaPagamentoCSVData(
        rplStartDate,
        rplEndDate,
        null /* obraId é null */
      );
      setRplReportData(response.data); // Estes são os dados para CSV e visualização
      setRplStep(3); // Avança para a etapa de visualização/exportação
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.message ||
        'Falha ao gerar dados do relatório.';
      setRplReportError(errorMsg);
      toast.error(errorMsg);
      // Mantém na etapa 2 (alerta) ou volta para 1 se o erro for crítico?
      // Se o precheck passou, mas a geração de dados falhou, ficar na etapa 2 com a mensagem de erro é razoável.
    } finally {
      setRplIsGeneratingReport(false);
    }
  };

  const handleRplExportCSV = () => {
    if (!rplReportData || rplReportData.length === 0) {
      toast.info('Não há dados para exportar para CSV.');
      return;
    }
    exportPayrollReportToCSV(
      rplReportData,
      `relatorio_folha_pagamento_${rplStartDate}_a_${rplEndDate}.csv`
    );
    toast.success('Relatório CSV exportado!');
  };

  const handleRplExportPDF = async () => {
    if (!rplStartDate || !rplEndDate) {
      setRplReportError('Datas de início e fim são obrigatórias para PDF.');
      toast.warn('Datas de início e fim são obrigatórias para PDF.');
      return;
    }
    setRplIsGeneratingReport(true); // Reutiliza o estado de carregamento
    setRplReportError(null);
    try {
      const response = await api.gerarRelatorioPagamentoLocacoesPDF(
        rplStartDate,
        rplEndDate,
        null /* obraId é null */
      );
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `Relatorio_Pagamento_Locacoes_${rplStartDate}_a_${rplEndDate}.pdf`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Relatório PDF gerado!');
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.message ||
        'Falha ao gerar PDF do relatório.';
      setRplReportError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setRplIsGeneratingReport(false);
    }
  };

  // --- Helper functions for data transformation before CSV export ---
  // It's important that these functions have access to 'obras', 'materiais', 'formatDate', 'formatCurrency'
  // So, they are defined within the component scope.

  const handleExportFinanceiroObra = data => {
    if (!data) return;
    const exportableData = [
      {
        'Obra Nome': data.nome_obra,
        'Obra ID': data.obra_id,
        'Data Início': formatDate(data.data_inicio), // formatDate is in scope
        'Data Fim': formatDate(data.data_fim),
        'Total Compras': formatCurrency(data.total_compras), // formatCurrency is in scope
        'Total Despesas Extras': formatCurrency(data.total_despesas_extras),
        'Custo Total Geral': formatCurrency(data.custo_total_geral),
      },
    ];
    exportDataToCsv(
      exportableData,
      `relatorio_financeiro_obra_${data.obra_id}_${data.data_inicio}_${data.data_fim}.csv`
    );
  };

  const handleExportGeralCompras = data => {
    if (!data || !data.compras || data.compras.length === 0) return;

    const exportableData = data.compras.map(compra => ({
      'Material ID': compra.material_id,
      'Material Nome':
        materiais.find(m => m.id === compra.material_id)?.nome || 'N/A', // 'materiais' is in scope
      'Obra ID': compra.obra_id,
      'Obra Nome': obras.find(o => o.id === compra.obra_id)?.nome_obra || 'N/A', // 'obras' is in scope
      Quantidade: compra.quantidade,
      'Custo Total': formatCurrency(compra.custo_total),
      Fornecedor: compra.fornecedor,
      'Data Compra': formatDate(compra.data_compra),
      'Nota Fiscal': compra.nota_fiscal || '', // Ensure empty string for null/undefined
    }));
    exportDataToCsv(
      exportableData,
      `relatorio_geral_compras_${data.filtros.data_inicio}_${data.filtros.data_fim}.csv`
    );
  };

  const handleExportDesempenhoEquipe = data => {
    if (!data || !data.alocacoes || data.alocacoes.length === 0) return;

    const exportableData = data.alocacoes.map(aloc => ({
      'Equipe Nome': data.filtros.nome_equipe,
      'Equipe ID': data.filtros.equipe_id,
      'Obra Nome': aloc.obra_nome,
      'Obra ID': aloc.obra_id, // Assuming obra_id is part of aloc if needed, or look up if only obra_nome is present
      'Data Alocação Início': formatDate(aloc.data_alocacao_inicio),
      'Data Alocação Fim': formatDate(aloc.data_alocacao_fim),
      'Funcionarios Alocados': aloc.funcionarios_alocados_nomes
        ? aloc.funcionarios_alocados_nomes.join('; ')
        : 'N/A', // Example if this data is available
      'Descricao Alocacao': aloc.descricao_alocacao || '', // Example if this data is available
    }));
    // Filename might need adjustment based on available filter info for equipe.
    exportDataToCsv(
      exportableData,
      `relatorio_desempenho_equipe_${data.filtros.equipe_id}_${data.filtros.nome_equipe}.csv`
    );
  };

  const handleExportCustoGeral = data => {
    if (!data) return;
    const exportableData = [
      {
        'Data Início': formatDate(data.filtros.data_inicio),
        'Data Fim': formatDate(data.filtros.data_fim),
        'Total Compras': formatCurrency(data.total_compras),
        'Total Despesas Extras': formatCurrency(data.total_despesas_extras),
        'Custo Consolidado Total': formatCurrency(data.custo_consolidado_total),
      },
    ];
    exportDataToCsv(
      exportableData,
      `relatorio_custo_geral_${data.filtros.data_inicio}_${data.filtros.data_fim}.csv`
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
        Página de Relatórios
      </h1>

      {/* Abas para seleção de tipo de relatório */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
          <button
            onClick={() => {
              setActiveTab('financeiroObra');
              setReportData(null);
              setError(null);
            }}
            className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm
                        ${
                          activeTab === 'financeiroObra'
                            ? 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
          >
            Financeiro por Obra
          </button>
          <button
            onClick={() => {
              setActiveTab('geralCompras');
              setReportData(null);
              setError(null);
            }}
            className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm
                        ${
                          activeTab === 'geralCompras'
                            ? 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
          >
            Geral de Compras
          </button>
          <button
            onClick={() => {
              setActiveTab('desempenhoEquipe');
              setReportData(null);
              setError(null);
            }}
            className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm
                        ${
                          activeTab === 'desempenhoEquipe'
                            ? 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
          >
            Desempenho de Equipe
          </button>
          <button
            onClick={() => {
              setActiveTab('custoGeral');
              setReportData(null);
              setError(null);
            }}
            className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm
                        ${
                          activeTab === 'custoGeral'
                            ? 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
          >
            Custo Geral do Sistema
          </button>
        </nav>
      </div>

      {error && (
        <div
          className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-200 px-4 py-3 rounded relative my-4"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Formulário de Filtros e Resultados do Relatório */}
      <div className="mb-8">{renderReportForm()}</div>

      {isLoading && (
        <p className="text-center py-4 text-gray-600 dark:text-gray-400">
          Carregando relatório...
        </p>
      )}

      {reportData && !isLoading && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mt-6">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Resultados do Relatório
          </h3>
          {/* Display logic for 'financeiroObra' */}
          {reportData.type === 'financeiroObra' && (
            <div className="space-y-2">
              <p>
                <strong>Obra:</strong> {reportData.data.nome_obra} (ID:{' '}
                {reportData.data.obra_id})
              </p>
              <p>
                <strong>Período:</strong>{' '}
                {formatDate(reportData.data.data_inicio)} -{' '}
                {formatDate(reportData.data.data_fim)}
              </p>
              <p>
                <strong>Total Compras:</strong>{' '}
                <span className="font-semibold">
                  {formatCurrency(reportData.data.total_compras)}
                </span>
              </p>
              <p>
                <strong>Total Despesas Extras:</strong>{' '}
                <span className="font-semibold">
                  {formatCurrency(reportData.data.total_despesas_extras)}
                </span>
              </p>
              <p className="text-lg">
                <strong>Custo Total Geral:</strong>{' '}
                <span className="font-bold text-primary-700">
                  {formatCurrency(reportData.data.custo_total_geral)}
                </span>
              </p>
              <div className="mt-4">
                <button
                  onClick={() => handleExportFinanceiroObra(reportData.data)}
                  disabled={!reportData.data}
                  className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 disabled:opacity-50"
                >
                  Exportar para CSV
                </button>
              </div>
            </div>
          )}
          {/* Display logic for 'geralCompras' */}
          {reportData.type === 'geralCompras' && (
            <div>
              <p className="mb-1">
                <strong>Filtros Aplicados:</strong>
              </p>
              <ul className="list-disc list-inside text-sm mb-2">
                <li>
                  Período: {formatDate(reportData.data.filtros.data_inicio)} -{' '}
                  {formatDate(reportData.data.filtros.data_fim)}
                </li>
                {reportData.data.filtros.obra_id && (
                  <li>
                    Obra:{' '}
                    {obras.find(
                      o => o.id === parseInt(reportData.data.filtros.obra_id)
                    )?.nome_obra || 'N/A'}{' '}
                    (ID: {reportData.data.filtros.obra_id})
                  </li>
                )}
                {reportData.data.filtros.material_id && (
                  <li>
                    Material:{' '}
                    {materiais.find(
                      m =>
                        m.id === parseInt(reportData.data.filtros.material_id)
                    )?.nome || 'N/A'}{' '}
                    (ID: {reportData.data.filtros.material_id})
                  </li>
                )}
              </ul>
              <p className="text-lg mb-4">
                <strong>Soma Total das Compras Filtradas:</strong>{' '}
                <span className="font-bold text-primary-700">
                  {formatCurrency(reportData.data.soma_total_compras)}
                </span>
              </p>

              <h4 className="text-md font-semibold text-gray-600 mb-2">
                Detalhes das Compras:
              </h4>
              {reportData.data.compras && reportData.data.compras.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th className="px-4 py-2">Material</th>
                        <th className="px-4 py-2">Obra</th>
                        <th className="px-4 py-2">Qtd.</th>
                        <th className="px-4 py-2">Custo Total</th>
                        <th className="px-4 py-2">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.data.compras.map(compra => (
                        <tr
                          key={compra.id}
                          className="bg-white border-b hover:bg-gray-50"
                        >
                          <td className="px-4 py-2">
                            {materiais.find(m => m.id === compra.material_id)
                              ?.nome || 'N/A'}
                          </td>{' '}
                          {/* Corrected: compra.material_id */}
                          <td className="px-4 py-2">
                            {obras.find(o => o.id === compra.obra_id)
                              ?.nome_obra || 'N/A'}
                          </td>{' '}
                          {/* Corrected: compra.obra_id */}
                          <td className="px-4 py-2">{compra.quantidade}</td>
                          <td className="px-4 py-2">
                            {formatCurrency(compra.custo_total)}
                          </td>
                          <td className="px-4 py-2">
                            {formatDate(compra.data_compra)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4">
                    <button
                      onClick={() => handleExportGeralCompras(reportData.data)}
                      disabled={
                        !reportData.data ||
                        !reportData.data.compras ||
                        reportData.data.compras.length === 0
                      }
                      className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 disabled:opacity-50"
                    >
                      Exportar para CSV
                    </button>
                  </div>
                </div>
              ) : (
                <p>Nenhuma compra encontrada para os filtros aplicados.</p>
              )}
            </div>
          )}
          {/* Display logic for 'desempenhoEquipe' */}
          {reportData.type === 'desempenhoEquipe' && (
            <div>
              <p className="mb-1">
                <strong>Filtros Aplicados:</strong>
              </p>
              <ul className="list-disc list-inside text-sm mb-2">
                <li>
                  Equipe: {reportData.data.filtros.nome_equipe} (ID:{' '}
                  {reportData.data.filtros.equipe_id})
                </li>
                {reportData.data.filtros.data_inicio && (
                  <li>
                    Data Início:{' '}
                    {formatDate(reportData.data.filtros.data_inicio)}
                  </li>
                )}
                {reportData.data.filtros.data_fim && (
                  <li>
                    Data Fim: {formatDate(reportData.data.filtros.data_fim)}
                  </li>
                )}
              </ul>
              <h4 className="text-md font-semibold text-gray-600 mb-2 mt-4">
                Alocações da Equipe:
              </h4>
              {reportData.data.alocacoes &&
              reportData.data.alocacoes.length > 0 ? (
                <div className="overflow-x-auto shadow-md sm:rounded-lg">
                  <table className="min-w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                      <tr>
                        <th scope="col" className="px-6 py-3">
                          Obra
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Data Início Alocação
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Data Fim Alocação
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.data.alocacoes.map(aloc => (
                        <tr
                          key={aloc.id}
                          className="bg-white border-b hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                            {aloc.obra_nome}
                          </td>
                          <td className="px-6 py-4">
                            {formatDate(aloc.data_alocacao_inicio)}
                          </td>
                          <td className="px-6 py-4">
                            {formatDate(aloc.data_alocacao_fim)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4">
                    <button
                      onClick={() =>
                        handleExportDesempenhoEquipe(reportData.data)
                      }
                      disabled={
                        !reportData.data ||
                        !reportData.data.alocacoes ||
                        reportData.data.alocacoes.length === 0
                      }
                      className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 disabled:opacity-50"
                    >
                      Exportar para CSV
                    </button>
                  </div>
                </div>
              ) : (
                <p>
                  Nenhuma alocação encontrada para a equipe e filtros
                  selecionados.
                </p>
              )}
            </div>
          )}
          {/* Display logic for 'custoGeral' */}
          {reportData.type === 'custoGeral' && reportData.data && (
            <div className="mt-6 bg-gray-50 p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-gray-700 mb-3">
                Resultados do Relatório Geral de Custos
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Período: {formatDate(reportData.data.filtros.data_inicio)} -{' '}
                {formatDate(reportData.data.filtros.data_fim)}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded shadow">
                  <h4 className="text-md font-semibold text-gray-600">
                    Total Compras
                  </h4>
                  <p className="text-2xl text-blue-600">
                    {formatCurrency(reportData.data.total_compras)}
                  </p>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <h4 className="text-md font-semibold text-gray-600">
                    Total Despesas Extras
                  </h4>
                  <p className="text-2xl text-orange-600">
                    {formatCurrency(reportData.data.total_despesas_extras)}
                  </p>
                </div>
                <div className="bg-white p-4 rounded shadow border-2 border-primary-500">
                  <h4 className="text-md font-semibold text-gray-700">
                    Custo Consolidado Total
                  </h4>
                  <p className="text-2xl font-bold text-primary-600">
                    {formatCurrency(reportData.data.custo_consolidado_total)}
                  </p>
                </div>
              </div>
              <div className="mt-4 col-span-1 md:col-span-3">
                <button
                  onClick={() => handleExportCustoGeral(reportData.data)}
                  disabled={!reportData.data}
                  className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 disabled:opacity-50"
                >
                  Exportar para CSV
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Seção para Ações de Exportação e Pagamento */}
      <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-600">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Ações de Exportação e Pagamento
        </h2>
        <div className="flex space-x-4 flex-wrap">
          <button
            onClick={handleOpenMaterialPayModal}
            className={`px-4 py-2 rounded-md font-medium mb-2 bg-blue-500 text-white hover:bg-blue-600`}
          >
            Pagamento de Materiais
          </button>
          <button
            onClick={handleOpenRplModal}
            className={`px-4 py-2 rounded-md font-medium mb-2 bg-teal-500 text-white hover:bg-teal-600`}
          >
            Relatório Pagamento Locações
          </button>
        </div>
      </div>

      {/* Modal for Material Payments Report */}
      {showMaterialPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity duration-300 ease-in-out">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                Relatório de Pagamento de Materiais
              </h2>
              <button
                onClick={handleCloseMaterialPayModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
              >
                &times;
              </button>
            </div>

            {/* Step 1: Filters */}
            {mpStep === 1 && (
              <div className="space-y-4">
                {/* Week Selector for Material Payments Report */}
                <div className="mb-4">
                  <label
                    htmlFor="mpWeekSelector"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Selecionar Semana (Opcional):
                  </label>
                  <select
                    id="mpWeekSelector"
                    onChange={handleMaterialPayWeekSelectorChange}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="mpStartDate"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Data Início Pagamento{' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="mpStartDate"
                      value={mpStartDate}
                      onChange={e => setMpStartDate(e.target.value)}
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="mpEndDate"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Data Fim Pagamento <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="mpEndDate"
                      value={mpEndDate}
                      onChange={e => setMpEndDate(e.target.value)}
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="mpObraId"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Obra (Opcional)
                  </label>
                  <select
                    id="mpObraId"
                    value={mpObraId}
                    onChange={e => setMpObraId(e.target.value)}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                  >
                    <option value="">Todas as Obras</option>{' '}
                    {/* mpObras is now just 'obras' */}
                    {obras.map(obra => (
                      <option key={obra.id} value={obra.id}>
                        {obra.nome_obra}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="mpFornecedor"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Fornecedor (Opcional)
                  </label>
                  <input
                    type="text"
                    id="mpFornecedor"
                    value={mpFornecedor}
                    onChange={e => setMpFornecedor(e.target.value)}
                    placeholder="Nome parcial do fornecedor"
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                {mpPreCheckError && (
                  <p className="text-red-500 dark:text-red-400 text-sm">
                    {mpPreCheckError}
                  </p>
                )}
                <button
                  onClick={handleMpPreCheck}
                  disabled={mpIsPreChecking || !mpStartDate || !mpEndDate}
                  className="w-full mt-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {mpIsPreChecking && <SpinnerIcon className="w-5 h-5 mr-2" />}
                  {mpIsPreChecking ? 'Verificando...' : 'Verificar Pendências'}
                </button>
              </div>
            )}

            {/* Step 2: Pre-check Display */}
            {mpStep === 2 && mpPreCheckData && (
              <div className="my-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Pré-verificação de Pagamentos
                </h3>
                {mpPreCheckData.compras_com_pagamento_pendente_ou_futuro
                  ?.length > 0 ? (
                  <div className="p-4 mb-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
                    <p className="font-bold mb-1">{mpPreCheckData.message}</p>
                    <ul className="list-disc list-inside text-sm">
                      {mpPreCheckData.compras_com_pagamento_pendente_ou_futuro.map(
                        compra => (
                          <li key={compra.id}>
                            Compra ID {compra.id} ({compra.fornecedor}, Obra:{' '}
                            {compra.obra_nome || 'N/A'}) - Valor:{' '}
                            {formatCurrency(compra.valor_total_liquido)} - Data
                            Compra: {formatDate(compra.data_compra)} - Pagamento
                            Previsto:{' '}
                            {compra.data_pagamento
                              ? formatDate(compra.data_pagamento)
                              : 'Pendente'}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                ) : (
                  <p className="p-4 bg-green-100 border-l-4 border-green-500 text-green-700">
                    Nenhuma compra com pagamento pendente ou futuro encontrada
                    para os filtros e período de compra informados.
                  </p>
                )}
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => setMpStep(1)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleMpGenerateReport}
                    disabled={mpIsGeneratingReport}
                    className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center"
                  >
                    {mpIsGeneratingReport && (
                      <SpinnerIcon className="w-5 h-5 mr-2" />
                    )}
                    Gerar Relatório
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Report Display */}
            {mpStep === 3 && mpReportData && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Relatório de Pagamentos de Materiais
                  </h3>
                  <button
                    onClick={() =>
                      exportMaterialPaymentsReportToCSV(
                        mpReportData,
                        `relatorio_pagamento_materiais_${mpStartDate}_a_${mpEndDate}.csv`
                      )
                    }
                    disabled={
                      !mpReportData.report_data ||
                      mpReportData.report_data.length === 0
                    }
                    className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 disabled:opacity-50"
                  >
                    Exportar para CSV
                  </button>
                </div>
                {mpReportError && (
                  <p className="text-red-500 text-sm mb-3">{mpReportError}</p>
                )}
                {mpReportData.report_data?.length === 0 && (
                  <p>
                    Nenhum pagamento de material encontrado para o período e
                    filtros selecionados.
                  </p>
                )}

                {mpReportData.report_data?.map(obra => (
                  <div
                    key={obra.obra_id}
                    className="mb-6 p-3 border rounded-md"
                  >
                    <h4 className="text-lg font-semibold text-blue-600 mb-2">
                      Obra: {obra.obra_nome} - Total Pago:{' '}
                      {formatCurrency(obra.total_obra)}
                    </h4>
                    {obra.fornecedores.map(fornecedor => (
                      <div
                        key={fornecedor.fornecedor_nome}
                        className="mb-3 pl-3 border-l-2"
                      >
                        <h5 className="text-md font-semibold text-gray-700">
                          Fornecedor: {fornecedor.fornecedor_nome} - Total Pago:{' '}
                          {formatCurrency(fornecedor.total_fornecedor_na_obra)}
                        </h5>
                        <table className="min-w-full text-xs mt-1">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-2 py-1 text-left">ID Compra</th>
                              <th className="px-2 py-1 text-left">
                                Data Compra
                              </th>
                              <th className="px-2 py-1 text-left">
                                Data Pagamento
                              </th>
                              <th className="px-2 py-1 text-left">
                                Nota Fiscal
                              </th>
                              <th className="px-2 py-1 text-right">
                                Valor Líquido
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {fornecedor.compras_a_pagar.map(compra => (
                              <tr key={compra.id} className="border-b">
                                <td className="px-2 py-1">{compra.id}</td>
                                <td className="px-2 py-1">
                                  {formatDate(compra.data_compra)}
                                </td>
                                <td className="px-2 py-1">
                                  {compra.data_pagamento
                                    ? formatDate(compra.data_pagamento)
                                    : 'N/A'}
                                </td>
                                <td className="px-2 py-1">
                                  {compra.nota_fiscal || '-'}
                                </td>
                                <td className="px-2 py-1 text-right">
                                  {formatCurrency(compra.valor_total_liquido)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                ))}
                {mpReportData.report_data?.length > 0 && (
                  <div className="mt-4 pt-2 border-t">
                    <p className="text-lg font-bold text-right">
                      Total Geral Pago:{' '}
                      {formatCurrency(mpReportData.total_geral_relatorio)}
                    </p>
                  </div>
                )}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setMpStep(1)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Gerar Novo Relatório
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NEW Modal for Relatório de Pagamento de Locações */}
      {showRplModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity duration-300 ease-in-out">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                Relatório de Pagamento de Locações
              </h2>
              <button
                onClick={handleCloseRplModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
              >
                &times;
              </button>
            </div>

            {/* Step 1: Date Selection */}
            {rplStep === 1 && (
              <div>
                <div className="mb-4">
                  <label
                    htmlFor="rplWeekSelector"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Selecionar Semana (Opcional):
                  </label>
                  <select
                    id="rplWeekSelector"
                    onChange={handleRplWeekSelectorChange}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Escolha uma semana...
                    </option>
                    {weekOptions.map(
                      (
                        opt // Assuming weekOptions is available in this component's scope
                      ) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label
                      htmlFor="rplStartDate"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Data de Início <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="rplStartDate"
                      value={rplStartDate}
                      onChange={e => setRplStartDate(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="rplEndDate"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Data de Fim <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="rplEndDate"
                      value={rplEndDate}
                      onChange={e => setRplEndDate(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                {rplPreCheckError && (
                  <p className="text-red-500 dark:text-red-400 text-sm mb-3">
                    {rplPreCheckError}
                  </p>
                )}
                <button
                  onClick={handleRplPreCheck}
                  disabled={rplIsPreChecking || !rplStartDate || !rplEndDate}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-4 focus:ring-primary-300 disabled:opacity-50 flex items-center justify-center"
                >
                  {rplIsPreChecking && <SpinnerIcon className="w-5 h-5 mr-2" />}
                  {rplIsPreChecking
                    ? 'Verificando...'
                    : 'Verificar Disponibilidade de Dias'}
                </button>
              </div>
            )}

            {/* Step 2: Pre-check Alert */}
            {rplStep === 2 && (
              <div className="my-4">
                {rplPreCheckError && (
                  <p className="text-red-500 dark:text-red-400 text-sm mb-3">
                    {rplPreCheckError}
                  </p>
                )}

                {rplPreCheckAlertDays.length > 0 ||
                rplPreCheckMedicoesPendentes.length > 0 ? (
                  <>
                    {rplPreCheckAlertDays.length > 0 && (
                      <div className="p-4 mb-4 bg-yellow-100 dark:bg-yellow-900 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-200">
                        <h3 className="font-bold mb-2">
                          Alerta: Dias Sem Locações Registradas!
                        </h3>
                        <p className="mb-1">
                          Foram encontrados os seguintes dias dentro do período
                          selecionado que não possuem nenhuma locação ativa
                          registrada:
                        </p>
                        <ul className="list-disc list-inside mb-3">
                          {rplPreCheckAlertDays.map(day => (
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

                    {rplPreCheckMedicoesPendentes.length > 0 && (
                      <div className="p-4 mb-4 bg-orange-100 dark:bg-orange-900 border-l-4 border-orange-500 text-orange-700 dark:text-orange-200">
                        <h3 className="font-bold mb-2">
                          Alerta: Medições Pendentes!
                        </h3>
                        <p className="mb-1">
                          As seguintes locações ativas no período possuem valor
                          de pagamento zerado ou não definido e podem precisar
                          de ajuste:
                        </p>
                        <ul className="list-disc list-inside mb-3 text-xs">
                          {rplPreCheckMedicoesPendentes.map(loc => (
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
                    <p className="mb-3">
                      Deseja gerar o relatório mesmo assim?
                    </p>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setRplStep(1)}
                        className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium py-2 px-4 rounded-md"
                      >
                        Voltar/Corrigir Datas
                      </button>
                      <button
                        onClick={handleRplContinueDespiteAlert}
                        disabled={rplIsGeneratingReport}
                        className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
                      >
                        {rplIsGeneratingReport && (
                          <SpinnerIcon className="w-5 h-5 mr-2" />
                        )}
                        {rplIsGeneratingReport
                          ? 'Gerando Dados...'
                          : 'Continuar e Preparar Dados'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-4 bg-green-100 dark:bg-green-900 border-l-4 border-green-500 text-green-700 dark:text-green-200">
                    <h3 className="font-bold mb-2">Verificação Concluída</h3>
                    <p>
                      Nenhuma pendência (dias sem locações ou medições zeradas)
                      encontrada no período selecionado.
                    </p>
                    <div className="flex justify-end space-x-3 mt-3">
                      <button
                        onClick={() => setRplStep(1)}
                        className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium py-2 px-4 rounded-md"
                      >
                        Voltar
                      </button>
                      <button
                        onClick={handleRplPrepareAndShowReportData}
                        disabled={rplIsGeneratingReport}
                        className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
                      >
                        {rplIsGeneratingReport && (
                          <SpinnerIcon className="w-5 h-5 mr-2" />
                        )}
                        {rplIsGeneratingReport
                          ? 'Gerando Dados...'
                          : 'Preparar Dados do Relatório'}
                      </button>
                    </div>
                  </div>
                )}
                {rplReportError && !rplIsGeneratingReport && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-3">
                    {rplReportError}
                  </p>
                )}
              </div>
            )}

            {/* Step 3: Report Display and Export Options */}
            {rplStep === 3 && rplReportData && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                    Relatório Gerado
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleRplExportCSV}
                      disabled={
                        !rplReportData ||
                        rplReportData.length === 0 ||
                        rplIsGeneratingReport
                      }
                      className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-4 focus:ring-green-300 text-sm disabled:opacity-50"
                    >
                      <SpinnerIcon
                        className={`w-4 h-4 mr-1 ${rplIsGeneratingReport && rplReportError === null ? 'inline-block' : 'hidden'}`}
                      />
                      Exportar para CSV
                    </button>
                    <button
                      onClick={handleRplExportPDF}
                      disabled={
                        !rplReportData ||
                        rplReportData.length === 0 ||
                        rplIsGeneratingReport
                      }
                      className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-4 focus:ring-red-300 text-sm disabled:opacity-50"
                    >
                      <SpinnerIcon
                        className={`w-4 h-4 mr-1 ${rplIsGeneratingReport && rplReportError === null ? 'inline-block' : 'hidden'}`}
                      />
                      Exportar para PDF
                    </button>
                  </div>
                </div>
                {rplReportError && (
                  <p className="text-red-500 dark:text-red-400 text-sm mb-3">
                    {rplReportError}
                  </p>
                )}
                {rplReportData.length === 0 && (
                  <p className="text-gray-600 dark:text-gray-400">
                    Nenhuma locação encontrada para o período e critérios
                    selecionados.
                  </p>
                )}

                {/* Displaying the report data - adapted from LocacoesPage */}
                {rplReportData.map(obraData => (
                  <div
                    key={obraData.obra_id || obraData.obra_nome}
                    className="mb-8 p-4 border border-gray-200 dark:border-gray-600 rounded-lg shadow dark:bg-gray-700"
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
                            <table className="min-w-full text-xs text-left text-gray-600 dark:text-gray-300">
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
                                    className="bg-white dark:bg-gray-800 border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                                  >
                                    <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                                      {loc.recurso_nome}
                                    </td>
                                    <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                                      {loc.tipo_pagamento_display}
                                    </td>
                                    <td className="px-3 py-2 text-right text-gray-900 dark:text-gray-100">
                                      {parseFloat(
                                        loc.valor_diario_atribuido
                                      ).toLocaleString('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                      })}
                                    </td>
                                    <td className="px-3 py-2 text-right text-gray-900 dark:text-gray-100">
                                      {parseFloat(
                                        loc.valor_pagamento_total_locacao
                                      ).toLocaleString('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                      })}
                                    </td>
                                    <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                                      {formatDateToDMY(
                                        loc.data_locacao_original_inicio
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                                      {formatDateToDMY(
                                        loc.data_locacao_original_fim
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
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
                {rplReportData.length > 0 && (
                  <div className="mt-8 pt-4 border-t-2 border-gray-300 dark:border-gray-600">
                    <p className="text-xl font-bold text-right text-gray-800 dark:text-gray-100">
                      Total Geral do Relatório:
                      <span className="text-green-700 dark:text-green-400 ml-2">
                        {rplReportData
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
                    onClick={() => setRplStep(1)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
                  >
                    Gerar Novo Relatório
                  </button>
                </div>
              </div>
            )}
            {/* Feedback de carregamento para etapas que não sejam a 3 (onde os botões de exportação têm seus próprios spinners) */}
            {rplIsGeneratingReport && rplStep !== 3 && (
              <p className="text-center text-gray-500 dark:text-gray-400 mt-4">
                <SpinnerIcon className="w-5 h-5 mr-2 inline" /> Gerando...
              </p>
            )}
            {rplReportError && rplStep !== 3 && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-3 text-center">
                {rplReportError}
              </p>
            )}
          </div>
        </div>
      )}
      {/* Modal de Pagamento de Locações removido, será reimplementado */}
    </div>
  );
};

export default RelatoriosPage;
