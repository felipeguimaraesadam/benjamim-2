import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import SpinnerIcon from '../utils/SpinnerIcon';

const DailyCostChart = ({
  title,
  data,
  isLoading,
  error,
  dataKey = 'total_cost',
  hasDataKey = 'has_data',
  yAxisLabel = 'Custo (R$)',
  chartMode,
  chartDate,
}) => {
  const formatDateTick = tickItem => {
    const date = new Date(tickItem + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const formatTooltipLabel = label => {
    const date = new Date(label + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTooltipValue = (value, name, props) => {
    if (
      props.payload[dataKey] === 0 &&
      props.payload[hasDataKey] === false
    ) {
      return ['Sem dados', 'Status'];
    }
    const formattedValue = `R$ ${parseFloat(value).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
    return [formattedValue, 'Custo Total'];
  };

  const dataMax = data.length > 0 ? Math.max(...data.map(d => d[dataKey])) : 0;
  const yAxisDomainMax = dataMax > 0 ? dataMax + dataMax * 0.1 : 100;

  const displayData = data.map(entry => {
    if (entry[dataKey] === 0 && entry[hasDataKey] === false) {
      return { ...entry, barValue: yAxisDomainMax };
    }
    return { ...entry, barValue: entry[dataKey] };
  });

  const getChartSubtitle = () => {
    if (chartMode === 'monthly') {
      return chartDate.toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
      });
    }
    return 'Últimos 30 dias';
  };

  return (
    <div className="mb-8 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow bg-white dark:bg-gray-800">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
            {title}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {getChartSubtitle()}
          </p>
        </div>
      </div>
      {isLoading && (
        <p className="text-center text-gray-500 dark:text-gray-400">
          <SpinnerIcon className="w-6 h-6 inline mr-2" />
          Carregando gráfico...
        </p>
      )}
      {error && (
        <div
          className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-200 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Erro no gráfico: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      {!isLoading && !error && data.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400">
          Nenhum dado encontrado para o período ou filtro selecionado.
        </p>
      )}
      {!isLoading && !error && data.length > 0 && (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={displayData}
            margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateTick}
              label={{
                value: 'Data (Últimos 30 dias)',
                position: 'insideBottom',
                offset: -15,
                dy: 10,
                fontSize: 12,
              }}
              interval={data.length > 15 ? Math.floor(data.length / 15) : 0}
              angle={data.length > 20 ? -30 : 0}
              textAnchor={data.length > 20 ? 'end' : 'middle'}
              height={50}
            />
            <YAxis
              label={{
                value: yAxisLabel,
                angle: -90,
                position: 'insideLeft',
                fontSize: 12,
              }}
              tickFormatter={value => parseFloat(value).toLocaleString('pt-BR')}
              domain={[0, yAxisDomainMax]}
            />
            <Tooltip
              labelFormatter={formatTooltipLabel}
              formatter={formatTooltipValue}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="barValue" name="Custo Total Diário">
              {displayData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry[dataKey] === 0 && entry[hasDataKey] === false
                      ? '#FFCA28'
                      : '#8884d8'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default DailyCostChart;
