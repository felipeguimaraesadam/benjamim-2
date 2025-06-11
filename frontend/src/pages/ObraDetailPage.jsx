import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as api from '../services/api.js'; // Corrected import

const ObraDetailPage = () => {
  const { id } = useParams(); // Get obra ID from URL
  const { id } = useParams(); // Get obra ID from URL
  const [obra, setObra] = useState(null);
  const [compras, setCompras] = useState([]); // Assuming you might fetch these later
  const [despesas, setDespesas] = useState([]); // Assuming you might fetch these later
  const [alocacoesEquipe, setAlocacoesEquipe] = useState([]); // State for allocated teams
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alocacaoError, setAlocacaoError] = useState(null); // Separate error state for alocacao operations

  const fetchObraData = async () => {
    setIsLoading(true);
    setError(null);
    setAlocacaoError(null);
    try {
      const obraRes = await api.getObraById(id);
      setObra(obraRes.data);

      // Fetch alocacoes for this obra
      const alocacoesRes = await api.getAlocacoes({ obra_id: id });
      setAlocacoesEquipe(alocacoesRes.data || alocacoesRes);

      // Placeholder for other related data, can be fetched similarly
      setCompras([]);
      setDespesas([]);

    } catch (err) {
      setError(err.message || `Falha ao buscar detalhes da obra ${id}`);
      console.error("Fetch Obra Detail Error:", err);
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

  return (
    <div className="container mx-auto px-4 py-6">
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

      {/* Related Data Sections Grid */}
      <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Equipes Alocadas Section */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-xl font-semibold text-gray-700">Equipes Alocadas</h2>
            <Link
              to="/alocacoes"
              state={{ obraIdParaNovaAlocacao: obra.id }}
              className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-1 px-3 rounded-md shadow-sm transition duration-150 ease-in-out text-xs"
            >
              + Alocar Nova Equipe
            </Link>
          </div>
          {alocacaoError && <p className="text-red-500 text-sm mb-2">Erro: {alocacaoError}</p>}
          {alocacoesEquipe.length > 0 ? (
            <ul className="space-y-3">
              {alocacoesEquipe.map(aloc => (
                <li key={aloc.id} className="p-3 bg-gray-50 rounded-md shadow-sm text-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-primary-700">{aloc.equipe_nome || 'Equipe não informada'}</p>
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
          ) : (<p className="text-gray-500 text-sm">Nenhuma equipe alocada para esta obra.</p>)}
        </div>

        {/* Compras Section Placeholder (can be expanded similarly) */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Compras de Materiais</h2>
          {/* Link to add compra can be here too if preferred */}
          {compras.length > 0 ? (
            <ul className="space-y-2 text-sm text-gray-600">{compras.map(c => <li key={c.id}>{c.material_nome}: {c.quantidade} {c.unidade_medida} - R$ {parseFloat(c.custo_total).toFixed(2)}</li>)}</ul>
          ) : (<p className="text-gray-500 text-sm">Nenhuma compra registrada para esta obra (dados de exemplo).</p>)}
        </div>

        {/* Despesas Extras Section Placeholder (can be expanded similarly) */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Despesas Extras</h2>
          {despesas.length > 0 ? (
            <ul className="space-y-2 text-sm text-gray-600">{despesas.map(d => <li key={d.id}>{d.descricao}: R$ {parseFloat(d.valor).toFixed(2)} ({d.categoria})</li>)}</ul>
          ) : (<p className="text-gray-500 text-sm">Nenhuma despesa extra registrada (dados de exemplo).</p>)}
        </div>

      </div>
    </div>
  );
};
export default ObraDetailPage;
