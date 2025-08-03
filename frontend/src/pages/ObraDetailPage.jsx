import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import * as api from '../services/api.js';
import { formatDateToDMY } from '../utils/dateUtils.js'; // Import the new formatter
import { useApiData } from '../hooks/useApiData'; // Import the custom hook
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';

import ObraDetailHeader from '../components/obra/ObraDetailHeader';
import FinancialDashboard from '../components/obra/FinancialDashboard';
// import CurrentStockTable from '../components/obra/CurrentStockTable'; // Removed
// import EquipesLocadasList from '../components/obra/EquipesLocadasList'; // Component not found
import CostHistoryChart from '../components/obra/CostHistoryChart';
import TopMaterialsChart from '../components/obra/TopMaterialsChart';
import ObraPurchasesTabContent from '../components/obra/ObraPurchasesTabContent';
import ObraExpensesTabContent from '../components/obra/ObraExpensesTabContent';

// NEW IMPORTS for Photo components
import ObraFotosUpload from '../components/obra/ObraFotosUpload';
import ObraGaleria from '../components/obra/ObraGaleria';

const ObraDetailPage = () => {
  const { id } = useParams();

  // Memoized parameters for API calls
  const obraApiParams = useMemo(() => id, [id]);
  const obraQueryObjParams = useMemo(() => ({ obra_id: id }), [id]);

  // Instantiate useApiData for each data point
  const { data: obra, isLoading: isLoadingObra, error: errorObra, fetchData: fetchObraDetails, setData: setObra } = useApiData(api.getObraById, obraApiParams, null, true);
  const { data: locacoesEquipe, isLoading: isLoadingLocacoes, error: errorLocacoes, fetchData: fetchLocacoes, setData: setLocacoesEquipe } = useApiData(api.getLocacoes, obraQueryObjParams, [], true);
  const { data: historicoCustos, isLoading: isLoadingHistoricoCustos, error: errorHistoricoCustos, fetchData: fetchHistoricoCustos } = useApiData(api.getObraHistoricoCustos, obraApiParams, [], true);

  const { data: custosMaterial, isLoading: isLoadingCustosMaterial, error: errorCustosMaterial, fetchData: fetchCustosMaterial } = useApiData(api.getObraCustosPorMaterial, obraApiParams, [], true);
  const { data: todasAsComprasBruto, isLoading: isLoadingTodasAsCompras, error: errorTodasAsCompras, fetchData: fetchTodasAsCompras } = useApiData(api.getCompras, obraQueryObjParams, [], true);

  const { data: despesasExtrasObra, isLoading: isLoadingDespesasExtras, error: errorDespesasExtras, fetchData: fetchDespesasExtras } = useApiData(api.getDespesasExtras, obraQueryObjParams, [], true);

  const actualTodasAsCompras = useMemo(() => {
      return todasAsComprasBruto?.results || (Array.isArray(todasAsComprasBruto) ? todasAsComprasBruto : []);
  }, [todasAsComprasBruto]);

  // Derived state for comprasEstoque (removed)
  // const comprasEstoque = useMemo(() => {
  //     if (!Array.isArray(actualTodasAsCompras)) return [];
  //     return actualTodasAsCompras.filter(compra => parseFloat(compra.quantidade_disponivel) > 0);
  // }, [actualTodasAsCompras]);

  // UI State
  const [specificLocacaoError, setSpecificLocacaoError] = useState(null);
  const [removingLocacaoId, setRemovingLocacaoId] = useState(null); // For loading state on remove button
  const [operationStatus, setOperationStatus] = useState({ type: '', message: '' }); // For success/error messages

  // NEW STATE for handling photo uploads
  const [latestUploadedFoto, setLatestUploadedFoto] = useState(null);

  // Effect to clear operation status messages
  useEffect(() => {
    if (operationStatus.message) {
        const timer = setTimeout(() => {
            setOperationStatus({ type: '', message: '' });
        }, 3000); // Clear after 3 seconds
        return () => clearTimeout(timer);
    }
  }, [operationStatus]);

  // Event Handlers
  const handleRemoverLocacao = useCallback(async (locacaoId) => {
     if (window.confirm('Tem certeza que deseja remover esta locação de equipe?')) {
         setRemovingLocacaoId(locacaoId);
         setSpecificLocacaoError(null);
         try {
             await api.deleteLocacao(locacaoId);
             fetchLocacoes(); // Re-fetch alocacoes
             fetchObraDetails(); // <<< ADD THIS LINE to re-fetch obra details for financial summary
             setOperationStatus({ type: 'success', message: 'Locação removida com sucesso!' });
         } catch (err) {
             const errMsg = err.response?.data?.detail || err.message || 'Falha ao remover locação.';
             setSpecificLocacaoError(errMsg); // Keep for specific error if needed at button level
             setOperationStatus({ type: 'error', message: `Falha ao remover locação: ${errMsg}` });
             console.error("Delete Locação Error:", errMsg);
         } finally {
             setRemovingLocacaoId(null);
         }
     }
  }, [fetchLocacoes, fetchObraDetails, setOperationStatus]); // Added fetchObraDetails to dependency array

  // NEW CALLBACK for photo upload
  const handlePhotoUploaded = (newFotoData) => {
      setLatestUploadedFoto(newFotoData);
      // Optionally, display a success message using operationStatus
      setOperationStatus({ type: 'success', message: 'Foto enviada com sucesso!' });
  };

  // Overall page loading state (optional, can use individual isLoading states in JSX)
  // const isPageLoading = isLoadingObra || isLoadingLocacoes || ... ;

  // Debug log for obra data
  useEffect(() => {
    console.log('[DEBUG ObraDetailPage] State updated: `obra`', obra);
  }, [obra]);


  useEffect(() => {
    console.log('[DEBUG ObraDetailPage] State updated: `todasAsComprasBruto`', todasAsComprasBruto);
  }, [todasAsComprasBruto]);

  // Chart data preparation
  const orcamentoVsGastoDataObra = obra ? [
      { name: 'Orçamento Previsto', value: parseFloat(obra.orcamento_previsto) || 0 },
      { name: 'Custo Total Realizado', value: parseFloat(obra.custo_total_realizado) || 0 },
  ] : [];

  const composicaoGastosDataObra = obra && obra.custos_por_categoria ? [
      { name: 'Materiais (Compras)', value: parseFloat(obra.custos_por_categoria.materiais) || 0 },
      { name: 'Locações/Serviços', value: parseFloat(obra.custos_por_categoria.locacoes) || 0 },
      { name: 'Despesas Extras', value: parseFloat(obra.custos_por_categoria.despesas_extras) || 0 },
  ].filter(item => item.value > 0) : [];

  const gastosPorCategoriaMaterialDataObra = obra && obra.gastos_por_categoria_material_obra ?
      Object.entries(obra.gastos_por_categoria_material_obra).map(([key, value]) => ({
          name: key,
          value: parseFloat(value) || 0,
      })).filter(entry => entry.value > 0)
      : [];

  // Colors for charts
  const COLORS_PIE_OBRA = ['#0088FE', '#FF8042'];
  const COLORS_CATEGORIES_OBRA = ['#8884d8', '#82ca9d', '#ffc658', '#FF8042', '#0088FE', '#00C49F', '#FFBB28', '#FF7777'];


  return (
    <div className="container mx-auto px-4 py-6">
      {operationStatus.message && (
        <div className={`p-3 my-4 rounded-md text-sm shadow ${operationStatus.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}`} role="alert">
            {operationStatus.message}
        </div>
      )}

      {isLoadingObra && <div className="p-4 text-center"><p>Carregando detalhes da obra...</p></div>}
      {errorObra && <div className="p-4 text-center"><p className="text-red-500">Erro ao carregar dados da obra: {errorObra}</p></div>}
      {!isLoadingObra && !errorObra && !obra && <div className="p-4 text-center"><p>Obra não encontrada.</p></div>}

      {obra && (
        <>
          <ObraDetailHeader obra={obra} formatDate={formatDateToDMY} />
          <FinancialDashboard obra={obra} />

          {/* New Charts Section */}
          <div className="my-8 p-4 bg-gray-50 shadow-md rounded-lg">
              <h2 className="text-xl font-bold mb-6 text-gray-700 text-center">Análise Financeira Detalhada da Obra</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Chart 1: Orçamento vs. Gasto Total */}
                  <div className="p-4 bg-white shadow-lg rounded-lg">
                      <h3 className="text-lg font-semibold mb-3 text-center text-gray-600">Orçamento vs. Gasto Total</h3>
                      {orcamentoVsGastoDataObra.length > 0 && (orcamentoVsGastoDataObra[0].value > 0 || orcamentoVsGastoDataObra[1].value > 0) ? (
                          <ResponsiveContainer width="100%" height={300}>
                              <PieChart>
                                  <Pie data={orcamentoVsGastoDataObra} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                                      {orcamentoVsGastoDataObra.map((entry, index) => (
                                          <Cell key={`cell-ovg-${index}`} fill={COLORS_PIE_OBRA[index % COLORS_PIE_OBRA.length]} />
                                      ))}
                                  </Pie>
                                  <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                                  <Legend />
                              </PieChart>
                          </ResponsiveContainer>
                      ) : <p className="text-center text-gray-500 py-10">Dados insuficientes.</p>}
                  </div>

                  {/* Chart 2: Composição dos Gastos */}
                  <div className="p-4 bg-white shadow-lg rounded-lg">
                      <h3 className="text-lg font-semibold mb-3 text-center text-gray-600">Composição dos Gastos</h3>
                      {composicaoGastosDataObra.length > 0 ? (
                          <ResponsiveContainer width="100%" height={300}>
                              <BarChart data={composicaoGastosDataObra} layout="vertical">
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis type="number" tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                                  <YAxis type="category" dataKey="name" width={120} interval={0} />
                                  <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                                  <Legend />
                                  <Bar dataKey="value" fill="#82ca9d">
                                      {composicaoGastosDataObra.map((entry, index) => (
                                          <Cell key={`cell-cg-${index}`} fill={COLORS_CATEGORIES_OBRA[index % COLORS_CATEGORIES_OBRA.length]} />
                                      ))}
                                  </Bar>
                              </BarChart>
                          </ResponsiveContainer>
                      ) : <p className="text-center text-gray-500 py-10">Não há composição de gastos para exibir.</p>}
                  </div>

                  {/* Chart 3: Gastos por Categoria de Material */}
                  <div className="p-4 bg-white shadow-lg rounded-lg">
                      <h3 className="text-lg font-semibold mb-3 text-center text-gray-600">Gastos por Categoria de Material</h3>
                       {gastosPorCategoriaMaterialDataObra.length > 0 ? (
                          <ResponsiveContainer width="100%" height={300}>
                              <PieChart>
                                  <Pie data={gastosPorCategoriaMaterialDataObra} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#ffc658" labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                                      {gastosPorCategoriaMaterialDataObra.map((entry, index) => (
                                          <Cell key={`cell-gcm-${index}`} fill={COLORS_CATEGORIES_OBRA[index % COLORS_CATEGORIES_OBRA.length]} />
                                      ))}
                                  </Pie>
                                  <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                                  <Legend wrapperStyle={{ overflowY: 'auto', maxHeight: 60 }}/>
                              </PieChart>
                          </ResponsiveContainer>
                      ) : <p className="text-center text-gray-500 py-10">Não há gastos por categoria de material para exibir.</p>}
                  </div>
              </div>
          </div>
          {/* End New Charts Section */}

          {/* CurrentStockTable component instance removed */}

          <div className="mb-8 py-6"> {/* Removed tab navigation structure, kept py-6 for padding */}
            {/* Components rendered sequentially */}
            {/* EquipesLocadasList component removed - component not found */}

            <ObraPurchasesTabContent
              todasCompras={actualTodasAsCompras}
              isLoading={isLoadingTodasAsCompras}
              todasComprasError={errorTodasAsCompras}
              obraId={obra.id}
              obraNome={obra.nome_obra}
            />

            {/* Container for Photo Components */}
            <div className="my-6"> {/* Added some margin for separation */}
              <ObraFotosUpload obraId={id} onUploadSuccess={handlePhotoUploaded} />
              <ObraGaleria obraId={id} newFoto={latestUploadedFoto} />
            </div>

            <ObraExpensesTabContent
              despesasExtrasObra={despesasExtrasObra}
              isLoading={isLoadingDespesasExtras}
              despesasExtrasObraError={errorDespesasExtras}
              obraId={obra.id}
              obraNome={obra.nome_obra}
            />
          </div>

          <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <CostHistoryChart historicoCustos={historicoCustos} custosError={errorHistoricoCustos} isLoading={isLoadingHistoricoCustos} />
            <TopMaterialsChart custosMaterial={custosMaterial} materialError={errorCustosMaterial} isLoading={isLoadingCustosMaterial} />
          </div>
        </>
      )}
    </div>
  );
};
export default ObraDetailPage;
