import React from 'react';
import { Link } from 'react-router-dom';

const AllocatedTeamsList = ({ alocacoesEquipe, obraId, obraNome, onRemoverAlocacao, formatDate, alocacaoError, removingAlocacaoId, isLoading }) => {
  // Added removingAlocacaoId and isLoading to props
  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-xl font-semibold text-gray-700">Equipes Alocadas</h2>
        <Link
          to="/alocacoes" // Assuming a page/modal to create new alocacoes
          state={{ obraIdParaNovaAlocacao: obraId, obraNome: obraNome }}
          className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-1 px-3 rounded-md shadow-sm transition duration-150 ease-in-out text-xs"
        >
          + Alocar Nova Equipe/Serviço
        </Link>
      </div>
      {alocacaoError && <p className="text-red-500 text-sm mb-2">Erro: {alocacaoError}</p>}
      {alocacoesEquipe && alocacoesEquipe.length > 0 ? (
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
                  onClick={() => onRemoverAlocacao(aloc.id)}
                  className="text-red-500 hover:text-red-700 font-semibold py-1 px-2 rounded-md text-xs hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Remover Alocação"
                  disabled={removingAlocacaoId === aloc.id || isLoading} // Disable if this specific one is being removed OR if main list is loading
                >
                  {removingAlocacaoId === aloc.id ? 'Removendo...' : 'Remover'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (<p className="text-gray-500 text-sm">Nenhuma equipe ou serviço externo alocado para esta obra.</p>)}
    </div>
  );
};

export default React.memo(AllocatedTeamsList);
