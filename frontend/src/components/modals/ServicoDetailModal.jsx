import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../../services/api';
import { formatDateToDMY } from '../../utils/dateUtils';

const formatCurrency = value => {
  const number = parseFloat(value);
  if (isNaN(number)) return 'R$ 0,00';
  return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const ServicoDetailModal = ({ obraId, onClose }) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async id => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getObraServicosDetail(id);
      setData(response.data);
    } catch (err) {
      console.error('Error fetching service details:', err);
      setError(err.message || 'Falha ao buscar detalhes de serviços.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (obraId) {
      fetchData(obraId);
    }
  }, [obraId, fetchData]);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!obraId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 border-b pb-4 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Detalhes de Custo de Serviços
          </h2>
          <button onClick={onClose} aria-label="Fechar modal">
            <svg className="w-6 h-6 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto">
          {isLoading && <div className="text-center py-10">Carregando...</div>}
          {error && <div className="text-center py-10 text-red-500">Erro: {error}</div>}

          {!isLoading && !error && data.length > 0 && (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serviço</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Início</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Fim</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observações</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data.map((servico, index) => (
                  <tr key={servico.id} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50'}>
                    <td className="px-6 py-4 whitespace-nowrap">{servico.servico_externo}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatDateToDMY(servico.data_locacao_inicio)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatDateToDMY(servico.data_locacao_fim)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(servico.valor_pagamento)}</td>
                    <td className="px-6 py-4">{servico.observacoes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!isLoading && !error && data.length === 0 && (
            <div className="text-center py-10 text-gray-500">Nenhum serviço encontrado.</div>
          )}
        </div>

        <div className="mt-6 flex justify-end pt-4 border-t dark:border-gray-700">
          <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServicoDetailModal;
