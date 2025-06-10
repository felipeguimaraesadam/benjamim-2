import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import FuncionariosTable from '../components/tables/FuncionariosTable';
import FuncionarioForm from '../components/forms/FuncionarioForm';

const FuncionariosPage = () => {
  const [funcionarios, setFuncionarios] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [error, setError] = useState(null);

  const [showFormModal, setShowFormModal] = useState(false);
  const [currentFuncionario, setCurrentFuncionario] = useState(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [funcionarioToDeleteId, setFuncionarioToDeleteId] = useState(null);

  const fetchFuncionarios = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getFuncionarios();
      setFuncionarios(response.data);
    } catch (err) {
      setError(err.message || 'Falha ao buscar funcionários. Tente novamente.');
      console.error("Fetch Funcionarios Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFuncionarios();
  }, [fetchFuncionarios]);

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
    setIsLoading(true);
    setError(null);
    try {
      await api.deleteFuncionario(funcionarioToDeleteId);
      setFuncionarioToDeleteId(null);
      setShowDeleteConfirm(false);
      await fetchFuncionarios();
    } catch (err) {
      setError(err.message || 'Falha ao excluir funcionário.');
      console.error("Delete Funcionario Error:", err);
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (formData) => {
    setIsLoadingForm(true);
    setError(null);
    try {
      if (currentFuncionario && currentFuncionario.id) {
        await api.updateFuncionario(currentFuncionario.id, formData);
      } else {
        await api.createFuncionario(formData);
      }
      setShowFormModal(false);
      setCurrentFuncionario(null);
      await fetchFuncionarios();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || (currentFuncionario ? 'Falha ao atualizar funcionário.' : 'Falha ao criar funcionário.'));
      console.error("Form Submit Funcionario Error:", err.response?.data || err.message);
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
        <h1 className="text-3xl font-semibold text-gray-800">Gestão de Funcionários</h1>
        <button
          onClick={handleAddNew}
          className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-75"
        >
          Adicionar Novo Funcionário
        </button>
      </div>

      {error && !showFormModal && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Erro: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <FuncionariosTable
        funcionarios={funcionarios}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      {/* Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">
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

export default FuncionariosPage;
