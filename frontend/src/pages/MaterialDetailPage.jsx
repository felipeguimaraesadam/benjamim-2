import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMaterialDetailsById } from '../services/api'; // To be created
import { formatDateToDMY } from '../utils/dateUtils';
import SpinnerIcon from '../components/utils/SpinnerIcon';

const MaterialDetailPage = () => {
  const { id } = useParams();
  const [materialDetails, setMaterialDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getMaterialDetailsById(id);
        setMaterialDetails(response.data);
      } catch (err) {
        console.error("Erro ao buscar detalhes do material:", err);
        setError(err.response?.data?.error || err.message || "Erro ao buscar detalhes do material.");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchDetails();
    }
  }, [id]);

  const formatNumber = (value) => {
    if (value === null || value === undefined) return 'N/A';
    // Assuming it might be a string from backend, ensure it's a number for formatting
    const num = parseFloat(value);
    if (isNaN(num)) return 'N/A';
    return num.toLocaleString('pt-BR'); // Adjust formatting as needed
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <SpinnerIcon className="h-12 w-12 text-blue-500" />
        <p className="ml-2 text-lg">Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Erro!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
        <div className="mt-4">
            <Link to="/materiais" className="text-blue-500 hover:text-blue-700 transition duration-300">
                &larr; Voltar para lista de materiais
            </Link>
        </div>
      </div>
    );
  }

  if (!materialDetails) {
    return (
        <div className="container mx-auto px-4 py-6 text-center">
            <p>Nenhum detalhe do material encontrado.</p>
            <div className="mt-4">
                <Link to="/materiais" className="text-blue-500 hover:text-blue-700 transition duration-300">
                    &larr; Voltar para lista de materiais
                </Link>
            </div>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Detalhes do Material: {materialDetails.nome}
        </h1>
        <Link
          to="/materiais"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300"
        >
          &larr; Voltar
        </Link>
      </div>

      {/* Dados do Material */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Dados do Material</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <p><strong>Nome:</strong> {materialDetails.nome}</p>
          <p><strong>Unidade de Medida:</strong> {materialDetails.unidade_medida}</p>
          <p><strong>Quantidade em Estoque:</strong> {formatNumber(materialDetails.quantidade_em_estoque)}</p>
          <p><strong>Nível Mínimo de Estoque:</strong> {formatNumber(materialDetails.nivel_minimo_estoque)}</p>
        </div>
      </div>

      {/* Histórico de Uso */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Histórico de Uso</h2>
        {materialDetails.usage_history && materialDetails.usage_history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase tracking-wider">Data de Uso</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase tracking-wider">Obra</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase tracking-wider">Qtde. Usada</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase tracking-wider">Andar</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase tracking-wider">Categoria de Uso</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase tracking-wider">Descrição</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {materialDetails.usage_history.map(uso => (
                  <tr key={uso.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4">{formatDateToDMY(uso.data_uso)}</td>
                    <td className="py-3 px-4">
                      {uso.obra && uso.obra_nome ? (
                        <Link to={`/obras/${uso.obra}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                          {uso.obra_nome}
                        </Link>
                      ) : (
                        uso.obra_nome || 'N/A'
                      )}
                    </td>
                    <td className="py-3 px-4">{formatNumber(uso.quantidade_usada)}</td>
                    <td className="py-3 px-4">{uso.andar || 'N/A'}</td>
                    <td className="py-3 px-4">{uso.categoria_uso || 'N/A'}</td>
                    <td className="py-3 px-4">{uso.descricao || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">Nenhum histórico de uso encontrado.</p>
        )}
      </div>
    </div>
  );
};

export default MaterialDetailPage;
