import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CostCompositionChart = ({ custosPorCategoria }) => {
  if (!custosPorCategoria) {
    return <p className="text-center text-gray-500 py-10">Dados de custos por categoria não disponíveis.</p>;
  }

  const data = [
    { name: 'Materiais', value: parseFloat(custosPorCategoria.materiais) || 0 },
    { name: 'Mão de Obra/Serviços', value: parseFloat(custosPorCategoria.locacoes) || 0 },
    { name: 'Despesas Extras', value: parseFloat(custosPorCategoria.despesas_extras) || 0 },
  ].filter(item => item.value > 0); // Filter out zero values to avoid cluttering the chart

  // Cores consistentes com os cards do FinancialDashboard
  const COLORS = ['#14B8A6', '#6366F1', '#F97316']; // Teal, Indigo, Orange

  if (data.length === 0) {
    return <p className="text-center text-gray-500 py-10">Não há composição de custos para exibir.</p>;
  }

  return (
    <div className="p-4 bg-white shadow-lg rounded-lg">
      <h3 className="text-lg font-semibold mb-3 text-center text-gray-700">Composição dos Custos Totais</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(CostCompositionChart);
