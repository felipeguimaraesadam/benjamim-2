import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import AlocacoesTable from '../components/tables/AlocacoesTable';
import AlocacaoForm from '../components/forms/AlocacaoForm';

const AlocacoesPage = () => {
  const [alocacoes, setAlocacoes] = useState([]);
  const [obras, setObras] = useState([]);
  const [equipes, setEquipes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [error, setError] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [currentAlocacao, setCurrentAlocacao] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [alocacaoToDeleteId, setAlocacaoToDeleteId] = useState(null);

  const fetchAlocacoes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getAlocacoes(); // To be created in api.js
      setAlocacoes(response.data);
    } catch (err) {
      setError(err.message || 'Falha ao buscar alocações.');
      console.error("Fetch Alocações Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchObras = useCallback(async () => {
    try {
      const response = await api.getObras();
      setObras(response.data);
    } catch (err) {
      console.error("Fetch Obras for AlocacaoForm Error:", err);
      // Potentially set a specific error for obras loading if critical for the page
    }
  }, []);

  const fetchEquipes = useCallback(async () => {
    try {
      const response = await api.getEquipes();
      setEquipes(response.data);
    } catch (err) {
      console.error("Fetch Equipes for AlocacaoForm Error:", err);
      // Potentially set a specific error for equipes loading
    }
  }, []);

  useEffect(() => {
    fetchAlocacoes();
    fetchObras();
    fetchEquipes();
  }, [fetchAlocacoes, fetchObras, fetchEquipes]);

  const handleAddNew = () => {
    setCurrentAlocacao(null);
    setShowFormModal(true);
  };

  const handleEdit = (alocacao) => {
    setCurrentAlocacao(alocacao);
    setShowFormModal(true);
  };

  const handleDelete = (id) => {
    setAlocacaoToDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!alocacaoToDeleteId) return;
    setIsLoading(true);
    setError(null);
    try {
      await api.deleteAlocacao(alocacaoToDeleteId); // To be created in api.js
      setAlocacaoToDeleteId(null);
      setShowDeleteConfirm(false);
      await fetchAlocacoes();
    } catch (err) {
      setError(err.message || 'Falha ao excluir alocação.');
      console.error("Delete Alocação Error:", err);
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (formData) => {
    setIsLoadingForm(true);
    setError(null);
    try {
      if (currentAlocacao && currentAlocacao.id) {
        await api.updateAlocacao(currentAlocacao.id, formData); // To be created
      } else {
        await api.createAlocacao(formData); // To be created
      }
      setShowFormModal(false);
      setCurrentAlocacao(null);
      await fetchAlocacoes();
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || (currentAlocacao ? 'Falha ao atualizar alocação.' : 'Falha ao criar alocação.');
      setError(errorMessage);
      console.error("Form Submit Alocação Error:", err.response?.data || err.message);
    } finally {
      setIsLoadingForm(false);
    }
  };

  const handleFormCancel = () => {
    setShowFormModal(false);
    setCurrentAlocacao(null);
    setError(null);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">Gestão de Alocações de Equipes</h1>
        <button
          onClick={handleAddNew}
          className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-75"
        >
          Nova Alocação
        </button>
      </div>

      {error && !showFormModal && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Erro: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <AlocacoesTable
        alocacoes={alocacoes}
        obras={obras}
        equipes={equipes}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">
              {currentAlocacao ? 'Editar Alocação' : 'Adicionar Nova Alocação'}
            </h2>
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Erro no formulário: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
            <AlocacaoForm
              initialData={currentAlocacao}
              obras={obras}
              equipes={equipes}
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
            <p className="mb-6">Tem certeza que deseja excluir esta alocação? Esta ação não pode ser desfeita.</p>
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

export default AlocacoesPage;
