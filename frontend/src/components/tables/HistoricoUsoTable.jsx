import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const HistoricoUsoTable = ({ usosMaterial, isLoading, error }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  const categoriaUsoOptions = useMemo(() => {
    if (!usosMaterial) return [];
    const uniqueCategories = new Set(usosMaterial.map(uso => uso.categoria_uso));
    return ['', ...Array.from(uniqueCategories).sort()];
  }, [usosMaterial]);

  const filteredData = useMemo(() => {
    if (!usosMaterial) return [];
    return usosMaterial.filter(uso => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' ||
        uso.material_nome?.toLowerCase().includes(searchLower) ||
        uso.descricao?.toLowerCase().includes(searchLower) ||
        uso.andar?.toLowerCase().includes(searchLower) ||
        uso.categoria_uso?.toLowerCase().includes(searchLower);

      const matchesCategory = categoryFilter === '' || uso.categoria_uso === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [usosMaterial, searchTerm, categoryFilter]);

  const calculateCustoProporcional = (uso) => {
    const custoOriginal = parseFloat(uso.compra_original_custo);
    const qtdOriginal = parseFloat(uso.compra_original_quantidade);
    const qtdUsada = parseFloat(uso.quantidade_usada);

    if (isNaN(custoOriginal) || isNaN(qtdOriginal) || isNaN(qtdUsada) || qtdOriginal === 0) {
      return 0; // Or handle as error/NaN
    }
    return (custoOriginal / qtdOriginal) * qtdUsada;
  };


  if (isLoading) {
    return <div className="p-4 text-center text-gray-500">Carregando histórico de uso...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">Erro ao carregar histórico: {typeof error === 'string' ? error : error.message}</div>;
  }

  if (!usosMaterial || usosMaterial.length === 0) {
    return <div className="p-4 text-center text-gray-500">Nenhum uso de material registrado para esta obra.</div>;
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Buscar material, descrição, andar..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          {categoriaUsoOptions.map(cat => (
            <option key={cat || 'todos'} value={cat}>
              {cat === '' ? 'Todas as Categorias' : cat}
            </option>
          ))}
        </select>
      </div>

      {filteredData.length === 0 && !isLoading && (
         <div className="p-4 text-center text-gray-500">Nenhum registro encontrado com os filtros aplicados.</div>
      )}

      {filteredData.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Uso</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtde. Usada</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destino (Andar)</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria Uso</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custo Proporcional</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map(uso => {
                const custoProporcional = calculateCustoProporcional(uso);
                return (
                  <tr key={uso.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{formatDate(uso.data_uso)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{uso.material_nome || 'N/A'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {parseFloat(uso.quantidade_usada).toLocaleString('pt-BR')}
                      {' '}
                      {/* Assuming unit of measure is part of material_nome or needs another field */}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{uso.andar}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{uso.categoria_uso}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{formatCurrency(custoProporcional)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate" title={uso.descricao}>{uso.descricao || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

HistoricoUsoTable.propTypes = {
  usosMaterial: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    data_uso: PropTypes.string.isRequired,
    material_nome: PropTypes.string, // From serializer
    quantidade_usada: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    andar: PropTypes.string.isRequired,
    categoria_uso: PropTypes.string.isRequired,
    descricao: PropTypes.string,
    compra_original_custo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // From serializer
    compra_original_quantidade: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // From serializer
  })).isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
};

HistoricoUsoTable.defaultProps = {
  isLoading: false,
  error: null,
  usosMaterial: [], // Ensure it defaults to an empty array if not provided initially
};

export default HistoricoUsoTable;
