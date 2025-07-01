import React from 'react';
import { Link } from 'react-router-dom'; // Se precisar de links internos
import { formatDateToDMY } from '../../utils/dateUtils'; // Ajuste o caminho se necessário

const formatTipoPagamento = (tipo) => {
  if (!tipo) return 'N/A';
  switch (tipo.toLowerCase()) {
    case 'diaria': return 'Diária';
    case 'metro': return 'Por Metro';
    case 'empreitada': return 'Empreitada';
    case 'mensal': return 'Mensal';
    case 'quinzenal': return 'Quinzenal';
    case 'semanal': return 'Semanal';
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
    // Verifica se a data já é um objeto Date
    if (dateString instanceof Date) {
        return dateString;
    }
    const parts = dateString.split('-'); // Assume YYYY-MM-DD
    if (parts.length === 3) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    return null; // Formato inválido
  };

  const startDate = parseDate(locacao.data_locacao_inicio);
  const endDate = parseDate(locacao.data_locacao_fim);

  // Prioriza status vindo diretamente do backend se disponível e relevante
  if (locacao.status_locacao) {
      switch (locacao.status_locacao.toLowerCase()) {
          case 'cancelada':
              return { text: 'Cancelada', colorClass: 'bg-red-100', textColorClass: 'text-red-700' };
          case 'finalizada':
               return { text: 'Finalizada', colorClass: 'bg-gray-200', textColorClass: 'text-gray-800' };
          case 'ativa': // Se o backend já define como ativa, podemos usar isso
                // mas ainda checar datas para "Hoje" ou "Futura" pode ser útil
                break; // Continua para lógica de datas
          default:
            // Para outros status do backend, pode-se mapeá-los aqui
            // Por ora, se não for um dos acima, segue para a lógica de datas
            break;
      }
  }

  if (endDate && endDate < today) {
    return { text: 'Passada/Concluída', colorClass: 'bg-yellow-100', textColorClass: 'text-yellow-700' };
  }
  if (startDate && startDate > today) {
    return { text: 'Futura', colorClass: 'bg-blue-100', textColorClass: 'text-blue-700' };
  }
  // Se tem data de início e (não tem data de fim OU data de fim é hoje ou futura) E data de início é hoje ou passada
  if (startDate && startDate <= today && (!endDate || endDate >= today)) {
    return { text: 'Em Andamento', colorClass: 'bg-green-100', textColorClass: 'text-green-700' };
  }

  // Fallback para status 'Ativa' genérico ou se as datas não permitirem uma classificação mais específica
  return { text: locacao.status_locacao ? (locacao.status_locacao.charAt(0).toUpperCase() + locacao.status_locacao.slice(1)) : 'Ativa', colorClass: 'bg-gray-100', textColorClass: 'text-gray-700' };
};


const ObraLaborCostsTable = ({ locacoesEquipe, onRemoverLocacao, removingLocacaoId, isLoading }) => {
  if (isLoading) {
    return <p className="text-center text-gray-500 py-4">Carregando custos de mão de obra...</p>;
  }

  if (!locacoesEquipe || locacoesEquipe.length === 0) {
    return <p className="text-center text-gray-500 py-4">Nenhum custo de mão de obra/serviço lançado para esta obra.</p>;
  }

  return (
    <div className="overflow-x-auto bg-white shadow-md rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Recurso Locado
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Data de Início
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Data de Fim
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tipo de Pagamento
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Valor do Pagamento
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {locacoesEquipe.map((loc) => {
            const statusInfo = getLocacaoStatusInfo(loc);
            let recursoNome = 'N/A';
            if (loc.equipe_details && loc.equipe_details.nome_equipe) {
                recursoNome = `Equipe: ${loc.equipe_details.nome_equipe}`;
            } else if (loc.funcionario_locado_details && loc.funcionario_locado_details.nome_completo) {
                recursoNome = `Funcionário: ${loc.funcionario_locado_details.nome_completo}`;
            } else if (loc.servico_externo) {
                recursoNome = `Serviço: ${loc.servico_externo}`;
            }

            // Para o link de detalhes, se aplicável
            let linkTo = null;
            if (loc.equipe_details && loc.equipe_details.id) {
                linkTo = `/equipes/${loc.equipe_details.id}`;
            } else if (loc.funcionario_locado_details && loc.funcionario_locado_details.id) {
                linkTo = `/funcionarios/${loc.funcionario_locado_details.id}`;
            }

            return (
              <tr key={loc.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {linkTo ? (
                    <Link to={linkTo} className="text-indigo-600 hover:text-indigo-900 hover:underline">
                      {recursoNome}
                    </Link>
                  ) : (
                    recursoNome
                  )}
                  {/* Detalhes dos membros da equipe, se houver */}
                  {loc.equipe_details && loc.equipe_details.membros && loc.equipe_details.membros.length > 0 && (
                    <div className="mt-1 text-xs text-gray-500">
                      Membros: {loc.equipe_details.membros.map(m => m.nome_completo).join(', ')}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {loc.data_locacao_inicio ? formatDateToDMY(loc.data_locacao_inicio) : 'N/A'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {loc.data_locacao_fim ? formatDateToDMY(loc.data_locacao_fim) : 'N/A'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {formatTipoPagamento(loc.tipo_pagamento)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(loc.valor_pagamento)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.colorClass} ${statusInfo.textColorClass}`}>
                    {statusInfo.text}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                  {onRemoverLocacao && (
                    <button
                      onClick={() => onRemoverLocacao(loc.id)}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={removingLocacaoId === loc.id || isLoading}
                      title="Remover Locação"
                    >
                      {removingLocacaoId === loc.id ? 'Removendo...' : 'Remover'}
                    </button>
                  )}
                  {/* Adicionar link para editar locação se necessário */}
                  {/* <Link to={`/locacoes/${loc.id}/edit`} className="text-indigo-600 hover:text-indigo-900 ml-3">Editar</Link> */}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default React.memo(ObraLaborCostsTable);
