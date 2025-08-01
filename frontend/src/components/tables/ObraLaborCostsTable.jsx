import React from 'react';
import { Link } from 'react-router-dom';
import { formatDateToDMY } from '../../utils/dateUtils';

const formatTipoPagamento = tipo => {
  if (!tipo) return 'N/A';
  switch (tipo.toLowerCase()) {
    case 'diaria':
      return 'Diária';
    case 'metro':
      return 'Por Metro';
    case 'empreitada':
      return 'Empreitada';
    case 'mensal':
      return 'Mensal';
    case 'quinzenal':
      return 'Quinzenal';
    case 'semanal':
      return 'Semanal';
    default:
      return tipo.charAt(0).toUpperCase() + tipo.slice(1);
  }
};

const formatCurrency = value => {
  if (value === null || value === undefined) return 'N/A';
  const number = parseFloat(value);
  if (isNaN(number)) return 'N/A';
  return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const getLocacaoStatusInfo = locacao => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parseDate = dateString => {
    if (!dateString) return null;
    if (dateString instanceof Date) return dateString;
    const parts = dateString.split('-');
    if (parts.length === 3)
      return new Date(
        parseInt(parts[0]),
        parseInt(parts[1]) - 1,
        parseInt(parts[2])
      );
    return null;
  };

  const startDate = parseDate(locacao.data_locacao_inicio);
  const endDate = parseDate(locacao.data_locacao_fim);

  if (locacao.status_locacao) {
    const statusLower = locacao.status_locacao.toLowerCase();
    if (statusLower === 'cancelada')
      return {
        text: 'Cancelada',
        colorClass: 'bg-red-100 dark:bg-red-700',
        textColorClass: 'text-red-700 dark:text-red-100',
      };
    if (statusLower === 'finalizada')
      return {
        text: 'Finalizada',
        colorClass: 'bg-gray-200 dark:bg-gray-600',
        textColorClass: 'text-gray-800 dark:text-gray-100',
      };
  }

  if (endDate && endDate < today)
    return {
      text: 'Passada/Concluída',
      colorClass: 'bg-yellow-100 dark:bg-yellow-700',
      textColorClass: 'text-yellow-700 dark:text-yellow-100',
    };
  if (startDate && startDate > today)
    return {
      text: 'Futura',
      colorClass: 'bg-blue-100 dark:bg-blue-700',
      textColorClass: 'text-blue-700 dark:text-blue-100',
    };
  if (startDate && startDate <= today && (!endDate || endDate >= today))
    return {
      text: 'Em Andamento',
      colorClass: 'bg-green-100 dark:bg-green-700',
      textColorClass: 'text-green-700 dark:text-green-100',
    };

  return {
    text: locacao.status_locacao
      ? locacao.status_locacao.charAt(0).toUpperCase() +
        locacao.status_locacao.slice(1)
      : 'Ativa',
    colorClass: 'bg-gray-100 dark:bg-gray-500',
    textColorClass: 'text-gray-700 dark:text-gray-100',
  };
};

const ObraLaborCostsTable = ({
  locacoesEquipe,
  onRemoverLocacao,
  removingLocacaoId,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 py-4">
        Carregando custos de mão de obra...
      </p>
    );
  }

  if (!locacoesEquipe || locacoesEquipe.length === 0) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 py-4">
        Nenhum custo de mão de obra/serviço lançado para esta obra.
      </p>
    );
  }

  return (
    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
      {' '}
      {/* Divisor de linha um pouco mais claro no dark */}
      {/* Cabeçalho da tabela: um cinza um pouco mais claro que o fundo do card no dark mode */}
      <thead className="bg-gray-50 dark:bg-gray-750">
        <tr>
          <th
            scope="col"
            className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
          >
            Recurso Locado
          </th>
          <th
            scope="col"
            className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
          >
            Data de Início
          </th>
          <th
            scope="col"
            className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
          >
            Data de Fim
          </th>
          <th
            scope="col"
            className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
          >
            Tipo de Pag.
          </th>
          <th
            scope="col"
            className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
          >
            Valor do Pag.
          </th>
          <th
            scope="col"
            className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
          >
            Status
          </th>
          <th
            scope="col"
            className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
          >
            Ações
          </th>
        </tr>
      </thead>
      {/* O tbody não precisa de bg explícito aqui, herdará do card pai ou será transparente.
            As linhas individuais (tr) terão hover effect. */}
      <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
        {locacoesEquipe.map(loc => {
          const statusInfo = getLocacaoStatusInfo(loc); // getLocacaoStatusInfo já foi ajustado para dark mode
          let recursoNome = 'N/A';
          if (loc.equipe_details && loc.equipe_details.nome_equipe)
            recursoNome = `Equipe: ${loc.equipe_details.nome_equipe}`;
          else if (
            loc.funcionario_locado_details &&
            loc.funcionario_locado_details.nome_completo
          )
            recursoNome = `Funcionário: ${loc.funcionario_locado_details.nome_completo}`;
          else if (loc.servico_externo)
            recursoNome = `Serviço: ${loc.servico_externo}`;

          let linkTo = null;
          if (loc.equipe_details && loc.equipe_details.id)
            linkTo = `/equipes/${loc.equipe_details.id}`;
          else if (
            loc.funcionario_locado_details &&
            loc.funcionario_locado_details.id
          )
            linkTo = `/funcionarios/${loc.funcionario_locado_details.id}`;

          return (
            <tr
              key={loc.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                {linkTo ? (
                  <Link
                    to={linkTo}
                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline"
                  >
                    {recursoNome}
                  </Link>
                ) : (
                  recursoNome
                )}
                {loc.equipe_details &&
                  loc.equipe_details.membros &&
                  loc.equipe_details.membros.length > 0 && (
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Membros:{' '}
                      {loc.equipe_details.membros
                        .map(m => m.nome_completo)
                        .join(', ')}
                    </div>
                  )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {loc.data_locacao_inicio
                  ? formatDateToDMY(loc.data_locacao_inicio)
                  : 'N/A'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {loc.data_locacao_fim
                  ? formatDateToDMY(loc.data_locacao_fim)
                  : 'N/A'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {formatTipoPagamento(loc.tipo_pagamento)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {formatCurrency(loc.valor_pagamento)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.colorClass} ${statusInfo.textColorClass}`}
                >
                  {statusInfo.text}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                {onRemoverLocacao && (
                  <button
                    onClick={() => onRemoverLocacao(loc.id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={removingLocacaoId === loc.id || isLoading}
                    title="Remover Locação"
                  >
                    {removingLocacaoId === loc.id ? 'Removendo...' : 'Remover'}
                  </button>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default React.memo(ObraLaborCostsTable);
