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

  return (
    <div className="mb-8 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Dashboard Financeiro</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"> {/* Adjusted to md:grid-cols-4 to potentially make cards larger, or keep as is if layout is fine */}
        <div className="p-4 bg-blue-100 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-blue-800">Orçamento Previsto</h3>
          <p className="text-2xl text-blue-900">R$ {parseFloat(obra.orcamento_previsto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="p-4 bg-red-100 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-red-800">Custo Total Realizado</h3>
          <p className="text-2xl text-red-900">R$ {parseFloat(obra.custo_total_realizado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className={`p-4 rounded-lg shadow ${parseFloat(obra.balanco_financeiro || 0) >= 0 ? 'bg-green-100' : 'bg-orange-100'}`}>
          <h3 className={`text-lg font-semibold ${parseFloat(obra.balanco_financeiro || 0) >= 0 ? 'text-green-800' : 'text-orange-800'}`}>Balanço Financeiro</h3>
          <p className={`text-2xl ${parseFloat(obra.balanco_financeiro || 0) >= 0 ? 'text-green-900' : 'text-orange-900'}`}>
            R$ {parseFloat(obra.balanco_financeiro || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="p-4 bg-purple-100 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-purple-800">Custo por m²</h3>
          <p className="text-2xl text-purple-900">
            {obra.custo_por_metro ? parseFloat(obra.custo_por_metro).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'N/A'}
          </p>
        </div>
      </div>
      {/* The PieChart section for "Composição dos Custos" has been removed from this component. */}
      {/* It will be implemented directly in ObraDetailPage.jsx if needed there. */}
    </div>
  );
};

export default React.memo(FinancialDashboard);
