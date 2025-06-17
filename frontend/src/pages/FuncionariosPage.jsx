import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import FuncionariosTable from '../components/tables/FuncionariosTable';
import FuncionarioForm from '../components/forms/FuncionarioForm';
import PaginationControls from '../components/utils/PaginationControls';
import { showSuccessToast, showErrorToast } from '../utils/toastUtils';
import SpinnerIcon from '../components/utils/SpinnerIcon';

const FuncionariosPage = () => {
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
  const [currentFuncionario, setCurrentFuncionario] = useState(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [funcionarioToDeleteId, setFuncionarioToDeleteId] = useState(null);

  const fetchFuncionarios = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getFuncionarios({ page });
      setFuncionarios(response.data.results);
      setTotalItems(response.data.count);
      setTotalPages(Math.ceil(response.data.count / PAGE_SIZE));
      setCurrentPage(page);
    } catch (err) {
      const errorMsg = err.message || 'Falha ao buscar funcionários. Tente novamente.';
      setError(errorMsg);
      showErrorToast(errorMsg);
      console.error("Fetch Funcionarios Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [PAGE_SIZE]);

  useEffect(() => {
    fetchFuncionarios(currentPage);
  }, [currentPage, fetchFuncionarios]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleAddNew = () => {
    setCurrentFuncionario(null);
    setShowFormModal(true);
    setError(null); // Clear any previous errors when opening form
  };

  const handleEdit = (funcionario) => {
    setCurrentFuncionario(funcionario);
    setShowFormModal(true);
    setError(null); // Clear any previous errors
  };

  const handleDelete = (id) => {
    setFuncionarioToDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!funcionarioToDeleteId) return;
    setIsDeleting(true);
    setError(null);
    try {
      await api.deleteFuncionario(funcionarioToDeleteId);
      showSuccessToast('Funcionário excluído com sucesso!');
      setFuncionarioToDeleteId(null);
      setShowDeleteConfirm(false);
      if (funcionarios.length === 1 && currentPage > 1) {
        fetchFuncionarios(currentPage - 1);
      } else {
        fetchFuncionarios(currentPage);
      }
    } catch (err) {
      const errorMsg = err.message || 'Falha ao excluir funcionário.';
      setError(errorMsg);
      showErrorToast(errorMsg);
      console.error("Delete Funcionario Error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async (formData) => {
    setIsLoadingForm(true);
    setError(null); // Clear previous modal errors
    const isEditing = currentFuncionario && currentFuncionario.id;
    try {
      if (isEditing) {
        await api.updateFuncionario(currentFuncionario.id, formData);
        showSuccessToast('Funcionário atualizado com sucesso!');
      } else {
        await api.createFuncionario(formData);
        showSuccessToast('Funcionário criado com sucesso!');
      }
      setShowFormModal(false);
      setCurrentFuncionario(null);
      fetchFuncionarios(isEditing ? currentPage : 1); // Refetch: current page on update, first page on create
    } catch (err) {
      // Handle more specific backend errors if available (e.g., from a DRF serializer)
      const errorData = err.response?.data;
      let errorMessage = 'Ocorreu um erro desconhecido.';
      if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (typeof errorData === 'object' && errorData !== null) {
        // Concatenate all error messages from the error object
        errorMessage = Object.entries(errorData)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('; ');
      } else if (err.message) {
        errorMessage = err.message;
      }
      errorMessage = errorMessage || (isEditing ? 'Falha ao atualizar funcionário.' : 'Falha ao criar funcionário.');

      setError(errorMessage); // Set error to be displayed in the modal
      showErrorToast(errorMessage); // Show general toast
      console.error("Form Submit Funcionario Error:", errorData || err.message);
    } finally {
      setIsLoadingForm(false);
    }
  };

  const handleFormCancel = () => {
    setShowFormModal(false);
    setCurrentFuncionario(null);
    setError(null);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestão de Funcionários</h1>
        <button
          onClick={handleAddNew}
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-4 focus:ring-primary-300 disabled:bg-primary-300"
        >
          Adicionar Novo Funcionário
        </button>
      </div>

      {/* Page level error display, not within modal context */}
      {error && !isLoading && !showFormModal && !showDeleteConfirm && funcionarios.length === 0 && (
         <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4 text-center" role="alert">
          <p className="font-bold">Falha ao Carregar Dados</p>
          <p>{error}</p>
        </div>
      )}

      {isLoading && funcionarios.length === 0 && (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      )}

      {(!isLoading || funcionarios.length > 0) && !error && (
        <>
          <FuncionariosTable
            funcionarios={funcionarios}
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
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              {currentFuncionario ? 'Editar Funcionário' : 'Adicionar Novo Funcionário'}
            </h2>
            {error && ( // Display error specific to form submission attempt inside modal
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Erro: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
            <FuncionarioForm
              initialData={currentFuncionario}
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
            <p className="mb-6">Tem certeza que deseja excluir este funcionário? Esta ação não pode ser desfeita.</p>
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

export default FuncionariosPage;
