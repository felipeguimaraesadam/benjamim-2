import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as api from '../services/api.js'; // Corrected import

const ObraDetailPage = () => {
  const { id } = useParams(); // Get obra ID from URL
  const [obra, setObra] = useState(null);
  const [compras, setCompras] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [equipes, setEquipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // API call to get obra details
        const obraRes = await api.getObraById(id);
        setObra(obraRes.data);

        // Placeholder for related data - focusing on UI structure
        // For now, we use empty arrays as per subtask instructions.
        // Actual API calls like api.getComprasByObraId(id) would be added here later.
        setCompras([]); // Placeholder
        setDespesas([]); // Placeholder
        setEquipes([]); // Placeholder

      } catch (err) {
        setError(err.message || `Falha ao buscar detalhes da obra ${id}`);
        console.error("Fetch Obra Detail Error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (isLoading) return <div className="p-4"><p>Carregando detalhes da obra...</p></div>;
  if (error) return <div className="p-4"><p className="text-red-500">Erro: {error}</p></div>;
  if (!obra) return <div className="p-4"><p>Obra não encontrada.</p></div>;

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
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{obra.nome_obra}</h1>
        <div className="grid md:grid-cols-2 gap-x-6 gap-y-4 mb-4 text-gray-700">
          <p><strong>Endereço:</strong> {obra.endereco_completo || `${obra.logradouro}, ${obra.numero}`}, {obra.bairro}, {obra.cidade} - {obra.estado}, CEP: {obra.cep}</p>
          <p><strong>Status:</strong> <span className={`px-3 py-1 text-sm font-semibold rounded-full ${obra.status === 'Em Andamento' ? 'bg-yellow-100 text-yellow-800' : obra.status === 'Concluída' ? 'bg-green-100 text-green-800' : obra.status === 'Planejada' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{obra.status}</span></p>
          <p><strong>Data de Início:</strong> {new Date(obra.data_inicio).toLocaleDateString('pt-BR')}</p>
          <p><strong>Previsão de Término:</strong> {new Date(obra.data_prevista_fim).toLocaleDateString('pt-BR')}</p>
          {obra.data_real_fim && <p><strong>Data de Conclusão:</strong> {new Date(obra.data_real_fim).toLocaleDateString('pt-BR')}</p>}
          <p><strong>Responsável:</strong> {obra.responsavel_nome || 'Não definido'}</p>
          {/* Assuming responsavel_nome from a join, or just responsavel_id if not joined */}
          <p><strong>Cliente:</strong> {obra.cliente_nome || 'Não definido'}</p>
          {/* Assuming cliente_nome from a join, or just cliente_id if not joined */}
        </div>
        {obra.descricao && (
          <div className="mt-4">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Descrição do Projeto</h2>
            <p className="text-gray-600 whitespace-pre-line">{obra.descricao}</p>
          </div>
        )}
      </div>

      {/* Related Data Sections */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        {/* Compras Section */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Compras de Materiais</h2>
          {compras.length > 0 ? (
            <ul className="space-y-2 text-sm text-gray-600">{compras.map(c => <li key={c.id}>{c.material_nome}: {c.quantidade} {c.unidade_medida} - R$ {parseFloat(c.custo_total).toFixed(2)}</li>)}</ul>
          ) : (<p className="text-gray-500 text-sm">Nenhuma compra registrada para esta obra.</p>)}
        </div>

        {/* Despesas Extras Section */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Despesas Extras</h2>
          {despesas.length > 0 ? (
            <ul className="space-y-2 text-sm text-gray-600">{despesas.map(d => <li key={d.id}>{d.descricao}: R$ {parseFloat(d.valor).toFixed(2)} ({d.categoria})</li>)}</ul>
          ) : (<p className="text-gray-500 text-sm">Nenhuma despesa extra registrada.</p>)}
        </div>

        {/* Equipes Alocadas Section */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Equipes Alocadas</h2>
          {equipes.length > 0 ? (
            <ul className="space-y-2 text-sm text-gray-600">{equipes.map(e => <li key={e.id}>{e.nome_equipe} (Líder: {e.lider_nome || 'Não definido'})</li>)}</ul>
          ) : (<p className="text-gray-500 text-sm">Nenhuma equipe alocada para esta obra.</p>)}
        </div>
      </div>
      {/* Consider adding sections for Ocorrências, Alocações de Funcionários if relevant and APIs exist */}
    </div>
  );
};
export default ObraDetailPage;
