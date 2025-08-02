import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import * as api from '../services/api.js';
import { formatDateToDMY } from '../utils/dateUtils.js';
import { useApiData } from '../hooks/useApiData';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';

import ObraDetailHeader from '../components/obra/ObraDetailHeader';
import FinancialDashboard from '../components/obra/FinancialDashboard';
import CostHistoryChart from '../components/obra/CostHistoryChart';
import TopMaterialsChart from '../components/obra/TopMaterialsChart';
import ObraPurchasesTabContent from '../components/obra/ObraPurchasesTabContent';
import ObraExpensesTabContent from '../components/obra/ObraExpensesTabContent';
import ObraGaleria from '../components/obra/ObraGaleria';
import ObraFotosUpload from '../components/obra/ObraFotosUpload';


const ObraDetailPage = () => {
  const { id } = useParams();

  // Single, consolidated data fetch for the entire page
  const { data: obra, isLoading, error, fetchData: fetchObraDetails } = useApiData(api.getObraById, id);

  // UI State
  const [operationStatus, setOperationStatus] = useState({ type: '', message: '' });
  const [latestUploadedFoto, setLatestUploadedFoto] = useState(null);

  // Effect to clear operation status messages after a few seconds
  useEffect(() => {
    if (operationStatus.message) {
      const timer = setTimeout(() => setOperationStatus({ type: '', message: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [operationStatus]);

  // Callback for when a photo is successfully uploaded
  const handlePhotoUploaded = (newFotoData) => {
    setLatestUploadedFoto(newFotoData);
    setOperationStatus({ type: 'success', message: 'Foto enviada com sucesso!' });
  };

  // Flatten the purchases data for the table component
  const comprasFlat = useMemo(() => {
    if (!obra?.compras) return [];
    return obra.compras.flatMap(compra =>
      compra.itens.map(item => ({
        ...item,
        compra_id: compra.id, // Add compra_id for linking
        data_compra: compra.data_compra,
        fornecedor: compra.fornecedor,
        nota_fiscal: compra.nota_fiscal,
        custo_total: item.valor_total_item,
        // Add a unique key for the row
        row_id: `compra-${compra.id}-item-${item.id}`,
      }))
    );
  }, [obra]);

  // Main loading/error display
  if (isLoading) return <div className="p-4 text-center"><p>Carregando detalhes da obra...</p></div>;
  if (error) return <div className="p-4 text-center"><p className="text-red-500">Erro ao carregar dados da obra: {error}</p></div>;
  if (!obra) return <div className="p-4 text-center"><p>Obra não encontrada.</p></div>;

  // Data for charts is now taken directly from the 'obra' object
  const orcamentoVsGastoData = [
      { name: 'Orçamento Previsto', value: parseFloat(obra.orcamento_previsto) || 0 },
      { name: 'Custo Total Realizado', value: parseFloat(obra.custo_total_realizado) || 0 },
  ];

  const composicaoGastosData = obra.custos_por_categoria ? [
      { name: 'Materiais', value: parseFloat(obra.custos_por_categoria.materiais) || 0 },
      { name: 'Mão de Obra', value: parseFloat(obra.custos_por_categoria.locacoes) || 0 },
      { name: 'Despesas Extras', value: parseFloat(obra.custos_por_categoria.despesas_extras) || 0 },
  ].filter(item => item.value > 0) : [];

  const gastosPorCategoriaMaterialData = obra.gastos_por_categoria_material_obra ?
      Object.entries(obra.gastos_por_categoria_material_obra).map(([key, value]) => ({
          name: key,
          value: parseFloat(value) || 0,
      })).filter(entry => entry.value > 0)
      : [];

  // Colors for charts
  const COLORS_PIE_OBRA = ['#0088FE', '#FF8042'];
  const COLORS_CATEGORIES_OBRA = ['#8884d8', '#82ca9d', '#ffc658', '#FF8042', '#0088FE', '#00C49F', '#FFBB28', '#FF7777'];


  return (
    <div className="container mx-auto px-4 py-6">
      {operationStatus.message && (
        <div className={`p-3 my-4 rounded-md text-sm shadow ${operationStatus.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}`} role="alert">
            {operationStatus.message}
        </div>
      )}

      <ObraDetailHeader obra={obra} formatDate={formatDateToDMY} />

      <FinancialDashboard obra={obra} />

      {/* Detailed Financial Analysis Section */}
      <div className="my-8 p-4 bg-gray-50 shadow-md rounded-lg">
          <h2 className="text-xl font-bold mb-6 text-gray-700 text-center">Análise Financeira Detalhada da Obra</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* Chart 1: Orçamento vs. Gasto Total */}
              <div className="p-4 bg-white shadow-lg rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 text-center text-gray-600">Orçamento vs. Gasto Total</h3>
                  {orcamentoVsGastoData.some(d => d.value > 0) ? (
                      <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                              <Pie data={orcamentoVsGastoData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                                  {orcamentoVsGastoData.map((entry, index) => (
                                      <Cell key={`cell-ovg-${index}`} fill={COLORS_PIE_OBRA[index % COLORS_PIE_OBRA.length]} />
                                  ))}
                              </Pie>
                              <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                              <Legend />
                          </PieChart>
                      </ResponsiveContainer>
                  ) : <p className="text-center text-gray-500 py-10">Dados insuficientes.</p>}
              </div>

              {/* Chart 2: Composição dos Gastos */}
              <div className="p-4 bg-white shadow-lg rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 text-center text-gray-600">Composição dos Gastos</h3>
                  {composicaoGastosData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={composicaoGastosData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                              <YAxis type="category" dataKey="name" width={100} interval={0} />
                              <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                              <Legend />
                              <Bar dataKey="value" name="Custo" fill="#82ca9d">
                                  {composicaoGastosData.map((entry, index) => (
                                      <Cell key={`cell-cg-${index}`} fill={COLORS_CATEGORIES_OBRA[index % COLORS_CATEGORIES_OBRA.length]} />
                                  ))}
                              </Bar>
                          </BarChart>
                      </ResponsiveContainer>
                  ) : <p className="text-center text-gray-500 py-10">Não há composição de gastos para exibir.</p>}
              </div>

              {/* Chart 3: Gastos por Categoria de Material */}
              <div className="p-4 bg-white shadow-lg rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 text-center text-gray-600">Gastos por Categoria de Material</h3>
                   {gastosPorCategoriaMaterialData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                              <Pie data={gastosPorCategoriaMaterialData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#ffc658" labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                                  {gastosPorCategoriaMaterialData.map((entry, index) => (
                                      <Cell key={`cell-gcm-${index}`} fill={COLORS_CATEGORIES_OBRA[index % COLORS_CATEGORIES_OBRA.length]} />
                                  ))}
                              </Pie>
                              <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                              <Legend wrapperStyle={{ overflowY: 'auto', maxHeight: 60 }}/>
                          </PieChart>
                      </ResponsiveContainer>
                  ) : <p className="text-center text-gray-500 py-10">Não há gastos por categoria de material para exibir.</p>}
              </div>
          </div>
      </div>

      {/* Other content sections */}
      <div className="mb-8 py-6">
        <ObraPurchasesTabContent
          todasCompras={comprasFlat}
          isLoading={isLoading}
          obraId={obra.id}
          obraNome={obra.nome_obra}
        />

        <div className="my-6">
          <ObraFotosUpload obraId={id} onUploadSuccess={handlePhotoUploaded} />
          <ObraGaleria obraId={id} newFoto={latestUploadedFoto} />
        </div>

        <ObraExpensesTabContent
          despesasExtrasObra={obra.despesas_extras || []}
          isLoading={isLoading}
          obraId={obra.id}
          obraNome={obra.nome_obra}
        />
      </div>

      <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <CostHistoryChart historicoCustos={obra.historico_custos || []} isLoading={isLoading} />
        <TopMaterialsChart custosMaterial={obra.top_materiais || []} isLoading={isLoading} />
      </div>
    </div>
  );
};
export default ObraDetailPage;
