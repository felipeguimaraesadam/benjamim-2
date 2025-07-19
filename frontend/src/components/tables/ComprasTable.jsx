import React from 'react';
import { Pencil, Trash2, Eye } from 'lucide-react';

const ComprasTable = ({ compras, onEdit, onDelete, onViewDetails, isLoading }) => {

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        // Similar to ObrasTable, ensure UTC treatment if date is just YYYY-MM-DD
        const date = new Date(dateString);
        const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
        return utcDate.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    };

    const formatCurrency = (value) => {
        if (value == null) return 'N/A';
        return parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // Display loading message if data is loading and table is empty
    if (isLoading && (!compras || compras.length === 0)) {
        return <p className="text-center text-gray-500 dark:text-gray-400 py-4">Carregando compras...</p>;
    }

    // Display message if no data is available after loading
    if (!isLoading && (!compras || compras.length === 0)) {
        return <p className="text-center text-gray-500 dark:text-gray-400 py-4">Nenhuma compra encontrada.</p>;
    }

    return (
        <div className="overflow-x-auto shadow-md sm:rounded-lg">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th scope="col" className="px-6 py-3">Itens</th>
                        <th scope="col" className="px-6 py-3">Obra</th>
                        <th scope="col" className="px-6 py-3">Custo Total</th>
                        <th scope="col" className="px-6 py-3">Fornecedor</th>
                        <th scope="col" className="px-6 py-3">Data da Compra</th>
                        <th scope="col" className="px-6 py-3 text-center">Detalhes</th>
                        <th scope="col" className="px-6 py-3 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {compras.map((compra) => (
                        <tr key={compra.id} className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200 whitespace-nowrap">
                                {`${compra.itens?.length || 0} itens`}
                            </td>
                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{compra.obra?.nome_obra || 'N/A'}</td>
                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{formatCurrency(compra.valor_total_liquido)}</td>
                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{compra.fornecedor}</td>
                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{formatDate(compra.data_compra)}</td>
                            <td className="px-6 py-4 text-center">
                                <button
                                    onClick={() => onViewDetails(compra)}
                                    className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:text-gray-400 dark:disabled:text-gray-600"
                                    disabled={isLoading}
                                    aria-label="Ver Detalhes"
                                    title="Ver Detalhes"
                                >
                                    <Eye size={18} />
                                </button>
                            </td>
                            <td className="px-6 py-4 text-center space-x-2">
                                <button
                                    onClick={() => onEdit(compra)}
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:text-gray-400 dark:disabled:text-gray-600"
                                    disabled={isLoading}
                                    aria-label="Editar Compra"
                                    title="Editar Compra"
                                >
                                    <Pencil size={18} />
                                </button>
                                <button
                                    onClick={() => onDelete(compra.id)}
                                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:text-gray-400 dark:disabled:text-gray-600"
                                    disabled={isLoading}
                                    aria-label="Excluir Compra"
                                    title="Excluir Compra"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ComprasTable;
