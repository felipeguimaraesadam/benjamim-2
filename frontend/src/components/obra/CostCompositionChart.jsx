import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CostCompositionChart = ({ custosPorCategoria }) => {
  if (!custosPorCategoria) {
    return <p className="text-center text-gray-500 dark:text-gray-400 py-10">Dados de custos por categoria não disponíveis.</p>;
  }

  const data = [
    { name: 'Materiais', value: parseFloat(custosPorCategoria.materiais) || 0 },
    { name: 'Mão de Obra/Serviços', value: parseFloat(custosPorCategoria.locacoes) || 0 },
    { name: 'Despesas Extras', value: parseFloat(custosPorCategoria.despesas_extras) || 0 },
  ].filter(item => item.value > 0); // Filter out zero values to avoid cluttering the chart

  // Cores consistentes com os cards do FinancialDashboard (ajustadas para bom visual em light/dark)
  // Teal, Indigo, Orange - Usando as cores base que o Tailwind usa para '500' ou '600'
  const COLORS = ['#14B8A6', '#6366F1', '#F97316']; // Teal-500, Indigo-500, Orange-500

  if (data.length === 0) {
    return <p className="text-center text-gray-500 dark:text-gray-400 py-10">Não há composição de custos para exibir.</p>;
  }

  // Custom Label para o PieChart para melhor visualização e evitar sobreposição
    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const textAnchor = x > cx ? 'start' : 'end';

    // Evita exibir o label se o percentual for muito pequeno
    if ((percent * 100) < 5) { // Ex: não mostrar label para fatias menores que 5%
        return null;
    }

    return (
        <text x={x} y={y} fill="white" textAnchor={textAnchor} dominantBaseline="central" fontSize="12px" fontWeight="bold">
            {`${name} (${(percent * 100).toFixed(0)}%)`}
        </text>
    );
    };


  return (
    <div className="p-4 bg-white shadow-lg rounded-lg dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-3 text-center text-gray-700 dark:text-gray-200">Composição dos Custos Totais</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            // label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} // Label padrão
            label={renderCustomizedLabel} // Usando label customizado
            outerRadius={110} // Aumentado um pouco o raio
            fill="#8884d8" // Cor de fallback, cada Cell terá sua cor
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => `R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', color: '#333' }} // Estilo do tooltip para light mode
            // Para dark mode, o Recharts não tem um suporte tão direto via props, pode precisar de CSS global ou wrapper
          />
          <Legend
             formatter={(value, entry, index) => <span style={{ color: document.documentElement.classList.contains('dark') ? '#E5E7EB' : '#4B5563' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(CostCompositionChart);
