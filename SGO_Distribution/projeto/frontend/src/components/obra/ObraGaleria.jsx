import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../services/api';

function ObraGaleria({ obraId, newFoto }) {
    const [fotos, setFotos] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedFoto, setSelectedFoto] = useState(null); // For modal view

    const fetchFotos = useCallback(async () => {
        if (!obraId) return;
        setIsLoading(true);
        setError('');
        try {
            const response = await apiClient.get(`/fotosobras/?obra_id=${obraId}`);
            // Ajuste para acessar a lista de resultados se a API estiver paginada
            const fotosData = response.data.results || response.data || [];
            setFotos(fotosData);
        } catch (err) {
            console.error('Erro ao buscar fotos:', err.response ? err.response.data : err.message);
            setError('Não foi possível carregar as fotos. Tente recarregar a página.');
        } finally {
            setIsLoading(false);
        }
    }, [obraId]);

    useEffect(() => {
        fetchFotos();
    }, [fetchFotos]);

    // Effect to add newFoto to the list when it's uploaded
    useEffect(() => {
        if (newFoto && newFoto.obra === parseInt(obraId)) { // Ensure foto belongs to current obra
            // Se fotos for um objeto paginado, precisamos ter cuidado aqui.
            // No entanto, newFoto é um único objeto, então adicioná-lo a uma lista é o comportamento esperado.
            // Se o estado `fotos` realmente se tornar um objeto paginado, esta lógica de adicionar
            // uma foto nova diretamente ao estado precisaria ser repensada ou o estado `fotos`
            // deveria consistentemente armazenar apenas a array de resultados.
            // A correção em fetchFotos (setFotos(fotosData)) garante que `fotos` seja sempre uma array.
            setFotos(prevFotosArray => [newFoto, ...prevFotosArray]); // Add new photo to the beginning
        }
    }, [newFoto, obraId]);

    const openModal = (foto) => {
        setSelectedFoto(foto);
    };

    const closeModal = () => {
        setSelectedFoto(null);
    };

    if (!obraId) {
        return <p className="text-gray-600 dark:text-gray-400">ID da Obra não especificado para carregar a galeria.</p>;
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-40">
                <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="ml-3 text-gray-700 dark:text-gray-300">Carregando fotos...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="my-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-600 rounded-md text-center">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                <button
                    onClick={fetchFotos}
                    className="mt-2 px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded hover:bg-red-700"
                >
                    Tentar Novamente
                </button>
            </div>
        );
    }

    // A verificação de fotos.length === 0 continua válida, pois `fotos` no estado sempre será uma array.
    if (fotos.length === 0 && !isLoading && !error) { // Adicionado !isLoading e !error para mostrar apenas se não houver erro e não estiver carregando
        return (
            <div className="my-6 p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Nenhuma foto adicionada ainda.</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Seja o primeiro a adicionar uma foto para esta obra!</p>
            </div>
        );
    }

    // Renderiza a galeria apenas se fotos for uma array e tiver itens.
    // Não é mais necessário checar fotos.results aqui porque `fotos` no estado é garantido ser uma array.
    return (
        <div className="my-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Galeria de Fotos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {fotos && fotos.map((foto) => ( // `fotos` aqui já é a array de resultados.
                    <div key={foto.id} className="group relative border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
                        <img
                            src={foto.imagem} // Assuming backend serves images correctly
                            alt={foto.descricao || `Foto da obra ${obraId}`}
                            className="w-full h-48 object-cover cursor-pointer"
                            onClick={() => openModal(foto)}
                        />
                        {foto.descricao && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <p className="truncate">{foto.descricao}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {selectedFoto && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                    onClick={closeModal} // Close modal on backdrop click
                >
                    <div
                        className="relative bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl max-w-3xl max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside image/modal content
                    >
                        <img
                            src={selectedFoto.imagem}
                            alt={selectedFoto.descricao || 'Foto da obra em tamanho maior'}
                            className="max-w-full max-h-[80vh] object-contain rounded"
                        />
                        {selectedFoto.descricao && (
                            <p className="mt-2 text-center text-gray-700 dark:text-gray-200">{selectedFoto.descricao}</p>
                        )}
                        <button
                            onClick={closeModal}
                            className="absolute top-2 right-2 bg-white dark:bg-gray-700 rounded-full p-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                            aria-label="Fechar modal"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ObraGaleria;
