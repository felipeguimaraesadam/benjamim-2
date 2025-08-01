import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const CostCompositionChart = ({ custosPorCategoria }) => {
  if (!custosPorCategoria) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
        <p className="text-center text-gray-500 dark:text-gray-400 py-10">
          Dados de custos por categoria não disponíveis.
        </p>
      </div>
    );
  }

  const data = [
    { name: 'Materiais', value: parseFloat(custosPorCategoria.materiais) || 0 },
    {
      name: 'Mão de Obra/Serviços',
      value: parseFloat(custosPorCategoria.locacoes) || 0,
    },
    {
      name: 'Despesas Extras',
      value: parseFloat(custosPorCategoria.despesas_extras) || 0,
    },
  ].filter(item => item.value > 0); // Filter out zero values to avoid cluttering the chart

  // Cores consistentes com os cards do FinancialDashboard (ajustadas para bom visual em light/dark)
  // Teal, Indigo, Orange - Usando as cores base que o Tailwind usa para '500' ou '600'
  const COLORS = ['#14B8A6', '#6366F1', '#F97316']; // Teal-500, Indigo-500, Orange-500

  if (data.length === 0) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg h-full flex flex-col justify-center items-center min-h-[300px]">
        <h3 className="text-lg font-semibold mb-3 text-center text-gray-700 dark:text-gray-200">
          Composição dos Custos Totais
        </h3>
        <p className="text-center text-gray-500 dark:text-gray-400 py-10">
          Não há composição de custos para exibir.
        </p>
      </div>
    );
  }

  // Custom Label para o PieChart para melhor visualização e evitar sobreposição
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
    name,
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const textAnchor = x > cx ? 'start' : 'end';

    // Evita exibir o label se o percentual for muito pequeno
    if (percent * 100 < 5) {
      // Ex: não mostrar label para fatias menores que 5%
      return null;
    }

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={textAnchor}
        dominantBaseline="central"
        fontSize="12px"
        fontWeight="bold"
      >
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  return (
    // Card principal do gráfico
    <div className="p-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
      <h3 className="text-lg font-semibold mb-3 text-center text-gray-700 dark:text-gray-200">
        Composição dos Custos Totais
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={110}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={value =>
              `R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            }
            // Para o tooltip, o ideal é que ele se adapte. Recharts não facilita muito isso diretamente.
            // Uma abordagem é usar contentStyle para um fundo semi-transparente que funcione em ambos os modos,
            // ou criar um CustomTooltip que leia o tema.
            // Por simplicidade, vamos usar um estilo que seja aceitável em ambos, priorizando legibilidade.
            contentStyle={{
              backgroundColor: document.documentElement.classList.contains(
                'dark'
              )
                ? 'rgba(55, 65, 81, 0.9)'
                : 'rgba(255, 255, 255, 0.9)', // dark:bg-gray-700, light:bg-white com opacidade
              color: document.documentElement.classList.contains('dark')
                ? '#E5E7EB'
                : '#1F2937', // dark:text-gray-200, light:text-gray-800
              borderRadius: '0.375rem', // rounded-md
              boxShadow:
                '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // shadow-lg
            }}
            cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }} // Cor do cursor ao passar por cima
          />
          <Legend
            // Ajusta a cor do texto da legenda dinamicamente baseado no tema
            formatter={value => (
              <span
                style={{
                  color: document.documentElement.classList.contains('dark')
                    ? '#D1D5DB'
                    : '#374151',
                }}
              >
                {value}
              </span>
            )} // dark:text-gray-300, light:text-gray-700
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(CostCompositionChart);
