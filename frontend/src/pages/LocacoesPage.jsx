import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // Added useLocation and useNavigate
import * as api from '../services/api';
import LocacoesTable from '../components/tables/LocacoesTable';
import LocacaoForm from '../components/forms/LocacaoForm';

const LocacoesPage = () => {
  const location = useLocation(); // Hook to access location state
  const navigate = useNavigate(); // Hook to navigate and modify state
  const [locacoes, setLocacoes] = useState([]);
  const [obras, setObras] = useState([]);
  const [equipes, setEquipes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [error, setError] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [currentLocacao, setCurrentLocacao] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [locacaoToDeleteId, setLocacaoToDeleteId] = useState(null);

  const fetchLocacoes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getLocacoes(); // To be created in api.js
      setLocacoes(response.data);
    } catch (err) {
      setError(err.message || 'Falha ao buscar locações.');
      console.error("Fetch Locações Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchObras = useCallback(async () => {
    try {
      const response = await api.getObras();
      setObras(response.data);
    } catch (err) {
      console.error("Fetch Obras for LocacaoForm Error:", err);
      // Potentially set a specific error for obras loading if critical for the page
    }
  }, []);

  const fetchEquipes = useCallback(async () => {
    try {
      const response = await api.getEquipes();
      setEquipes(response.data);
    } catch (err) {
      console.error("Fetch Equipes for LocacaoForm Error:", err);
      // Potentially set a specific error for equipes loading
    }
  }, []);

  useEffect(() => {
    fetchLocacoes();
    fetchObras();
    fetchEquipes();
  }, [fetchLocacoes, fetchObras, fetchEquipes]);

  const handleAddNew = () => {
    const obraIdFromState = location.state?.obraIdParaNovaAlocacao;
    // Assuming LocacaoForm expects the obra ID as 'obra' in initialData
    setCurrentLocacao(obraIdFromState ? { obra: obraIdFromState } : null);
    setError(null); // Clear previous errors
    setShowFormModal(true);
    // Clear location state after using it
    if (obraIdFromState) {
        navigate(location.pathname, { replace: true, state: {} });
    }
  };

  const handleEdit = (locacao) => {
    setCurrentLocacao(locacao);
    setShowFormModal(true);
  };

  const handleDelete = (id) => {
    setLocacaoToDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!locacaoToDeleteId) return;
    setIsLoading(true);
    setError(null);
    try {
      await api.deleteLocacao(locacaoToDeleteId); // To be created in api.js
      setLocacaoToDeleteId(null);
      setShowDeleteConfirm(false);
      await fetchLocacoes();
    } catch (err) {
      setError(err.message || 'Falha ao excluir locação.');
      console.error("Delete Locação Error:", err);
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (formData) => {
    setIsLoadingForm(true);
    setError(null);
    try {
      if (currentLocacao && currentLocacao.id) {
        await api.updateLocacao(currentLocacao.id, formData); // To be created
      } else {
        await api.createLocacao(formData); // To be created
      }
      setShowFormModal(false);
      setCurrentLocacao(null);
      await fetchLocacoes();
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || (currentLocacao ? 'Falha ao atualizar locação.' : 'Falha ao criar locação.');
      setError(errorMessage);
      console.error("Form Submit Locação Error:", err.response?.data || err.message);
    } finally {
      setIsLoadingForm(false);
    }
  };

  const handleFormCancel = () => {
    setShowFormModal(false);
    setCurrentLocacao(null);
    setError(null);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestão de Locações de Equipes</h1>
        <button
          onClick={handleAddNew}
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-4 focus:ring-primary-300 disabled:bg-primary-300"
        >
          Nova Locação
        </button>
      </div>

      {error && !showFormModal && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Erro: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <LocacoesTable
        locacoes={locacoes}
        obras={obras}
        equipes={equipes}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              {currentLocacao ? 'Editar Locação' : 'Adicionar Nova Locação'}
            </h2>
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Erro no formulário: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
            <LocacaoForm
              initialData={currentLocacao}
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
            <p className="mb-6">Tem certeza que deseja excluir esta locação? Esta ação não pode ser desfeita.</p>
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

export default LocacoesPage;
