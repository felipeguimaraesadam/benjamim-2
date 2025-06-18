import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import * as api from '../services/api.js';
import { formatDateToDMY } from '../utils/dateUtils.js'; // Import the new formatter
import { useApiData } from '../hooks/useApiData'; // Import the custom hook

import DistribuicaoMaterialForm from '../components/forms/DistribuicaoMaterialForm';
import ObraDetailHeader from '../components/obra/ObraDetailHeader';
import FinancialDashboard from '../components/obra/FinancialDashboard';
import QuickActionsSection from '../components/obra/QuickActionsSection';
import CurrentStockTable from '../components/obra/CurrentStockTable';
import MaterialUsageHistory from '../components/obra/MaterialUsageHistory';
import EquipesLocadasList from '../components/obra/EquipesLocadasList';
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

  // custosCategoria is part of 'obra' object (obra.custos_por_categoria)
  // No separate hook needed if FinancialDashboard consumes 'obra' prop and derives it.
  // If direct fetch was needed: const { data: custosCategoria, ... } = useApiData(api.getObraCustosPorCategoria, obraApiParams, [], true);

  const { data: custosMaterial, isLoading: isLoadingCustosMaterial, error: errorCustosMaterial, fetchData: fetchCustosMaterial } = useApiData(api.getObraCustosPorMaterial, obraApiParams, [], true);
  const { data: todasAsComprasBruto, isLoading: isLoadingTodasAsCompras, error: errorTodasAsCompras, fetchData: fetchTodasAsCompras } = useApiData(api.getCompras, obraQueryObjParams, [], true);

  // Assuming getUsosMaterial takes obraId directly as string/number
  const { data: usosMaterial, isLoading: isLoadingUsosMaterial, error: errorUsosMaterial, fetchData: fetchUsosMaterial } = useApiData(api.getUsosMaterial, obraApiParams, [], true);
  const { data: despesasExtrasObra, isLoading: isLoadingDespesasExtras, error: errorDespesasExtras, fetchData: fetchDespesasExtras } = useApiData(api.getDespesasExtras, obraQueryObjParams, [], true);

  const actualTodasAsCompras = useMemo(() => {
      return todasAsComprasBruto?.results || (Array.isArray(todasAsComprasBruto) ? todasAsComprasBruto : []);
  }, [todasAsComprasBruto]);

  // Derived state for comprasEstoque
  const comprasEstoque = useMemo(() => {
      if (!Array.isArray(actualTodasAsCompras)) return [];
      return actualTodasAsCompras.filter(compra => parseFloat(compra.quantidade_disponivel) > 0);
  }, [actualTodasAsCompras]);

  // UI State
  const [showDistribuicaoModal, setShowDistribuicaoModal] = useState(false);
  const [activeTab, setActiveTab] = useState('equipes'); // Default tab
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
  const handleOpenDistribuicaoModal = useCallback(() => setShowDistribuicaoModal(true), []);
  const handleCloseDistribuicaoModal = useCallback(() => setShowDistribuicaoModal(false), []);

  const handleSubmitDistribuicaoSuccess = useCallback(() => {
     fetchObraDetails();
     fetchTodasAsCompras();
     fetchUsosMaterial();
     handleCloseDistribuicaoModal();
     setOperationStatus({ type: 'success', message: 'Uso de material registrado com sucesso!' });
  }, [fetchObraDetails, fetchTodasAsCompras, fetchUsosMaterial, handleCloseDistribuicaoModal, setOperationStatus]);

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

  // Main loading/error display for the core 'obra' data
  if (isLoadingObra) return <div className="p-4 text-center"><p>Carregando detalhes da obra...</p></div>;
  if (errorObra) return <div className="p-4 text-center"><p className="text-red-500">Erro ao carregar dados da obra: {errorObra}</p></div>;
  if (!obra && !isLoadingObra) return <div className="p-4 text-center"><p>Obra não encontrada.</p></div>;

  return (
    <div className="container mx-auto px-4 py-6">
      {showDistribuicaoModal && (
        <DistribuicaoMaterialForm
          obraId={id}
          onClose={handleCloseDistribuicaoModal}
          onSubmitSuccess={handleSubmitDistribuicaoSuccess}
          showModal={showDistribuicaoModal}
        />
      )}

      {operationStatus.message && (
        <div className={`p-3 my-4 rounded-md text-sm shadow ${operationStatus.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}`} role="alert">
            {operationStatus.message}
        </div>
      )}

      <ObraDetailHeader obra={obra} formatDate={formatDateToDMY} />

      <FinancialDashboard obra={obra} />

      <QuickActionsSection onOpenDistribuicaoModal={handleOpenDistribuicaoModal} />

      <CurrentStockTable
        comprasEstoque={comprasEstoque}
        formatDate={formatDateToDMY}
        // isLoading={isLoadingTodasAsCompras} // Can add if needed for a specific loader on this table
        // error={errorTodasAsCompras}
      />

      <MaterialUsageHistory
        usosMaterial={usosMaterial?.results || []}
        isLoading={isLoadingUsosMaterial}
        error={errorUsosMaterial}
      />

      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs"> {/* Added overflow-x-auto for smaller screens */}
            {['equipes', 'compras', 'despesas', 'fotos'].map(tabName => ( // Added 'fotos' tab
              <button
                key={tabName}
                onClick={() => setActiveTab(tabName)}
                className={`whitespace-nowrap py-4 px-3 md:px-4 border-b-2 font-medium text-sm ${ // Adjusted padding
                  activeTab === tabName
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tabName === 'equipes' ? 'Equipes Locadas' :
                 tabName === 'compras' ? 'Todas as Compras' :
                 tabName === 'despesas' ? 'Despesas Extras' :
                 'Fotos da Obra'} {/* Label for 'fotos' tab */}
              </button>
            ))}
          </nav>
        </div>

        <div className="py-6">
          {activeTab === 'equipes' && (
            <EquipesLocadasList
              locacoesEquipe={locacoesEquipe?.results || (Array.isArray(locacoesEquipe) ? locacoesEquipe : [])}
              obraId={obra.id}
              obraNome={obra.nome_obra}
              onRemoverLocacao={handleRemoverLocacao}
              formatDate={formatDateToDMY}
              locacaoError={errorLocacoes || specificLocacaoError}
              isLoading={isLoadingLocacoes}
              removingLocacaoId={removingLocacaoId} // Pass loading state for specific button
            />
          )}
          {activeTab === 'compras' && (
            <ObraPurchasesTabContent
              todasCompras={actualTodasAsCompras}
              isLoading={isLoadingTodasAsCompras}
              todasComprasError={errorTodasAsCompras}
              obraId={obra.id}
              obraNome={obra.nome_obra}
            />
          )}
          {activeTab === 'despesas' && (
            <ObraExpensesTabContent
              despesasExtrasObra={despesasExtrasObra}
              isLoading={isLoadingDespesasExtras}
              despesasExtrasObraError={errorDespesasExtras}
              obraId={obra.id}
              obraNome={obra.nome_obra}
            />
          )}
          {activeTab === 'fotos' && (
            <div>
              <ObraFotosUpload obraId={id} onUploadSuccess={handlePhotoUploaded} />
              <ObraGaleria obraId={id} newFoto={latestUploadedFoto} />
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <CostHistoryChart historicoCustos={historicoCustos} custosError={errorHistoricoCustos} isLoading={isLoadingHistoricoCustos} />
        <TopMaterialsChart custosMaterial={custosMaterial} materialError={errorCustosMaterial} isLoading={isLoadingCustosMaterial} />
      </div>
    </div>
  );
};
export default ObraDetailPage;
