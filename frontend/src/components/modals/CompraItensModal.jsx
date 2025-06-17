import React from 'react';

const CompraItensModal = ({ isOpen, onClose, itens }) => {
    if (!isOpen) {
        return null;
    }

    const formatCurrency = (value) => {
        if (value == null || isNaN(Number(value))) {
            return 'N/A';
        }
        return parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Detalhes da Compra</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                        aria-label="Fechar modal"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {(!itens || itens.length === 0) ? (
                    <p className="text-center text-gray-500 py-4">Nenhum item encontrado para esta compra.</p>
                ) : (
                    <div className="overflow-x-auto shadow-md sm:rounded-lg">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Material</th>
                                    <th scope="col" className="px-6 py-3">Quantidade</th>
                                    <th scope="col" className="px-6 py-3">Valor Unitário</th>
                                    <th scope="col" className="px-6 py-3">Valor Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {itens.map((item, index) => (
                                    <tr key={item.id || index} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                            {item.material_nome || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4">{item.quantidade}</td>
                                        <td className="px-6 py-4">{formatCurrency(item.valor_unitario)}</td>
                                        <td className="px-6 py-4">{formatCurrency(item.valor_total_item)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CompraItensModal;
