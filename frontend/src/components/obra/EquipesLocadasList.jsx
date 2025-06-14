import React from 'react';
import { Link } from 'react-router-dom';

const EquipesLocadasList = ({ locacoesEquipe, obraId, obraNome, onRemoverLocacao, formatDate, locacaoError, removingLocacaoId, isLoading }) => {
  // Added removingLocacaoId and isLoading to props
  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-xl font-semibold text-gray-700">Equipes Locadas</h2>
        <Link
          to="/locacoes" // Assuming a page/modal to create new locacoes
          state={{ obraIdParaNovaAlocacao: obraId, obraNome: obraNome }}
          className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-1 px-3 rounded-md shadow-sm transition duration-150 ease-in-out text-xs"
        >
          + Locar Nova Equipe/Serviço
        </Link>
      </div>
      {locacaoError && <p className="text-red-500 text-sm mb-2">Erro: {locacaoError}</p>}
      {locacoesEquipe && locacoesEquipe.length > 0 ? (
        <ul className="space-y-3">
          {locacoesEquipe.map(loc => (
            <li key={loc.id} className="p-3 bg-gray-50 rounded-md shadow-sm text-sm">
              <div className="flex justify-between items-start">
                <div>
                  {loc.equipe_nome ? (
                    <p className="font-semibold text-primary-700">Equipe: {loc.equipe_nome}</p>
                  ) : (
                    <p className="font-semibold text-primary-700">Serviço Externo: {loc.servico_externo || 'Não especificado'}</p>
                  )}
                  <p className="text-gray-600">De: {formatDate(loc.data_locacao_inicio)}</p>
                  <p className="text-gray-600">Até: {loc.data_locacao_fim ? formatDate(loc.data_locacao_fim) : 'Presente'}</p>
                </div>
                <button
                  onClick={() => onRemoverLocacao(loc.id)}
                  className="text-red-500 hover:text-red-700 font-semibold py-1 px-2 rounded-md text-xs hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Remover Locação"
                  disabled={removingLocacaoId === loc.id || isLoading} // Disable if this specific one is being removed OR if main list is loading
                >
                  {removingLocacaoId === loc.id ? 'Removendo...' : 'Remover'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (<p className="text-gray-500 text-sm">Nenhuma equipe ou serviço externo locado para esta obra.</p>)}
    </div>
  );
};

export default React.memo(EquipesLocadasList);
