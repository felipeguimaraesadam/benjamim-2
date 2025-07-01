import React from 'react';
// Recharts imports removed as the PieChart is being removed from this component
// import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const FinancialDashboard = ({ obra }) => {
  if (!obra) return null;
  // Debug log kept for general data inspection if needed elsewhere or for context
  console.log('[DEBUG] FinancialDashboard obra data:', obra);

  // Data preparation for the removed PieChart is no longer needed here
  // const custosCategoriaData = ...
  // const COLORS = ...

  // Helper to format currency, ensuring robustness
  const formatCurrency = (value) => {
    const number = parseFloat(value);
    if (isNaN(number)) return 'R$ 0,00'; // Default or error state
    return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const custos = obra.custos_por_categoria || {};

  return (
    <div className="mb-8 p-6 bg-white shadow-lg rounded-lg dark:bg-gray-800">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6">Dashboard Financeiro</h2>

      {/* First row of cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-blue-100 rounded-lg shadow dark:bg-blue-700">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-100">Orçamento Previsto</h3>
          <p className="text-xl font-bold text-blue-900 dark:text-white">{formatCurrency(obra.orcamento_previsto)}</p>
        </div>
        <div className="p-4 bg-red-100 rounded-lg shadow dark:bg-red-700">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-100">Custo Total Realizado</h3>
          <p className="text-xl font-bold text-red-900 dark:text-white">{formatCurrency(obra.custo_total_realizado)}</p>
        </div>
        <div className={`p-4 rounded-lg shadow ${parseFloat(obra.balanco_financeiro || 0) >= 0 ? 'bg-green-100 dark:bg-green-700' : 'bg-orange-100 dark:bg-orange-600'}`}>
          <h3 className={`text-sm font-semibold ${parseFloat(obra.balanco_financeiro || 0) >= 0 ? 'text-green-800 dark:text-green-100' : 'text-orange-800 dark:text-orange-100'}`}>Balanço Financeiro</h3>
          <p className={`text-xl font-bold ${parseFloat(obra.balanco_financeiro || 0) >= 0 ? 'text-green-900 dark:text-white' : 'text-orange-900 dark:text-white'}`}>
            {formatCurrency(obra.balanco_financeiro)}
          </p>
        </div>
        <div className="p-4 bg-purple-100 rounded-lg shadow dark:bg-purple-700">
          <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-100">Custo por m²</h3>
          <p className="text-xl font-bold text-purple-900 dark:text-white">
            {obra.custo_por_metro ? formatCurrency(obra.custo_por_metro) : 'N/A'}
          </p>
        </div>
      </div>

      {/* Second row of cards for cost breakdown */}
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3 mt-6">Detalhamento do Custo Realizado</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-teal-100 rounded-lg shadow dark:bg-teal-700">
          <h4 className="text-sm font-semibold text-teal-800 dark:text-teal-100">Custo Total de Materiais</h4>
          <p className="text-xl font-bold text-teal-900 dark:text-white">{formatCurrency(custos.materiais)}</p>
        </div>
        <div className="p-4 bg-indigo-100 rounded-lg shadow dark:bg-indigo-700">
          <h4 className="text-sm font-semibold text-indigo-800 dark:text-indigo-100">Custo Mão de Obra/Serviços</h4>
          <p className="text-xl font-bold text-indigo-900 dark:text-white">{formatCurrency(custos.locacoes)}</p>
        </div>
        <div className="p-4 bg-orange-100 rounded-lg shadow dark:bg-orange-600"> {/* Ajustado para orange-600 para melhor contraste no dark mode */}
          <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-100">Custo de Despesas Extras</h4>
          <p className="text-xl font-bold text-orange-900 dark:text-white">{formatCurrency(custos.despesas_extras)}</p>
        </div>
      </div>

      {/* The PieChart section for "Composição dos Custos" has been removed from this component. */}
      {/* It will be implemented directly in ObraDetailPage.jsx if needed there. */}
    </div>
  );
};

export default React.memo(FinancialDashboard);
