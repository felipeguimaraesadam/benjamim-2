import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import EquipesTable from '../components/tables/EquipesTable';
import EquipeForm from '../components/forms/EquipeForm';

const EquipesPage = () => {
  const [equipes, setEquipes] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]); // To store all funcionarios for selects/display
  const [isLoading, setIsLoading] = useState(false); // For table and initial data
  const [isLoadingForm, setIsLoadingForm] = useState(false); // For form submission
  const [error, setError] = useState(null);

  const [showFormModal, setShowFormModal] = useState(false);
  const [currentEquipe, setCurrentEquipe] = useState(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [equipeToDeleteId, setEquipeToDeleteId] = useState(null);

  const fetchEquipesAndFuncionarios = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [equipesResponse, funcionariosResponse] = await Promise.all([
        api.getEquipes(),
        api.getFuncionarios()
      ]);
      setEquipes(equipesResponse.data);
      setFuncionarios(funcionariosResponse.data);
    } catch (err) {
      setError(err.message || 'Falha ao buscar dados. Tente novamente.');
      console.error("Fetch Equipes/Funcionarios Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEquipesAndFuncionarios();
  }, [fetchEquipesAndFuncionarios]);

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
    setIsLoading(true); // Use main loading for consistency as table will refresh
    setError(null);
    try {
      await api.deleteEquipe(equipeToDeleteId);
      setEquipeToDeleteId(null);
      setShowDeleteConfirm(false);
      // Re-fetch only equipes, funcionarios list is likely stable
      const equipesResponse = await api.getEquipes();
      setEquipes(equipesResponse.data);
    } catch (err) {
      setError(err.message || 'Falha ao excluir equipe.');
      console.error("Delete Equipe Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (formData) => {
    setIsLoadingForm(true);
    setError(null);
    try {
      if (currentEquipe && currentEquipe.id) {
        await api.updateEquipe(currentEquipe.id, formData);
      } else {
        await api.createEquipe(formData);
      }
      setShowFormModal(false);
      setCurrentEquipe(null);
      // Re-fetch only equipes
      const equipesResponse = await api.getEquipes();
      setEquipes(equipesResponse.data);
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || err.message || (currentEquipe ? 'Falha ao atualizar equipe.' : 'Falha ao criar equipe.'));
      console.error("Form Submit Equipe Error:", err.response?.data || err.message);
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

      {error && !showFormModal && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Erro: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <EquipesTable
        equipes={equipes}
        funcionarios={funcionarios} // Pass funcionarios to resolve names
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

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

export default EquipesPage;
