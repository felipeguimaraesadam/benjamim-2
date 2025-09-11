import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import * as api from '../../services/api';
import { formatDateToDMY } from '../../utils/dateUtils';
import SpinnerIcon from '../utils/SpinnerIcon';

const AnexoS3Manager = ({ entityType, entityId, onAnexosChange }) => {
  const [anexos, setAnexos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [storageInfo, setStorageInfo] = useState(null);
  const [migrationStatus, setMigrationStatus] = useState(null);

  useEffect(() => {
    if (entityType && entityId) {
      fetchAnexos();
      fetchStorageInfo();
    }
  }, [entityType, entityId]);

  const fetchAnexos = async () => {
    try {
      setIsLoading(true);
      const response = await api.getAnexosS3(entityType, entityId);
      setAnexos(response.data.anexos || []);
      if (onAnexosChange) {
        onAnexosChange(response.data.anexos || []);
      }
    } catch (err) {
      console.error('Erro ao carregar anexos:', err);
      toast.error('Erro ao carregar anexos');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStorageInfo = async () => {
    try {
      const response = await api.getS3StorageInfo();
      setStorageInfo(response.data);
    } catch (err) {
      console.error('Erro ao carregar informações de armazenamento:', err);
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
    if (files.length > 0) {
      setShowUploadModal(true);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      selectedFiles.forEach((file, index) => {
        formData.append(`files`, file);
      });
      formData.append('entity_type', entityType);
      formData.append('entity_id', entityId);

      const response = await api.uploadAnexosS3(formData, {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        },
      });

      toast.success(`${selectedFiles.length} arquivo(s) enviado(s) com sucesso!`);
      setSelectedFiles([]);
      setShowUploadModal(false);
      await fetchAnexos();
      await fetchStorageInfo();
    } catch (err) {
      console.error('Erro ao fazer upload:', err);
      const errorMsg = err.response?.data?.error || 'Erro ao fazer upload dos arquivos';
      toast.error(errorMsg);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (anexoId) => {
    if (!window.confirm('Tem certeza que deseja excluir este anexo?')) {
      return;
    }

    try {
      await api.deleteAnexoS3(anexoId);
      toast.success('Anexo excluído com sucesso!');
      await fetchAnexos();
      await fetchStorageInfo();
    } catch (err) {
      console.error('Erro ao excluir anexo:', err);
      const errorMsg = err.response?.data?.error || 'Erro ao excluir anexo';
      toast.error(errorMsg);
    }
  };

  const handleDownload = async (anexoId, filename) => {
    try {
      const response = await api.downloadAnexoS3(anexoId);
      
      // Criar um link temporário para download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Download iniciado!');
    } catch (err) {
      console.error('Erro ao fazer download:', err);
      const errorMsg = err.response?.data?.error || 'Erro ao fazer download do arquivo';
      toast.error(errorMsg);
    }
  };

  const handleMigrateToS3 = async () => {
    if (!window.confirm('Deseja migrar todos os anexos locais para o S3? Esta operação pode demorar alguns minutos.')) {
      return;
    }

    try {
      setMigrationStatus('running');
      const response = await api.migrateAnexosToS3(entityType, entityId);
      setMigrationStatus('completed');
      toast.success(`Migração concluída! ${response.data.migrated_count} arquivos migrados.`);
      await fetchAnexos();
      await fetchStorageInfo();
    } catch (err) {
      console.error('Erro na migração:', err);
      setMigrationStatus('error');
      const errorMsg = err.response?.data?.error || 'Erro durante a migração';
      toast.error(errorMsg);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      default:
        return '📎';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Anexos S3
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Gerenciar arquivos no Amazon S3
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {storageInfo && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <span>Usado: {formatFileSize(storageInfo.used_storage)}</span>
              {storageInfo.total_files > 0 && (
                <span className="ml-2">({storageInfo.total_files} arquivos)</span>
              )}
            </div>
          )}
          <button
            onClick={handleMigrateToS3}
            disabled={migrationStatus === 'running'}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-3 rounded-md text-sm disabled:opacity-50"
            title="Migrar anexos locais para S3"
          >
            {migrationStatus === 'running' ? (
              <>
                <SpinnerIcon className="w-4 h-4 mr-1" />
                Migrando...
              </>
            ) : (
              '🔄 Migrar'
            )}
          </button>
          <label className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md cursor-pointer flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>Upload</span>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="*/*"
            />
          </label>
        </div>
      </div>

      {/* Modal de Upload */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Confirmar Upload</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                Arquivos selecionados ({selectedFiles.length}):
              </p>
              <div className="max-h-32 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="text-xs text-gray-500 dark:text-gray-400 py-1">
                    {getFileIcon(file.name)} {file.name} ({formatFileSize(file.size)})
                  </div>
                ))}
              </div>
            </div>
            
            {isUploading && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                  <span>Progresso do upload</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFiles([]);
                }}
                disabled={isUploading}
                className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="px-4 py-2 rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <SpinnerIcon className="w-4 h-4" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <span>Confirmar Upload</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Anexos */}
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <SpinnerIcon className="w-6 h-6" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Carregando anexos...</span>
        </div>
      ) : anexos.length === 0 ? (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            Nenhum anexo encontrado
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Faça upload de arquivos para começar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {anexos.map((anexo) => (
            <div key={anexo.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getFileIcon(anexo.filename)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {anexo.filename}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(anexo.file_size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleDownload(anexo.id, anexo.filename)}
                    className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 p-1"
                    title="Download"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(anexo.id)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1"
                    title="Excluir"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <p>Enviado: {formatDateToDMY(anexo.uploaded_at)}</p>
                {anexo.s3_key && (
                  <p className="text-green-600 dark:text-green-400">✓ Armazenado no S3</p>
                )}
                {anexo.local_path && !anexo.s3_key && (
                  <p className="text-yellow-600 dark:text-yellow-400">⚠ Armazenado localmente</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnexoS3Manager;