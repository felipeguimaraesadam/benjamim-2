import React from 'react';
import PropTypes from 'prop-types';

const ObraDespesasExtrasTable = ({ despesas, isLoading, error }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (isLoading) {
    return <div className="p-4 text-center text-gray-500">Carregando despesas extras...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">Erro ao carregar despesas: {typeof error === 'string' ? error : error.message}</div>;
  }

  if (!despesas || despesas.length === 0) {
    return <div className="p-4 text-center text-gray-500">Nenhuma despesa extra registrada para esta obra.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {despesas.map(despesa => (
            <tr key={despesa.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{formatDate(despesa.data)}</td>
              <td className="px-4 py-3 text-sm text-gray-900 max-w-sm truncate" title={despesa.descricao}>{despesa.descricao}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{formatCurrency(despesa.valor)}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{despesa.categoria}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

ObraDespesasExtrasTable.propTypes = {
  despesas: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    data: PropTypes.string.isRequired,
    descricao: PropTypes.string.isRequired,
    valor: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    categoria: PropTypes.string.isRequired,
  })).isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
};

ObraDespesasExtrasTable.defaultProps = {
  isLoading: false,
  error: null,
  despesas: [],
};

export default ObraDespesasExtrasTable;
