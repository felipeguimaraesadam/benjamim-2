import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFuncionarioDetailsById } from '../services/api';
import { formatDateToDMY } from '../utils/dateUtils';
import SpinnerIcon from '../components/utils/SpinnerIcon'; // Assuming this path is correct

const FuncionarioDetailPage = () => {
  const { id } = useParams();
  const [funcionarioDetails, setFuncionarioDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getFuncionarioDetailsById(id);
        setFuncionarioDetails(response.data);
      } catch (err) {
        console.error("Erro ao buscar detalhes do funcionário:", err);
        setError(err.response?.data?.error || err.message || "Erro ao buscar detalhes do funcionário.");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchDetails();
    }
  }, [id]);

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
            <Link to="/funcionarios" className="text-blue-500 hover:text-blue-700 transition duration-300">
                &larr; Voltar para lista de funcionários
            </Link>
        </div>
      </div>
    );
  }

  if (!funcionarioDetails) {
    return (
        <div className="container mx-auto px-4 py-6 text-center">
            <p>Nenhum detalhe do funcionário encontrado.</p>
            <div className="mt-4">
                <Link to="/funcionarios" className="text-blue-500 hover:text-blue-700 transition duration-300">
                    &larr; Voltar para lista de funcionários
                </Link>
            </div>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Detalhes do Funcionário: {funcionarioDetails.nome_completo}
        </h1>
        <Link
          to="/funcionarios"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300"
        >
          &larr; Voltar
        </Link>
      </div>

      {/* Dados Pessoais */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Dados Pessoais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <p><strong>Nome Completo:</strong> {funcionarioDetails.nome_completo}</p>
          <p><strong>Cargo:</strong> {funcionarioDetails.cargo}</p>
          <p><strong>Data de Contratação:</strong> {formatDateToDMY(funcionarioDetails.data_contratacao)}</p>
          <p><strong>Valor Diária Padrão:</strong> {formatCurrency(funcionarioDetails.valor_diaria_padrao)}</p>
          <p><strong>Valor Metro Padrão:</strong> {formatCurrency(funcionarioDetails.valor_metro_padrao)}</p>
          <p><strong>Valor Empreitada Padrão:</strong> {formatCurrency(funcionarioDetails.valor_empreitada_padrao)}</p>
        </div>
      </div>

      {/* Obras Participadas */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Obras Participadas</h2>
        {funcionarioDetails.obras_participadas && funcionarioDetails.obras_participadas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase tracking-wider">Nome da Obra</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase tracking-wider">Início da Locação</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase tracking-wider">Fim da Locação</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {funcionarioDetails.obras_participadas.map(obra => (
                  <tr key={obra.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <Link to={`/obras/${obra.obra_id}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                        {obra.nome_obra || 'Nome não disponível'}
                      </Link>
                    </td>
                    <td className="py-3 px-4">{formatDateToDMY(obra.data_locacao_inicio)}</td>
                    <td className="py-3 px-4">{formatDateToDMY(obra.data_locacao_fim)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">Nenhuma obra encontrada.</p>
        )}
      </div>

      {/* Histórico de Pagamentos */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Histórico de Pagamentos</h2>
        {funcionarioDetails.pagamentos_recebidos && funcionarioDetails.pagamentos_recebidos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase tracking-wider">Obra</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase tracking-wider">Data de Pagamento</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase tracking-wider">Valor Pago</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {funcionarioDetails.pagamentos_recebidos.map(pagamento => (
                  <tr key={pagamento.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4">{pagamento.obra_nome || 'Não especificado'}</td>
                    <td className="py-3 px-4">{formatDateToDMY(pagamento.data_pagamento)}</td>
                    <td className="py-3 px-4">{formatCurrency(pagamento.valor_pagamento)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">Nenhum pagamento encontrado.</p>
        )}
      </div>

      {/* Ocorrências Registradas */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Ocorrências Registradas</h2>
        {funcionarioDetails.ocorrencias_registradas && funcionarioDetails.ocorrencias_registradas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase tracking-wider">Data</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase tracking-wider">Tipo</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase tracking-wider">Observação</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {funcionarioDetails.ocorrencias_registradas.map(ocorrencia => (
                  <tr key={ocorrencia.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4">{formatDateToDMY(ocorrencia.data)}</td>
                    <td className="py-3 px-4">{ocorrencia.tipo}</td>
                    <td className="py-3 px-4">{ocorrencia.observacao || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">Nenhuma ocorrência encontrada.</p>
        )}
      </div>
    </div>
  );
};

export default FuncionarioDetailPage;
