import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const FinancialDashboard = ({ obra }) => {
  if (!obra) return null;
  console.log('[DEBUG] FinancialDashboard obra data:', obra);

  // Prepare data for PieChart, ensuring values are numbers and filtering out zero values
  const custosCategoriaData = obra?.custos_por_categoria ? // MODIFIED LINE
    Object.entries(obra.custos_por_categoria)
      .map(([name, value]) => ({ name, value: parseFloat(value) || 0 }))
      .filter(entry => entry.value > 0)
    : [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560', '#775DD0'];

  return (
    <div className="mb-8 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Dashboard Financeiro</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
      <div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Composição dos Custos</h3>
        {custosCategoriaData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={custosCategoriaData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent, value }) => `${name} (${(percent * 100).toFixed(0)}%) - R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {custosCategoriaData.map((entry, index) => (
                  <Cell key={`cell-comp-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500">Não há dados de composição de custos para exibir.</p>
        )}
      </div>
    </div>
  );
};

export default React.memo(FinancialDashboard);
