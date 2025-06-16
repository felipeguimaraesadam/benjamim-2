import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import MateriaisTable from '../components/tables/MateriaisTable';
import MaterialForm from '../components/forms/MaterialForm';
import PaginationControls from '../components/utils/PaginationControls';
import { showSuccessToast, showErrorToast } from '../../utils/toastUtils'; // Import toast utilities
import SpinnerIcon from '../components/utils/SpinnerIcon'; // Import SpinnerIcon for delete button

const MateriaisPage = () => {
  const [materiais, setMateriais] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // For table data loading
  const [isLoadingForm, setIsLoadingForm] = useState(false); // For form submission
  const [error, setError] = useState(null); // General page/form error

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const PAGE_SIZE = 10; // Should match backend PAGE_SIZE

  const [showFormModal, setShowFormModal] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [materialToDeleteId, setMaterialToDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false); // State for delete operation

  // State for low stock alerts
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [isLoadingLowStockAlerts, setIsLoadingLowStockAlerts] = useState(false);
  const [lowStockAlertsError, setLowStockAlertsError] = useState(null);

  const fetchMateriais = useCallback(async (page = 1) => {
    setIsLoading(true); // Start loading before API call
    setError(null);
    try {
      const response = await api.getMateriais({ page });
      setMateriais(response.data.results);
      setTotalItems(response.data.count);
      setTotalPages(Math.ceil(response.data.count / PAGE_SIZE));
      setCurrentPage(page);
    } catch (err) {
      setError(err.message || 'Falha ao buscar materiais. Tente novamente.');
      showErrorToast('Falha ao buscar materiais.'); // Show toast on fetch error
      console.error("Fetch Materiais Error:", err);
    } finally {
      setIsLoading(false); // Stop loading after API call
    }
  }, [PAGE_SIZE]);

  const fetchLowStockAlerts = useCallback(async () => {
    setIsLoadingLowStockAlerts(true);
    setLowStockAlertsError(null);
    try {
      const response = await api.getMateriaisAlertaEstoqueBaixo();
      setLowStockAlerts(response.data || []);
    } catch (err) {
      setLowStockAlertsError(err.message || 'Falha ao buscar alertas de estoque baixo.');
      console.error("Fetch Low Stock Alerts Error:", err);
    } finally {
      setIsLoadingLowStockAlerts(false);
    }
  }, []);

  useEffect(() => {
    fetchMateriais(currentPage);
    fetchLowStockAlerts();
  }, [currentPage, fetchMateriais, fetchLowStockAlerts]);
  // Note: fetchMateriais and fetchLowStockAlerts are memoized by useCallback.
  // currentPage change will trigger this useEffect.

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      // fetchMateriais will be called by the useEffect above when currentPage changes
      setCurrentPage(newPage);
    }
  };

  const handleAddNew = () => {
    setCurrentMaterial(null);
    setShowFormModal(true);
    setError(null);
  };

  const handleEdit = (material) => {
    setCurrentMaterial(material);
    setShowFormModal(true);
    setError(null);
  };

  const handleDelete = (id) => {
    setMaterialToDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!materialToDeleteId) return;
    setIsDeleting(true); // Start deleting loader
    // setError(null); // Clear previous general errors, or use a specific delete error state
    try {
      await api.deleteMaterial(materialToDeleteId);
      showSuccessToast('Material excluído com sucesso!');
      setMaterialToDeleteId(null);
      setShowDeleteConfirm(false);
      // Refetch to update list, consider current page or go to page 1
      // If current page might become empty, logic to go to prev page could be added
      fetchMateriais(currentPage);
      fetchLowStockAlerts(); // Also refresh low stock alerts
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Falha ao excluir material.';
      showErrorToast(errorMsg);
      // setError(errorMsg); // Set general error or a specific delete error state
      console.error("Delete Material Error:", err);
    } finally {
      setIsDeleting(false); // Stop deleting loader
      // setIsLoading(false); // This was for general loading, ensure it's handled if needed
    }
  };

  const handleFormSubmit = async (formData) => {
    setIsLoadingForm(true);
    setError(null); // Clear previous form-specific errors shown in modal
    try {
      if (currentMaterial && currentMaterial.id) {
        await api.updateMaterial(currentMaterial.id, formData);
        showSuccessToast('Material atualizado com sucesso!');
      } else {
        await api.createMaterial(formData);
        showSuccessToast('Material criado com sucesso!');
      }
      setShowFormModal(false);
      setCurrentMaterial(null);
      fetchMateriais(currentPage); // Refetch current page to see changes
      fetchLowStockAlerts(); // Also refresh low stock alerts
    } catch (err) {
      const errorMsg = err.response?.data?.nome?.[0] ||
                       err.response?.data?.detail ||
                       (typeof err.response?.data === 'object' ? Object.values(err.response.data).flat().join('; ') : null) ||
                       err.message ||
                       (currentMaterial ? 'Falha ao atualizar material.' : 'Falha ao criar material.');
      setError(errorMsg); // This error is for the modal
      showErrorToast(currentMaterial ? 'Erro ao atualizar material.' : 'Erro ao criar material.'); // General toast
      console.error("Form Submit Material Error:", err.response?.data || err.message);
    } finally {
      // setIsLoadingForm(false) is handled by the MaterialForm itself now if we pass isSubmitting
      // For this parent page, we don't need setIsLoadingForm if the form handles its own submit state.
      // However, the current MaterialForm expects 'isLoading' which is 'isLoadingForm' here.
      // This will be refactored in the next step for MaterialForm.
      // For now, keep it as is.
      setIsLoadingForm(false);
    }
  };

  const handleFormCancel = () => {
    setShowFormModal(false);
    setCurrentMaterial(null);
    setError(null);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestão de Materiais</h1>
        <button
          onClick={handleAddNew}
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-4 focus:ring-primary-300 disabled:bg-primary-300"
        >
          Adicionar Novo Material
        </button>
      </div>

      {/* Low Stock Alerts Display */}
      {isLoadingLowStockAlerts && !lowStockAlertsError && <p className="text-center text-gray-500 my-4">Carregando alertas de estoque...</p>}
      {lowStockAlertsError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4" role="alert">
          <p className="font-bold">Erro ao Carregar Alertas de Estoque:</p>
          <p>{lowStockAlertsError}</p>
        </div>
      )}
      {!isLoadingLowStockAlerts && lowStockAlerts.length > 0 && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 my-4" role="alert">
          <p className="font-bold">Alerta de Estoque Baixo!</p>
          <p>Os seguintes materiais atingiram ou estão abaixo do nível mínimo de estoque:</p>
          <ul className="list-disc ml-5 mt-2">
            {lowStockAlerts.map(material => (
              <li key={material.id}>
                {material.nome} (Estoque Atual: {material.quantidade_em_estoque}, Mínimo Definido: {material.nivel_minimo_estoque})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Main content: table or loading spinner */}
      {isLoading && materiais.length === 0 && !error && (
         <div className="flex justify-center items-center min-h-[300px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      )}

      {!isLoading && error && materiais.length === 0 && ( // Show error prominently if it prevented initial load
         <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative my-4 text-center" role="alert">
          <strong className="font-bold">Erro ao carregar materiais: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {(!isLoading || materiais.length > 0) && !error && ( // Show table if not loading initial data OR if data is present, and no major error
        <>
          <MateriaisTable
            materiais={materiais}
            onEdit={handleEdit}
            onDelete={handleDelete}
            // isLoading prop for table might be used for per-row actions later, but page isLoading handles main table load
            lowStockAlerts={lowStockAlerts}
          />
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={totalItems}
            itemsPerPage={PAGE_SIZE}
          />
        </>
      )}

      {/* General error display, if not related to initial load and modal isn't up */}
      {error && !showFormModal && !isLoading && materiais.length > 0 && (
         <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative my-4" role="alert">
          <strong className="font-bold">Ocorreu um erro: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}


      {/* Form Modal */}
      {/* This duplicated block of props was causing the syntax error. It's removed. */}
      {/* The actual Form Modal is rendered below. PaginationControls are rendered with the table. */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              {currentMaterial ? 'Editar Material' : 'Adicionar Novo Material'}
            </h2>
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Erro: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
            <MaterialForm
              initialData={currentMaterial}
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
            <p className="mb-6">Tem certeza que deseja excluir este material? Esta ação não pode ser desfeita.</p>
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

export default MateriaisPage;
