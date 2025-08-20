import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../services/api';
import { FileText, Image, FileIcon, Trash2, Download } from 'lucide-react';

function ObraGaleria({ obraId, newArquivo }) {
  const [arquivos, setArquivos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedArquivo, setSelectedArquivo] = useState(null); // For modal view
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchArquivos = useCallback(async () => {
    if (!obraId) return;
    setIsLoading(true);
    setError('');
    try {
      const response = await apiClient.get(`/arquivos-obra/?obra=${obraId}`);
      // Ajuste para acessar a lista de resultados se a API estiver paginada
      const arquivosData = response.data.results || response.data || [];
      setArquivos(Array.isArray(arquivosData) ? arquivosData : []);
    } catch (err) {
      console.error(
        'Erro ao buscar arquivos:',
        err.response ? err.response.data : err.message
      );
      setError(
        'Não foi possível carregar os arquivos. Tente recarregar a página.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [obraId]);

  useEffect(() => {
    fetchArquivos();
  }, [fetchArquivos]);

  // Effect to add newArquivo to the list when it's uploaded
  useEffect(() => {
    if (newArquivo && newArquivo.obra === parseInt(obraId)) {
      setArquivos(prevArquivos => [newArquivo, ...prevArquivos]);
    }
  }, [newArquivo, obraId]);

  const openModal = arquivo => {
    setSelectedArquivo(arquivo);
  };

  const closeModal = () => {
    setSelectedArquivo(null);
  };

  const handleDeleteClick = (arquivo) => {
    setDeleteConfirm(arquivo);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    try {
      await apiClient.delete(`/arquivos-obra/${deleteConfirm.id}/`);
      setArquivos(prev => prev.filter(a => a.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Erro ao deletar arquivo:', err);
      alert('Erro ao deletar arquivo. Tente novamente.');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  const getFileIcon = (arquivo) => {
    if (arquivo.tipo_arquivo?.startsWith('image/')) {
      return <Image className="h-8 w-8 text-blue-500" />;
    } else if (arquivo.tipo_arquivo === 'application/pdf') {
      return <FileText className="h-8 w-8 text-red-500" />;
    } else {
      return <FileIcon className="h-8 w-8 text-gray-500" />;
    }
  };

  const isImage = (arquivo) => {
    return arquivo.tipo_arquivo?.startsWith('image/');
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!obraId) {
    return (
      <p className="text-gray-600 dark:text-gray-400">
        ID da Obra não especificado para carregar a galeria.
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <svg
          className="animate-spin h-8 w-8 text-blue-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <p className="ml-3 text-gray-700 dark:text-gray-300">
          Carregando arquivos...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-600 rounded-md text-center">
        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        <button
          onClick={fetchArquivos}
          className="mt-2 px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded hover:bg-red-700"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (arquivos.length === 0 && !isLoading && !error) {
    return (
      <div className="my-6 p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          Nenhum arquivo adicionado ainda.
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Seja o primeiro a adicionar um arquivo para esta obra!
        </p>
      </div>
    );
  }

  // Group files by category
  const groupedArquivos = (arquivos || []).reduce((acc, arquivo) => {
    const categoria = arquivo.categoria || 'OUTROS';
    if (!acc[categoria]) acc[categoria] = [];
    acc[categoria].push(arquivo);
    return acc;
  }, {});

  const categoryLabels = {
    'FOTO': 'Fotos',
    'DOCUMENTO': 'Documentos',
    'PLANTA': 'Plantas',
    'CONTRATO': 'Contratos',
    'LICENCA': 'Licenças',
    'OUTROS': 'Outros'
  };

  return (
    <div className="my-6">
      <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-4">
        Arquivos da Obra
      </h3>
      
      {Object.entries(groupedArquivos).map(([categoria, arquivosCategoria]) => (
        <div key={categoria} className="mb-8">
          <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">
            {categoryLabels[categoria]} ({arquivosCategoria.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {arquivosCategoria.map((arquivo) => (
              <div
                key={arquivo.id}
                className="group relative border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out bg-white dark:bg-gray-800"
              >
                {isImage(arquivo) ? (
                  <img
                    src={arquivo.arquivo_url}
                    alt={arquivo.descricao || `Arquivo da obra ${obraId}`}
                    className="w-full h-48 object-cover cursor-pointer"
                    onClick={() => openModal(arquivo)}
                  />
                ) : (
                  <div 
                    className="w-full h-48 flex flex-col items-center justify-center cursor-pointer bg-gray-50 dark:bg-gray-700"
                    onClick={() => openModal(arquivo)}
                  >
                    {getFileIcon(arquivo)}
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 text-center px-2 truncate">
                      {arquivo.arquivo_nome}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(arquivo.arquivo_tamanho)}
                    </p>
                  </div>
                )}
                
                {/* Action buttons */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-1">
                  <a
                    href={arquivo.arquivo_url}
                    download={arquivo.arquivo_nome}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded-full shadow-lg"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(arquivo);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white p-1 rounded-full shadow-lg"
                    title="Deletar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                {/* File info overlay */}
                {arquivo.descricao && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="truncate">{arquivo.descricao}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Confirmar Exclusão
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Tem certeza que deseja excluir o arquivo "{deleteConfirm.arquivo_nome}"? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedArquivo && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="relative bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            {isImage(selectedArquivo) ? (
              <img
                src={selectedArquivo.arquivo_url}
                alt={selectedArquivo.descricao || 'Arquivo da obra em tamanho maior'}
                className="max-w-full max-h-[80vh] object-contain rounded"
              />
            ) : selectedArquivo.tipo_arquivo === 'application/pdf' ? (
              <div className="w-full h-[80vh]">
                <iframe
                  src={selectedArquivo.arquivo_url}
                  className="w-full h-full rounded"
                  title={selectedArquivo.arquivo_nome}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8">
                {getFileIcon(selectedArquivo)}
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                  {selectedArquivo.arquivo_nome}
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Tamanho: {formatFileSize(selectedArquivo.arquivo_tamanho)}
                </p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Tipo: {selectedArquivo.tipo_arquivo}
                </p>
                <a
                  href={selectedArquivo.arquivo_url}
                  download={selectedArquivo.arquivo_nome}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </a>
              </div>
            )}
            
            {selectedArquivo.descricao && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <strong>Descrição:</strong> {selectedArquivo.descricao}
                </p>
              </div>
            )}
            
            <div className="mt-4 flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
              <span>Categoria: {categoryLabels[selectedArquivo.categoria] || 'Outros'}</span>
              <span>Enviado em: {new Date(selectedArquivo.uploaded_at).toLocaleDateString('pt-BR')}</span>
            </div>
            
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 bg-white dark:bg-gray-700 rounded-full p-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
              aria-label="Fechar modal"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ObraGaleria;
