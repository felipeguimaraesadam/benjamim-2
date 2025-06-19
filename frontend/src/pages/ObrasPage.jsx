import React, { useState, useEffect, useCallback } from 'react';
import { apiClient, getObras, createObra, updateObra, deleteObra } from '../services/api';
import { toast } from 'react-toastify'; // Added toast for error handling
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer, Sector } from 'recharts';
import ObrasTable from '../components/tables/ObrasTable';
import ObraForm from '../components/forms/ObraForm';
import PaginationControls from '../components/utils/PaginationControls';
import { showSuccessToast, showErrorToast } from '../utils/toastUtils';
import SpinnerIcon from '../components/utils/SpinnerIcon';

const ObrasPage = () => {
  const [obras, setObras] = useState([]); // Will store results from API
  const [isLoading, setIsLoading] = useState(false); // For table data loading
  const [isLoadingForm, setIsLoadingForm] = useState(false); // For form submission (create/update)
  const [isDeleting, setIsDeleting] = useState(false); // For delete operation
  const [error, setError] = useState(null); // For general page errors or form errors in modal

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const PAGE_SIZE = 10; // Should match backend PAGE_SIZE

  const [showFormModal, setShowFormModal] = useState(false);
  const [currentObra, setCurrentObra] = useState(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [obraToDeleteId, setObraToDeleteId] = useState(null);

  // State for dashboard summary
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // Colors for charts
  const COLORS_PIE = ['#0088FE', '#FF8042', '#FFBB28', '#00C49F'];
  const COLORS_CATEGORIES = ['#8884d8', '#82ca9d', '#ffc658', '#FF8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28CFF', '#FF8F57', '#FFDA83', '#80E1D1'];


  const fetchObras = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getObras({ page }); // Pass page to API
      setObras(response.data.results);
      setTotalItems(response.data.count);
      setTotalPages(Math.ceil(response.data.count / PAGE_SIZE));
      setCurrentPage(page);
    } catch (err) {
      const errorMsg = err.message || 'Falha ao buscar obras. Tente novamente.';
      setError(errorMsg);
      showErrorToast(errorMsg);
      console.error("Fetch Obras Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [PAGE_SIZE]);

  useEffect(() => {
    fetchObras(currentPage);
  }, [currentPage, fetchObras]);

  // useEffect to fetch dashboard summary data
  useEffect(() => {
    const fetchDashboardSummary = async () => {
      setLoadingSummary(true);
      try {
        console.log("[DEBUG ObrasPage] Fetching dashboard summary...");
        const response = await apiClient.get('/dashboard/obras-summary/');
        setDashboardSummary(response.data);
        console.log("[DEBUG ObrasPage] Dashboard summary data:", response.data);
      } catch (error) {
        console.error("Erro ao buscar resumo do dashboard de obras:", error);
        toast.error("Erro ao buscar resumo do dashboard de obras. Tente novamente mais tarde.");
        setDashboardSummary(null); // Or an empty structure
      } finally {
        setLoadingSummary(false);
      }
    };

    fetchDashboardSummary();
  }, []); // Empty dependency array to run once on mount

  // Prepare data for charts
  const orcamentoVsGastoData = dashboardSummary ? [
    { name: 'Orçamento Total', value: parseFloat(dashboardSummary.orcamento_total_geral) || 0 },
    { name: 'Gasto Total', value: parseFloat(dashboardSummary.gasto_total_geral) || 0 },
  ] : [];

  const composicaoGastosData = dashboardSummary && dashboardSummary.gastos_por_tipo ? [
    { name: 'Compras', value: parseFloat(dashboardSummary.gastos_por_tipo.compras) || 0 },
    { name: 'Locações', value: parseFloat(dashboardSummary.gastos_por_tipo.locacoes) || 0 },
    { name: 'Despesas Extras', value: parseFloat(dashboardSummary.gastos_por_tipo.despesas_extras) || 0 },
  ] : [];

  const gastosPorCategoriaData = dashboardSummary && dashboardSummary.gastos_por_categoria_material ?
    Object.entries(dashboardSummary.gastos_por_categoria_material).map(([key, value]) => ({
      name: key,
      value: parseFloat(value) || 0,
    })).filter(entry => entry.value > 0) // Filter out categories with zero value
    : [];

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleAddNew = () => {
    setCurrentObra(null);
    setShowFormModal(true);
  };

  const handleEdit = (obra) => {
    setCurrentObra(obra);
    setShowFormModal(true);
  };

  const handleDelete = (id) => {
    setObraToDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!obraToDeleteId) return;
    setIsDeleting(true);
    setError(null);
    try {
      await deleteObra(obraToDeleteId);
      showSuccessToast('Obra excluída com sucesso!');
      setObraToDeleteId(null);
      setShowDeleteConfirm(false);
      // Refetch obras, considering pagination (e.g., stay on current page or adjust if last item deleted)
      // A simple refetch of the current page is often sufficient.
      // If it was the last item on the page, and page > 1, fetch previous page.
      if (obras.length === 1 && currentPage > 1) {
        fetchObras(currentPage - 1);
      } else {
        fetchObras(currentPage);
      }
    } catch (err) {
      const errorMsg = err.message || 'Falha ao excluir obra.';
      setError(errorMsg); // Show error in modal or page if appropriate
      showErrorToast(errorMsg);
      console.error("Delete Obra Error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async (formData) => {
    setIsLoadingForm(true);
    setError(null); // Clear previous form errors
    try {
      if (currentObra && currentObra.id) {
        await updateObra(currentObra.id, formData);
        showSuccessToast('Obra atualizada com sucesso!');
      } else {
        await createObra(formData);
        showSuccessToast('Obra criada com sucesso!');
      }
      setShowFormModal(false);
      setCurrentObra(null);
      fetchObras(currentObra ? currentPage : 1); // Refetch current page on update, or first page on create
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.nome_obra?.[0] || err.message || (currentObra ? 'Falha ao atualizar obra.' : 'Falha ao criar obra.');
      setError(errorMsg); // Show error in the modal
      showErrorToast(errorMsg);
      console.error("Form Submit Obra Error:", err.response?.data || err.message);
    } finally {
      setIsLoadingForm(false);
    }
  };

  const handleFormCancel = () => {
    setShowFormModal(false);
    setCurrentObra(null);
    setError(null); // Clear form-specific errors
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestão de Obras</h1>
        {/* Placeholder for where summary might go, or it could be a separate section */}
      </div>

      {/* Dashboard Summary Section with Charts */}
      {loadingSummary && <p className="text-center text-gray-600 py-8">Carregando resumo e gráficos...</p>}
      {!loadingSummary && dashboardSummary && (
        <div className="mb-8 p-4 bg-gray-50 shadow-lg rounded-lg">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">Resumo Financeiro Geral das Obras</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Chart 1: Orçamento vs. Gasto Total */}
            <div className="chart-container p-4 bg-white shadow-md rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-center text-gray-600">Orçamento vs. Gasto Total</h3>
              {orcamentoVsGastoData.reduce((acc, item) => acc + item.value, 0) > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={orcamentoVsGastoData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                      {orcamentoVsGastoData.map((entry, index) => (
                        <Cell key={`cell-orcamento-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (<p className="text-center text-gray-500 py-10">Não há dados de orçamento ou gastos para exibir.</p>)}
            </div>

            {/* Chart 2: Composição dos Gastos */}
            <div className="chart-container p-4 bg-white shadow-md rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-center text-gray-600">Composição dos Gastos Totais</h3>
              {composicaoGastosData.reduce((acc, item) => acc + item.value, 0) > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={composicaoGastosData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                    <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                    <Legend />
                    <Bar dataKey="value">
                      {composicaoGastosData.map((entry, index) => (
                        <Cell key={`cell-composicao-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (<p className="text-center text-gray-500 py-10">Não há dados de composição de gastos para exibir.</p>)}
            </div>

            {/* Chart 3: Gastos por Categoria de Material */}
            <div className="chart-container p-4 bg-white shadow-md rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-center text-gray-600">Gastos por Categoria de Material</h3>
              {gastosPorCategoriaData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={gastosPorCategoriaData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#ffc658" label>
                      {gastosPorCategoriaData.map((entry, index) => (
                        <Cell key={`cell-categoria-${index}`} fill={COLORS_CATEGORIES[index % COLORS_CATEGORIES.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                    <Legend wrapperStyle={{ overflowX: 'auto', maxHeight: '80px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-10">Não há dados de gastos por categoria de material para exibir.</p>
              )}
            </div>
          </div>
        </div>
      )}
      {/* End Dashboard Summary Section with Charts */}

      <div className="flex justify-between items-center mb-6 pt-4 border-t border-gray-200">
        {/*Moved Add button to a new row for clarity, or it can be integrated elsewhere */}
        <div></div> {/*Keeps Add button to the right if title is also here */}
        <button
          onClick={handleAddNew}
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-4 focus:ring-primary-300 disabled:bg-primary-300"
        >
          Adicionar Nova Obra
        </button>
      </div>

      {/* Page level error display (for fetch errors mainly) */}
      {error && !isLoading && !showFormModal && obras.length === 0 && (
         <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4 text-center" role="alert">
          <p className="font-bold">Falha ao Carregar Dados</p>
          <p>{error}</p>
        </div>
      )}

      {/* Loading spinner for initial page load */}
      {isLoading && obras.length === 0 && (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      )}

      {/* Table and Pagination - only show if not initial loading or if there's data */}
      {(!isLoading || obras.length > 0) && !error && (
        <>
          <ObrasTable
            obras={obras} // Now receives paginated data
            onEdit={handleEdit}
            onDelete={handleDelete}
            // isLoading prop for table can be used for row-specific loading if needed
          />
          {totalPages > 0 && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={totalItems}
              itemsPerPage={PAGE_SIZE}
            />
          )}
        </>
      )}

      {/* Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              {currentObra ? 'Editar Obra' : 'Adicionar Nova Obra'}
            </h2>
            {error && ( // Display error specific to form submission attempt
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Erro: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
            <ObraForm
              initialData={currentObra}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              isLoading={isLoadingForm}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Confirmar Exclusão</h2>
            <p className="mb-6">Tem certeza que deseja excluir esta obra? Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md focus:ring-4 focus:outline-none focus:ring-gray-300 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md focus:ring-4 focus:outline-none focus:ring-red-300 disabled:opacity-50 flex items-center justify-center"
              >
                {isDeleting ? <SpinnerIcon className="w-5 h-5 mr-2"/> : null}
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ObrasPage;
