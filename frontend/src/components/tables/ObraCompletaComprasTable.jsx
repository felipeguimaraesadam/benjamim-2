import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Eye, Pencil } from 'lucide-react';

const ObraCompletaComprasTable = ({ compras, isLoading, error }) => {
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
              Material
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Quantidade
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Valor Unitário
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
              Fornecedor
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Nota Fiscal
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {compras.map(item => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                {formatDate(item.data_compra)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                {item.material_nome || 'N/A'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                {parseFloat(item.quantidade || 0).toLocaleString('pt-BR')}{' '}
                {item.unidade_medida || ''}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                {formatCurrency(item.valor_unitario)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                {formatCurrency(item.custo_total)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                {item.fornecedor || '-'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                {item.nota_fiscal || '-'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                <div className="flex items-center justify-center space-x-2">
                  <Link
                    to={`/compras/${item.compra_id}`}
                    className="text-blue-600 hover:text-blue-800"
                    title="Ver Detalhes da Compra"
                  >
                    <Eye size={18} />
                  </Link>
                  <Link
                    to={`/compras/editar/${item.compra_id}`}
                    className="text-yellow-600 hover:text-yellow-800"
                    title="Editar Compra"
                  >
                    <Pencil size={18} />
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

ObraCompletaComprasTable.propTypes = {
  compras: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired, // Now a unique string like 'compraId-itemId'
      compra_id: PropTypes.number.isRequired,
      data_compra: PropTypes.string,
      material_nome: PropTypes.string,
      quantidade: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      unidade_medida: PropTypes.string,
      valor_unitario: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      custo_total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      fornecedor: PropTypes.string,
      nota_fiscal: PropTypes.string,
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
