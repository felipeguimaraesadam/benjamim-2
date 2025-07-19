import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import * as api from '../services/api';
import { formatDateToDMY } from '../utils/dateUtils';
import SpinnerIcon from '../components/utils/SpinnerIcon';

const BackupPage = () => {
  const [backups, setBackups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [backupDescription, setBackupDescription] = useState('');
  const [error, setError] = useState(null);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [lastAutoBackup, setLastAutoBackup] = useState(null);

  useEffect(() => {
    fetchBackups();
    fetchBackupSettings();
  }, []);

  const fetchBackups = async () => {
    try {
      setIsLoading(true);
      const response = await api.getBackups();
      setBackups(response.data.backups || []);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar backups:', err);
      setError('Falha ao carregar lista de backups.');
      toast.error('Erro ao carregar backups');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBackupSettings = async () => {
    try {
      const response = await api.getBackupSettings();
      setAutoBackupEnabled(response.data.auto_backup_enabled || false);
      setLastAutoBackup(response.data.last_auto_backup || null);
    } catch (err) {
      console.error('Erro ao carregar configurações de backup:', err);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setIsCreatingBackup(true);
      setError(null);
      const response = await api.createBackup({ description: backupDescription });
      toast.success('Backup criado com sucesso!');
      await fetchBackups(); // Recarregar lista
      setShowCreateModal(false);
      setBackupDescription('');
    } catch (err) {
      console.error('Erro ao criar backup:', err);
      const errorMsg = err.response?.data?.error || 'Falha ao criar backup.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;
    
    try {
      setIsRestoringBackup(true);
      setError(null);
      await api.restoreBackup(selectedBackup.id);
      toast.success('Backup restaurado com sucesso! O sistema foi atualizado.');
      setShowRestoreConfirm(false);
      setSelectedBackup(null);
      // Recarregar a página para refletir as mudanças
      window.location.reload();
    } catch (err) {
      console.error('Erro ao restaurar backup:', err);
      const errorMsg = err.response?.data?.error || 'Falha ao restaurar backup.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsRestoringBackup(false);
    }
  };

  const handleDeleteBackup = async (backupId) => {
    if (!window.confirm('Tem certeza que deseja excluir este backup? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await api.deleteBackup(backupId);
      toast.success('Backup excluído com sucesso!');
      await fetchBackups();
    } catch (err) {
      console.error('Erro ao excluir backup:', err);
      const errorMsg = err.response?.data?.error || 'Falha ao excluir backup.';
      toast.error(errorMsg);
    }
  };

  const handleToggleAutoBackup = async () => {
    try {
      const newStatus = !autoBackupEnabled;
      await api.updateBackupSettings({ auto_backup_enabled: newStatus });
      setAutoBackupEnabled(newStatus);
      toast.success(`Backup automático ${newStatus ? 'ativado' : 'desativado'} com sucesso!`);
    } catch (err) {
      console.error('Erro ao atualizar configurações:', err);
      toast.error('Falha ao atualizar configurações de backup.');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const openRestoreConfirm = (backup) => {
    setSelectedBackup(backup);
    setShowRestoreConfirm(true);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Gerenciamento de Backup</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gerencie backups do banco de dados para proteger seus dados
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={isCreatingBackup}
          className="bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isCreatingBackup ? (
            <>
              <SpinnerIcon />
              <span>Criando...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Criar Backup</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 dark:border-red-400 text-red-700 dark:text-red-200 p-4 mb-6" role="alert">
          <p className="font-bold">Erro</p>
          <p>{error}</p>
        </div>
      )}

      {/* Configurações de Backup Automático */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Configurações</h2>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">Backup Automático Diário</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {autoBackupEnabled 
                ? 'Backups são criados automaticamente todos os dias às 02:00'
                : 'Backup automático está desativado'
              }
            </p>
            {lastAutoBackup && (
              <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
                Último backup automático: {formatDateToDMY(lastAutoBackup)}
              </p>
            )}
          </div>
          <button
            onClick={handleToggleAutoBackup}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              autoBackupEnabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                autoBackupEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Lista de Backups */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Criar Backup Manual</h3>
            <p className="mb-4 text-gray-600 dark:text-gray-300">Adicione uma descrição opcional para este backup.</p>
            <textarea
              value={backupDescription}
              onChange={(e) => setBackupDescription(e.target.value)}
              className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Ex: Backup antes da atualização X"
              rows={3}
            />
            <div className="flex justify-end mt-4 space-x-2">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">Cancelar</button>
              <button onClick={handleCreateBackup} disabled={isCreatingBackup} className="px-4 py-2 rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50">
                {isCreatingBackup ? 'Criando...' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRestoreConfirm && selectedBackup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg">
            <h3 className="text-xl font-bold text-yellow-500 mb-4">Confirmar Restauração</h3>
            <p className="mb-2">Você está prestes a restaurar o sistema para o estado do backup:</p>
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md mb-4">
              <p><strong>Arquivo:</strong> {selectedBackup.filename}</p>
              <p><strong>Data:</strong> {formatDateToDMY(selectedBackup.created_at)}</p>
              <p><strong>Tamanho:</strong> {formatFileSize(selectedBackup.size_bytes)}</p>
              <p><strong>Tipo:</strong> <span className={`font-semibold ${selectedBackup.tipo === 'manual' ? 'text-blue-500' : 'text-green-500'}`}>{selectedBackup.tipo === 'manual' ? 'Manual' : 'Automático'}</span></p>
              {selectedBackup.description && <p><strong>Descrição:</strong> {selectedBackup.description}</p>}
            </div>
            <p className="text-red-600 dark:text-red-400 font-semibold">Atenção: Todos os dados atuais serão substituídos por este backup. Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end mt-6 space-x-2">
              <button onClick={() => setShowRestoreConfirm(false)} className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">Cancelar</button>
              <button onClick={handleRestoreBackup} disabled={isRestoringBackup} className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50">
                {isRestoringBackup ? 'Restaurando...' : 'Confirmar e Restaurar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Backups Disponíveis</h2>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <SpinnerIcon className="w-8 h-8" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Carregando backups...</span>
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m0 0l-4-4m4 4V3" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Nenhum backup encontrado</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Comece criando seu primeiro backup.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Nome do Arquivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Data de Criação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tamanho
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {backups.map((backup) => (
                  <tr key={backup.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {backup.filename}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDateToDMY(backup.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatFileSize(backup.size_bytes)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        backup.tipo === 'manual' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {backup.tipo === 'manual' ? 'Manual' : 'Automático'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => openRestoreConfirm(backup)}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                        title="Restaurar backup"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteBackup(backup.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Excluir backup"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Restauração */}
      {showRestoreConfirm && selectedBackup && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
                  <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Confirmar Restauração de Backup
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Tem certeza que deseja restaurar o backup <strong>{selectedBackup.filename}</strong>?
                </p>
                <div className="bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-400 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700 dark:text-yellow-200">
                        <strong>Atenção:</strong> Esta ação irá substituir todos os dados atuais pelos dados do backup. 
                        Dados criados após a data do backup serão perdidos.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRestoreConfirm(false);
                    setSelectedBackup(null);
                  }}
                  className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium py-2 px-4 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRestoreBackup}
                  disabled={isRestoringBackup}
                  className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isRestoringBackup ? (
                    <>
                      <SpinnerIcon />
                      <span>Restaurando...</span>
                    </>
                  ) : (
                    <span>Confirmar Restauração</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupPage;