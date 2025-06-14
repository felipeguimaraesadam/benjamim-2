import React from 'react';
import { Link } from 'react-router-dom';

const formatTipoPagamento = (tipo) => {
  if (!tipo) return 'N/A';
  switch (tipo) {
    case 'diaria': return 'Diária';
    case 'metro': return 'Por Metro';
    case 'empreitada': return 'Empreitada';
    default: return tipo.charAt(0).toUpperCase() + tipo.slice(1);
  }
};

const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'N/A';
  const number = parseFloat(value);
  if (isNaN(number)) return 'N/A';
  return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const getLocacaoStatusInfo = (locacao) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parseDate = (dateString) => {
    if (!dateString) return null;
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    return null;
  };

  const startDate = parseDate(locacao.data_locacao_inicio);
  const endDate = parseDate(locacao.data_locacao_fim);

  if (locacao.status_locacao === 'cancelada') {
    return { text: 'Cancelada', colorClass: 'bg-red-100', textColorClass: 'text-red-700' };
  }

  if (endDate && endDate < today) {
    return { text: 'Passada', colorClass: 'bg-yellow-100', textColorClass: 'text-yellow-700' };
  }
  if (startDate && startDate > today) {
    return { text: 'Futura', colorClass: 'bg-blue-100', textColorClass: 'text-blue-700' };
  }
  if (startDate && startDate <= today && (!endDate || endDate >= today)) {
    return { text: 'Hoje', colorClass: 'bg-green-100', textColorClass: 'text-green-700' };
  }

  return { text: 'Ativa', colorClass: 'bg-gray-100', textColorClass: 'text-gray-700' };
};

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
          {locacoesEquipe.map(loc => {
            // const statusInfo = getLocacaoStatusInfo(loc);
            return (
            <li key={loc.id} className="p-3 bg-gray-50 rounded-md shadow-sm text-sm">
              <div className="flex justify-between items-start mb-1">
                <div>
                  {loc.equipe_nome && (
                    <p className="font-semibold text-primary-700">Equipe: {loc.equipe_nome}</p>
                  )}
                  {loc.funcionario_locado_nome && (
                    <p className="font-semibold text-primary-700">Funcionário: {loc.funcionario_locado_nome}</p>
                  )}
                  {loc.servico_externo && (
                    <p className="font-semibold text-primary-700">Serviço Externo: {loc.servico_externo}</p>
                  )}
                </div>
                <button
                  onClick={() => onRemoverLocacao(loc.id)}
                  className="text-red-500 hover:text-red-700 font-semibold py-1 px-2 rounded-md text-xs hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Remover Locação"
                  disabled={removingLocacaoId === loc.id || isLoading}
                >
                  {removingLocacaoId === loc.id ? 'Removendo...' : 'Remover'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                <p><span className="font-medium">Início:</span> {formatDate(loc.data_locacao_inicio)}</p>
                <p><span className="font-medium">Fim:</span> {loc.data_locacao_fim ? formatDate(loc.data_locacao_fim) : 'Presente'}</p>
                <p><span className="font-medium">Tipo Pag.:</span> {formatTipoPagamento(loc.tipo_pagamento)}</p>
                <p><span className="font-medium">Valor Pag.:</span> {formatCurrency(loc.valor_pagamento)}</p>
                {loc.data_pagamento && ( // Only show if data_pagamento exists
                  <p><span className="font-medium">Data Pag.:</span> {formatDate(loc.data_pagamento)}</p>
                )}
              </div>
              {/*
              <div className="mt-1">
                <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.colorClass} ${statusInfo.textColorClass}`}>
                  {statusInfo.text}
                </span>
              </div>
              */}
            </li>
          );
        })}
        </ul>
      ) : (<p className="text-gray-500 text-sm">Nenhuma equipe ou serviço externo locado para esta obra.</p>)}
    </div>
  );
};

export default React.memo(EquipesLocadasList);
