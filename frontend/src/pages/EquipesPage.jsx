import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import EquipesTable from '../components/tables/EquipesTable';
import EquipeForm from '../components/forms/EquipeForm';
import PaginationControls from '../components/utils/PaginationControls';
import { showSuccessToast, showErrorToast } from '../utils/toastUtils';
import SpinnerIcon from '../components/utils/SpinnerIcon';

const EquipesPage = () => {
  const [equipes, setEquipes] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // For page data (equipes)
  const [isLoadingForm, setIsLoadingForm] = useState(false); // For form submission
  const [isDeleting, setIsDeleting] = useState(false); // For delete operation
  const [error, setError] = useState(null); // General page/form errors

  // Pagination state for equipes
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const PAGE_SIZE = 10;

  const [showFormModal, setShowFormModal] = useState(false);
  const [currentEquipe, setCurrentEquipe] = useState(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [equipeToDeleteId, setEquipeToDeleteId] = useState(null);

  const fetchPageData = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch paginated equipes
      const equipesResponse = await api.getEquipes({ page });
      setEquipes(equipesResponse.data.results);
      setTotalItems(equipesResponse.data.count);
      setTotalPages(Math.ceil(equipesResponse.data.count / PAGE_SIZE));
      setCurrentPage(page);

      // Fetch all funcionarios (assuming not too many for dropdowns, or handle pagination for them separately if needed)
      // This might lead to fetching funcionarios multiple times if page changes, consider optimizing if it's an issue.
      // A common optimization is to fetch funcionarios once on mount or store in a context/global state.
      // For this task, keeping it simple as per existing structure.
      const funcionariosResponse = await api.getFuncionarios(); // Assuming getFuncionarios fetches all for now
      setFuncionarios(funcionariosResponse.data.results || funcionariosResponse.data); // Handle if getFuncionarios is also paginated
    } catch (err) {
      const errorMsg = err.message || 'Falha ao buscar dados. Tente novamente.';
      setError(errorMsg);
      showErrorToast(errorMsg);
      console.error("Fetch Equipes/Funcionarios Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [PAGE_SIZE]);

  useEffect(() => {
    fetchPageData(currentPage);
  }, [currentPage, fetchPageData]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleAddNew = () => {
    setCurrentEquipe(null);
    setShowFormModal(true);
    setError(null);
  };

  const handleEdit = (equipe) => {
    setCurrentEquipe(equipe);
    setShowFormModal(true);
    setError(null);
  };

  const handleDelete = (id) => {
    setEquipeToDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!equipeToDeleteId) return;
    setIsDeleting(true);
    setError(null);
    try {
      await api.deleteEquipe(equipeToDeleteId);
      showSuccessToast('Equipe excluída com sucesso!');
      setEquipeToDeleteId(null);
      setShowDeleteConfirm(false);
      if (equipes.length === 1 && currentPage > 1) {
        fetchPageData(currentPage - 1);
      } else {
        fetchPageData(currentPage);
      }
    } catch (err) {
      const errorMsg = err.message || 'Falha ao excluir equipe.';
      setError(errorMsg);
      showErrorToast(errorMsg);
      console.error("Delete Equipe Error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async (formData) => {
    setIsLoadingForm(true);
    setError(null); // Clear previous modal errors
    const isEditing = currentEquipe && currentEquipe.id;
    try {
      if (isEditing) {
        await api.updateEquipe(currentEquipe.id, formData);
        showSuccessToast('Equipe atualizada com sucesso!');
      } else {
        await api.createEquipe(formData);
        showSuccessToast('Equipe criada com sucesso!');
      }
      setShowFormModal(false);
      setCurrentEquipe(null);
      fetchPageData(isEditing ? currentPage : 1); // Refetch current page on update, or first page on create
    } catch (err) {
      const errorData = err.response?.data;
      let errorMessage = 'Ocorreu um erro desconhecido.';
      if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (typeof errorData === 'object' && errorData !== null) {
        errorMessage = Object.entries(errorData)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('; ');
      } else if (err.message) {
        errorMessage = err.message;
      }
      errorMessage = errorMessage || (isEditing ? 'Falha ao atualizar equipe.' : 'Falha ao criar equipe.');

      setError(errorMessage); // Set error to be displayed in the modal
      showErrorToast(errorMessage); // Show general toast
      console.error("Form Submit Equipe Error:", errorData || err.message);
    } finally {
      setIsLoadingForm(false);
    }
  };

  const handleFormCancel = () => {
    setShowFormModal(false);
    setCurrentEquipe(null);
    setError(null);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestão de Equipes</h1>
        <button
          onClick={handleAddNew}
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-4 focus:ring-primary-300 disabled:bg-primary-300"
        >
          Adicionar Nova Equipe
        </button>
      </div>

      {error && !isLoading && !showFormModal && !showDeleteConfirm && equipes.length === 0 && (
         <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4 text-center" role="alert">
          <p className="font-bold">Falha ao Carregar Dados</p>
          <p>{error}</p>
        </div>
      )}

      {isLoading && equipes.length === 0 && (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      )}

      {(!isLoading || equipes.length > 0) && !error && (
        <>
          <EquipesTable
            equipes={equipes} // Now receives paginated data
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
              {currentEquipe ? 'Editar Equipe' : 'Adicionar Nova Equipe'}
            </h2>
            {error && ( // Display error specific to form submission attempt inside modal
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Erro: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
            {/*
              Pass funcionarios to EquipeForm if it doesn't fetch them internally.
              Our current EquipeForm fetches them internally, so not strictly needed here.
              However, if EquipeForm were to receive them as props:
              <EquipeForm funcionarios={funcionarios} ... />
            */}
            <EquipeForm
              initialData={currentEquipe}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              isLoading={isLoadingForm}
              // funcionarios={funcionarios} // Pass if form expects it as prop
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Confirmar Exclusão</h2>
            <p className="mb-6">Tem certeza que deseja excluir esta equipe? Esta ação não pode ser desfeita.</p>
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

export default EquipesPage;
