import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../../services/api';
import { toast } from 'react-toastify';

function ObraGaleria({ obraId, newFoto }) {
  const [fotos, setFotos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFoto, setSelectedFoto] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchFotos = useCallback(async () => {
    if (!obraId) return;
    setIsLoading(true);
    setError('');
    try {
      const response = await api.getFotosObra(obraId);
      const fotosData = response.data.results || response.data || [];
      setFotos(fotosData);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Não foi possível carregar as fotos.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [obraId]);

  useEffect(() => {
    fetchFotos();
  }, [fetchFotos]);

  useEffect(() => {
    if (newFoto && newFoto.obra === parseInt(obraId)) {
      setFotos(prevFotos => [newFoto, ...prevFotos]);
    }
  }, [newFoto, obraId]);

  const handleDeleteFoto = async (fotoId, event) => {
    event.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir esta foto?')) {
      setDeletingId(fotoId);
      try {
        await api.deleteFoto(fotoId);
        setFotos(prevFotos => prevFotos.filter(foto => foto.id !== fotoId));
        toast.success('Foto excluída com sucesso!');
      } catch (err) {
        const errorMessage = err.response?.data?.detail || 'Falha ao excluir a foto.';
        toast.error(errorMessage);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const openModal = foto => setSelectedFoto(foto);
  const closeModal = () => setSelectedFoto(null);

  if (isLoading) {
    return <p className="text-center p-4">Carregando fotos...</p>;
  }

  if (error) {
    return <p className="text-center p-4 text-red-500">{error}</p>;
  }

  return (
    <div className="my-6">
      <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Galeria de Fotos</h3>
      {fotos.length === 0 ? (
        <div className="my-6 p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
          <p className="mt-1 text-sm text-gray-500">Nenhuma foto adicionada ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {fotos.map(foto => (
            <div key={foto.id} className="group relative border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
              <img
                src={foto.imagem}
                alt={foto.descricao || `Foto da obra ${obraId}`}
                className="w-full h-48 object-cover cursor-pointer"
                onClick={() => openModal(foto)}
              />
              <button
                onClick={(e) => handleDeleteFoto(foto.id, e)}
                disabled={deletingId === foto.id}
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-opacity duration-300 disabled:opacity-50"
                aria-label="Excluir foto"
              >
                {deletingId === foto.id ? (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
              {foto.descricao && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="truncate">{foto.descricao}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedFoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="relative bg-white p-4 rounded-lg shadow-xl max-w-3xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <img src={selectedFoto.imagem} alt={selectedFoto.descricao || 'Foto da obra em tamanho maior'} className="max-w-full max-h-[80vh] object-contain rounded"/>
            <button onClick={closeModal} className="absolute top-2 right-2 bg-white rounded-full p-1 text-gray-600 hover:text-gray-900 focus:outline-none" aria-label="Fechar modal">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ObraGaleria;
