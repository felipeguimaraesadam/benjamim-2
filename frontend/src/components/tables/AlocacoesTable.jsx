import React from 'react';

const AlocacoesTable = ({ alocacoes, obras, equipes, onEdit, onDelete, isLoading }) => {
  const getObraNome = (obraId) => {
    const obra = obras && obras.find(o => o.id === obraId);
    return obra ? obra.nome_obra : 'N/A';
  };

  const getEquipeNome = (equipeId) => {
    const equipe = equipes && equipes.find(e => e.id === equipeId);
    return equipe ? equipe.nome_equipe : 'N/A';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return <div className="text-center py-4">Carregando alocações...</div>;
  }

  if (!alocacoes || alocacoes.length === 0) {
    return <div className="text-center py-4 text-gray-600">Nenhuma alocação encontrada.</div>;
  }

  return (
    <div className="overflow-x-auto shadow-md sm:rounded-lg">
      <table className="min-w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
          <tr>
            <th scope="col" className="px-6 py-3">Obra</th>
            <th scope="col" className="px-6 py-3">Equipe</th>
            <th scope="col" className="px-6 py-3">Data Início</th>
            <th scope="col" className="px-6 py-3">Data Fim</th>
            <th scope="col" className="px-6 py-3">Ações</th>
          </tr>
        </thead>
        <tbody>
          {alocacoes.map((alocacao) => (
            <tr key={alocacao.id} className="bg-white border-b hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{getObraNome(alocacao.obra)}</td>
              <td className="px-6 py-4">{getEquipeNome(alocacao.equipe)}</td>
              <td className="px-6 py-4">{formatDate(alocacao.data_alocacao_inicio)}</td>
              <td className="px-6 py-4">{formatDate(alocacao.data_alocacao_fim)}</td>
              <td className="px-6 py-4 flex space-x-2">
                <button
                  onClick={() => onEdit(alocacao)}
                  className="font-medium text-blue-600 hover:underline"
                >
                  Editar
                </button>
                <button
                  onClick={() => onDelete(alocacao.id)}
                  className="font-medium text-red-600 hover:underline"
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AlocacoesTable;
