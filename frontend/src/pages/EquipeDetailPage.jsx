import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEquipeDetailsById } from '../services/api';
import { formatDateToDMY } from '../utils/dateUtils';
import SpinnerIcon from '../components/utils/SpinnerIcon';

const EquipeDetailPage = () => {
  const { id } = useParams();
  const [equipeDetails, setEquipeDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getEquipeDetailsById(id);
        setEquipeDetails(response.data);
      } catch (err) {
        console.error('Erro ao buscar detalhes da equipe:', err);
        setError(
          err.response?.data?.error ||
            err.message ||
            'Erro ao buscar detalhes da equipe.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchDetails();
    }
  }, [id]);

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
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Erro!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
        <div className="mt-4">
          <Link
            to="/equipes"
            className="text-blue-500 hover:text-blue-700 transition duration-300"
          >
            &larr; Voltar para lista de equipes
          </Link>
        </div>
      </div>
    );
  }

  if (!equipeDetails) {
    return (
      <div className="container mx-auto px-4 py-6 text-center">
        <p>Nenhum detalhe da equipe encontrado.</p>
        <div className="mt-4">
          <Link
            to="/equipes"
            className="text-blue-500 hover:text-blue-700 transition duration-300"
          >
            &larr; Voltar para lista de equipes
          </Link>
        </div>
      </div>
    );
  }

  // Helper to extract obra_id from obra_nome if it's in format "ID: X - Nome: YYY" or from a direct obra_id field
  // For locacoes_participadas, the serializer provides 'obra_nome' and the locacao 'id'.
  // We need obra_id for the link. Assuming locacoes_participadas items might not directly have obra_id.
  // This is a placeholder; ideally, the API should provide obra_id directly in locacoes_participadas.
  // For now, we'll assume obra_nome is just the name and we might not have obra_id for links in locações.
  // The serializer for EquipeLocacaoSerializer has: fields = ['id', 'obra_nome', ...]
  // It does NOT have obra_id. This means we cannot link to /obras/:obraId from locações table yet.
  // We'll render obra_nome as text.

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Detalhes da Equipe: {equipeDetails.nome_equipe}
        </h1>
        <Link
          to="/equipes"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300"
        >
          &larr; Voltar
        </Link>
      </div>

      {/* Dados da Equipe */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
          Dados da Equipe
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <p>
            <strong>Nome da Equipe:</strong> {equipeDetails.nome_equipe}
          </p>
          <div>
            <strong>Líder:</strong>
            {equipeDetails.lider && equipeDetails.lider_nome ? (
              <Link
                to={`/funcionarios/${equipeDetails.lider}`}
                className="text-blue-600 hover:text-blue-800 hover:underline ml-1"
              >
                {equipeDetails.lider_nome}
              </Link>
            ) : (
              <span className="ml-1">N/A</span>
            )}
          </div>
        </div>
        {equipeDetails.descricao && (
          <div className="mt-4">
            <p>
              <strong>Descrição:</strong>
            </p>
            <p className="mt-2 text-gray-700 bg-gray-50 p-3 rounded-md border">
              {equipeDetails.descricao}
            </p>
          </div>
        )}
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Membros:</h3>
          {equipeDetails.membros && equipeDetails.membros.length > 0 ? (
            <ul className="list-disc list-inside pl-4 space-y-1">
              {equipeDetails.membros.map(membro => (
                <li key={membro.id}>
                  <Link
                    to={`/funcionarios/${membro.id}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {membro.nome_completo}
                  </Link>
                  {membro.id === equipeDetails.lider && (
                    <span className="text-sm text-gray-500 ml-2">(Líder)</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">
              Nenhum membro cadastrado nesta equipe.
            </p>
          )}
        </div>
      </div>

      {/* Histórico de Locações / Obras Atuadas */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
          Histórico de Locações
        </h2>
        {equipeDetails.locacoes_participadas &&
        equipeDetails.locacoes_participadas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase tracking-wider">
                    Nome da Obra
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase tracking-wider">
                    Início da Locação
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase tracking-wider">
                    Fim da Locação
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase tracking-wider">
                    Tipo Pagamento
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase tracking-wider">
                    Valor Pago
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {equipeDetails.locacoes_participadas.map(locacao => (
                  <tr
                    key={locacao.id}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      {/* As per comment above, obra_id is not available in EquipeLocacaoSerializer directly.
                          If it were, it would be:
                          <Link to={`/obras/${locacao.obra_id}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                            {locacao.obra_nome}
                          </Link>
                          For now, just display name.
                      */}
                      {locacao.obra_nome || 'Nome não disponível'}
                    </td>
                    <td className="py-3 px-4">
                      {formatDateToDMY(locacao.data_locacao_inicio)}
                    </td>
                    <td className="py-3 px-4">
                      {formatDateToDMY(locacao.data_locacao_fim)}
                    </td>
                    <td className="py-3 px-4">
                      {locacao.tipo_pagamento ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {locacao.tipo_pagamento.charAt(0).toUpperCase() +
                            locacao.tipo_pagamento.slice(1)}
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {locacao.valor_pagamento ? (
                        <span className="font-medium text-green-600">
                          R${' '}
                          {parseFloat(locacao.valor_pagamento).toLocaleString(
                            'pt-BR',
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          locacao.data_pagamento
                            ? 'bg-green-100 text-green-800'
                            : locacao.valor_pagamento
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {locacao.data_pagamento
                          ? 'Pago'
                          : locacao.valor_pagamento
                            ? 'Considerado Pago'
                            : 'Sem Pagamento'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">
            Nenhuma locação encontrada para esta equipe.
          </p>
        )}
      </div>
    </div>
  );
};

export default EquipeDetailPage;
