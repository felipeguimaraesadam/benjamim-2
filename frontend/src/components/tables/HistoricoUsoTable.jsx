import React, { useState, useEffect } from 'react';

const HistoricoUsoTable = ({ usosMaterial, isLoading, error }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsos, setFilteredUsos] = useState([]);

  // Helper functions defined once, outside useEffect, but within component scope
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return 'N/A';
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getAndarLabel = (value) => {
    const choices = {
      'Terreo': 'Térreo',
      '1 Andar': '1º Andar',
      '2 Andar': '2º Andar',
      'Cobertura': 'Cobertura',
      'Area Externa': 'Área Externa',
      'Outro': 'Outro'
    };
    return choices[value] || value;
  };

  const getCategoriaLabel = (value) => {
    const choices = {
      'Geral': 'Geral',
      'Eletrica': 'Elétrica',
      'Hidraulica': 'Hidráulica',
      'Alvenaria': 'Alvenaria',
      'Acabamento': 'Acabamento',
      'Estrutura': 'Estrutura',
      'Uso da Equipe': 'Uso da Equipe'
    };
    return choices[value] || value;
  };

  useEffect(() => {
    if (isLoading || error || !usosMaterial) {
      setFilteredUsos([]);
      return;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = usosMaterial.filter(uso => {
      return (
        (uso.material_nome && uso.material_nome.toLowerCase().includes(lowerSearchTerm)) ||
        (uso.descricao && uso.descricao.toLowerCase().includes(lowerSearchTerm)) ||
        (uso.categoria_uso && getCategoriaLabel(uso.categoria_uso).toLowerCase().includes(lowerSearchTerm)) ||
        (uso.andar && getAndarLabel(uso.andar).toLowerCase().includes(lowerSearchTerm)) ||
        (uso.quantidade_usada && uso.quantidade_usada.toString().includes(lowerSearchTerm)) ||
        (uso.custo_proporcional && formatCurrency(uso.custo_proporcional).toLowerCase().includes(lowerSearchTerm)) ||
        (uso.data_uso && formatDate(uso.data_uso).includes(lowerSearchTerm))
      );
    });
    setFilteredUsos(filtered);
  }, [searchTerm, usosMaterial, isLoading, error]); // Dependencies for useEffect

  if (isLoading) {
    return <p className="text-center text-gray-500 py-4">Carregando histórico de uso...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500 py-4">Erro ao carregar histórico: {typeof error === 'string' ? error : error.message || 'Erro desconhecido'}</p>;
  }

  const dataToDisplay = searchTerm ? filteredUsos : (usosMaterial || []);

  if (!isLoading && !error && (!usosMaterial || usosMaterial.length === 0)) {
    return <p className="text-center text-gray-500 py-4">Nenhum registro de uso de material encontrado.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <h3 className="text-lg font-semibold text-gray-700">Registros de Uso</h3>
        <input
          type="text"
          placeholder="Buscar no histórico..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm w-full sm:w-72"
        />
      </div>
      <div className="overflow-x-auto shadow-md sm:rounded-lg">
        <table className="min-w-full w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3">Data</th>
              <th scope="col" className="px-4 py-3">Material</th>
              <th scope="col" className="px-4 py-3 text-right">Qtd. Usada</th>
              <th scope="col" className="px-4 py-3">Destino (Andar)</th>
              <th scope="col" className="px-4 py-3">Categoria</th>
              <th scope="col" className="px-4 py-3 text-right">Custo Proporcional</th>
              <th scope="col" className="px-4 py-3">Descrição</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dataToDisplay.map((uso) => (
              <tr key={uso.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap">{formatDate(uso.data_uso)}</td>
                <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{uso.material_nome || 'N/A'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-right">{parseFloat(uso.quantidade_usada || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td className="px-4 py-3 whitespace-nowrap">{getAndarLabel(uso.andar)}</td>
                <td className="px-4 py-3 whitespace-nowrap">{getCategoriaLabel(uso.categoria_uso)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-right">{formatCurrency(uso.custo_proporcional)}</td>
                <td className="px-4 py-3 text-gray-600 min-w-[200px] max-w-xs break-words whitespace-pre-wrap">{uso.descricao || '-'}</td>
              </tr>
            ))}
            {/* Message for no search results */}
            {searchTerm && dataToDisplay.length === 0 && !isLoading && !error && (
              <tr>
                <td colSpan="7" className="text-center py-4 text-gray-500">
                  Nenhum resultado encontrado para "{searchTerm}".
                </td>
              </tr>
            )}
            {/* Message when the table is empty but not due to search and not loading/error */}
            {!searchTerm && usosMaterial && usosMaterial.length > 0 && dataToDisplay.length === 0 && !isLoading && !error && (
                <tr>
                    <td colSpan="7" className="text-center py-4 text-gray-500">
                        Todos os registros foram filtrados ou não correspondem aos critérios.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoricoUsoTable;
