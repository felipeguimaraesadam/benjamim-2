import React from 'react';

const CompraItensModal = ({ isOpen, onClose, compra }) => {
  if (!isOpen || !compra) {
    return null;
  }

  const formatCurrency = value => {
    if (value == null || isNaN(Number(value))) {
      return 'N/A';
    }
    return parseFloat(value).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    // Adjust for potential timezone issues if dateString is just YYYY-MM-DD
    const utcDate = new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    );
    return utcDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = dateTimeString => {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const itens = compra?.itens || [];

  const DetailItem = ({ label, value }) => (
    <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-700">
      <dt className="text-sm font-medium text-gray-600 dark:text-gray-300">
        {label}:
      </dt>
      <dd className="text-sm text-gray-800 dark:text-gray-200 text-right">
        {value || 'N/A'}
      </dd>
    </div>
  );

  const DetailTextareaItem = ({ label, value }) => (
    <div className="py-1.5">
      <dt className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
        {label}:
      </dt>
      <dd className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap bg-gray-50 dark:bg-gray-700 p-2 rounded-md max-h-28 overflow-y-auto">
        {value || 'Nenhuma observação.'}
      </dd>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex justify-center items-center z-50 px-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-3xl mx-auto my-8">
        {' '}
        {/* Increased max-w and added my-8 for scroll margin */}
        <div className="flex justify-between items-center mb-5 border-b border-gray-200 dark:border-gray-700 pb-3">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Detalhes da Compra
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            aria-label="Fechar modal"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
            Informações Gerais
          </h3>
          <dl className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-700 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-600/20 sm:rounded-xl p-4">
            <DetailItem label="Obra" value={compra.obra_nome} />
            <DetailItem label="Fornecedor" value={compra.fornecedor} />
            <DetailItem label="Nota Fiscal" value={compra.nota_fiscal} />
            <DetailItem
              label="Data da Compra"
              value={formatDate(compra.data_compra)}
            />
            <DetailItem
              label="Data de Pagamento"
              value={formatDate(compra.data_pagamento)}
            />
            <DetailItem
              label="Data do Registro"
              value={formatDateTime(compra.created_at)}
            />
          </dl>

          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3 pt-3">
            Valores
          </h3>
          <dl className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-700 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-600/20 sm:rounded-xl p-4">
            <DetailItem
              label="Subtotal dos Itens"
              value={formatCurrency(compra.valor_total_bruto)}
            />
            <DetailItem
              label="Desconto"
              value={formatCurrency(compra.desconto)}
            />
            <DetailItem
              label="Valor Total (Líquido)"
              value={formatCurrency(compra.valor_total_liquido)}
            />
          </dl>

          {compra.observacoes && (
            <>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2 pt-3">
                Observações
              </h3>
              <div className="bg-white dark:bg-gray-700 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-600/20 sm:rounded-xl p-4">
                <DetailTextareaItem value={compra.observacoes} />
              </div>
            </>
          )}
        </div>
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          Itens da Compra
        </h3>
        {!itens || itens.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">
            Nenhum item encontrado para esta compra.
          </p>
        ) : (
          <div className="overflow-x-auto shadow-md sm:rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Material
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Quantidade
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Valor Unitário
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Categoria de Uso
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Valor Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item, index) => (
                  <tr
                    key={item.id || index}
                    className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-200 whitespace-nowrap">
                      {item.material_nome || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                      {item.quantidade}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                      {formatCurrency(item.valor_unitario)}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {item.categoria_uso || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                      {formatCurrency(item.valor_total_item)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-8 flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 pt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompraItensModal;
