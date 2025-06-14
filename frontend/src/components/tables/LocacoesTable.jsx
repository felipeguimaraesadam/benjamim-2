import React from 'react';

const LocacoesTable = ({ locacoes, obras, equipes, onEdit, onDelete, isLoading }) => {
  const getObraNome = (obraId) => {
    const obra = obras && obras.find(o => o.id === obraId);
    return obra ? obra.nome_obra : 'N/A';
  };

  // getEquipeNome can be removed if equipe_nome is always provided by serializer
  // const getEquipeNome = (equipeId) => {
  //   const equipe = equipes && equipes.find(e => e.id === equipeId);
  //   return equipe ? equipe.nome_equipe : 'N/A';
  // };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

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
      // Ensure parts are valid before creating date
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

  if (isLoading) {
    return <div className="text-center py-4">Carregando locações...</div>;
  }

  if (!locacoes || locacoes.length === 0) {
    return <div className="text-center py-4 text-gray-600">Nenhuma locação encontrada.</div>;
  }

  return (
    <div className="overflow-x-auto shadow-md sm:rounded-lg">
      <table className="min-w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
          <tr>
            <th scope="col" className="px-6 py-3">Obra</th>
            <th scope="col" className="px-6 py-3">Recurso Locado</th>
            <th scope="col" className="px-6 py-3">Data Início</th>
            <th scope="col" className="px-6 py-3">Data Fim</th>
            <th scope="col" className="px-6 py-3">Tipo Pag.</th>
            <th scope="col" className="px-6 py-3">Valor Pag.</th>
            <th scope="col" className="px-6 py-3">Data Pag.</th>
            <th scope="col" className="px-6 py-3">Status</th> {/* New Header */}
            <th scope="col" className="px-6 py-3">Ações</th>
          </tr>
        </thead>
        <tbody>
          {locacoes.map((locacao) => {
            const statusInfo = getLocacaoStatusInfo(locacao);
            return (
            <tr key={locacao.id} className="bg-white border-b hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{locacao.obra_nome || getObraNome(locacao.obra)}</td>
              <td className="px-6 py-4">
                {locacao.equipe_nome ? `Equipe: ${locacao.equipe_nome}` :
                 locacao.funcionario_locado_nome ? `Funcionário: ${locacao.funcionario_locado_nome}` :
                 locacao.servico_externo ? `Externo: ${locacao.servico_externo}` :
                 'N/A'}
              </td>
              <td className="px-6 py-4">{formatDate(locacao.data_locacao_inicio)}</td>
              <td className="px-6 py-4">{formatDate(locacao.data_locacao_fim)}</td>
              <td className="px-6 py-4">{formatTipoPagamento(locacao.tipo_pagamento)}</td>
              <td className="px-6 py-4">{formatCurrency(locacao.valor_pagamento)}</td>
              <td className="px-6 py-4">{formatDate(locacao.data_pagamento)}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.colorClass} ${statusInfo.textColorClass}`}>
                  {statusInfo.text}
                </span>
              </td>
              <td className="px-6 py-4 flex space-x-2">
                <button
                  onClick={() => onEdit(locacao)}
                  className="font-medium text-blue-600 hover:underline"
                >
                  Editar
                </button>
                <button
                  onClick={() => onDelete(locacao.id)}
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

export default LocacoesTable;
