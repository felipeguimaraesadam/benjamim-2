import React from 'react';
import { Pencil, Trash2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const MateriaisTable = ({
  materiais,
  onEdit,
  onDelete,
  isLoading,
  lowStockAlerts = [],
}) => {
  const getUnidadeMedidaLabel = value => {
    const options = {
      un: 'Unidade (un)',
      'm²': 'Metro Quadrado (m²)',
      kg: 'Quilograma (kg)',
      saco: 'Saco (saco)',
    };
    return options[value] || value;
  };

  if (isLoading && (!materiais || materiais.length === 0)) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 py-4">
        Carregando materiais...
      </p>
    );
  }

  if (!isLoading && (!materiais || materiais.length === 0)) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 py-4">
        Nenhum material encontrado.
      </p>
    );
  }

  const lowStockIds = new Set(lowStockAlerts.map(alert => alert.id));

  return (
    <div className="overflow-x-auto shadow-md sm:rounded-lg">
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700">
          <tr>
            <th scope="col" className="px-6 py-3">
              Nome do Material
            </th>
            <th scope="col" className="px-6 py-3">
              Estoque Atual
            </th>
            <th scope="col" className="px-6 py-3">
              Nível Mínimo
            </th>
            <th scope="col" className="px-6 py-3">
              Unidade de Medida
            </th>
            <th scope="col" className="px-6 py-3 text-center">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {materiais.map(material => {
            const isLowStock = lowStockIds.has(material.id);
            return (
              <tr
                key={material.id}
                className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${isLowStock ? 'bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30' : 'bg-white dark:bg-gray-800'}`}
              >
                <th
                  scope="row"
                  className={`px-6 py-4 font-medium whitespace-nowrap ${isLowStock ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-900 dark:text-gray-200'}`}
                >
                  {material.nome}
                </th>
                <td
                  className={`px-6 py-4 ${isLowStock && parseFloat(material.quantidade_em_estoque) <= parseFloat(material.nivel_minimo_estoque) ? 'text-red-600 dark:text-red-400 font-bold' : 'text-gray-700 dark:text-gray-300'}`}
                >
                  {material.quantidade_em_estoque !== undefined
                    ? parseFloat(material.quantidade_em_estoque).toLocaleString(
                        'pt-BR'
                      )
                    : 'N/A'}
                </td>
                <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                  {material.nivel_minimo_estoque !== undefined
                    ? material.nivel_minimo_estoque
                    : 'N/A'}
                </td>
                <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                  {getUnidadeMedidaLabel(material.unidade_medida)}
                </td>
                <td className="px-6 py-4 text-center space-x-2">
                  <Link
                    to={`/materiais/${material.id}`}
                    title="Visualizar Detalhes"
                    aria-label="Visualizar Detalhes"
                    className="text-green-600 hover:text-green-800 disabled:text-gray-400 inline-block"
                  >
                    <Eye size={18} />
                  </Link>
                  <button
                    onClick={() => onEdit(material)}
                    className="text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                    disabled={isLoading}
                    aria-label="Editar Material"
                    title="Editar Material"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(material.id)}
                    className="text-red-600 hover:text-red-800 disabled:text-gray-400"
                    disabled={isLoading}
                    aria-label="Excluir Material"
                    title="Excluir Material"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MateriaisTable;
