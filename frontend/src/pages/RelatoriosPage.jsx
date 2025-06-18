import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import { exportDataToCsv, exportMaterialPaymentsReportToCSV } from '../utils/csvExporter'; // Import CSV exporter
import SpinnerIcon from '../components/utils/SpinnerIcon'; // Assuming SpinnerIcon is needed
import { formatDateToDMY, getStartOfWeek, formatDateToYYYYMMDD } from '../../utils/dateUtils.js'; // Import date utils

const RelatoriosPage = () => {
  const [obras, setObras] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [equipes, setEquipes] = useState([]);
  const [reportType, setReportType] = useState('financeiroObra'); // 'financeiroObra', 'geralCompras', 'desempenhoEquipe', 'custoGeral', 'pagamentoMateriais'

  // Filters state for each report type
  const [financeiroFilters, setFinanceiroFilters] = useState({ obra_id: '', data_inicio: '', data_fim: '' });
  const [geralComprasFilters, setGeralComprasFilters] = useState({ data_inicio: '', data_fim: '', obra_id: '', material_id: '' });
  const [desempenhoEquipeFilters, setDesempenhoEquipeFilters] = useState({ equipe_id: '', data_inicio: '', data_fim: '' });
  const [custoGeralFilters, setCustoGeralFilters] = useState({ data_inicio: '', data_fim: '' });

  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false); // For initial dropdown data
  const [error, setError] = useState(null);

  // State for Material Payments Report Modal
  const [showMaterialPayModal, setShowMaterialPayModal] = useState(false);
  const [mpStartDate, setMpStartDate] = useState('');
  const [mpEndDate, setMpEndDate] = useState('');
  const [mpObraId, setMpObraId] = useState('');
  const [mpFornecedor, setMpFornecedor] = useState('');
  const [mpObras, setMpObras] = useState([]); // For Obra dropdown in this modal

  const [mpPreCheckData, setMpPreCheckData] = useState(null);
  const [mpIsPreChecking, setMpIsPreChecking] = useState(false);
  const [mpPreCheckError, setMpPreCheckError] = useState(null);

  const [mpReportData, setMpReportData] = useState(null);
  const [mpIsGeneratingReport, setMpIsGeneratingReport] = useState(false);
  const [mpReportError, setMpReportError] = useState(null);

  const [mpStep, setMpStep] = useState(1); // 1: filters, 2: pre-check, 3: report

  const weekOptions = [
    { label: "Esta Semana", value: 0 },
    { label: "Semana Passada", value: -1 },
    { label: "2 Semanas Atrás", value: -2 },
    { label: "3 Semanas Atrás", value: -3 },
    { label: "4 Semanas Atrás", value: -4 },
    { label: "5 Semanas Atrás", value: -5 },
  ];

  const handleMaterialPayWeekSelectorChange = (event) => {
    const selectedWeekOffset = parseInt(event.target.value, 10);
    if (isNaN(selectedWeekOffset)) {
      return;
    }

    const today = new Date();
    const startOfCurrentWeek = getStartOfWeek(today, 1); // Monday as startDay = 1

    const targetMonday = new Date(startOfCurrentWeek);
    targetMonday.setDate(startOfCurrentWeek.getDate() + (selectedWeekOffset * 7));

    const targetSunday = new Date(targetMonday);
    targetSunday.setDate(targetMonday.getDate() + 6); // Sunday is 6 days after Monday

    setMpStartDate(formatDateToYYYYMMDD(targetMonday));
    setMpEndDate(formatDateToYYYYMMDD(targetSunday));
  };

  const fetchDropdownData = useCallback(async () => {
    setIsInitialLoading(true);
    try {
      // Fetch all necessary data for dropdowns, including obras for the new report
      const [obrasRes, materiaisRes, equipesRes] = await Promise.all([
        api.getObras({ page_size: 1000 }), // Fetch more obras if needed for dropdowns
        api.getMateriais({ page_size: 1000 }), // Fetch more materiais if needed
        api.getEquipes({ page_size: 1000 }),   // Fetch more equipes if needed
      ]);

      const getSafeData = (response) => {
        const data = response?.data?.results || response?.data || (Array.isArray(response) ? response : []);
        return Array.isArray(data) ? data : [];
      };

      setObras(getSafeData(obrasRes));
      setMpObras(getSafeData(obrasRes)); // Also for the new report modal
      setMateriais(getSafeData(materiaisRes));
      setEquipes(getSafeData(equipesRes));

    } catch (err) {
      console.error("Failed to fetch dropdown data:", err);
      setError('Falha ao carregar dados para filtros.');
      setObras([]);
      setMpObras([]);
      setMateriais([]);
      setEquipes([]);
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDropdownData();
  }, [fetchDropdownData]);


  const handleFilterChange = (report, field, value) => {
    setError(null);
    setReportData(null);
    switch (report) {
      case 'financeiroObra':
        setFinanceiroFilters(prev => ({ ...prev, [field]: value }));
        break;
      case 'geralCompras':
        setGeralComprasFilters(prev => ({ ...prev, [field]: value }));
        break;
      case 'desempenhoEquipe':
        setDesempenhoEquipeFilters(prev => ({ ...prev, [field]: value }));
        break;
      case 'custoGeral':
        setCustoGeralFilters(prev => ({ ...prev, [field]: value }));
        break;
      default:
        break;
    }
  };

  const validateFilters = (report) => {
    let isValid = true;
    let currentError = null;
    switch (report) {
        case 'financeiroObra':
            if (!financeiroFilters.obra_id) currentError = "Obra é obrigatória.";
            else if (!financeiroFilters.data_inicio) currentError = "Data de Início é obrigatória.";
            else if (!financeiroFilters.data_fim) currentError = "Data de Fim é obrigatória.";
            else if (new Date(financeiroFilters.data_inicio) > new Date(financeiroFilters.data_fim)) currentError = "Data de Início não pode ser posterior à Data de Fim.";
            break;
        case 'geralCompras':
            if (!geralComprasFilters.data_inicio) currentError = "Data de Início é obrigatória.";
            else if (!geralComprasFilters.data_fim) currentError = "Data de Fim é obrigatória.";
            else if (new Date(geralComprasFilters.data_inicio) > new Date(geralComprasFilters.data_fim)) currentError = "Data de Início não pode ser posterior à Data de Fim.";
            break;
        case 'desempenhoEquipe':
            if (!desempenhoEquipeFilters.equipe_id) currentError = "Equipe é obrigatória.";
            else if (desempenhoEquipeFilters.data_inicio && desempenhoEquipeFilters.data_fim && new Date(desempenhoEquipeFilters.data_inicio) > new Date(desempenhoEquipeFilters.data_fim)) currentError = "Data de Início não pode ser posterior à Data de Fim.";
            break;
        case 'custoGeral':
            if (!custoGeralFilters.data_inicio) currentError = "Data de Início é obrigatória.";
            else if (!custoGeralFilters.data_fim) currentError = "Data de Fim é obrigatória.";
            else if (new Date(custoGeralFilters.data_inicio) > new Date(custoGeralFilters.data_fim)) currentError = "Data de Início não pode ser posterior à Data de Fim.";
            break;
        default:
            isValid = false; // Should not happen
    }
    if(currentError) {
        setError(currentError);
        isValid = false;
    }
    return isValid;
  };


  const handleSubmitReport = async (currentReportType) => {
    if (!validateFilters(currentReportType)) return;

    setError(null);
    setReportData(null);
    setIsLoading(true);

    try {
      let response;
      let params;
      switch (currentReportType) {
        case 'financeiroObra':
          response = await api.getRelatorioFinanceiroObra(financeiroFilters);
          break;
        case 'geralCompras':
          params = { ...geralComprasFilters };
          if (!params.obra_id) delete params.obra_id;
          if (!params.material_id) delete params.material_id;
          response = await api.getRelatorioGeralCompras(params);
          break;
        case 'desempenhoEquipe':
          params = { ...desempenhoEquipeFilters };
          if (!params.data_inicio) delete params.data_inicio;
          if (!params.data_fim) delete params.data_fim;
          response = await api.getRelatorioDesempenhoEquipe(params);
          break;
        case 'custoGeral':
          response = await api.getRelatorioCustoGeral(custoGeralFilters);
          break;
        default:
          throw new Error("Tipo de relatório desconhecido.");
      }
      setReportData({ type: currentReportType, data: response.data });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Falha ao gerar relatório.');
      console.error(`Relatorio ${currentReportType} Error:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString + 'T00:00:00Z');
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const renderReportForm = () => {
    if (isInitialLoading) return <p className="text-center text-gray-600">Carregando filtros...</p>;

    switch (reportType) {
      case 'financeiroObra':
        return (
          <form key="form-financeiro-obra" onSubmit={(e) => { e.preventDefault(); handleSubmitReport('financeiroObra'); }} className="bg-white p-6 rounded-lg shadow mb-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Relatório Financeiro da Obra</h2>
            <div>
              <label htmlFor="obra_id_fin" className="block text-sm font-medium text-gray-700">Obra <span className="text-red-500">*</span></label>
              <select id="obra_id_fin" name="obra_id" value={financeiroFilters.obra_id}
                      onChange={(e) => handleFilterChange('financeiroObra', 'obra_id', e.target.value)}
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                <option value="">Selecione uma Obra</option>
                {obras.map(obra => <option key={obra.id} value={obra.id}>{obra.nome_obra}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="data_inicio_fin" className="block text-sm font-medium text-gray-700">Data Início <span className="text-red-500">*</span></label>
                <input type="date" id="data_inicio_fin" name="data_inicio" value={financeiroFilters.data_inicio}
                       onChange={(e) => handleFilterChange('financeiroObra', 'data_inicio', e.target.value)}
                       className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"/>
              </div>
              <div>
                <label htmlFor="data_fim_fin" className="block text-sm font-medium text-gray-700">Data Fim <span className="text-red-500">*</span></label>
                <input type="date" id="data_fim_fin" name="data_fim" value={financeiroFilters.data_fim}
                       onChange={(e) => handleFilterChange('financeiroObra', 'data_fim', e.target.value)}
                       className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"/>
              </div>
            </div>
            <button type="submit" disabled={isLoading}
                    className="w-full md:w-auto mt-2 px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-75 disabled:opacity-50">
              {isLoading ? 'Gerando...' : 'Gerar Relatório'}
            </button>
          </form>
        );
      case 'geralCompras':
         return (
            <form key="form-geral-compras" onSubmit={(e) => { e.preventDefault(); handleSubmitReport('geralCompras'); }} className="bg-white p-6 rounded-lg shadow mb-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Relatório Geral de Compras</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                <label htmlFor="data_inicio_comp" className="block text-sm font-medium text-gray-700">Data Início <span className="text-red-500">*</span></label>
                <input type="date" id="data_inicio_comp" name="data_inicio" value={geralComprasFilters.data_inicio}
                        onChange={(e) => handleFilterChange('geralCompras', 'data_inicio', e.target.value)}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"/>
                </div>
                <div>
                <label htmlFor="data_fim_comp" className="block text-sm font-medium text-gray-700">Data Fim <span className="text-red-500">*</span></label>
                <input type="date" id="data_fim_comp" name="data_fim" value={geralComprasFilters.data_fim}
                        onChange={(e) => handleFilterChange('geralCompras', 'data_fim', e.target.value)}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"/>
                </div>
                <div>
                <label htmlFor="obra_id_comp" className="block text-sm font-medium text-gray-700">Obra (Opcional)</label>
                <select id="obra_id_comp" name="obra_id" value={geralComprasFilters.obra_id}
                        onChange={(e) => handleFilterChange('geralCompras', 'obra_id', e.target.value)}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                    <option value="">Todas as Obras</option>
                    {obras.map(obra => <option key={obra.id} value={obra.id}>{obra.nome_obra}</option>)}
                </select>
                </div>
                <div>
                <label htmlFor="material_id_comp" className="block text-sm font-medium text-gray-700">Material (Opcional)</label>
                <select id="material_id_comp" name="material_id" value={geralComprasFilters.material_id}
                        onChange={(e) => handleFilterChange('geralCompras', 'material_id', e.target.value)}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                    <option value="">Todos os Materiais</option>
                    {materiais.map(material => <option key={material.id} value={material.id}>{material.nome}</option>)}
                </select>
                </div>
            </div>
            <button type="submit" disabled={isLoading}
                    className="w-full md:w-auto mt-2 px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-75 disabled:opacity-50">
                {isLoading ? 'Gerando...' : 'Gerar Relatório'}
            </button>
            </form>
         );
      case 'desempenhoEquipe':
        return (
            <form key="form-desempenho-equipe" onSubmit={(e) => { e.preventDefault(); handleSubmitReport('desempenhoEquipe'); }} className="bg-white p-6 rounded-lg shadow mb-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Relatório de Desempenho de Equipes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div>
                <label htmlFor="equipe_id_des" className="block text-sm font-medium text-gray-700">Equipe <span className="text-red-500">*</span></label>
                <select id="equipe_id_des" name="equipe_id" value={desempenhoEquipeFilters.equipe_id}
                        onChange={(e) => handleFilterChange('desempenhoEquipe', 'equipe_id', e.target.value)}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                    <option value="">Selecione uma Equipe</option>
                    {equipes.map(equipe => <option key={equipe.id} value={equipe.id}>{equipe.nome_equipe}</option>)}
                </select>
                </div>
                <div>
                <label htmlFor="data_inicio_des" className="block text-sm font-medium text-gray-700">Data Início (Opcional)</label>
                <input type="date" id="data_inicio_des" name="data_inicio" value={desempenhoEquipeFilters.data_inicio}
                        onChange={(e) => handleFilterChange('desempenhoEquipe', 'data_inicio', e.target.value)}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"/>
                </div>
                <div>
                <label htmlFor="data_fim_des" className="block text-sm font-medium text-gray-700">Data Fim (Opcional)</label>
                <input type="date" id="data_fim_des" name="data_fim" value={desempenhoEquipeFilters.data_fim}
                        onChange={(e) => handleFilterChange('desempenhoEquipe', 'data_fim', e.target.value)}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"/>
                </div>
                <button type="submit" disabled={isLoading || !desempenhoEquipeFilters.equipe_id}
                        className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-75 disabled:opacity-50">
                {isLoading ? 'Gerando...' : 'Gerar Relatório'}
                </button>
            </div>
            </form>
        );
    case 'custoGeral':
        return (
            <form key="form-custo-geral" onSubmit={(e) => { e.preventDefault(); handleSubmitReport('custoGeral'); }} className="bg-white p-6 rounded-lg shadow mb-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Relatório Geral de Custos do Sistema</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                <label htmlFor="data_inicio_cg" className="block text-sm font-medium text-gray-700">Data Início <span className="text-red-500">*</span></label>
                <input type="date" id="data_inicio_cg" name="data_inicio" value={custoGeralFilters.data_inicio}
                        onChange={(e) => handleFilterChange('custoGeral', 'data_inicio', e.target.value)}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"/>
                </div>
                <div>
                <label htmlFor="data_fim_cg" className="block text-sm font-medium text-gray-700">Data Fim <span className="text-red-500">*</span></label>
                <input type="date" id="data_fim_cg" name="data_fim" value={custoGeralFilters.data_fim}
                        onChange={(e) => handleFilterChange('custoGeral', 'data_fim', e.target.value)}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"/>
                </div>
                <button type="submit" disabled={isLoading}
                        className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-75 disabled:opacity-50">
                {isLoading ? <SpinnerIcon className="w-5 h-5 mr-2 inline-block" /> : null}
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
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

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
      setMpPreCheckError("Datas de início e fim são obrigatórias.");
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
      setMpPreCheckError(err.response?.data?.error || err.message || "Falha na pré-verificação.");
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
      setMpReportError(err.response?.data?.error || err.message || "Falha ao gerar relatório.");
    } finally {
      setMpIsGeneratingReport(false);
    }
  };

  const handleMpContinueDespiteAlert = () => {
    handleMpGenerateReport();
  };


  // --- Helper functions for data transformation before CSV export ---
  // It's important that these functions have access to 'obras', 'materiais', 'formatDate', 'formatCurrency'
  // So, they are defined within the component scope.

  const handleExportFinanceiroObra = (data) => {
    if (!data) return;
    const exportableData = [
        {
            "Obra Nome": data.nome_obra,
            "Obra ID": data.obra_id,
            "Data Início": formatDate(data.data_inicio), // formatDate is in scope
            "Data Fim": formatDate(data.data_fim),
            "Total Compras": formatCurrency(data.total_compras), // formatCurrency is in scope
            "Total Despesas Extras": formatCurrency(data.total_despesas_extras),
            "Custo Total Geral": formatCurrency(data.custo_total_geral),
        }
    ];
    exportDataToCsv(exportableData, `relatorio_financeiro_obra_${data.obra_id}_${data.data_inicio}_${data.data_fim}.csv`);
  };

  const handleExportGeralCompras = (data) => {
      if (!data || !data.compras || data.compras.length === 0) return;

      const exportableData = data.compras.map(compra => ({
          "Material ID": compra.material_id,
          "Material Nome": materiais.find(m => m.id === compra.material_id)?.nome || 'N/A', // 'materiais' is in scope
          "Obra ID": compra.obra_id,
          "Obra Nome": obras.find(o => o.id === compra.obra_id)?.nome_obra || 'N/A', // 'obras' is in scope
          "Quantidade": compra.quantidade,
          "Custo Total": formatCurrency(compra.custo_total),
          "Fornecedor": compra.fornecedor,
          "Data Compra": formatDate(compra.data_compra),
          "Nota Fiscal": compra.nota_fiscal || '', // Ensure empty string for null/undefined
      }));
      exportDataToCsv(exportableData, `relatorio_geral_compras_${data.filtros.data_inicio}_${data.filtros.data_fim}.csv`);
  };

  const handleExportDesempenhoEquipe = (data) => {
      if (!data || !data.alocacoes || data.alocacoes.length === 0) return;

      const exportableData = data.alocacoes.map(aloc => ({
          "Equipe Nome": data.filtros.nome_equipe,
          "Equipe ID": data.filtros.equipe_id,
          "Obra Nome": aloc.obra_nome,
          "Obra ID": aloc.obra_id, // Assuming obra_id is part of aloc if needed, or look up if only obra_nome is present
          "Data Alocação Início": formatDate(aloc.data_alocacao_inicio),
          "Data Alocação Fim": formatDate(aloc.data_alocacao_fim),
          "Funcionarios Alocados": aloc.funcionarios_alocados_nomes ? aloc.funcionarios_alocados_nomes.join('; ') : 'N/A', // Example if this data is available
          "Descricao Alocacao": aloc.descricao_alocacao || '', // Example if this data is available
      }));
      // Filename might need adjustment based on available filter info for equipe.
      exportDataToCsv(exportableData, `relatorio_desempenho_equipe_${data.filtros.equipe_id}_${data.filtros.nome_equipe}.csv`);
  };

  const handleExportCustoGeral = (data) => {
      if (!data) return;
      const exportableData = [
          {
              "Data Início": formatDate(data.filtros.data_inicio),
              "Data Fim": formatDate(data.filtros.data_fim),
              "Total Compras": formatCurrency(data.total_compras),
              "Total Despesas Extras": formatCurrency(data.total_despesas_extras),
              "Custo Consolidado Total": formatCurrency(data.custo_consolidado_total),
          }
      ];
      exportDataToCsv(exportableData, `relatorio_custo_geral_${data.filtros.data_inicio}_${data.filtros.data_fim}.csv`);
  };


  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">Página de Relatórios</h1>

      <div className="mb-6 flex space-x-2 flex-wrap">
        {/* Buttons to select report type */}
        <button onClick={() => { setReportType('financeiroObra'); setReportData(null); setError(null); }} className={`px-4 py-2 rounded-md font-medium mb-2 ${reportType === 'financeiroObra' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
            Financeiro por Obra
        </button>
        <button onClick={() => { setReportType('geralCompras'); setReportData(null); setError(null); }} className={`px-4 py-2 rounded-md font-medium mb-2 ${reportType === 'geralCompras' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
            Geral de Compras
        </button>
        <button onClick={() => { setReportType('desempenhoEquipe'); setReportData(null); setError(null); }} className={`px-4 py-2 rounded-md font-medium mb-2 ${reportType === 'desempenhoEquipe' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
            Desempenho de Equipe
        </button>
        <button onClick={() => { setReportType('custoGeral'); setReportData(null); setError(null); }} className={`px-4 py-2 rounded-md font-medium mb-2 ${reportType === 'custoGeral' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
            Custo Geral do Sistema
        </button>
        <button
            onClick={handleOpenMaterialPayModal}
            className={`px-4 py-2 rounded-md font-medium mb-2 bg-blue-500 text-white hover:bg-blue-600`}
        >
            Pagamento de Materiais
        </button>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative my-4" role="alert">{error}</div>}

      {renderReportForm()}

      {isLoading && <p className="text-center py-4">Carregando relatório...</p>}

      {reportData && !isLoading && (
        <div className="bg-white p-6 rounded-lg shadow mt-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Resultados do Relatório</h3>
          {/* Display logic for 'financeiroObra' */}
          {reportData.type === 'financeiroObra' && (
            <div className="space-y-2">
              <p><strong>Obra:</strong> {reportData.data.nome_obra} (ID: {reportData.data.obra_id})</p>
              <p><strong>Período:</strong> {formatDate(reportData.data.data_inicio)} - {formatDate(reportData.data.data_fim)}</p>
              <p><strong>Total Compras:</strong> <span className="font-semibold">{formatCurrency(reportData.data.total_compras)}</span></p>
              <p><strong>Total Despesas Extras:</strong> <span className="font-semibold">{formatCurrency(reportData.data.total_despesas_extras)}</span></p>
              <p className="text-lg"><strong>Custo Total Geral:</strong> <span className="font-bold text-primary-700">{formatCurrency(reportData.data.custo_total_geral)}</span></p>
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
             <p className="mb-1"><strong>Filtros Aplicados:</strong></p>
             <ul className="list-disc list-inside text-sm mb-2">
               <li>Período: {formatDate(reportData.data.filtros.data_inicio)} - {formatDate(reportData.data.filtros.data_fim)}</li>
               {reportData.data.filtros.obra_id && <li>Obra: {obras.find(o => o.id === parseInt(reportData.data.filtros.obra_id))?.nome_obra || 'N/A'} (ID: {reportData.data.filtros.obra_id})</li>}
               {reportData.data.filtros.material_id && <li>Material: {materiais.find(m => m.id === parseInt(reportData.data.filtros.material_id))?.nome || 'N/A'} (ID: {reportData.data.filtros.material_id})</li>}
             </ul>
             <p className="text-lg mb-4"><strong>Soma Total das Compras Filtradas:</strong> <span className="font-bold text-primary-700">{formatCurrency(reportData.data.soma_total_compras)}</span></p>

             <h4 className="text-md font-semibold text-gray-600 mb-2">Detalhes das Compras:</h4>
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
                       <tr key={compra.id} className="bg-white border-b hover:bg-gray-50">
                         <td className="px-4 py-2">{materiais.find(m=>m.id === compra.material_id)?.nome || 'N/A'}</td> {/* Corrected: compra.material_id */}
                         <td className="px-4 py-2">{obras.find(o=>o.id === compra.obra_id)?.nome_obra || 'N/A'}</td> {/* Corrected: compra.obra_id */}
                         <td className="px-4 py-2">{compra.quantidade}</td>
                         <td className="px-4 py-2">{formatCurrency(compra.custo_total)}</td>
                         <td className="px-4 py-2">{formatDate(compra.data_compra)}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                 <div className="mt-4">
                    <button
                        onClick={() => handleExportGeralCompras(reportData.data)}
                        disabled={!reportData.data || !reportData.data.compras || reportData.data.compras.length === 0}
                        className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 disabled:opacity-50"
                    >
                        Exportar para CSV
                    </button>
                 </div>
               </div>
             ) : <p>Nenhuma compra encontrada para os filtros aplicados.</p>}
           </div>
          )}
          {/* Display logic for 'desempenhoEquipe' */}
          {reportData.type === 'desempenhoEquipe' && (
            <div>
                <p className="mb-1"><strong>Filtros Aplicados:</strong></p>
                <ul className="list-disc list-inside text-sm mb-2">
                    <li>Equipe: {reportData.data.filtros.nome_equipe} (ID: {reportData.data.filtros.equipe_id})</li>
                    {reportData.data.filtros.data_inicio && <li>Data Início: {formatDate(reportData.data.filtros.data_inicio)}</li>}
                    {reportData.data.filtros.data_fim && <li>Data Fim: {formatDate(reportData.data.filtros.data_fim)}</li>}
                </ul>
                <h4 className="text-md font-semibold text-gray-600 mb-2 mt-4">Alocações da Equipe:</h4>
                {reportData.data.alocacoes && reportData.data.alocacoes.length > 0 ? (
                <div className="overflow-x-auto shadow-md sm:rounded-lg">
                    <table className="min-w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                        <tr>
                        <th scope="col" className="px-6 py-3">Obra</th>
                        <th scope="col" className="px-6 py-3">Data Início Alocação</th>
                        <th scope="col" className="px-6 py-3">Data Fim Alocação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.data.alocacoes.map(aloc => (
                        <tr key={aloc.id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{aloc.obra_nome}</td>
                            <td className="px-6 py-4">{formatDate(aloc.data_alocacao_inicio)}</td>
                            <td className="px-6 py-4">{formatDate(aloc.data_alocacao_fim)}</td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                    <div className="mt-4">
                        <button
                            onClick={() => handleExportDesempenhoEquipe(reportData.data)}
                            disabled={!reportData.data || !reportData.data.alocacoes || reportData.data.alocacoes.length === 0}
                            className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 disabled:opacity-50"
                        >
                            Exportar para CSV
                        </button>
                    </div>
                </div>
                ) : <p>Nenhuma alocação encontrada para a equipe e filtros selecionados.</p>}
            </div>
          )}
          {/* Display logic for 'custoGeral' */}
          {reportData.type === 'custoGeral' && reportData.data && (
            <div className="mt-6 bg-gray-50 p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold text-gray-700 mb-3">Resultados do Relatório Geral de Custos</h3>
                <p className="text-sm text-gray-600 mb-4">
                Período: {formatDate(reportData.data.filtros.data_inicio)} - {formatDate(reportData.data.filtros.data_fim)}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded shadow">
                    <h4 className="text-md font-semibold text-gray-600">Total Compras</h4>
                    <p className="text-2xl text-blue-600">{formatCurrency(reportData.data.total_compras)}</p>
                </div>
                <div className="bg-white p-4 rounded shadow">
                    <h4 className="text-md font-semibold text-gray-600">Total Despesas Extras</h4>
                    <p className="text-2xl text-orange-600">{formatCurrency(reportData.data.total_despesas_extras)}</p>
                </div>
                <div className="bg-white p-4 rounded shadow border-2 border-primary-500">
                    <h4 className="text-md font-semibold text-gray-700">Custo Consolidado Total</h4>
                    <p className="text-2xl font-bold text-primary-600">{formatCurrency(reportData.data.custo_consolidado_total)}</p>
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

      {/* Modal for Material Payments Report */}
      {showMaterialPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity duration-300 ease-in-out">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Relatório de Pagamento de Materiais</h2>
              <button onClick={handleCloseMaterialPayModal} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>

            {/* Step 1: Filters */}
            {mpStep === 1 && (
              <div className="space-y-4">
                {/* Week Selector for Material Payments Report */}
                <div className="mb-4">
                  <label htmlFor="mpWeekSelector" className="block text-sm font-medium text-gray-700 mb-1">Selecionar Semana (Opcional):</label>
                  <select
                    id="mpWeekSelector"
                    onChange={handleMaterialPayWeekSelectorChange}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    defaultValue=""
                  >
                    <option value="" disabled>Escolha uma semana...</option>
                    {weekOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="mpStartDate" className="block text-sm font-medium text-gray-700">Data Início Pagamento <span className="text-red-500">*</span></label>
                    <input type="date" id="mpStartDate" value={mpStartDate} onChange={(e) => setMpStartDate(e.target.value)}
                           className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
                  </div>
                  <div>
                    <label htmlFor="mpEndDate" className="block text-sm font-medium text-gray-700">Data Fim Pagamento <span className="text-red-500">*</span></label>
                    <input type="date" id="mpEndDate" value={mpEndDate} onChange={(e) => setMpEndDate(e.target.value)}
                           className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
                  </div>
                </div>
                <div>
                  <label htmlFor="mpObraId" className="block text-sm font-medium text-gray-700">Obra (Opcional)</label>
                  <select id="mpObraId" value={mpObraId} onChange={(e) => setMpObraId(e.target.value)}
                          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm">
                    <option value="">Todas as Obras</option>
                    {mpObras.map(obra => <option key={obra.id} value={obra.id}>{obra.nome_obra}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="mpFornecedor" className="block text-sm font-medium text-gray-700">Fornecedor (Opcional)</label>
                  <input type="text" id="mpFornecedor" value={mpFornecedor} onChange={(e) => setMpFornecedor(e.target.value)}
                         placeholder="Nome parcial do fornecedor"
                         className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
                </div>
                {mpPreCheckError && <p className="text-red-500 text-sm">{mpPreCheckError}</p>}
                <button onClick={handleMpPreCheck} disabled={mpIsPreChecking || !mpStartDate || !mpEndDate}
                        className="w-full mt-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center">
                  {mpIsPreChecking && <SpinnerIcon className="w-5 h-5 mr-2"/>}
                  {mpIsPreChecking ? 'Verificando...' : 'Verificar Pendências'}
                </button>
              </div>
            )}

            {/* Step 2: Pre-check Display */}
            {mpStep === 2 && mpPreCheckData && (
              <div className="my-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Pré-verificação de Pagamentos</h3>
                {mpPreCheckData.compras_com_pagamento_pendente_ou_futuro?.length > 0 ? (
                  <div className="p-4 mb-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
                    <p className="font-bold mb-1">{mpPreCheckData.message}</p>
                    <ul className="list-disc list-inside text-sm">
                      {mpPreCheckData.compras_com_pagamento_pendente_ou_futuro.map(compra => (
                        <li key={compra.id}>
                          Compra ID {compra.id} ({compra.fornecedor}, Obra: {compra.obra_nome || 'N/A'}) - Valor: {formatCurrency(compra.valor_total_liquido)} - Data Compra: {formatDate(compra.data_compra)} - Pagamento Previsto: {compra.data_pagamento ? formatDate(compra.data_pagamento) : 'Pendente'}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="p-4 bg-green-100 border-l-4 border-green-500 text-green-700">Nenhuma compra com pagamento pendente ou futuro encontrada para os filtros e período de compra informados.</p>
                )}
                <div className="flex justify-end space-x-3 mt-4">
                  <button onClick={() => setMpStep(1)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">Voltar</button>
                  <button onClick={handleMpGenerateReport} disabled={mpIsGeneratingReport}
                          className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center">
                    {mpIsGeneratingReport && <SpinnerIcon className="w-5 h-5 mr-2"/>}
                    Gerar Relatório
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Report Display */}
            {mpStep === 3 && mpReportData && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">Relatório de Pagamentos de Materiais</h3>
                    <button onClick={() => exportMaterialPaymentsReportToCSV(mpReportData, `relatorio_pagamento_materiais_${mpStartDate}_a_${mpEndDate}.csv`)}
                            disabled={!mpReportData.report_data || mpReportData.report_data.length === 0}
                            className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 disabled:opacity-50">
                        Exportar para CSV
                    </button>
                </div>
                {mpReportError && <p className="text-red-500 text-sm mb-3">{mpReportError}</p>}
                {mpReportData.report_data?.length === 0 && <p>Nenhum pagamento de material encontrado para o período e filtros selecionados.</p>}

                {mpReportData.report_data?.map(obra => (
                  <div key={obra.obra_id} className="mb-6 p-3 border rounded-md">
                    <h4 className="text-lg font-semibold text-blue-600 mb-2">Obra: {obra.obra_nome} - Total Pago: {formatCurrency(obra.total_obra)}</h4>
                    {obra.fornecedores.map(fornecedor => (
                      <div key={fornecedor.fornecedor_nome} className="mb-3 pl-3 border-l-2">
                        <h5 className="text-md font-semibold text-gray-700">Fornecedor: {fornecedor.fornecedor_nome} - Total Pago: {formatCurrency(fornecedor.total_fornecedor_na_obra)}</h5>
                        <table className="min-w-full text-xs mt-1">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-2 py-1 text-left">ID Compra</th>
                              <th className="px-2 py-1 text-left">Data Compra</th>
                              <th className="px-2 py-1 text-left">Data Pagamento</th>
                              <th className="px-2 py-1 text-left">Nota Fiscal</th>
                              <th className="px-2 py-1 text-right">Valor Líquido</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fornecedor.compras_a_pagar.map(compra => (
                              <tr key={compra.id} className="border-b">
                                <td className="px-2 py-1">{compra.id}</td>
                                <td className="px-2 py-1">{formatDate(compra.data_compra)}</td>
                                <td className="px-2 py-1">{compra.data_pagamento ? formatDate(compra.data_pagamento) : 'N/A'}</td>
                                <td className="px-2 py-1">{compra.nota_fiscal || '-'}</td>
                                <td className="px-2 py-1 text-right">{formatCurrency(compra.valor_total_liquido)}</td>
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
                        <p className="text-lg font-bold text-right">Total Geral Pago: {formatCurrency(mpReportData.total_geral_relatorio)}</p>
                    </div>
                )}
                <div className="flex justify-end space-x-3 mt-6">
                  <button onClick={() => setMpStep(1)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
                    Gerar Novo Relatório
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RelatoriosPage;
