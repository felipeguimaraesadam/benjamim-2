import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../../services/api';
import { formatDateToDMY } from '../../utils/dateUtils'; // Assuming this utility exists

const DetailItem = ({ label, value }) => (
  <div className="mb-3">
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="text-md text-gray-900">{value || 'N/A'}</p>
  </div>
);

const LocacaoDetailModal = ({ locacaoId, onClose }) => {
  const [locacao, setLocacao] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLocacaoDetails = useCallback(async (id) => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getLocacaoById(id);
      setLocacao(response.data);
    } catch (err) {
      console.error('Error fetching locacao details:', err);
      setError(err.message || 'Falha ao buscar detalhes da locação.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (locacaoId) {
      fetchLocacaoDetails(locacaoId);
    } else {
      // Reset when locacaoId is not present (e.g., modal is hidden)
      setLocacao(null);
      setError(null);
      setIsLoading(false);
    }
  }, [locacaoId, fetchLocacaoDetails]);

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A';
    const number = parseFloat(value);
    return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatTipoPagamento = (tipo) => {
    if (!tipo) return 'N/A';
    switch (tipo) {
      case 'diaria': return 'Diária';
      case 'metro': return 'Por Metro';
      case 'empreitada': return 'Empreitada';
      default: return tipo.charAt(0).toUpperCase() + tipo.slice(1);
    }
  };

  const getRecursoLocado = (loc) => {
    if (!loc) return 'N/A';
    if (loc.equipe_nome) return `Equipe: ${loc.equipe_nome}`;
    if (loc.funcionario_locado_nome) return `Funcionário: ${loc.funcionario_locado_nome}`;
    if (loc.servico_externo) return `Serviço Externo: ${loc.servico_externo}`;
    return 'N/A';
  };

  if (!locacaoId) { // Or some other prop to control visibility, but typically driven by parent through locacaoId
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 transition-opacity duration-300 ease-in-out">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Detalhes da Locação</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Fechar modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {isLoading && <div className="text-center py-4">Carregando detalhes...</div>}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Erro: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {locacao && !isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <DetailItem label="Obra" value={locacao.obra_nome} />
            <DetailItem label="Recurso Locado" value={getRecursoLocado(locacao)} />
            <DetailItem label="Data de Início" value={formatDateToDMY(locacao.data_locacao_inicio)} />
            <DetailItem label="Data de Fim" value={formatDateToDMY(locacao.data_locacao_fim)} />
            <DetailItem label="Tipo de Pagamento" value={formatTipoPagamento(locacao.tipo_pagamento)} />
            <DetailItem label="Valor do Pagamento" value={formatCurrency(locacao.valor_pagamento)} />
            <DetailItem label="Data Prev. Pagamento" value={formatDateToDMY(locacao.data_pagamento)} />
            <DetailItem label="Status" value={locacao.status_locacao ? locacao.status_locacao.charAt(0).toUpperCase() + locacao.status_locacao.slice(1) : 'N/A'} />
            <div className="md:col-span-2">
                <DetailItem label="Observações" value={locacao.observacoes} />
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocacaoDetailModal;
