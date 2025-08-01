import React, { useState, useEffect, useCallback } from 'react';
import OcorrenciasTable from '../components/tables/OcorrenciasTable';
import OcorrenciaForm from '../components/forms/OcorrenciaForm';
import * as api from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import PaginationControls from '../components/utils/PaginationControls';
import { showSuccessToast, showErrorToast } from '../utils/toastUtils';
import SpinnerIcon from '../components/utils/SpinnerIcon';

const OcorrenciasPage = () => {
  const [ocorrencias, setOcorrencias] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // For page data
  const [isLoadingForm, setIsLoadingForm] = useState(false); // For form submission
  const [isDeleting, setIsDeleting] = useState(false); // For delete operation
  const [error, setError] = useState(null); // General page/form errors

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const PAGE_SIZE = 10;

  const [showFormModal, setShowFormModal] = useState(false);
  const [currentOcorrencia, setCurrentOcorrencia] = useState(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [ocorrenciaToDeleteId, setOcorrenciaToDeleteId] = useState(null);

  const [filtros, setFiltros] = useState({
    data_inicio: '',
    data_fim: '',
    funcionario_id: '',
    tipo: '',
  });
  const [ocorrenciasGrafico, setOcorrenciasGrafico] = useState([]);

  const fetchPageData = useCallback(
    async (page = 1, currentFilters = {}) => {
      setIsLoading(true);
      setError(null);
      try {
        const queryParams = { page };
        if (currentFilters.data_inicio)
          queryParams.data_inicio = currentFilters.data_inicio;
        if (currentFilters.data_fim)
          queryParams.data_fim = currentFilters.data_fim;
        if (currentFilters.funcionario_id)
          queryParams.funcionario_id = currentFilters.funcionario_id;
        if (currentFilters.tipo) queryParams.tipo = currentFilters.tipo;

        // Fetch paginated ocorrencias
        const ocorrenciasResponse = await api.getOcorrencias(queryParams);
        const fetchedOcorrencias = ocorrenciasResponse.data.results || [];
        setOcorrencias(fetchedOcorrencias);
        setTotalItems(ocorrenciasResponse.data.count || 0);
        setTotalPages(
          Math.ceil((ocorrenciasResponse.data.count || 0) / PAGE_SIZE)
        );
        setCurrentPage(page);

        // Fetch funcionarios (assuming this list isn't huge and doesn't need its own pagination for dropdowns)
        // This might be fetched only once if funcionarios list is stable
        if (funcionarios.length === 0) {
          // Fetch only if not already populated
          const funcionariosResponse = await api.getFuncionarios(); // Assuming this fetches all
          setFuncionarios(
            funcionariosResponse.data.results || funcionariosResponse.data || []
          );
        }

        // Prepare data for the chart based on current page's ocorrencias
        const contagemPorTipo = fetchedOcorrencias.reduce((acc, ocorr) => {
          const tipoLabel = ocorr.tipo || 'Não Especificado'; // Handle null/undefined tipo
          acc[tipoLabel] = (acc[tipoLabel] || 0) + 1;
          return acc;
        }, {});
        const dadosGrafico = Object.keys(contagemPorTipo).map(tipo => ({
          name: tipo,
          count: contagemPorTipo[tipo],
        }));
        setOcorrenciasGrafico(dadosGrafico);
      } catch (err) {
        const errorMsg =
          err.message || 'Falha ao buscar dados. Tente novamente.';
        setError(errorMsg);
        showErrorToast(errorMsg);
        console.error('Fetch Data Error:', err);
        setOcorrencias([]);
        setOcorrenciasGrafico([]);
      } finally {
        setIsLoading(false);
      }
    },
    [PAGE_SIZE, funcionarios.length]
  ); // Add funcionarios.length to re-fetch funcionarios if it was empty

  useEffect(() => {
    fetchPageData(currentPage, filtros);
  }, [currentPage, filtros, fetchPageData]);

  const handlePageChange = newPage => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleFiltroChange = e => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  const aplicarFiltros = () => {
    setCurrentPage(1); // Reset to page 1 when applying new filters
    fetchPageData(1, filtros);
  };

  const limparFiltros = () => {
    const filtrosVazios = {
      data_inicio: '',
      data_fim: '',
      funcionario_id: '',
      tipo: '',
    };
    setFiltros(filtrosVazios);
    setCurrentPage(1); // Reset to page 1
    // fetchPageData will be called by useEffect due to filtros or currentPage change
  };

  const handleAddNew = () => {
    setCurrentOcorrencia(null); // Ensure form is for new entry
    setError(null);
    setShowFormModal(true);
  };

  const handleEdit = ocorrencia => {
    setCurrentOcorrencia(ocorrencia);
    setError(null);
    setShowFormModal(true);
  };

  const handleDelete = id => {
    setOcorrenciaToDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!ocorrenciaToDeleteId) return;
    setIsDeleting(true);
    setError(null);
    try {
      await api.deleteOcorrencia(ocorrenciaToDeleteId);
      showSuccessToast('Ocorrência excluída com sucesso!');
      setOcorrenciaToDeleteId(null);
      setShowDeleteConfirm(false);
      if (ocorrencias.length === 1 && currentPage > 1) {
        fetchPageData(currentPage - 1, filtros);
      } else {
        fetchPageData(currentPage, filtros);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        err.message ||
        'Falha ao excluir ocorrência.';
      setError(errorMsg);
      showErrorToast(errorMsg);
      console.error(
        'Delete Ocorrencia Error:',
        err.response?.data || err.message
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async formData => {
    setIsLoadingForm(true);
    setError(null); // Clear previous modal errors
    const isEditing = currentOcorrencia && currentOcorrencia.id;
    try {
      if (isEditing) {
        await api.updateOcorrencia(currentOcorrencia.id, formData);
        showSuccessToast('Ocorrência atualizada com sucesso!');
      } else {
        await api.createOcorrencia(formData);
        showSuccessToast('Ocorrência criada com sucesso!');
      }
      setShowFormModal(false);
      setCurrentOcorrencia(null);
      fetchPageData(isEditing ? currentPage : 1, filtros); // Refetch with current filters
    } catch (err) {
      const errorData = err.response?.data;
      let errorMessage = 'Ocorreu um erro desconhecido.';
      if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (typeof errorData === 'object' && errorData !== null) {
        errorMessage = Object.entries(errorData)
          .map(
            ([key, value]) =>
              `${key}: ${Array.isArray(value) ? value.join(', ') : value}`
          )
          .join('; ');
      } else if (err.message) {
        errorMessage = err.message;
      }
      errorMessage =
        errorMessage ||
        (isEditing
          ? 'Falha ao atualizar ocorrência.'
          : 'Falha ao criar ocorrência.');

      setError(errorMessage); // For display in modal
      showErrorToast(errorMessage); // General toast
      console.error('Form Submit Ocorrencia Error:', errorData || err.message);
    } finally {
      setIsLoadingForm(false);
    }
  };

  const handleFormCancel = () => {
    setShowFormModal(false);
    setCurrentOcorrencia(null);
    setError(null);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Gestão de Ocorrências
        </h1>
        <button
          onClick={handleAddNew}
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-4 focus:ring-primary-300 disabled:bg-primary-300"
        >
          Adicionar Ocorrência
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label
              htmlFor="filtro_data_inicio"
              className="block text-sm font-medium text-gray-700"
            >
              Data Início
            </label>
            <input
              type="date"
              name="data_inicio"
              id="filtro_data_inicio"
              value={filtros.data_inicio}
              onChange={handleFiltroChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="filtro_data_fim"
              className="block text-sm font-medium text-gray-700"
            >
              Data Fim
            </label>
            <input
              type="date"
              name="data_fim"
              id="filtro_data_fim"
              value={filtros.data_fim}
              onChange={handleFiltroChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="filtro_funcionario"
              className="block text-sm font-medium text-gray-700"
            >
              Funcionário
            </label>
            <select
              name="funcionario_id"
              id="filtro_funcionario"
              value={filtros.funcionario_id}
              onChange={handleFiltroChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="">Todos</option>
              {funcionarios.map(f => (
                <option key={f.id} value={f.id}>
                  {f.nome_completo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="filtro_tipo"
              className="block text-sm font-medium text-gray-700"
            >
              Tipo
            </label>
            <select
              name="tipo"
              id="filtro_tipo"
              value={filtros.tipo}
              onChange={handleFiltroChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="">Todos</option>
              <option value="Atraso">Atraso</option>
              <option value="Falta Justificada">Falta Justificada</option>
              <option value="Falta não Justificada">
                Falta não Justificada
              </option>
            </select>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={aplicarFiltros}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-4 focus:ring-primary-300 text-sm"
            >
              Filtrar
            </button>
            <button
              onClick={limparFiltros}
              className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-4 focus:ring-gray-200 text-sm"
            >
              Limpar
            </button>
          </div>
        </div>
      </div>

      {error &&
        !isLoading &&
        !showFormModal &&
        !showDeleteConfirm &&
        ocorrencias.length === 0 && (
          <div
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4 text-center"
            role="alert"
          >
            <p className="font-bold">Falha ao Carregar Dados</p>
            <p>{error}</p>
          </div>
        )}

      {isLoading && ocorrencias.length === 0 && (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      )}

      {(!isLoading || ocorrencias.length > 0) && !error && (
        <>
          <OcorrenciasTable
            ocorrencias={ocorrencias}
            funcionarios={funcionarios}
            onEdit={handleEdit}
            onDelete={handleDelete}
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

      {/* Gráfico de Ocorrências */}
      <div className="bg-white shadow-lg rounded-lg p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">
          Contagem de Ocorrências por Tipo (Período Filtrado)
        </h2>
        {ocorrenciasGrafico.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={ocorrenciasGrafico}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name="Quantidade" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-sm">
            Nenhuma ocorrência encontrada para os filtros aplicados ou dados
            insuficientes para o gráfico.
          </p>
        )}
      </div>

      {/* Form Modal (OcorrenciaForm) */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              {currentOcorrencia
                ? 'Editar Ocorrência'
                : 'Adicionar Nova Ocorrência'}
            </h2>
            {error && (
              <div
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
                role="alert"
              >
                <strong className="font-bold">Erro: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            <OcorrenciaForm
              initialData={currentOcorrencia}
              funcionarios={funcionarios}
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
            <p className="mb-6">
              Tem certeza que deseja excluir esta ocorrência? Esta ação não pode
              ser desfeita.
            </p>
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

export default OcorrenciasPage;
