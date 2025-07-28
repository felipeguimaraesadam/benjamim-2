import React from 'react';
import { formatDateToDMY } from '../../utils/dateUtils.js'; // Corrected path
import { Link } from 'react-router-dom';

const MaterialPurchaseHistoryTable = ({ purchaseHistory }) => {
    if (!purchaseHistory || purchaseHistory.length === 0) {
        return <p className="text-gray-600 py-4">Nenhum histórico de compra encontrado para este material.</p>;
    }

    const formatCurrency = (value) => {
        if (value == null || isNaN(parseFloat(value))) return 'N/A';
        return parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
        <div className="overflow-x-auto shadow-md sm:rounded-lg mt-4">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                    <tr>
                        <th scope="col" className="px-6 py-3">Data Compra</th>
                        <th scope="col" className="px-6 py-3">Obra</th>
                        <th scope="col" className="px-6 py-3 text-right">Quantidade</th>
                        <th scope="col" className="px-6 py-3 text-right">Valor Unitário</th>
                        <th scope="col" className="px-6 py-3 text-right">Valor Total Item</th>
                    </tr>
                </thead>
                <tbody>
                    {purchaseHistory.map((item) => (
                        <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">{item.data_compra ? formatDateToDMY(item.data_compra) : 'N/A'}</td>
                            <td className="px-6 py-4">
                                {/*
                                  The ItemCompraHistorySerializer provides `obra_nome` directly.
                                  If `item.compra.obra_id` were available and linking desired:
                                  item.compra && item.compra.obra_id ? (
                                    <Link to={`/obras/${item.compra.obra_id}`} className="text-blue-600 hover:underline">
                                        {item.obra_nome || 'Ver Obra'}
                                    </Link>
                                  ) : (item.obra_nome || 'N/A')
                                */}
                                {item.obra_nome || 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-right">{item.quantidade}</td>
                            <td className="px-6 py-4 text-right">{formatCurrency(item.valor_unitario)}</td>
                            <td className="px-6 py-4 text-right">{formatCurrency(item.valor_total_item)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default MaterialPurchaseHistoryTable;
