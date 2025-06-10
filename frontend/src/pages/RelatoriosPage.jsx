import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

const RelatoriosPage = () => {
  const [obras, setObras] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [reportType, setReportType] = useState('financeiroObra'); // 'financeiroObra' or 'geralCompras'

  // Filters state
  const [financeiroFilters, setFinanceiroFilters] = useState({
    obra_id: '',
    data_inicio: '',
    data_fim: '',
  });
  const [geralComprasFilters, setGeralComprasFilters] = useState({
    data_inicio: '',
    data_fim: '',
    obra_id: '',
    material_id: '',
  });

  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // For report data fetching
  const [isInitialLoading, setIsInitialLoading] = useState(false); // For obras/materiais fetching
  const [error, setError] = useState(null);

  // Fetch Obras and Materiais for filter dropdowns
  useEffect(() => {
    const fetchDropdownData = async () => {
      setIsInitialLoading(true);
      try {
        const [obrasRes, materiaisRes] = await Promise.all([
          api.getObras(),
          api.getMateriais()
        ]);
        setObras(obrasRes.data);
        setMateriais(materiaisRes.data);
      } catch (err) {
        console.error("Failed to fetch dropdown data:", err);
        setError('Falha ao carregar dados para filtros.');
      } finally {
        setIsInitialLoading(false);
      }
    };
    fetchDropdownData();
  }, []);

  const handleFilterChange = (report, field, value) => {
    setError(null); // Clear previous errors on filter change
    setReportData(null); // Clear previous report data
    if (report === 'financeiroObra') {
      setFinanceiroFilters(prev => ({ ...prev, [field]: value }));
    } else if (report === 'geralCompras') {
      setGeralComprasFilters(prev => ({ ...prev, [field]: value }));
    }
  };

  const validateFinanceiroFilters = () => {
    if (!financeiroFilters.obra_id) { setError("Obra é obrigatória."); return false; }
    if (!financeiroFilters.data_inicio) { setError("Data de Início é obrigatória."); return false; }
    if (!financeiroFilters.data_fim) { setError("Data de Fim é obrigatória."); return false; }
    if (financeiroFilters.data_inicio > financeiroFilters.data_fim) {
        setError("Data de Início não pode ser posterior à Data de Fim."); return false;
    }
    return true;
  }

  const validateGeralComprasFilters = () => {
    if (!geralComprasFilters.data_inicio) { setError("Data de Início é obrigatória."); return false; }
    if (!geralComprasFilters.data_fim) { setError("Data de Fim é obrigatória."); return false; }
    if (geralComprasFilters.data_inicio > geralComprasFilters.data_fim) {
        setError("Data de Início não pode ser posterior à Data de Fim."); return false;
    }
    return true;
  }


  const handleSubmitReport = async (report) => {
    setError(null);
    setReportData(null);

    if (report === 'financeiroObra') {
      if (!validateFinanceiroFilters()) return;
      setIsLoading(true);
      try {
        const response = await api.getRelatorioFinanceiroObra(financeiroFilters);
        setReportData({ type: 'financeiroObra', data: response.data });
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Falha ao gerar relatório financeiro.');
        console.error("RelatorioFinanceiroObra Error:", err);
      } finally {
        setIsLoading(false);
      }
    } else if (report === 'geralCompras') {
      if (!validateGeralComprasFilters()) return;

      // Prepare params, removing empty optional fields
      const params = {
        data_inicio: geralComprasFilters.data_inicio,
        data_fim: geralComprasFilters.data_fim,
      };
      if (geralComprasFilters.obra_id) params.obra_id = geralComprasFilters.obra_id;
      if (geralComprasFilters.material_id) params.material_id = geralComprasFilters.material_id;

      setIsLoading(true);
      try {
        const response = await api.getRelatorioGeralCompras(params);
        setReportData({ type: 'geralCompras', data: response.data });
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Falha ao gerar relatório de compras.');
        console.error("RelatorioGeralCompras Error:", err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return utcDate.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };


  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">Página de Relatórios</h1>

      <div className="mb-6 flex space-x-2">
        <button
            onClick={() => { setReportType('financeiroObra'); setReportData(null); setError(null); }}
            className={`px-4 py-2 rounded-md font-medium ${reportType === 'financeiroObra' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
            Financeiro por Obra
        </button>
        <button
            onClick={() => { setReportType('geralCompras'); setReportData(null); setError(null); }}
            className={`px-4 py-2 rounded-md font-medium ${reportType === 'geralCompras' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
            Geral de Compras
        </button>
      </div>

      {isInitialLoading && <p>Carregando filtros...</p>}

      {/* Relatório Financeiro de Obra Form */}
      {reportType === 'financeiroObra' && !isInitialLoading && (
        <form onSubmit={(e) => { e.preventDefault(); handleSubmitReport('financeiroObra'); }} className="bg-white p-6 rounded-lg shadow mb-6 space-y-4">
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
      )}

      {/* Relatório Geral de Compras Form */}
      {reportType === 'geralCompras' && !isInitialLoading && (
        <form onSubmit={(e) => { e.preventDefault(); handleSubmitReport('geralCompras'); }} className="bg-white p-6 rounded-lg shadow mb-6 space-y-4">
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
      )}

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative my-4" role="alert">{error}</div>}

      {/* Display Report Data */}
      {isLoading && <p className="text-center py-4">Carregando relatório...</p>}

      {reportData && !isLoading && (
        <div className="bg-white p-6 rounded-lg shadow mt-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Resultados do Relatório</h3>
          {reportData.type === 'financeiroObra' && (
            <div className="space-y-2">
              <p><strong>Obra:</strong> {reportData.data.nome_obra} (ID: {reportData.data.obra_id})</p>
              <p><strong>Período:</strong> {formatDate(reportData.data.data_inicio)} - {formatDate(reportData.data.data_fim)}</p>
              <p><strong>Total Compras:</strong> <span className="font-semibold">{formatCurrency(reportData.data.total_compras)}</span></p>
              <p><strong>Total Despesas Extras:</strong> <span className="font-semibold">{formatCurrency(reportData.data.total_despesas_extras)}</span></p>
              <p className="text-lg"><strong>Custo Total Geral:</strong> <span className="font-bold text-primary-700">{formatCurrency(reportData.data.custo_total_geral)}</span></p>
            </div>
          )}

          {reportData.type === 'geralCompras' && (
            <div>
              <p className="mb-1"><strong>Filtros Aplicados:</strong></p>
              <ul className="list-disc list-inside text-sm mb-2">
                <li>Período: {formatDate(reportData.data.filtros.data_inicio)} - {formatDate(reportData.data.filtros.data_fim)}</li>
                {reportData.data.filtros.obra_id && <li>Obra ID: {reportData.data.filtros.obra_id}</li>}
                {reportData.data.filtros.material_id && <li>Material ID: {reportData.data.filtros.material_id}</li>}
              </ul>
              <p className="text-lg mb-4"><strong>Soma Total das Compras Filtradas:</strong> <span className="font-bold text-primary-700">{formatCurrency(reportData.data.soma_total_compras)}</span></p>

              <h4 className="text-md font-semibold text-gray-600 mb-2">Detalhes das Compras:</h4>
              {reportData.data.compras && reportData.data.compras.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th className="px-4 py-2">Material</th>
                        <th className="px-4 py-2">Obra ID</th>
                        <th className="px-4 py-2">Qtd.</th>
                        <th className="px-4 py-2">Custo Total</th>
                        <th className="px-4 py-2">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.data.compras.map(compra => (
                        <tr key={compra.id} className="bg-white border-b hover:bg-gray-50">
                          <td className="px-4 py-2">{materiais.find(m=>m.id === compra.material)?.nome || 'N/A'}</td>
                          <td className="px-4 py-2">{compra.obra}</td>
                          <td className="px-4 py-2">{compra.quantidade}</td>
                          <td className="px-4 py-2">{formatCurrency(compra.custo_total)}</td>
                          <td className="px-4 py-2">{formatDate(compra.data_compra)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p>Nenhuma compra encontrada para os filtros aplicados.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RelatoriosPage;
