import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import UsuariosTable from '../components/tables/UsuariosTable';
import UsuarioForm from '../components/forms/UsuarioForm';

const UsuariosPage = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [error, setError] = useState(null);

  const [showFormModal, setShowFormModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDeleteId, setUserToDeleteId] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false); // State for help modal

  const fetchUsuarios = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getUsuarios();
      setUsers(response.data || response); // Adapt based on API response structure
    } catch (err) {
      setError(err.message || 'Falha ao buscar usuários. Tente novamente.');
      console.error("Fetch Usuarios Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const handleAddNew = () => {
    setCurrentUser(null);
    setError(null);
    setShowFormModal(true);
  };

  const handleEdit = (user) => {
    setCurrentUser(user);
    setError(null);
    setShowFormModal(true);
  };

  const handleDelete = (id) => {
    setUserToDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!userToDeleteId) return;
    setIsLoading(true); // Main loading for table refresh
    setError(null);
    try {
      await api.deleteUsuario(userToDeleteId);
      setUserToDeleteId(null);
      setShowDeleteConfirm(false);
      await fetchUsuarios(); // Re-fetch
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Falha ao excluir usuário.');
      console.error("Delete Usuario Error:", err.response?.data || err.message);
      // Stop loading if delete failed before fetchUsuarios
      if (!showFormModal) setIsLoading(false);
    }
  };

  const handleFormSubmit = async (formData) => {
    setIsLoadingForm(true);
    setError(null);
    try {
      if (currentUser && currentUser.id) {
        await api.updateUsuario(currentUser.id, formData);
      } else {
        await api.createUsuario(formData);
      }
      setShowFormModal(false);
      setCurrentUser(null);
      await fetchUsuarios(); // Re-fetch
    } catch (err) {
      const errorMessage = err.response?.data?.detail ||
                           (Array.isArray(err.response?.data) && err.response?.data.map(e => e.msg || (typeof e === 'string' ? e : JSON.stringify(e))).join(', ')) ||
                           err.message ||
                           (currentUser ? 'Falha ao atualizar usuário.' : 'Falha ao criar usuário.');
      setError(errorMessage);
      console.error("Form Submit Usuario Error:", err.response?.data || err.message || err);
    } finally {
      setIsLoadingForm(false);
    }
  };

  const handleFormCancel = () => {
    setShowFormModal(false);
    setCurrentUser(null);
    setError(null); // Clear form-specific errors
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold text-gray-800">Gestão de Usuários</h1>
          <button
            onClick={() => setShowHelpModal(true)}
            className="ml-4 p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
            title="Ajuda sobre Permissões"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
          </button>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-4 focus:ring-primary-300 disabled:bg-primary-300"
        >
          Adicionar Novo Usuário
        </button>
      </div>

      {error && !showFormModal && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Erro: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <UsuariosTable
        users={users}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      {/* Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"> {/* Adjusted max-w-lg for user form */}
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              {currentUser ? 'Editar Usuário' : 'Adicionar Novo Usuário'}
            </h2>
            {error && ( // Display error specific to form submission attempt
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Erro: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
            <UsuarioForm
              initialData={currentUser}
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
            <p className="mb-6">Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isLoading} // Main isLoading as delete affects table
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md focus:ring-4 focus:outline-none focus:ring-gray-300 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={isLoading} // Main isLoading
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md focus:ring-4 focus:outline-none focus:ring-red-300 disabled:opacity-50"
              >
                {isLoading ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Níveis de Permissão</h2>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-full hover:bg-gray-200"
                title="Fechar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="text-sm text-gray-700 space-y-3">
              <p><strong>Administrador (admin):</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Acesso total a todas as funcionalidades do sistema.</li>
                <li>Pode gerenciar obras, finanças, equipes, materiais.</li>
                <li>Pode gerenciar usuários (criar, editar, excluir, definir nível de acesso).</li>
                <li>Pode visualizar todos os relatórios.</li>
              </ul>
              <p><strong>Gerente (gerente):</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Acesso limitado às funcionalidades operacionais e de gerenciamento de obras.</li>
                <li>Pode criar e gerenciar obras, compras, despesas, alocações, ocorrências.</li>
                <li>Pode visualizar relatórios relevantes à gestão de obras.</li>
                <li>Não pode gerenciar usuários ou acessar configurações administrativas do sistema.</li>
              </ul>
            </div>
            <div className="mt-6 text-right">
              <button
                onClick={() => setShowHelpModal(false)}
                className="py-2 px-4 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuariosPage;
