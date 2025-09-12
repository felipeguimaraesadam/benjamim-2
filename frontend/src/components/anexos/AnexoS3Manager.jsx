import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import * as api from '../../services/api';
import { formatDateToDMY } from '../../utils/dateUtils';
import SpinnerIcon from '../utils/SpinnerIcon';
import { 
  FiUpload, 
  FiDownload, 
  FiTrash2, 
  FiFile, 
  FiImage, 
  FiFileText, 
  FiFilm, 
  FiMusic,
  FiArchive,
  FiHardDrive,
  FiCloud,
  FiEye
} from 'react-icons/fi';

const AnexoS3Manager = ({ entityType, entityId, onAnexosChange }) => {
  const [anexos, setAnexos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [storageInfo, setStorageInfo] = useState(null);
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchAnexos();
    fetchStorageInfo();
  }, [entityType, entityId]);

  // Função para verificar se o arquivo é uma imagem
  const isImageFile = (filename) => {
    if (!filename) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  const fetchAnexos = async () => {
    try {
      setIsLoading(true);
      const params = {};
      if (entityType && entityId) {
        params.entity_type = entityType;
        params.entity_id = entityId;
      }
      const response = await api.getAnexosS3(params);
      
      // Verificar se a resposta tem a estrutura esperada
      let anexosList = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          anexosList = response.data;
        } else if (response.data.anexos && Array.isArray(response.data.anexos)) {
          anexosList = response.data.anexos;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          anexosList = response.data.results;
        }
      }
      
      setAnexos(anexosList);
      if (onAnexosChange) {
        onAnexosChange(anexosList);
      }
    } catch (err) {
      console.error('Erro ao carregar anexos:', err);
      
      // Tratamento de erro mais específico
      let errorMsg = 'Erro ao carregar anexos';
      if (err.response?.status === 401) {
        errorMsg = 'Não autorizado. Faça login novamente.';
      } else if (err.response?.status === 403) {
        errorMsg = 'Sem permissão para acessar anexos.';
      } else if (err.response?.status === 404) {
        errorMsg = 'Endpoint de anexos não encontrado.';
      } else if (err.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      }
      
      toast.error(errorMsg);
      setAnexos([]); // Limpar lista em caso de erro
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStorageInfo = async () => {
    try {
      const response = await api.getS3Statistics();
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
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });
      if (entityType) {
        formData.append('entity_type', entityType);
      }
      if (entityId) {
        formData.append('entity_id', entityId);
      }

      // Configuração correta para axios com progress
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        },
      };

      const response = await api.uploadAnexoS3(formData);

      toast.success(`${selectedFiles.length} arquivo(s) enviado(s) com sucesso!`);
      setSelectedFiles([]);
      setShowUploadModal(false);
      
      // Aguardar um pouco antes de recarregar para garantir que o backend processou
      setTimeout(async () => {
        await fetchAnexos();
        await fetchStorageInfo();
      }, 500);
    } catch (err) {
      console.error('Erro ao fazer upload:', err);
      let errorMsg = 'Erro ao fazer upload dos arquivos';
      
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMsg = err.response.data;
        } else if (err.response.data.error) {
          errorMsg = err.response.data.error;
        } else if (err.response.data.detail) {
          errorMsg = err.response.data.detail;
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      
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
      // Remover imediatamente da lista local para feedback visual rápido
      const anexoToDelete = anexos.find(anexo => anexo.anexo_id === anexoId);
      setAnexos(prevAnexos => prevAnexos.filter(anexo => anexo.anexo_id !== anexoId));
      
      await api.deleteAnexoS3(anexoId);
      toast.success('Anexo excluído com sucesso!');
      
      // Recarregar dados do servidor para garantir sincronização
      setTimeout(async () => {
        await fetchAnexos();
        await fetchStorageInfo();
      }, 300);
    } catch (err) {
      console.error('Erro ao excluir anexo:', err);
      let errorMsg = 'Erro ao excluir anexo';
      
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMsg = err.response.data;
        } else if (err.response.data.error) {
          errorMsg = err.response.data.error;
        } else if (err.response.data.detail) {
          errorMsg = err.response.data.detail;
        }
      }
      
      toast.error(errorMsg);
      // Recarregar a lista em caso de erro para restaurar o estado correto
      fetchAnexos();
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
      link.target = '_blank'; // Abrir em nova aba
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
      const response = await api.migrateAnexosToS3();
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

  // Função para abrir preview de imagem
  const handleImagePreview = (anexo) => {
    if (isImageFile(anexo.filename)) {
      setPreviewImage({
        url: `/api/anexos-s3/${anexo.anexo_id}/preview/`,
        name: anexo.filename
      });
      setShowPreview(true);
    }
  };

  // Função para fechar preview
  const closePreview = () => {
    setShowPreview(false);
    setPreviewImage(null);
  };

  // Função para obter informações de anexação
  const getAttachmentInfo = (anexo) => {
    const typeMap = {
      'compra': 'Compra',
      'obra': 'Obra', 
      'despesa': 'Despesa',
      'geral': 'Geral'
    };
    
    const typeName = typeMap[anexo.anexo_type] || anexo.anexo_type || 'Não especificado';
    const objectId = anexo.object_id || 'N/A';
    
    return `${typeName} #${objectId}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (filename) => {
    if (!filename || typeof filename !== 'string') {
      return '📎'; // Ícone padrão se filename for inválido
    }
    
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
            <div key={anexo.anexo_id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {isImageFile(anexo.filename) && anexo.download_url ? (
                      <div className="relative">
                        <img
                          src={anexo.download_url}
                          alt={anexo.filename}
                          className="w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleImagePreview(anexo)}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <div className="w-12 h-12 flex items-center justify-center" style={{display: 'none'}}>
                          {getFileIcon(anexo.filename)}
                        </div>
                      </div>
                    ) : (
                      getFileIcon(anexo.filename)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {anexo.filename}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatFileSize(anexo.file_size)}</span>
                      <span>{formatDateToDMY(anexo.uploaded_at)}</span>
                      <span className="flex items-center space-x-1">
                        {anexo.s3_key ? (
                          <>
                            <FiCloud className="w-3 h-3" />
                            <span>S3</span>
                          </>
                        ) : (
                          <>
                            <FiHardDrive className="w-3 h-3" />
                            <span>Local</span>
                          </>
                        )}
                      </span>
                      {(anexo.anexo_type || anexo.object_id) && (
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs">
                          {getAttachmentInfo(anexo)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {isImageFile(anexo.filename) && (
                    <button
                      onClick={() => handleImagePreview(anexo)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                      title="Visualizar"
                    >
                      <FiEye className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDownload(anexo.anexo_id, anexo.filename)}
                    className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 p-1"
                    title="Download"
                  >
                    <FiDownload className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(anexo.anexo_id)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1"
                    title="Excluir"
                  >
                    <FiTrash2 className="w-4 h-4" />
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

      {/* Modal de Preview de Imagem */}
      {showPreview && previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center" onClick={closePreview}>
          <div className="relative max-w-4xl max-h-full p-4">
            <button
              onClick={closePreview}
              className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={previewImage.url}
              alt={previewImage.name}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-2 left-2 right-2 text-white bg-black bg-opacity-50 p-2 rounded text-center">
              {previewImage.name}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnexoS3Manager;