import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import MateriaisTable from '../components/tables/MateriaisTable';
import MaterialForm from '../components/forms/MaterialForm';

const MateriaisPage = () => {
  const [materiais, setMateriais] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [error, setError] = useState(null);

  const [showFormModal, setShowFormModal] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [materialToDeleteId, setMaterialToDeleteId] = useState(null);

  const fetchMateriais = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getMateriais();
      setMateriais(response.data);
    } catch (err) {
      setError(err.message || 'Falha ao buscar materiais. Tente novamente.');
      console.error("Fetch Materiais Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMateriais();
  }, [fetchMateriais]);

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
    setIsLoading(true);
    setError(null);
    try {
      await api.deleteMaterial(materialToDeleteId);
      setMaterialToDeleteId(null);
      setShowDeleteConfirm(false);
      await fetchMateriais();
    } catch (err) {
      setError(err.message || 'Falha ao excluir material.');
      console.error("Delete Material Error:", err);
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (formData) => {
    setIsLoadingForm(true);
    setError(null);
    try {
      if (currentMaterial && currentMaterial.id) {
        await api.updateMaterial(currentMaterial.id, formData);
      } else {
        await api.createMaterial(formData);
      }
      setShowFormModal(false);
      setCurrentMaterial(null);
      await fetchMateriais();
    } catch (err) {
      const errorMsg = err.response?.data?.nome?.[0] || // Specific error for 'nome' field (e.g. unique constraint)
                       err.response?.data?.detail ||
                       JSON.stringify(err.response?.data) ||
                       err.message ||
                       (currentMaterial ? 'Falha ao atualizar material.' : 'Falha ao criar material.');
      setError(errorMsg);
      console.error("Form Submit Material Error:", err.response?.data || err.message);
    } finally {
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

      {error && !showFormModal && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Erro: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <MateriaisTable
        materiais={materiais}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      {/* Form Modal */}
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

export default MateriaisPage;
