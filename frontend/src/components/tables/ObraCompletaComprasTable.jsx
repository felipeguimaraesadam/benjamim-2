import React, { useState } from 'react';
import PropTypes from 'prop-types';
import CompraDetailModal from '../modals/CompraDetailModal';

const ObraCompletaComprasTable = ({ compras, isLoading, error }) => {
  const [selectedCompraId, setSelectedCompraId] = useState(null);

  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      timeZone: 'UTC',
    });
  };

  const formatCurrency = value => {
    if (value === null || value === undefined) return 'N/A';
    return `R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500">
        Carregando todas as compras...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Erro ao carregar compras:{' '}
        {typeof error === 'string' ? error : error.message}
      </div>
    );
  }

  if (!compras || compras.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        Nenhuma compra registrada para esta obra.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Data Compra
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Fornecedor
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Custo Total
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Nota Fiscal
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {compras.map(compra => (
              <tr key={compra.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {formatDate(compra.data_compra)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {compra.fornecedor || '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {formatCurrency(compra.valor_total_liquido)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {compra.nota_fiscal || '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  <button
                    onClick={() => setSelectedCompraId(compra.id)}
                    className="text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    Ver Detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedCompraId && (
        <CompraDetailModal
          compraId={selectedCompraId}
          onClose={() => setSelectedCompraId(null)}
        />
      )}
    </>
  );
};

ObraCompletaComprasTable.propTypes = {
  compras: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      data_compra: PropTypes.string,
      fornecedor: PropTypes.string,
      nota_fiscal: PropTypes.string,
      itens: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.number.isRequired,
          material_nome: PropTypes.string,
          quantidade: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          valor_unitario: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number,
          ]),
          valor_total_item: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number,
          ]),
        })
      ),
    })
  ),
  isLoading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
};

ObraCompletaComprasTable.defaultProps = {
  isLoading: false,
  error: null,
  compras: [],
};

export default ObraCompletaComprasTable;
