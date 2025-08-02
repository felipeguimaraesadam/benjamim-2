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
  const formatCurrency = value => {
    const number = parseFloat(value);
    if (isNaN(number)) return 'R$ 0,00'; // Default or error state
    return number.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const custos = obra.custos_por_categoria || {};

  return (
    // O componente FinancialDashboard em si é um card grande.
    // Aplicando o padrão: fundo branco no light mode, cinza escuro (gray-800) no dark mode.
    <div className="mb-8 p-6 bg-white shadow-lg rounded-lg dark:bg-gray-800">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
        Dashboard Financeiro
      </h2>

      {/* First row of cards - estes são sub-cards dentro do FinancialDashboard */}
      {/* Eles manterão seus fundos coloridos no light mode, e no dark mode terão um fundo um pouco mais claro que o card principal do dashboard, ou uma variação da cor base.
          Para "fundo cinza e os cards brancos", se o FinancialDashboard já é um "card branco (dark:bg-gray-800)", os sub-cards devem ter um tratamento que os diferencie.
          Vou usar as cores base do light mode e aplicar um overlay escuro ou uma cor base esmaecida para o dark mode, mantendo a identidade da cor.
          Ou, mais simples e alinhado com "cards brancos", eles seriam bg-gray-50 dark:bg-gray-700/750 para se destacarem do dark:bg-gray-800 do dashboard.
          Optarei por manter as cores de destaque, mas ajustando o texto para contraste.
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card Orçamento Previsto */}
        <div className="p-4 bg-blue-100 rounded-lg shadow dark:bg-blue-500/30 dark:hover:bg-blue-500/40">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
            Orçamento Previsto
          </h3>
          <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
            {formatCurrency(obra.orcamento_previsto)}
          </p>
        </div>
        {/* Card Custo Total Realizado */}
        <div className="p-4 bg-red-100 rounded-lg shadow dark:bg-red-500/30 dark:hover:bg-red-500/40">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
            Custo Total Realizado
          </h3>
          <p className="text-xl font-bold text-red-900 dark:text-red-100">
            {formatCurrency(obra.custo_total_realizado)}
          </p>
        </div>
        {/* Card Balanço Financeiro */}
        <div
          className={`p-4 rounded-lg shadow ${
            parseFloat(obra.balanco_financeiro || 0) >= 0
              ? 'bg-green-100 dark:bg-green-500/30 dark:hover:bg-green-500/40'
              : 'bg-orange-100 dark:bg-orange-500/30 dark:hover:bg-orange-500/40'
          }`}
        >
          <h3
            className={`text-sm font-semibold ${
              parseFloat(obra.balanco_financeiro || 0) >= 0
                ? 'text-green-800 dark:text-green-200'
                : 'text-orange-800 dark:text-orange-200'
            }`}
          >
            Balanço Financeiro
          </h3>
          <p
            className={`text-xl font-bold ${
              parseFloat(obra.balanco_financeiro || 0) >= 0
                ? 'text-green-900 dark:text-green-100'
                : 'text-orange-900 dark:text-orange-100'
            }`}
          >
            {formatCurrency(obra.balanco_financeiro)}
          </p>
        </div>
        {/* Card Custo por m² */}
        <div className="p-4 bg-purple-100 rounded-lg shadow dark:bg-purple-500/30 dark:hover:bg-purple-500/40">
          <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-200">
            Custo por m²
          </h3>
          <p className="text-xl font-bold text-purple-900 dark:text-purple-100">
            {obra.custo_por_metro
              ? formatCurrency(obra.custo_por_metro)
              : 'N/A'}
          </p>
        </div>
      </div>

      {/* Second row of cards for cost breakdown */}
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-100 mb-3 mt-6">
        Detalhamento do Custo Realizado
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card Custo Total de Materiais */}
        <div className="p-4 bg-teal-100 rounded-lg shadow dark:bg-teal-500/30 dark:hover:bg-teal-500/40">
          <h4 className="text-sm font-semibold text-teal-800 dark:text-teal-200">
            Custo Total de Materiais
          </h4>
          <p className="text-xl font-bold text-teal-900 dark:text-teal-100">
            {formatCurrency(custos.materiais)}
          </p>
        </div>
        {/* Card Custo Mão de Obra/Serviços */}
        <div className="p-4 bg-indigo-100 rounded-lg shadow dark:bg-indigo-500/30 dark:hover:bg-indigo-500/40">
          <h4 className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">
            Custo Mão de Obra/Serviços
          </h4>
          <p className="text-xl font-bold text-indigo-900 dark:text-indigo-100">
            {formatCurrency(custos.locacoes)}
          </p>
        </div>
        {/* Card Custo de Despesas Extras */}
        <div className="p-4 bg-orange-100 rounded-lg shadow dark:bg-orange-500/30 dark:hover:bg-orange-500/40">
          <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-200">
            Custo de Despesas Extras
          </h4>
          <p className="text-xl font-bold text-orange-900 dark:text-orange-100">
            {formatCurrency(custos.despesas_extras)}
          </p>
        </div>
      </div>

      {/* The PieChart section for "Composição dos Custos" has been removed from this component. */}
      {/* It will be implemented directly in ObraDetailPage.jsx if needed there. */}
    </div>
  );
};

export default React.memo(FinancialDashboard);
