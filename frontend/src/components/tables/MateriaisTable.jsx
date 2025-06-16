import React from 'react';

const MateriaisTable = ({ materiais, onEdit, onDelete, isLoading, lowStockAlerts = [] }) => {

  const getUnidadeMedidaLabel = (value) => {
    const options = {
      'un': 'Unidade (un)',
      'm²': 'Metro Quadrado (m²)',
      'kg': 'Quilograma (kg)',
      'saco': 'Saco (saco)',
    };
    return options[value] || value;
  };

  if (isLoading && (!materiais || materiais.length === 0)) {
    return <p className="text-center text-gray-500 py-4">Carregando materiais...</p>;
  }

  if (!isLoading && (!materiais || materiais.length === 0)) {
    return <p className="text-center text-gray-500 py-4">Nenhum material encontrado.</p>;
  }

  const lowStockIds = new Set(lowStockAlerts.map(alert => alert.id));

  return (
    <div className="overflow-x-auto shadow-md sm:rounded-lg">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3">Nome do Material</th>
            <th scope="col" className="px-6 py-3">Estoque Atual</th>
            <th scope="col" className="px-6 py-3">Nível Mínimo</th>
            <th scope="col" className="px-6 py-3">Unidade de Medida</th>
            <th scope="col" className="px-6 py-3 text-center">Ações</th>
          </tr>
        </thead>
        <tbody>
          {materiais.map((material) => {
            const isLowStock = lowStockIds.has(material.id);
            return (
            <tr key={material.id} className={`border-b hover:bg-gray-50 ${isLowStock ? 'bg-yellow-50 hover:bg-yellow-100' : 'bg-white'}`}>
              <th scope="row" className={`px-6 py-4 font-medium whitespace-nowrap ${isLowStock ? 'text-yellow-700' : 'text-gray-900'}`}>
                {material.nome}
              </th>
              <td className={`px-6 py-4 ${isLowStock && parseFloat(material.quantidade_em_estoque) <= parseFloat(material.nivel_minimo_estoque) ? 'text-red-600 font-bold' : ''}`}>
                {material.quantidade_em_estoque !== undefined ? parseFloat(material.quantidade_em_estoque).toLocaleString('pt-BR') : 'N/A'}
              </td>
              <td className="px-6 py-4">
                {material.nivel_minimo_estoque !== undefined ? material.nivel_minimo_estoque : 'N/A'}
              </td>
              <td className="px-6 py-4">{getUnidadeMedidaLabel(material.unidade_medida)}</td>
              <td className="px-6 py-4 text-center space-x-2">
                <button
                  onClick={() => onEdit(material)}
                  className="font-medium text-blue-600 hover:underline disabled:text-gray-400"
                  disabled={isLoading}
                >
                  Editar
                </button>
                <button
                  onClick={() => onDelete(material.id)}
                  className="font-medium text-red-600 hover:underline disabled:text-gray-400"
                  disabled={isLoading}
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MateriaisTable;
