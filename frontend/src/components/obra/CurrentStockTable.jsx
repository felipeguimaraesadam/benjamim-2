import React from 'react';

const CurrentStockTable = ({ comprasEstoque, formatDate }) => {
  return (
    <div className="mb-8 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Estoque Atual (Materiais Disponíveis)</h2>
      {comprasEstoque && comprasEstoque.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Material</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Disponível</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Data Compra</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fornecedor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {comprasEstoque.map(compra => (
                <tr key={compra.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{compra.material_nome}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{parseFloat(compra.quantidade_disponivel).toLocaleString('pt-BR')} {compra.material_unidade_medida || ''}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{formatDate(compra.data_compra)}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{compra.fornecedor || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500">Nenhum material em estoque no momento.</p>
      )}
    </div>
  );
};

export default React.memo(CurrentStockTable);
