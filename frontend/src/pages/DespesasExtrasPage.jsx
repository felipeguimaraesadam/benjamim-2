// Re-processing trigger for DespesasExtrasPage and its imports
import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import Autocomplete from '../components/forms/Autocomplete';
import DespesasExtrasTable from '../components/tables/DespesasExtrasTable';
import DespesaExtraForm from '../components/forms/DespesaExtraForm';
import PaginationControls from '../components/utils/PaginationControls';
import { showSuccessToast, showErrorToast } from '../utils/toastUtils';
import SpinnerIcon from '../components/utils/SpinnerIcon';

const DespesasExtrasPage = () => {
  const [despesas, setDespesas] = useState([]);
  const [obras, setObras] = useState([]); // For form dropdown
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
  const [currentDespesa, setCurrentDespesa] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [despesaToDeleteId, setDespesaToDeleteId] = useState(null);

  const [filters, setFilters] = useState({
    obra_id: '',
  });

  const fetchDespesasExtras = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = {
          page,
          obra_id: filters.obra_id,
        };
        const response = await api.getDespesasExtras(params);
        setDespesas(response.data.results);
        setTotalItems(response.data.count);
        setTotalPages(Math.ceil(response.data.count / PAGE_SIZE));
        setCurrentPage(page);
      } catch (err) {
        const errorMsg = err.message || 'Falha ao buscar despesas extras.';
        setError(errorMsg);
        showErrorToast(errorMsg);
        console.error('Fetch Despesas Extras Error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [PAGE_SIZE, filters]
  );

  const fetchObrasForForm = useCallback(async () => {
    // Assuming getObras is already in api.js and fetches all obras
    try {
      const response = await api.getObras({ page_size: 500 }); // Fetch more obras
      setObras(
        response.data?.results ||
          (Array.isArray(response.data) ? response.data : [])
      ); // More robust extraction
    } catch (err) {
      // Handle error fetching obras for the form specifically if needed
      console.error('Fetch Obras for Form Error:', err);
      // Optionally set a specific error state for obras loading
    }
  }, []);

  useEffect(() => {
    fetchDespesasExtras(currentPage);
    fetchObrasForForm(); // Obras list for form, fetched once or as needed
  }, [currentPage, fetchDespesasExtras, fetchObrasForForm]);

  const handlePageChange = newPage => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleAddNew = () => {
    setCurrentDespesa(null);
    setShowFormModal(true);
  };

  const handleEdit = despesa => {
    setCurrentDespesa(despesa);
    setShowFormModal(true);
  };

  const handleDelete = id => {
    setDespesaToDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!despesaToDeleteId) return;
    setIsDeleting(true);
    setError(null);
    try {
      await api.deleteDespesaExtra(despesaToDeleteId);
      showSuccessToast('Despesa excluída com sucesso!');
      setDespesaToDeleteId(null);
      setShowDeleteConfirm(false);
      if (despesas.length === 1 && currentPage > 1) {
        fetchDespesasExtras(currentPage - 1);
      } else {
        fetchDespesasExtras(currentPage);
      }
    } catch (err) {
      const errorMsg = err.message || 'Falha ao excluir despesa.';
      setError(errorMsg);
      showErrorToast(errorMsg);
      console.error('Delete Despesa Extra Error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async formData => {
    setIsLoadingForm(true);
    setError(null); // Clear previous modal errors
    const isEditing = currentDespesa && currentDespesa.id;
    try {
      if (isEditing) {
        await api.updateDespesaExtra(currentDespesa.id, formData);
        showSuccessToast('Despesa atualizada com sucesso!');
      } else {
        await api.createDespesaExtra(formData);
        showSuccessToast('Despesa criada com sucesso!');
      }
      setShowFormModal(false);
      setCurrentDespesa(null);
      fetchDespesasExtras(isEditing ? currentPage : 1); // Refetch current or first page
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
        (isEditing ? 'Falha ao atualizar despesa.' : 'Falha ao criar despesa.');

      setError(errorMessage); // For display in modal
      showErrorToast(errorMessage); // General toast
      console.error(
        'Form Submit Despesa Extra Error:',
        errorData || err.message
      );
    } finally {
      setIsLoadingForm(false);
    }
  };

  const handleFormCancel = () => {
    setShowFormModal(false);
    setCurrentDespesa(null);
    setError(null);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Gestão de Despesas Extras
        </h1>
        <button
          onClick={handleAddNew}
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-4 focus:ring-primary-300 disabled:bg-primary-300"
        >
          Adicionar Nova Despesa
        </button>
      </div>

      {error &&
        !isLoading &&
        !showFormModal &&
        !showDeleteConfirm &&
        despesas.length === 0 && (
          <div
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4 text-center"
            role="alert"
          >
            <p className="font-bold">Falha ao Carregar Dados</p>
            <p>{error}</p>
          </div>
        )}

      {isLoading && despesas.length === 0 && (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      )}

      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="obra-filter" className="block text-sm font-medium text-gray-700">
              Filtrar por Obra
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
                setFilters({ ...filters, obra_id: selection ? selection.value : '' })
              }
              onClear={() => setFilters({ ...filters, obra_id: '' })}
              placeholder="Digite para buscar uma obra..."
            />
          </div>
        </div>
      </div>

      {(!isLoading || despesas.length > 0) && !error && (
        <>
          <DespesasExtrasTable
            despesas={despesas} // Now receives paginated data
            obras={obras}
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

      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              {currentDespesa
                ? 'Editar Despesa Extra'
                : 'Adicionar Nova Despesa Extra'}
            </h2>
            {error && (
              <div
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
                role="alert"
              >
                <strong className="font-bold">Erro no formulário: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            <DespesaExtraForm
              initialData={currentDespesa}
              obras={obras} // Pass obras to the form for the dropdown
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              isLoading={isLoadingForm}
            />
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Confirmar Exclusão</h2>
            <p className="mb-6">
              Tem certeza que deseja excluir esta despesa? Esta ação não pode
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

export default DespesasExtrasPage;
