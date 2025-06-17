import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

const ComprasTable = ({ compras, onEdit, onDelete, isLoading }) => {

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
        return <p className="text-center text-gray-500 py-4">Carregando compras...</p>;
    }

    // Display message if no data is available after loading
    if (!isLoading && (!compras || compras.length === 0)) {
        return <p className="text-center text-gray-500 py-4">Nenhuma compra encontrada.</p>;
    }

    return (
        <div className="overflow-x-auto shadow-md sm:rounded-lg">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3">Material</th>
                        <th scope="col" className="px-6 py-3">Obra</th>
                        <th scope="col" className="px-6 py-3">Quantidade</th>
                        <th scope="col" className="px-6 py-3">Custo Total</th>
                        <th scope="col" className="px-6 py-3">Fornecedor</th>
                        <th scope="col" className="px-6 py-3">Data da Compra</th>
                        <th scope="col" className="px-6 py-3 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {compras.map((compra) => (
                        <tr key={compra.id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                {compra.material?.nome || 'N/A'}
                                {compra.material?.unidade_medida && ` (${compra.material.unidade_medida})`}
                            </td>
                            <td className="px-6 py-4">{compra.obra?.nome_obra || 'N/A'}</td>
                            <td className="px-6 py-4">{compra.quantidade}</td>
                            <td className="px-6 py-4">{formatCurrency(compra.custo_total)}</td>
                            <td className="px-6 py-4">{compra.fornecedor}</td>
                            <td className="px-6 py-4">{formatDate(compra.data_compra)}</td>
                            <td className="px-6 py-4 text-center space-x-2">
                                <button
                                    onClick={() => onEdit(compra)}
                                    className="text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                                    disabled={isLoading}
                                    aria-label="Editar Compra"
                                    title="Editar Compra"
                                >
                                    <Pencil size={18} />
                                </button>
                                <button
                                    onClick={() => onDelete(compra.id)}
                                    className="text-red-600 hover:text-red-800 disabled:text-gray-400"
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
