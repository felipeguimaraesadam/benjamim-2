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
        <h1 className="text-3xl font-bold text-gray-800">Gestão de Usuários</h1>
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
    </div>
  );
};

export default UsuariosPage;
