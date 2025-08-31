import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../../services/api';
import { formatDateToDMY } from '../../utils/dateUtils';

const DetailItem = ({ label, value, className = '' }) => (
  <div className={`mb-3 ${className}`}>
    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
      {label}
    </p>
    <p className="text-md text-gray-900 dark:text-gray-200">{value || 'N/A'}</p>
  </div>
);

const CompraDetailModal = ({ compraId, onClose }) => {
  const [compra, setCompra] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCompraDetails = useCallback(async id => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getCompraById(id);
      setCompra(response.data);
    } catch (err) {
      console.error('Error fetching compra details:', err);
      setError(err.message || 'Falha ao buscar detalhes da compra.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (compraId) {
      fetchCompraDetails(compraId);
    } else {
      setCompra(null);
      setError(null);
      setIsLoading(false);
    }
  }, [compraId, fetchCompraDetails]);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const formatCurrency = value => {
    if (value === null || value === undefined) return 'N/A';
    const number = parseFloat(value);
    return number.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  if (!compraId) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 transition-opacity duration-300 ease-in-out">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Detalhes da Compra
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Fechar modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        {isLoading && (
          <div className="text-center py-4 text-gray-600 dark:text-gray-400">
            Carregando detalhes...
          </div>
        )}
        {error && (
          <div
            className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            <strong className="font-bold">Erro: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {compra && !isLoading && !error && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <DetailItem label="Obra" value={compra.obra_nome} />
              <DetailItem label="Fornecedor" value={compra.fornecedor} />
              <DetailItem label="Data da Compra" value={formatDateToDMY(compra.data_compra)} />
              <DetailItem label="Tipo" value={compra.tipo?.replace(/_/g, ' ')} />
              <DetailItem label="Status Orçamento" value={compra.status_orcamento?.replace(/_/g, ' ')} />
              <DetailItem label="Forma de Pagamento" value={compra.forma_pagamento?.replace(/_/g, ' ')} />
              {compra.forma_pagamento === 'parcelado' && (
                <DetailItem label="Número de Parcelas" value={compra.numero_parcelas} />
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Valores
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
                    <DetailItem label="Valor Total (Bruto)" value={formatCurrency(compra.valor_total_bruto)} />
                    <DetailItem label="Desconto" value={formatCurrency(compra.desconto)} />
                    <DetailItem label="Valor Total (Líquido)" value={formatCurrency(compra.valor_total_liquido)} />
                </div>
            </div>

            {compra.itens && compra.itens.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Itens da Compra
                </h3>
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Material
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Qtd
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Un
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Valor Unitário
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Categoria de Uso
                        </th>
                         <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Valor Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {compra.itens.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            {item.material_nome}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {item.quantidade}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {item.unidade}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {formatCurrency(item.valor_unitario)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {item.categoria_uso || 'N/A'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {formatCurrency(item.valor_total_item)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:focus:ring-gray-500 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompraDetailModal;
