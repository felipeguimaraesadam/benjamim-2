import React, { useState, useRef } from 'react';
import { apiClient } from '../../services/api';

function ObraFotosUpload({ obraId, onUploadSuccess }) {
    const [imagem, setImagem] = useState(null);
    const [descricao, setDescricao] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null); // Ref for the file input

    const handleFileChange = (event) => {
        setImagem(event.target.files[0]);
        setError('');
        setSuccessMessage('');
    };

    const handleDescricaoChange = (event) => {
        setDescricao(event.target.value);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!imagem) {
            setError('Por favor, selecione uma imagem.');
            return;
        }
        if (!obraId) {
            setError('ID da Obra não fornecido. Recarregue a página ou contate o suporte.');
            return;
        }

        const formData = new FormData();
        formData.append('imagem', imagem);
        formData.append('descricao', descricao);
        formData.append('obra', obraId);

        setIsUploading(true);
        setError('');
        setSuccessMessage('');

        try {
            const response = await apiClient.post('/fotosobras/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setSuccessMessage(`Foto "${response.data.imagem.split('/').pop()}" enviada com sucesso!`);
            setImagem(null);
            setDescricao('');
            if (fileInputRef.current) {
                fileInputRef.current.value = ""; // Reset file input
            }
            if (onUploadSuccess) {
                onUploadSuccess(response.data);
            }
        } catch (err) {
            console.error('Erro no upload da foto:', err.response ? err.response.data : err.message);
            let errorMessage = 'Erro ao enviar foto. Tente novamente.';
            if (err.response && err.response.data) {
                if (err.response.data.imagem && Array.isArray(err.response.data.imagem)) {
                    errorMessage = `Imagem: ${err.response.data.imagem.join(' ')}`;
                } else if (err.response.data.detail) {
                    errorMessage = err.response.data.detail;
                } else if (typeof err.response.data === 'string' && err.response.data.length < 200) { // Avoid overly long string errors
                    errorMessage = err.response.data;
                } else if (err.response.status === 400) {
                    errorMessage = "Dados inválidos. Verifique o arquivo e a descrição.";
                } else if (err.response.status === 401 || err.response.status === 403) {
                    errorMessage = "Não autorizado. Faça login novamente.";
                }
            }
            setError(errorMessage);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="my-6 p-5 border border-gray-200 rounded-lg shadow-md bg-white">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Adicionar Nova Foto à Obra</h3>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="fotoObraInput" className="block text-sm font-medium text-gray-700 mb-1">
                        Selecionar Imagem (PNG, JPG/JPEG)
                    </label>
                    <input
                        type="file"
                        id="fotoObraInput"
                        ref={fileInputRef}
                        accept="image/png, image/jpeg"
                        onChange={handleFileChange}
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="mb-5">
                    <label htmlFor="fotoDescricaoInput" className="block text-sm font-medium text-gray-700 mb-1">
                        Descrição (opcional)
                    </label>
                    <input
                        type="text"
                        id="fotoDescricaoInput"
                        value={descricao}
                        onChange={handleDescricaoChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Ex: Vista lateral da fundação"
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
                    disabled={isUploading || !imagem}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    {isUploading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Enviando...
                        </>
                    ) : (
                        'Enviar Foto'
                    )}
                </button>
            </form>
        </div>
    );
}

export default ObraFotosUpload;
