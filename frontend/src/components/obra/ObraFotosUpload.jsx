import React, { useState, useRef } from 'react';
import { apiClient } from '../../services/api';

function ObraFotosUpload({ obraId, onUploadSuccess }) {
  const [arquivo, setArquivo] = useState(null);
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('FOTO');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const categorias = [
    { value: 'FOTO', label: 'Foto' },
    { value: 'DOCUMENTO', label: 'Documento' },
    { value: 'PLANTA', label: 'Planta/Projeto' },
    { value: 'CONTRATO', label: 'Contrato' },
    { value: 'LICENCA', label: 'Licença' },
    { value: 'OUTROS', label: 'Outros' },
  ];

  const acceptedFileTypes = {
    'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-powerpoint': ['.ppt'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    'text/plain': ['.txt'],
    'application/rtf': ['.rtf']
  };

  const getAcceptString = () => {
    return Object.keys(acceptedFileTypes).join(',');
  };

  const validateFileType = (file) => {
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    const isValidType = Object.values(acceptedFileTypes).some(extensions => 
      extensions.includes(fileExtension)
    );
    return isValidType;
  };

  const validateFileSize = (file) => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    return file.size <= maxSize;
  };

  const handleFileChange = event => {
    const file = event.target.files[0];
    if (file) {
      if (!validateFileType(file)) {
        setError('Tipo de arquivo não suportado. Selecione um arquivo válido.');
        setArquivo(null);
        return;
      }
      if (!validateFileSize(file)) {
        setError('Arquivo muito grande. O tamanho máximo é 50MB.');
        setArquivo(null);
        return;
      }
      setArquivo(file);
      setError('');
      setSuccessMessage('');
    }
  };

  const handleCategoriaChange = event => {
    setCategoria(event.target.value);
  };

  const handleDescricaoChange = event => {
    setDescricao(event.target.value);
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (!arquivo) {
      setError('Por favor, selecione um arquivo.');
      return;
    }
    if (!obraId) {
      setError(
        'ID da Obra não fornecido. Recarregue a página ou contate o suporte.'
      );
      return;
    }

    const formData = new FormData();

    // Generate a shorter, unique filename on the client-side
    const fileExtension = arquivo.name.split('.').pop();
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
    const renamedFile = new File([arquivo], uniqueName, { type: arquivo.type });

    formData.append('arquivo', renamedFile);
    formData.append('descricao', descricao);
    formData.append('categoria', categoria);
    formData.append('obra', obraId);

    setIsUploading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await apiClient.post('/arquivos-obra/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccessMessage(
        `Arquivo "${response.data.nome_original}" enviado com sucesso!`
      );
      setArquivo(null);
      setDescricao('');
      setCategoria('FOTO');
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset file input
      }
      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }
    } catch (err) {
      console.error(
        'Erro no upload do arquivo:',
        err.response ? err.response.data : err.message
      );
      let errorMessage = 'Erro ao enviar arquivo. Tente novamente.';
      if (err.response && err.response.data) {
        if (
          err.response.data.arquivo &&
          Array.isArray(err.response.data.arquivo)
        ) {
          errorMessage = `Arquivo: ${err.response.data.arquivo.join(' ')}`;
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (
          typeof err.response.data === 'string' &&
          err.response.data.length < 200
        ) {
          // Avoid overly long string errors
          errorMessage = err.response.data;
        } else if (err.response.status === 400) {
          errorMessage = 'Dados inválidos. Verifique o arquivo e a descrição.';
        } else if (err.response.status === 401 || err.response.status === 403) {
          errorMessage = 'Não autorizado. Faça login novamente.';
        }
      }
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="my-6 p-5 border border-gray-200 rounded-lg shadow-md bg-white">
      <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
        Adicionar Novo Arquivo à Obra
      </h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="arquivoObraInput"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Selecionar Arquivo (Imagens, PDFs, Documentos - máx. 50MB)
          </label>
          <input
            type="file"
            id="arquivoObraInput"
            ref={fileInputRef}
            accept={getAcceptString()}
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="categoriaSelect"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Categoria
          </label>
          <select
            id="categoriaSelect"
            value={categoria}
            onChange={handleCategoriaChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            {categorias.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-5">
          <label
            htmlFor="arquivoDescricaoInput"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Descrição (opcional)
          </label>
          <input
            type="text"
            id="arquivoDescricaoInput"
            value={descricao}
            onChange={handleDescricaoChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Ex: Vista lateral da fundação, Contrato de empreitada"
          />
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-300 rounded-md">
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        )}
        <button
          type="submit"
          disabled={isUploading || !arquivo}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
              Enviando...
            </>
          ) : (
            'Enviar Arquivo'
          )}
        </button>
      </form>
    </div>
  );
}

export default ObraFotosUpload;
