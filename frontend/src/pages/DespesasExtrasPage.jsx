import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import DespesasExtrasTable from '../components/tables/DespesasExtrasTable';
import DespesaExtraForm from '../components/forms/DespesaExtraForm';
// Ensure correct relative paths if components are in subdirectories

const DespesasExtrasPage = () => {
  const [despesas, setDespesas] = useState([]);
  const [obras, setObras] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [error, setError] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [currentDespesa, setCurrentDespesa] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [despesaToDeleteId, setDespesaToDeleteId] = useState(null);

  const fetchDespesasExtras = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getDespesasExtras();
      setDespesas(response.data);
    } catch (err) {
      setError(err.message || 'Falha ao buscar despesas extras.');
      console.error("Fetch Despesas Extras Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchObrasForForm = useCallback(async () => {
    // Assuming getObras is already in api.js and fetches all obras
    try {
      const response = await api.getObras();
      setObras(response.data);
    } catch (err) {
      // Handle error fetching obras for the form specifically if needed
      console.error("Fetch Obras for Form Error:", err);
      // Optionally set a specific error state for obras loading
    }
  }, []);

  useEffect(() => {
    fetchDespesasExtras();
    fetchObrasForForm();
  }, [fetchDespesasExtras, fetchObrasForForm]);

  const handleAddNew = () => {
    setCurrentDespesa(null);
    setShowFormModal(true);
  };

  const handleEdit = (despesa) => {
    setCurrentDespesa(despesa);
    setShowFormModal(true);
  };

  const handleDelete = (id) => {
    setDespesaToDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!despesaToDeleteId) return;
    setIsLoading(true);
    setError(null);
    try {
      await api.deleteDespesaExtra(despesaToDeleteId);
      setDespesaToDeleteId(null);
      setShowDeleteConfirm(false);
      await fetchDespesasExtras();
    } catch (err) {
      setError(err.message || 'Falha ao excluir despesa.');
      console.error("Delete Despesa Extra Error:", err);
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (formData) => {
    setIsLoadingForm(true);
    setError(null);
    try {
      if (currentDespesa && currentDespesa.id) {
        await api.updateDespesaExtra(currentDespesa.id, formData);
      } else {
        await api.createDespesaExtra(formData);
      }
      setShowFormModal(false);
      setCurrentDespesa(null);
      await fetchDespesasExtras();
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || (currentDespesa ? 'Falha ao atualizar despesa.' : 'Falha ao criar despesa.');
      setError(errorMessage);
      console.error("Form Submit Despesa Extra Error:", err.response?.data || err.message);
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
        <h1 className="text-3xl font-bold text-gray-800">Gestão de Despesas Extras</h1>
        <button
          onClick={handleAddNew}
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-4 focus:ring-primary-300 disabled:bg-primary-300"
        >
          Adicionar Nova Despesa
        </button>
      </div>

      {error && !showFormModal && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Erro: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <DespesasExtrasTable
        despesas={despesas}
        obras={obras} // Pass obras to the table for display purposes
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              {currentDespesa ? 'Editar Despesa Extra' : 'Adicionar Nova Despesa Extra'}
            </h2>
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
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
            <p className="mb-6">Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isLoading}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md focus:ring-4 focus:outline-none focus:ring-gray-300 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md focus:ring-4 focus:outline-none focus:ring-red-300 disabled:opacity-50"
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

export default DespesasExtrasPage;
