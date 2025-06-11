import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api'; // Import all functions from api.js
import ObrasTable from '../components/tables/ObrasTable';
import ObraForm from '../components/forms/ObraForm';
// Consider a generic Button component later if needed: import Button from '../components/ui/Button';

const ObrasPage = () => {
  const [obras, setObras] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(false); // Separate loading for form submission
  const [error, setError] = useState(null);

  const [showFormModal, setShowFormModal] = useState(false);
  const [currentObra, setCurrentObra] = useState(null); // For editing or null for new

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [obraToDeleteId, setObraToDeleteId] = useState(null);

  const fetchObras = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getObras();
      setObras(response.data);
    } catch (err) {
      setError(err.message || 'Falha ao buscar obras. Tente novamente.');
      console.error("Fetch Obras Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchObras();
  }, [fetchObras]);

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
    setIsLoading(true); // Use main loading for table refresh
    setError(null);
    try {
      await api.deleteObra(obraToDeleteId);
      setObraToDeleteId(null);
      setShowDeleteConfirm(false);
      await fetchObras(); // Re-fetch
    } catch (err) {
      setError(err.message || 'Falha ao excluir obra.');
      console.error("Delete Obra Error:", err);
      setIsLoading(false); // Stop loading if delete failed before fetchObras
    }
    // setIsLoading(false) will be called by fetchObras if successful
  };

  const handleFormSubmit = async (formData) => {
    setIsLoadingForm(true);
    setError(null);
    try {
      if (currentObra && currentObra.id) {
        await api.updateObra(currentObra.id, formData);
      } else {
        await api.createObra(formData);
      }
      setShowFormModal(false);
      setCurrentObra(null);
      await fetchObras(); // Re-fetch
    } catch (err) {
      setError(err.response?.data?.detail || err.message || (currentObra ? 'Falha ao atualizar obra.' : 'Falha ao criar obra.'));
      console.error("Form Submit Obra Error:", err.response?.data || err.message);
      // Keep form open on error so user can see/correct
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
        <button
          onClick={handleAddNew}
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-4 focus:ring-primary-300 disabled:bg-primary-300"
        >
          Adicionar Nova Obra
        </button>
      </div>

      {error && !showFormModal && ( // Display general errors here, form errors are in ObraForm or handled below
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Erro: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <ObrasTable
        obras={obras}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      {/* Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">
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
                disabled={isLoading}
                className="py-2 px-4 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-primary-300"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={isLoading}
                className="py-2 px-4 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300"
              >
                {isLoading ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ObrasPage;
