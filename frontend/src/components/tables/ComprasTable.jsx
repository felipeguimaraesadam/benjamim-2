import React, { useState } from 'react';
import { Pencil, Trash2, Eye, CheckCircle, MoreVertical, Copy, ToggleLeft, ToggleRight } from 'lucide-react';
import ContextMenu from '../utils/ContextMenu';

const ComprasTable = ({
  compras,
  onEdit,
  onDelete,
  onViewDetails,
  onApprove,
  isLoading,
  onDuplicate,
  onToggleStatus,
}) => {
  const [contextMenu, setContextMenu] = useState(null);

  const handleContextMenu = (event, compra) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      compra: compra,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };
  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    // Similar to ObrasTable, ensure UTC treatment if date is just YYYY-MM-DD
    const date = new Date(dateString);
    const utcDate = new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    );
    return utcDate.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatCurrency = value => {
    if (value == null) return 'N/A';
    return parseFloat(value).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // Display loading message if data is loading and table is empty
  if (isLoading && (!compras || compras.length === 0)) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 py-4">
        Carregando compras...
      </p>
    );
  }

  // Display message if no data is available after loading
  if (!isLoading && (!compras || compras.length === 0)) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 py-4">
        Nenhuma compra encontrada.
      </p>
    );
  }

  const getContextMenuItems = (compra) => {
    if (!compra || !compra.id || typeof compra.tipo !== 'string') {
      // Return a default or empty set of items if compra is invalid
      return [
        { label: 'Visualizar', onClick: () => onViewDetails(compra), icon: <Eye size={16} /> },
        { label: 'Editar', onClick: () => onEdit(compra), icon: <Pencil size={16} /> },
        { label: 'Excluir', onClick: () => onDelete(compra.id), icon: <Trash2 size={16} /> },
      ];
    }
    const isOrcamento = compra.tipo.toUpperCase() === 'ORCAMENTO';
    const isPendente = compra.status_orcamento === 'PENDENTE';

    const items = [
      { label: 'Visualizar', onClick: () => onViewDetails(compra), icon: <Eye size={16} /> },
      { label: 'Editar', onClick: () => onEdit(compra), icon: <Pencil size={16} /> },
      { label: 'Duplicar', onClick: () => onDuplicate(compra), icon: <Copy size={16} /> },
      {
        label: isOrcamento ? 'Mudar para Compra' : 'Mudar para Orçamento',
        onClick: () => onToggleStatus(compra.id, 'tipo'),
        icon: isOrcamento ? <ToggleRight size={16} /> : <ToggleLeft size={16} />
      },
    ];

    if (isOrcamento) {
      if (isPendente) {
        items.push({ 
          label: 'Aprovar Orçamento',
          onClick: () => onApprove(compra.id),
          icon: <CheckCircle size={16} />
        });
      } else {
        items.push({
          label: 'Marcar como Pendente',
          onClick: () => onToggleStatus(compra.id, 'status'),
          icon: <ToggleLeft size={16} />
        });
      }
    }

    items.push({ label: 'Excluir', onClick: () => onDelete(compra.id), icon: <Trash2 size={16} /> });

    return items;
  };

  return (
    <div className="overflow-x-auto shadow-md sm:rounded-lg">
      {contextMenu && (
        <ContextMenu
          position={contextMenu}
          menuItems={getContextMenuItems(contextMenu.compra)}
          onClose={closeContextMenu}
        />
      )}
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700">
          <tr>
            <th scope="col" className="px-6 py-3">
              Itens
            </th>
            <th scope="col" className="px-6 py-3">
              Obra
            </th>
            <th scope="col" className="px-6 py-3">
              Custo Total
            </th>
            <th scope="col" className="px-6 py-3">
              Fornecedor
            </th>
            <th scope="col" className="px-6 py-3">
              Data
            </th>
            <th scope="col" className="px-6 py-3">
              Tipo
            </th>
            <th scope="col" className="px-6 py-3">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-center">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {compras.map(compra => {
            if (!compra || !compra.id) return null;
            const isOrcamento = typeof compra.tipo === 'string' && compra.tipo.toUpperCase() === 'ORCAMENTO';
            const isPendente = compra.status_orcamento === 'PENDENTE';
            const rowClass = isOrcamento
              ? 'bg-yellow-100 dark:bg-yellow-900'
              : 'bg-white dark:bg-gray-800';

            return (
              <tr
                key={compra.id}
                className={`${rowClass} border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700`}
                onContextMenu={(e) => handleContextMenu(e, compra)}
              >
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200 whitespace-nowrap">
                  {`${compra.itens?.length || 0} itens`}
                </td>
                <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                  {compra.obra_details?.nome_obra || 'N/A'}
                </td>
                <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                  {formatCurrency(compra.valor_total_liquido)}
                </td>
                <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                  {compra.fornecedor}
                </td>
                <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                  {formatDate(compra.data_compra)}
                </td>
                <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                  {compra.tipo}
                </td>
                <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                  {compra.status_orcamento || 'N/A'}
                </td>
                <td className="px-6 py-4 text-center flex items-center justify-center space-x-2">
                  <button
                    onClick={() => onViewDetails(compra)}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:text-gray-400 dark:disabled:text-gray-600"
                    disabled={isLoading}
                    aria-label="Ver Detalhes"
                    title="Ver Detalhes"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => onEdit(compra)}
                    className="text-blue-600 dark:text-blue-500 hover:text-blue-800 dark:hover:text-blue-400 disabled:text-gray-400 dark:disabled:text-gray-600"
                    disabled={isLoading}
                    aria-label="Editar Compra"
                    title="Editar Compra"
                  >
                    <Pencil size={18} />
                  </button>
                  {isOrcamento && isPendente && (
                    <button
                      onClick={() => onApprove(compra.id)}
                      className="text-green-600 dark:text-green-500 hover:text-green-800 dark:hover:text-green-400 disabled:text-gray-400 dark:disabled:text-gray-600"
                      disabled={isLoading}
                      aria-label="Aprovar Orçamento"
                      title="Aprovar Orçamento"
                    >
                      <CheckCircle size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(compra.id)}
                    className="text-red-600 dark:text-red-500 hover:text-red-800 dark:hover:text-red-400 disabled:text-gray-400 dark:disabled:text-gray-600"
                    disabled={isLoading}
                    aria-label="Excluir Compra"
                    title="Excluir Compra"
                  >
                    <Trash2 size={18} />
                  </button>
                  <button
                    onClick={(e) => handleContextMenu(e, compra)}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:text-gray-400 dark:disabled:text-gray-600"
                    disabled={isLoading}
                    aria-label="Mais Opções"
                    title="Mais Opções"
                  >
                    <MoreVertical size={18} />
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

export default ComprasTable;
