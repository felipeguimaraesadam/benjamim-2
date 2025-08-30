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
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
              <DetailItem label="Fornecedor" value={compra.fornecedor_nome} />
              <DetailItem label="Data da Compra" value={formatDateToDMY(compra.data_compra)} />
              <DetailItem label="Tipo" value={compra.tipo?.replace(/_/g, ' ')} />
              <DetailItem label="Status Orçamento" value={compra.status_orcamento?.replace(/_/g, ' ')} />
              <DetailItem label="Categoria de Uso" value={compra.categoria_uso} />
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
                    <DetailItem label="Valor Total (Bruto)" value={formatCurrency(compra.valor_total)} />
                    <DetailItem label="Desconto" value={formatCurrency(compra.desconto)} />
                    <DetailItem label="Valor Total (Líquido)" value={formatCurrency(compra.valor_total_liquido)} />
                </div>
            </div>

            {compra.itens && compra.itens.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Itens da Compra
                </h3>
                <div className="space-y-2">
                  {compra.itens.map(item => (
                    <div key={item.id} className="p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                        <p className="font-semibold">{item.material_nome}</p>
                        <div className="text-sm grid grid-cols-3 gap-x-4">
                            <span>Qtd: {item.quantidade}</span>
                            <span>Un: {item.unidade}</span>
                            <span>Valor Un: {formatCurrency(item.valor_unitario)}</span>
                        </div>
                    </div>
                  ))}
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
