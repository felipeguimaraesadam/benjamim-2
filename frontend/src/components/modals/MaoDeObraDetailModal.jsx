import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../../services/api';
import { formatDateToDMY } from '../../utils/dateUtils';

const formatCurrency = value => {
  const number = parseFloat(value);
  if (isNaN(number)) return 'R$ 0,00';
  return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const MaoDeObraDetailModal = ({ obraId, onClose }) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchData = useCallback(async id => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getObraMaoDeObraDetail(id);
      setData(response.data);
    } catch (err) {
      console.error('Error fetching labor details:', err);
      setError(err.message || 'Falha ao buscar detalhes de mão de obra.');
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
            Detalhes de Custo de Mão de Obra
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Funcionário</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Locações</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Pago</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diária Média</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Participação</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data.map((func, index) => (
                  <React.Fragment key={func.funcionario_id}>
                    <tr className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50'}>
                      <td className="px-6 py-4 whitespace-nowrap"><Link to={`/funcionarios/${func.funcionario_id}`} className="text-blue-500 hover:underline">{func.nome_completo}</Link></td>
                      <td className="px-6 py-4 whitespace-nowrap">{func.locacoes_count}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(func.total_pago)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(func.media_diaria)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{func.participacao_percentual.toFixed(2)}%</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button onClick={() => setExpandedRow(expandedRow === func.funcionario_id ? null : func.funcionario_id)} className="text-sm text-blue-500 hover:underline">
                          {expandedRow === func.funcionario_id ? 'Ocultar' : 'Ver Pagamentos'}
                        </button>
                      </td>
                    </tr>
                    {expandedRow === func.funcionario_id && (
                      <tr>
                        <td colSpan="6" className="p-4 bg-gray-100 dark:bg-gray-900">
                          <h5 className="font-bold mb-2">Detalhes de Pagamentos:</h5>
                          <ul className="list-disc pl-5">
                            {func.pagamentos.map(p => (
                              <li key={p.locacao_id} className="mb-1">
                                {formatDateToDMY(p.data_inicio)} a {formatDateToDMY(p.data_fim)} ({p.recurso}) - {p.tipo_pagamento}: {formatCurrency(p.valor_pago)}
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}

          {!isLoading && !error && data.length === 0 && (
            <div className="text-center py-10 text-gray-500">Nenhum dado de mão de obra encontrado.</div>
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

export default MaoDeObraDetailModal;
