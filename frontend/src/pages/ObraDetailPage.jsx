import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as api from '../services/api.js';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import DistribuicaoMaterialForm from '../components/forms/DistribuicaoMaterialForm';
import HistoricoUsoTable from '../components/tables/HistoricoUsoTable';
import ObraCompletaComprasTable from '../components/tables/ObraCompletaComprasTable';
import ObraDespesasExtrasTable from '../components/tables/ObraDespesasExtrasTable';

const ObraDetailPage = () => {
  const { id } = useParams(); // Get obra ID from URL
  const [obra, setObra] = useState(null);
  // const [compras, setCompras] = useState([]); // Placeholder, not fully implemented in this task
  // const [despesas, setDespesas] = useState([]); // Placeholder, not fully implemented in this task
  const [alocacoesEquipe, setAlocacoesEquipe] = useState([]);
  const [historicoCustos, setHistoricoCustos] = useState([]);
  const [custosCategoria, setCustosCategoria] = useState([]); // State for category costs (from obra.custos_por_categoria)
  const [custosMaterial, setCustosMaterial] = useState([]);   // State for material costs (Top Materiais chart)
  const [comprasEstoque, setComprasEstoque] = useState([]);
  const [usosMaterial, setUsosMaterial] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null); // General page error
  const [alocacaoError, setAlocacaoError] = useState(null); // Error for alocacao operations
  const [custosError, setCustosError] = useState(null);       // Error for historicoCustos chart
  const [categoriaError, setCategoriaError] = useState(null); // Error for custosCategoria chart
  const [materialError, setMaterialError] = useState(null);   // Error for custosMaterial chart
  const [showDistribuicaoModal, setShowDistribuicaoModal] = useState(false);
  const [activeTab, setActiveTab] = useState('equipes'); // Default tab
  const [todasCompras, setTodasCompras] = useState([]);
  const [despesasExtrasObra, setDespesasExtrasObra] = useState([]);
  const [todasComprasError, setTodasComprasError] = useState(null);
  const [despesasExtrasObraError, setDespesasExtrasObraError] = useState(null);


  const fetchObraData = async () => {
    setIsLoading(true);
    setError(null);
    setAlocacaoError(null);
    setCustosError(null);
    setCategoriaError(null);
    setMaterialError(null);
    setTodasComprasError(null);
    setDespesasExtrasObraError(null);
    try {
      // Fetch obra details
      const obraRes = await api.getObraById(id);
      setObra(obraRes.data);

      // Fetch alocacoes for this obra
      const alocacoesRes = await api.getAlocacoes({ obra_id: id });
      setAlocacoesEquipe(alocacoesRes.data || []);

      // Fetch cost history for this obra
      try {
        const custosRes = await api.getObraHistoricoCustos(id);
        setHistoricoCustos(custosRes.data || []);
      } catch (err) {
        console.error("Erro ao buscar histórico de custos:", err);
        setCustosError("Falha ao carregar histórico de custos.");
      }

      // Fetch custos por categoria
      try {
        const categoriaRes = await api.getObraCustosPorCategoria(id);
        setCustosCategoria(categoriaRes.data || []);
      } catch (err) {
        console.error("Erro ao buscar custos por categoria:", err);
        setCategoriaError("Falha ao carregar custos por categoria.");
      }

      // Fetch custos por material (for Top Materiais chart)
      try {
        const materialRes = await api.getObraCustosPorMaterial(id);
        setCustosMaterial(materialRes.data || []);
      } catch (err) {
        console.error("Erro ao buscar custos por material (Top Materiais):", err);
        setMaterialError("Falha ao carregar top materiais por custo.");
      }

      // Fetch Compras for the obra (for Estoque Atual)
      try {
        const comprasRes = await api.getCompras({ obra_id: id });
        const comprasComEstoque = comprasRes.data.filter(compra =>
          parseFloat(compra.quantidade_disponivel) > 0
        );
        setComprasEstoque(comprasComEstoque || []);
      } catch (err) {
        console.error("Erro ao buscar compras em estoque:", err);
        // Consider setting a specific error state for compras if needed
      }

      // Fetch Usos de Material for the obra
      try {
        const usosRes = await api.getUsosMaterial(id);
        setUsosMaterial(usosRes.data || []);
      } catch (err) {
        console.error("Erro ao buscar usos de material:", err);
        // Consider setting a specific error state for usos if needed
      }

      // Fetch all compras for "Todas as Compras" tab
      try {
        const todasComprasRes = await api.getCompras({ obra_id: id });
        setTodasCompras(todasComprasRes.data || []);
      } catch (err) {
        console.error("Erro ao buscar todas as compras:", err);
        setTodasComprasError("Falha ao carregar todas as compras.");
      }

      // Fetch despesas extras for "Despesas Extras" tab
      try {
        const despesasRes = await api.getDespesasExtras({ obra_id: id });
        setDespesasExtrasObra(despesasRes.data || []);
      } catch (err) {
        console.error("Erro ao buscar despesas extras:", err);
        setDespesasExtrasObraError("Falha ao carregar despesas extras.");
      }

    } catch (err) {
      setError(err.message || `Falha ao buscar dados da obra ${id}`);
      console.error("Fetch Obra Main Data Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchObraData();
  }, [id]);

  const handleRemoverAlocacao = async (alocacaoId) => {
    if (window.confirm('Tem certeza que deseja remover esta alocação de equipe?')) {
      try {
        setAlocacaoError(null); // Clear previous alocacao errors
        await api.deleteAlocacao(alocacaoId);
        // Refresh alocacoes list
        const alocacoesRes = await api.getAlocacoes({ obra_id: id });
        setAlocacoesEquipe(alocacoesRes.data || alocacoesRes);
      } catch (err) {
        const errMsg = err.response?.data?.detail || err.message || 'Falha ao remover alocação.';
        setAlocacaoError(errMsg);
        console.error("Delete Alocacao Error:", errMsg);
      } finally {
      }
    }
  };

  if (isLoading) return <div className="p-4"><p>Carregando detalhes da obra...</p></div>;
  if (error) return <div className="p-4"><p className="text-red-500">Erro ao carregar dados da obra: {error}</p></div>;
  if (!obra) return <div className="p-4"><p>Obra não encontrada.</p></div>;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  const handleOpenDistribuicaoModal = () => setShowDistribuicaoModal(true);
  const handleCloseDistribuicaoModal = () => setShowDistribuicaoModal(false);

  const handleSubmitDistribuicaoSuccess = () => {
    fetchObraData(); // Refresh all obra data, including estoque and usos
    // alert('Uso de material registrado com sucesso!'); // Basic feedback
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {showDistribuicaoModal && (
        <DistribuicaoMaterialForm
          obraId={id}
          onClose={handleCloseDistribuicaoModal}
          onSubmitSuccess={handleSubmitDistribuicaoSuccess}
          showModal={showDistribuicaoModal}
        />
      )}
      {/* Breadcrumbs or Back Link */}
      <div className="mb-6">
        <Link to="/obras" className="text-primary-600 hover:text-primary-700 transition duration-150 ease-in-out inline-flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Voltar para Obras
        </Link>
      </div>

      {/* Main Details Section */}
      <div className="bg-white shadow-xl rounded-lg p-6 mb-8">
        <div className="flex flex-wrap justify-between items-start mb-4">
          <h1 className="text-3xl font-bold text-gray-800">{obra.nome_obra}</h1>
          {/* Action Buttons Moved Up for better visibility */}
          <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
            <Link
              to="/obras"
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-3 rounded-md shadow-sm transition duration-150 ease-in-out text-xs"
            >
              Editar Obra (Lista)
            </Link>
            <Link
              to="/compras"
              state={{ obraIdParaNovaCompra: obra.id }}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-3 rounded-md shadow-sm transition duration-150 ease-in-out text-xs"
            >
              Adicionar Compra
            </Link>
            {/* "Alocar Equipe" button is effectively replaced by the section below, but can be kept if direct navigation is desired */}
            {/* <Link
              to="/alocacoes"
              state={{ obraIdParaNovaAlocacao: obra.id }}
              className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-3 rounded-md shadow-sm transition duration-150 ease-in-out text-xs"
            >
              Alocar Nova Equipe
            </Link> */}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-x-6 gap-y-4 mb-4 text-gray-700">
          <p><strong>Endereço:</strong> {obra.endereco_completo || `${obra.logradouro || ''}, ${obra.numero || ''}`}, {obra.bairro || ''}, {obra.cidade || ''} - {obra.estado || ''}, CEP: {obra.cep || ''}</p>
          <p><strong>Status:</strong> <span className={`px-3 py-1 text-sm font-semibold rounded-full ${obra.status === 'Em Andamento' ? 'bg-yellow-100 text-yellow-800' : obra.status === 'Concluída' ? 'bg-green-100 text-green-800' : obra.status === 'Planejada' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{obra.status}</span></p>
          <p><strong>Data de Início:</strong> {formatDate(obra.data_inicio)}</p>
          <p><strong>Previsão de Término:</strong> {formatDate(obra.data_prevista_fim)}</p>
          {obra.data_real_fim && <p><strong>Data de Conclusão:</strong> {formatDate(obra.data_real_fim)}</p>}
          <p><strong>Responsável:</strong> {obra.responsavel_nome || 'Não definido'}</p>
          <p><strong>Cliente:</strong> {obra.cliente_nome || 'Não definido'}</p>
        </div>
        {obra.descricao && (
          <div className="mt-4">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Descrição do Projeto</h2>
            <p className="text-gray-600 whitespace-pre-line">{obra.descricao}</p>
          </div>
        )}
      </div>

    {/* Dashboard Financeiro */}
    <div className="mb-8 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Dashboard Financeiro</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
      </div>
      <div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Composição dos Custos</h3>
        {obra.custos_por_categoria && (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={Object.entries(obra.custos_por_categoria)
                  .map(([name, value]) => ({ name, value: parseFloat(value) }))
                  .filter(entry => entry.value > 0) // Mostrar apenas categorias com valor
                }
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent, value }) => `${name} (${(percent * 100).toFixed(0)}%) - R$ ${value.toLocaleString('pt-BR')}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {Object.entries(obra.custos_por_categoria).filter(([name, value]) => parseFloat(value) > 0).map((entry, index) => (
                  <Cell key={`cell-comp-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'][index % 5]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>

    {/* Central de Ações Rápidas */}
    <div className="mb-8 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Ações Rápidas</h2>
      <button
        onClick={handleOpenDistribuicaoModal}
        className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out"
      >
        Distribuir Materiais (Registrar Uso)
      </button>
      {/* Placeholder for other actions */}
    </div>


    {/* Estoque Atual */}
    <div className="mb-8 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Estoque Atual (Materiais Disponíveis)</h2>
      {comprasEstoque.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Material</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Disponível</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Data Compra</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fornecedor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {comprasEstoque.map(compra => (
                <tr key={compra.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{compra.material_nome}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{parseFloat(compra.quantidade_disponivel).toLocaleString('pt-BR')} {compra.material_unidade_medida || ''}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{formatDate(compra.data_compra)}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{compra.fornecedor || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500">Nenhum material em estoque no momento.</p>
      )}
    </div>

    {/* Histórico de Uso de Materiais */}
    <div className="bg-white shadow-lg rounded-lg p-6 mt-6"> {/* Use a consistent container like others */}
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2">
        Histórico de Uso de Materiais
      </h2>
      <HistoricoUsoTable
        usosMaterial={usosMaterial}
        isLoading={isLoading}
        error={error} // Can pass general page error or a specific one if created for usos
      />
    </div>


    {/* Abas de Detalhamento */}
    <div className="mb-8">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('equipes')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'equipes'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Equipes Alocadas
          </button>
          <button
            onClick={() => setActiveTab('compras')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'compras'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Todas as Compras
          </button>
          <button
            onClick={() => setActiveTab('despesas')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'despesas'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Despesas Extras
          </button>
          {/* Adicionar mais abas conforme necessário */}
        </nav>
      </div>

      {/* Conteúdo das Abas */}
      <div className="py-6">
        {activeTab === 'equipes' && (
          <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-xl font-semibold text-gray-700">Equipes Alocadas</h2>
              <Link
                to="/alocacoes" // Assuming a page/modal to create new alocacoes
                state={{ obraIdParaNovaAlocacao: obra.id }}
                className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-1 px-3 rounded-md shadow-sm transition duration-150 ease-in-out text-xs"
              >
                + Alocar Nova Equipe/Serviço
              </Link>
            </div>
            {alocacaoError && <p className="text-red-500 text-sm mb-2">Erro: {alocacaoError}</p>}
            {alocacoesEquipe.length > 0 ? (
              <ul className="space-y-3">
                {alocacoesEquipe.map(aloc => (
                  <li key={aloc.id} className="p-3 bg-gray-50 rounded-md shadow-sm text-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        {aloc.equipe_nome ? (
                          <p className="font-semibold text-primary-700">Equipe: {aloc.equipe_nome}</p>
                        ) : (
                          <p className="font-semibold text-primary-700">Serviço Externo: {aloc.servico_externo || 'Não especificado'}</p>
                        )}
                        <p className="text-gray-600">De: {formatDate(aloc.data_alocacao_inicio)}</p>
                        <p className="text-gray-600">Até: {aloc.data_alocacao_fim ? formatDate(aloc.data_alocacao_fim) : 'Presente'}</p>
                      </div>
                      <button
                        onClick={() => handleRemoverAlocacao(aloc.id)}
                        className="text-red-500 hover:text-red-700 font-semibold py-1 px-2 rounded-md text-xs hover:bg-red-100 transition-colors"
                        title="Remover Alocação"
                      >
                        Remover
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (<p className="text-gray-500 text-sm">Nenhuma equipe ou serviço externo alocado para esta obra.</p>)}
          </div>
        )}

        {activeTab === 'compras' && (
          <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-xl font-semibold text-gray-700">Todas as Compras da Obra</h2>
                <Link
                    to="/compras" // Link to general compras page or a modal for new compra
                    state={{ obraIdParaNovaCompra: obra.id, obraNome: obra.nome_obra }} // Pass obraId and name
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-3 rounded-md shadow-sm transition duration-150 ease-in-out text-xs"
                >
                    + Adicionar Nova Compra
                </Link>
            </div>
            {todasComprasError && <p className="text-red-500 text-sm mb-2">Erro: {todasComprasError}</p>}
            <ObraCompletaComprasTable
                compras={todasCompras}
                isLoading={isLoading}
                error={todasComprasError}
            />
          </div>
        )}

        {activeTab === 'despesas' && (
          <div className="bg-white shadow-lg rounded-lg p-6">
             <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-xl font-semibold text-gray-700">Despesas Extras da Obra</h2>
                <Link
                    to="/despesas-extras" // Link to general despesas page or a modal
                    state={{ obraIdParaNovaDespesa: obra.id, obraNome: obra.nome_obra }} // Pass obraId and name
                    className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-1 px-3 rounded-md shadow-sm transition duration-150 ease-in-out text-xs"
                >
                    + Adicionar Despesa Extra
                </Link>
            </div>
            {despesasExtrasObraError && <p className="text-red-500 text-sm mb-2">Erro: {despesasExtrasObraError}</p>}
            <ObraDespesasExtrasTable
                despesas={despesasExtrasObra}
                isLoading={isLoading}
                error={despesasExtrasObraError}
            />
          </div>
        )}
      </div>
    </div>

    {/* Remaining charts can stay outside tabs or be moved into a 'Visão Geral' or 'Financeiro' tab later */}
    <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico Histórico de Custos Mensais */}
        <div className="bg-white shadow-lg rounded-lg p-6 lg:col-span-2"> {/* Making it full width for now */}
          <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Visão Geral: Histórico de Custos Mensais</h2>
          {custosError && <p className="text-red-500 text-sm mb-2">Erro: {custosError}</p>}
          {historicoCustos.length > 0 ? (
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

        {/* Gráfico Materiais Mais Caros - Pode ser movido para aba "Compras" ou "Análise" futuramente */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Visão Geral: Top Materiais por Custo</h2>
          {materialError && <p className="text-red-500 text-sm mb-2">Erro: {materialError}</p>}
          {custosMaterial.length > 0 ? (
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
      </div>
    </div>
  );
};
export default ObraDetailPage;
