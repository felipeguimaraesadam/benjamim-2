import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import * as api from '../../services/api';
import { formatDateToDMY } from '../../utils/dateUtils';
import SpinnerIcon from '../utils/SpinnerIcon';

const BranchManager = () => {
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [newBranch, setNewBranch] = useState({
    name: '',
    description: '',
    base_branch: 'main'
  });
  const [mergeData, setMergeData] = useState({
    source_branch: '',
    target_branch: 'main',
    merge_message: ''
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setIsLoading(true);
      const response = await api.getBranches();
      setBranches(response.data.branches || []);
    } catch (err) {
      console.error('Erro ao carregar branches:', err);
      toast.error('Erro ao carregar branches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBranch = async () => {
    try {
      setIsCreatingBranch(true);
      await api.createBranch(newBranch);
      toast.success('Branch criada com sucesso!');
      setShowBranchModal(false);
      setNewBranch({ name: '', description: '', base_branch: 'main' });
      await fetchBranches();
    } catch (err) {
      console.error('Erro ao criar branch:', err);
      const errorMsg = err.response?.data?.error || 'Erro ao criar branch';
      toast.error(errorMsg);
    } finally {
      setIsCreatingBranch(false);
    }
  };

  const handleDeleteBranch = async (branchName) => {
    if (!window.confirm(`Tem certeza que deseja excluir a branch "${branchName}"?`)) {
      return;
    }

    try {
      await api.deleteBranch(branchName);
      toast.success('Branch excluída com sucesso!');
      await fetchBranches();
    } catch (err) {
      console.error('Erro ao excluir branch:', err);
      const errorMsg = err.response?.data?.error || 'Erro ao excluir branch';
      toast.error(errorMsg);
    }
  };

  const handleMergeBranch = async () => {
    try {
      setIsMerging(true);
      await api.mergeBranch(mergeData);
      toast.success('Merge realizado com sucesso!');
      setShowMergeModal(false);
      setMergeData({ source_branch: '', target_branch: 'main', merge_message: '' });
      await fetchBranches();
    } catch (err) {
      console.error('Erro ao fazer merge:', err);
      const errorMsg = err.response?.data?.error || 'Erro ao fazer merge';
      toast.error(errorMsg);
    } finally {
      setIsMerging(false);
    }
  };

  const handleSwitchBranch = async (branchName) => {
    try {
      await api.switchBranch(branchName);
      toast.success(`Mudou para a branch "${branchName}"`);
      await fetchBranches();
    } catch (err) {
      console.error('Erro ao mudar branch:', err);
      const errorMsg = err.response?.data?.error || 'Erro ao mudar branch';
      toast.error(errorMsg);
    }
  };

  const getBranchStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'merged':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'stale':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'protected':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getBranchIcon = (branch) => {
    if (branch.is_current) return '🌟';
    if (branch.is_protected) return '🔒';
    if (branch.status === 'merged') return '✅';
    if (branch.ahead_count > 0) return '⬆️';
    if (branch.behind_count > 0) return '⬇️';
    return '🌿';
  };

  const formatCommitHash = (hash) => {
    return hash ? hash.substring(0, 8) : 'N/A';
  };

  return (
    <div className="space-y-6">
      {/* Header com Ações */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Gerenciamento de Branches
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie branches do repositório, crie novas branches e faça merges
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => setShowMergeModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span>Merge</span>
            </button>
            
            <button
              onClick={() => setShowBranchModal(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Nova Branch</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Nova Branch */}
      {showBranchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Criar Nova Branch</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome da Branch
                </label>
                <input
                  type="text"
                  value={newBranch.name}
                  onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="feature/nova-funcionalidade"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Branch Base
                </label>
                <select
                  value={newBranch.base_branch}
                  onChange={(e) => setNewBranch({ ...newBranch, base_branch: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {branches.map((branch) => (
                    <option key={branch.name} value={branch.name}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição
                </label>
                <textarea
                  value={newBranch.description}
                  onChange={(e) => setNewBranch({ ...newBranch, description: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Descrição da branch..."
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowBranchModal(false);
                  setNewBranch({ name: '', description: '', base_branch: 'main' });
                }}
                disabled={isCreatingBranch}
                className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateBranch}
                disabled={isCreatingBranch || !newBranch.name.trim()}
                className="px-4 py-2 rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {isCreatingBranch ? (
                  <>
                    <SpinnerIcon className="w-4 h-4" />
                    <span>Criando...</span>
                  </>
                ) : (
                  <span>Criar Branch</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Merge */}
      {showMergeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Fazer Merge</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Branch Origem
                </label>
                <select
                  value={mergeData.source_branch}
                  onChange={(e) => setMergeData({ ...mergeData, source_branch: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Selecione a branch origem</option>
                  {branches.filter(b => !b.is_current).map((branch) => (
                    <option key={branch.name} value={branch.name}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Branch Destino
                </label>
                <select
                  value={mergeData.target_branch}
                  onChange={(e) => setMergeData({ ...mergeData, target_branch: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {branches.map((branch) => (
                    <option key={branch.name} value={branch.name}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mensagem do Merge
                </label>
                <textarea
                  value={mergeData.merge_message}
                  onChange={(e) => setMergeData({ ...mergeData, merge_message: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Mensagem do merge..."
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowMergeModal(false);
                  setMergeData({ source_branch: '', target_branch: 'main', merge_message: '' });
                }}
                disabled={isMerging}
                className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleMergeBranch}
                disabled={isMerging || !mergeData.source_branch || !mergeData.target_branch}
                className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {isMerging ? (
                  <>
                    <SpinnerIcon className="w-4 h-4" />
                    <span>Fazendo Merge...</span>
                  </>
                ) : (
                  <span>Fazer Merge</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Branches */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Branches do Repositório
          </h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <SpinnerIcon className="w-8 h-8" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Carregando branches...</span>
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              Nenhuma branch encontrada
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Crie uma nova branch para começar.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Último Commit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Commits
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {branches.map((branch) => (
                  <tr key={branch.name} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${branch.is_current ? 'bg-green-50 dark:bg-green-900' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getBranchIcon(branch)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {branch.name}
                            {branch.is_current && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Atual
                              </span>
                            )}
                          </div>
                          {branch.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {branch.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBranchStatusColor(branch.status)}`}>
                        {branch.status.toUpperCase()}
                      </span>
                      {branch.is_protected && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          Protegida
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {formatCommitHash(branch.last_commit_hash)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {branch.last_commit_date ? formatDateToDMY(branch.last_commit_date) : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex space-x-2">
                        {branch.ahead_count > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            +{branch.ahead_count}
                          </span>
                        )}
                        {branch.behind_count > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            -{branch.behind_count}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {!branch.is_current && (
                        <button
                          onClick={() => handleSwitchBranch(branch.name)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Mudar para esta branch"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        </button>
                      )}
                      {!branch.is_protected && branch.name !== 'main' && branch.name !== 'master' && (
                        <button
                          onClick={() => handleDeleteBranch(branch.name)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Excluir branch"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedBranch(branch)}
                        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                        title="Ver detalhes"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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

      {/* Modal de Detalhes da Branch */}
      {selectedBranch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-96 overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold">Detalhes da Branch</h3>
              <button
                onClick={() => setSelectedBranch(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome</label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 flex items-center">
                    {getBranchIcon(selectedBranch)} {selectedBranch.name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBranchStatusColor(selectedBranch.status)}`}>
                    {selectedBranch.status.toUpperCase()}
                  </span>
                </div>
              </div>
              
              {selectedBranch.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{selectedBranch.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Último Commit</label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{formatCommitHash(selectedBranch.last_commit_hash)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data do Último Commit</label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {selectedBranch.last_commit_date ? formatDateToDMY(selectedBranch.last_commit_date) : 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Commits à Frente</label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{selectedBranch.ahead_count || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Commits Atrás</label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{selectedBranch.behind_count || 0}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {selectedBranch.is_current && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    🌟 Branch Atual
                  </span>
                )}
                {selectedBranch.is_protected && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    🔒 Protegida
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 dark:text-gray-400">
                <div>
                  <label className="block font-medium">Criada em</label>
                  <p>{selectedBranch.created_at ? formatDateToDMY(selectedBranch.created_at) : 'N/A'}</p>
                </div>
                <div>
                  <label className="block font-medium">Atualizada em</label>
                  <p>{selectedBranch.updated_at ? formatDateToDMY(selectedBranch.updated_at) : 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchManager;