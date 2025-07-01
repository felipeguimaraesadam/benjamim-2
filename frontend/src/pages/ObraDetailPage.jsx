import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import * as api from '../services/api.js';
import { formatDateToDMY } from '../utils/dateUtils.js';
import { useApiData } from '../hooks/useApiData';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';

import ObraDetailHeader from '../components/obra/ObraDetailHeader';
import FinancialDashboard from '../components/obra/FinancialDashboard';
import CostCompositionChart from '../components/obra/CostCompositionChart'; // Novo gráfico
import ObraLaborTabContent from '../components/obra/ObraLaborTabContent'; // Renomeado
import CostHistoryChart from '../components/obra/CostHistoryChart';
import TopMaterialsChart from '../components/obra/TopMaterialsChart';
import ObraPurchasesTabContent from '../components/obra/ObraPurchasesTabContent';
import ObraExpensesTabContent from '../components/obra/ObraExpensesTabContent';
import ObraFotosUpload from '../components/obra/ObraFotosUpload';
import ObraGaleria from '../components/obra/ObraGaleria';

const ObraDetailPage = () => {
  const { id } = useParams();

  const obraApiParams = useMemo(() => id, [id]);
  const obraQueryObjParams = useMemo(() => ({ obra_id: id }), [id]);

  const { data: obra, isLoading: isLoadingObra, error: errorObra, fetchData: fetchObraDetails, setData: setObra } = useApiData(api.getObraById, obraApiParams, null, true);
  const { data: locacoesEquipe, isLoading: isLoadingLocacoes, error: errorLocacoes, fetchData: fetchLocacoes, setData: setLocacoesEquipe } = useApiData(api.getLocacoes, obraQueryObjParams, [], true);
  const { data: historicoCustos, isLoading: isLoadingHistoricoCustos, error: errorHistoricoCustos, fetchData: fetchHistoricoCustos } = useApiData(api.getObraHistoricoCustos, obraApiParams, [], true);
  const { data: custosMaterial, isLoading: isLoadingCustosMaterial, error: errorCustosMaterial, fetchData: fetchCustosMaterial } = useApiData(api.getObraCustosPorMaterial, obraApiParams, [], true);
  const { data: todasAsComprasBruto, isLoading: isLoadingTodasAsCompras, error: errorTodasAsCompras, fetchData: fetchTodasAsCompras } = useApiData(api.getCompras, obraQueryObjParams, [], true);
  const { data: despesasExtrasObra, isLoading: isLoadingDespesasExtras, error: errorDespesasExtras, fetchData: fetchDespesasExtras } = useApiData(api.getDespesasExtras, obraQueryObjParams, [], true);

  const actualTodasAsCompras = useMemo(() => {
      return todasAsComprasBruto?.results || (Array.isArray(todasAsComprasBruto) ? todasAsComprasBruto : []);
  }, [todasAsComprasBruto]);

  const [specificLocacaoError, setSpecificLocacaoError] = useState(null);
  const [removingLocacaoId, setRemovingLocacaoId] = useState(null);
  const [operationStatus, setOperationStatus] = useState({ type: '', message: '' });
  const [latestUploadedFoto, setLatestUploadedFoto] = useState(null);

  // State for PDF generation
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState('labor'); // Estado para aba ativa

  useEffect(() => {
    if (operationStatus.message) {
        const timer = setTimeout(() => setOperationStatus({ type: '', message: '' }), 3000);
        return () => clearTimeout(timer);
    }
  }, [operationStatus]);

  const handleRemoverLocacao = useCallback(async (locacaoId) => {
     if (window.confirm('Tem certeza que deseja remover esta locação de equipe?')) {
         setRemovingLocacaoId(locacaoId);
         setSpecificLocacaoError(null);
         try {
             await api.deleteLocacao(locacaoId);
             fetchLocacoes();
             fetchObraDetails();
             setOperationStatus({ type: 'success', message: 'Locação removida com sucesso!' });
         } catch (err) {
             const errMsg = err.response?.data?.detail || err.message || 'Falha ao remover locação.';
             setSpecificLocacaoError(errMsg);
             setOperationStatus({ type: 'error', message: `Falha ao remover locação: ${errMsg}` });
             console.error("Delete Locação Error:", errMsg);
         } finally {
             setRemovingLocacaoId(null);
         }
     }
  }, [fetchLocacoes, fetchObraDetails, setOperationStatus]);

  const handlePhotoUploaded = (newFotoData) => {
      setLatestUploadedFoto(newFotoData);
      setOperationStatus({ type: 'success', message: 'Foto enviada com sucesso!' });
  };

  const handleGenerateReport = async () => {
    if (!obra || !obra.id) {
      setOperationStatus({ type: 'error', message: 'Detalhes da obra não carregados ou ID da obra ausente.' });
      return;
    }
    setIsGeneratingPdf(true);
    try {
      const response = await api.gerarRelatorioPDFObra(obra.id);

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;

      const obraName = obra.nome_obra || 'obra';
      // Regex to keep only alphanumeric, underscore, hyphen, dot. Replace others with underscore.
      const safeObraName = obraName.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const fileName = `Relatorio_Obra_${safeObraName}_${obra.id}.pdf`;

      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setOperationStatus({ type: 'success', message: 'Relatório PDF gerado e download iniciado!' });

    } catch (error) {
      console.error('Erro ao gerar relatório PDF:', error);
      let errorMsg = 'Falha ao gerar o relatório em PDF.';
      if (error.response && error.response.data && typeof error.response.data.text === 'function') {
        try {
            const errBlobText = await error.response.data.text();
            try {
                const errJson = JSON.parse(errBlobText);
                if (errJson && errJson.error) {
                    errorMsg = `Falha ao gerar PDF: ${errJson.error}`;
                } else {
                     errorMsg = `Falha ao gerar PDF (detalhe): ${errBlobText.substring(0,150)}`;
                }
            } catch (e_json) {
                 errorMsg = `Falha ao gerar PDF (detalhe): ${errBlobText.substring(0,150)}`;
            }
        } catch (e_blob) {
            // Blob could not be read
        }
      } else if (error.message) {
        errorMsg = `Falha ao gerar o relatório em PDF: ${error.message}`;
      }
      setOperationStatus({ type: 'error', message: errorMsg });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (isLoadingObra) return <div className="p-4 text-center"><p>Carregando detalhes da obra...</p></div>;
  if (errorObra) return <div className="p-4 text-center"><p className="text-red-500">Erro ao carregar dados da obra: {errorObra}</p></div>;
  if (!obra && !isLoadingObra) return <div className="p-4 text-center"><p>Obra não encontrada.</p></div>;

  const orcamentoVsGastoDataObra = obra ? [
      { name: 'Orçamento Previsto', value: parseFloat(obra.orcamento_previsto) || 0 },
      { name: 'Custo Total Realizado', value: parseFloat(obra.custo_total_realizado) || 0 },
  ] : [];

  const composicaoGastosDataObra = obra && obra.custos_por_categoria ? [
      { name: 'Materiais', value: parseFloat(obra.custos_por_categoria.materiais) || 0 },
      { name: 'Locações/Serviços', value: parseFloat(obra.custos_por_categoria.locacoes) || 0 },
      { name: 'Despesas Extras', value: parseFloat(obra.custos_por_categoria.despesas_extras) || 0 },
  ].filter(item => item.value > 0) : [];

  const gastosPorCategoriaMaterialDataObra = obra && obra.gastos_por_categoria_material_obra ?
      Object.entries(obra.gastos_por_categoria_material_obra).map(([key, value]) => ({
          name: key, value: parseFloat(value) || 0,
      })).filter(entry => entry.value > 0)
      : [];

  const COLORS_PIE_OBRA = ['#0088FE', '#FF8042'];
  const COLORS_CATEGORIES_OBRA = ['#8884d8', '#82ca9d', '#ffc658', '#FF8042', '#0088FE', '#00C49F', '#FFBB28', '#FF7777'];

  return (
    <div className="container mx-auto px-4 py-6">
      {operationStatus.message && (
        <div className={`p-3 my-4 rounded-md text-sm shadow ${operationStatus.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}`} role="alert">
            {operationStatus.message}
        </div>
      )}

      <ObraDetailHeader obra={obra} formatDate={formatDateToDMY} />

      {/* Botão para Gerar Relatório PDF */}
      {obra && obra.id && (
        <div className="my-4 py-4 text-center md:text-right">
          <button
            onClick={handleGenerateReport}
            disabled={isGeneratingPdf || !obra}
            className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-6 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-75 disabled:opacity-60 disabled:cursor-not-allowed transition ease-in-out duration-150"
          >
            {isGeneratingPdf ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Gerando PDF...
              </>
            ) : (
              'Gerar Relatório em PDF'
            )}
          </button>
        </div>
      )}

      <FinancialDashboard obra={obra} />

      {/* Container para os gráficos principais de análise financeira */}
      <div className="my-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfico de Orçamento vs. Gasto Total */}
        {obra && (
          <div className="p-4 bg-white shadow-lg rounded-lg dark:bg-gray-800">
            <h3 className="text-lg font-semibold mb-3 text-center text-gray-700 dark:text-gray-200">Orçamento vs. Gasto Total</h3>
            {orcamentoVsGastoDataObra.length > 0 && (orcamentoVsGastoDataObra[0].value > 0 || orcamentoVsGastoDataObra[1].value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={orcamentoVsGastoDataObra} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                    {orcamentoVsGastoDataObra.map((entry, index) => (
                      <Cell key={`cell-ovg-${index}`} fill={COLORS_PIE_OBRA[index % COLORS_PIE_OBRA.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', color: '#333' }} // Estilo para tooltip em modo claro
                  />
                  <Legend formatter={(value) => <span style={{ color: document.documentElement.classList.contains('dark') ? '#E5E7EB' : '#4B5563' }}>{value}</span>}/>
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-gray-500 dark:text-gray-400 py-10">Dados insuficientes.</p>}
          </div>
        )}

        {/* Novo Gráfico de Composição de Custos */}
        {obra && obra.custos_por_categoria && (
          <CostCompositionChart custosPorCategoria={obra.custos_por_categoria} />
        )}
      </div>

      {/* Wrapper para Gráfico de Materiais e Sistema de Abas para corrigir erro de JSX adjacente */}
      <>
        {/* Gráfico de Gastos por Categoria de Material (Renderizado condicionalmente) */}
        {obra && ( /* Garante que a seção toda só aparece se `obra` existir */
          <div className="my-8 p-4 bg-white shadow-lg rounded-lg dark:bg-gray-800">
            <h3 className="text-lg font-semibold mb-3 text-center text-gray-700 dark:text-gray-200">
              Gastos por Categoria de Material
            </h3>
            {gastosPorCategoriaMaterialDataObra.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={gastosPorCategoriaMaterialDataObra}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#ffc658"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {gastosPorCategoriaMaterialDataObra.map((entry, index) => (
                      <Cell key={`cell-gcm-${index}`} fill={COLORS_CATEGORIES_OBRA[index % COLORS_CATEGORIES_OBRA.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', color: '#333' }}
                  />
                  <Legend
                    wrapperStyle={{ overflowY: 'auto', maxHeight: 60 }}
                    formatter={(value) => <span style={{ color: document.documentElement.classList.contains('dark') ? '#E5E7EB' : '#4B5563' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-10">
                Não há gastos por categoria de material para exibir.
              </p>
            )}
          </div>
        )}

        {/* Sistema de Abas */}
        <div className="my-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-4 sm:space-x-6 overflow-x-auto" aria-label="Tabs">
              {/* Botão Mão de Obra/Serviços */}
              <button
                onClick={() => setActiveTab('labor')}
                className={`${
                  activeTab === 'labor'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
                } whitespace-nowrap py-3 px-2 sm:py-4 sm:px-3 border-b-2 font-medium text-sm focus:outline-none transition-colors duration-150 ease-in-out`}
              >
                Mão de Obra/Serviços
              </button>
              {/* Botão Materiais (Compras) */}
              <button
                onClick={() => setActiveTab('materials')}
                className={`${
                  activeTab === 'materials'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
                } whitespace-nowrap py-3 px-2 sm:py-4 sm:px-3 border-b-2 font-medium text-sm focus:outline-none transition-colors duration-150 ease-in-out`}
              >
                Materiais (Compras)
              </button>
              {/* Botão Despesas Extras */}
              <button
                onClick={() => setActiveTab('expenses')}
                className={`${
                  activeTab === 'expenses'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
                } whitespace-nowrap py-3 px-2 sm:py-4 sm:px-3 border-b-2 font-medium text-sm focus:outline-none transition-colors duration-150 ease-in-out`}
              >
                Despesas Extras
              </button>
              {/* Botão Fotos e Anexos */}
              <button
                onClick={() => setActiveTab('photos')}
                className={`${
                  activeTab === 'photos'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
                } whitespace-nowrap py-3 px-2 sm:py-4 sm:px-3 border-b-2 font-medium text-sm focus:outline-none transition-colors duration-150 ease-in-out`}
              >
                Fotos e Anexos
              </button>
            </nav>
          </div>

          {/* Conteúdo das Abas */}
          <div className="mt-6">
            {activeTab === 'labor' && (
              <ObraLaborTabContent
                locacoesEquipe={locacoesEquipe?.results || (Array.isArray(locacoesEquipe) ? locacoesEquipe : [])}
                obraId={obra?.id}
                obraNome={obra?.nome_obra}
                onRemoverLocacao={handleRemoverLocacao}
                locacaoError={errorLocacoes || specificLocacaoError}
                isLoading={isLoadingLocacoes}
                removingLocacaoId={removingLocacaoId}
              />
            )}
            {activeTab === 'materials' && (
              <ObraPurchasesTabContent
                todasCompras={actualTodasAsCompras} // Já trata .results internamente
                isLoading={isLoadingTodasAsCompras}
                todasComprasError={errorTodasAsCompras}
                obraId={obra?.id}
                obraNome={obra?.nome_obra}
              />
            )}
            {activeTab === 'expenses' && (
              <ObraExpensesTabContent
                despesasExtrasObra={despesasExtrasObra?.results || (Array.isArray(despesasExtrasObra) ? despesasExtrasObra : [])}
                isLoading={isLoadingDespesasExtras}
                despesasExtrasObraError={errorDespesasExtras}
                obraId={obra?.id}
                obraNome={obra?.nome_obra}
              />
            )}
            {activeTab === 'photos' && (
              <div className="p-4 bg-white shadow-lg rounded-lg dark:bg-gray-800">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Fotos e Anexos da Obra</h2>
                <ObraFotosUpload obraId={id} onUploadSuccess={handlePhotoUploaded} />
                <div className="mt-6">
                  <ObraGaleria obraId={id} newFoto={latestUploadedFoto} />
                </div>
              </div>
            )}
          </div>
        </div>
      </>

      {/* Gráficos de Histórico e Top Materiais (mantidos fora das abas) */}
      <div className="my-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <CostHistoryChart historicoCustos={historicoCustos} custosError={errorHistoricoCustos} isLoading={isLoadingHistoricoCustos} />
        {/* O gráfico TopMaterialsChart usa a prop custosMaterial que vem de api.getObraCustosPorMaterial */}
        <TopMaterialsChart custosMaterial={custosMaterial} materialError={errorCustosMaterial} isLoading={isLoadingCustosMaterial} />
      </div>
    </div>
  );
};
export default ObraDetailPage;
