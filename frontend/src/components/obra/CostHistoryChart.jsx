import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CostHistoryChart = ({ historicoCustos, custosError }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6 lg:col-span-2">
      <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Visão Geral: Histórico de Custos Mensais</h2>
      {custosError && <p className="text-red-500 text-sm mb-2">Erro: {custosError}</p>}
      {historicoCustos && historicoCustos.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={historicoCustos} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis tickFormatter={(value) => `R$${value.toLocaleString('pt-BR')}`} />
            <Tooltip formatter={(value) => `R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
            <Legend />
            <Line type="monotone" dataKey="total_custo_compras" name="Compras" stroke="#8884d8" activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="total_custo_despesas" name="Despesas Extras" stroke="#82ca9d" activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="total_geral_mes" name="Custo Total Mensal" stroke="#ff7300" activeDot={{ r: 8 }} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        !custosError && <p className="text-gray-500 text-sm">Não há dados de custos mensais para exibir o histórico.</p>
      )}
    </div>
  );
};

export default React.memo(CostHistoryChart);
