import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TopMaterialsChart = ({ custosMaterial, materialError }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Visão Geral: Top Materiais por Custo</h2>
      {materialError && <p className="text-red-500 text-sm mb-2">Erro: {materialError}</p>}
      {custosMaterial && custosMaterial.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={custosMaterial.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={(value) => `R$${(value/1000).toLocaleString('pt-BR')}k`} />
            <YAxis dataKey="name" type="category" width={110} interval={0} />
            <Tooltip formatter={(value) => `R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
            <Legend />
            <Bar dataKey="value" name="Custo Total" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        !materialError && <p className="text-gray-500 text-sm">Nenhuma compra registrada para este gráfico.</p>
      )}
    </div>
  );
};

export default React.memo(TopMaterialsChart);
