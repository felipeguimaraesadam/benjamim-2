import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../../services/api';
import { formatDateToDMY } from '../../utils/dateUtils';

const formatCurrency = value => {
  const number = parseFloat(value);
  if (isNaN(number)) return 'R$ 0,00';
  return number.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

const AccordionItem = ({ title, children, totalValue }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-4 px-2 text-left"
      >
        <span className="font-semibold text-lg text-gray-800 dark:text-gray-200">{title}</span>
        <div className="flex items-center">
            <span className="text-lg font-bold text-green-600 dark:text-green-400 mr-4">{formatCurrency(totalValue)}</span>
            <svg
                className={`w-6 h-6 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
        </div>
      </button>
      {isOpen && <div className="pb-4 px-2">{children}</div>}
    </div>
  );
};

const MaterialDetailModal = ({ obraId, onClose }) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async id => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getObraMateriaisDetail(id);
      setData(response.data);
    } catch (err) {
      console.error('Error fetching material details:', err);
      setError(err.message || 'Falha ao buscar detalhes de materiais.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (obraId) {
      fetchData(obraId);
    }
  }, [obraId, fetchData]);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!obraId) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 border-b pb-4 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Detalhes de Custo de Material
          </h2>
          <button onClick={onClose} aria-label="Fechar modal">
            <svg className="w-6 h-6 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto">
          {isLoading && <div className="text-center py-10">Carregando...</div>}
          {error && <div className="text-center py-10 text-red-500">Erro: {error}</div>}

          {data && !isLoading && !error && (
            Object.keys(data).length > 0 ? (
              Object.entries(data).map(([category, materials]) => (
                <AccordionItem
                  key={category}
                  title={category}
                  totalValue={materials.reduce((acc, mat) => acc + parseFloat(mat.total_valor), 0)}
                >
                  {materials.map(material => (
                    <div key={material.material_nome} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <h4 className="font-semibold text-md text-gray-700 dark:text-gray-300">{material.material_nome} - Total: {formatCurrency(material.total_valor)}</h4>
                      <div className="overflow-x-auto mt-2">
                        <table className="min-w-full text-sm">
                          <thead className="text-left text-gray-500 dark:text-gray-400">
                            <tr>
                              <th className="p-2">Data</th>
                              <th className="p-2">Fornecedor</th>
                              <th className="p-2">Qtd.</th>
                              <th className="p-2">Vlr. Unit.</th>
                              <th className="p-2">Vlr. Total</th>
                              <th className="p-2">Nota Fiscal</th>
                              <th className="p-2">Ação</th>
                            </tr>
                          </thead>
                          <tbody>
                            {material.compras.map(compra => (
                              <tr key={compra.compra_id} className="border-t border-gray-200 dark:border-gray-600">
                                <td className="p-2">{formatDateToDMY(compra.data_compra)}</td>
                                <td className="p-2">{compra.fornecedor}</td>
                                <td className="p-2">{compra.quantidade} {material.unidade_medida}</td>
                                <td className="p-2">{formatCurrency(compra.valor_unitario)}</td>
                                <td className="p-2">{formatCurrency(compra.valor_total_item)}</td>
                                <td className="p-2">{compra.nota_fiscal}</td>
                                <td className="p-2">
                                  <Link to={`/compras/${compra.compra_id}`} className="text-blue-500 hover:underline">Ver Compra</Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </AccordionItem>
              ))
            ) : (
              <div className="text-center py-10 text-gray-500">Nenhum dado de material encontrado.</div>
            )
          )}
        </div>

        <div className="mt-6 flex justify-end pt-4 border-t dark:border-gray-700">
          <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaterialDetailModal;
