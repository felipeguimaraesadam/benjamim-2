import React from 'react';
import { Link } from 'react-router-dom';
import ObraLaborCostsTable from '../tables/ObraLaborCostsTable'; // Importando a nova tabela

// As funções de formatação e status (formatTipoPagamento, formatCurrency, getLocacaoStatusInfo)
// foram movidas para ObraLaborCostsTable.jsx, pois são específicas da apresentação tabular desses dados.
// Se alguma dessas funções for necessária em outro lugar, considere movê-las para utils.

const ObraLaborTabContent = ({
  locacoesEquipe,
  obraId,
  obraNome,
  onRemoverLocacao,
  // formatDate não é mais necessário aqui diretamente, pois a tabela lida com isso
  locacaoError,
  removingLocacaoId,
  isLoading
}) => {

  return (
    <div className="bg-white shadow-lg rounded-lg p-4 md:p-6"> {/* Ajuste de padding para consistência */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b pb-3">
        <h2 className="text-xl font-semibold text-gray-800 mb-2 sm:mb-0">
          Mão de Obra / Serviços Contratados
        </h2>
        {obraId && ( // Renderiza o botão apenas se obraId estiver disponível
          <Link
            to="/locacoes/nova" // Rota para adicionar nova locação. Ajuste conforme sua estrutura de rotas.
            state={{ obraIdParaNovaAlocacao: obraId, obraNome: obraNome }}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 self-start sm:self-center"
          >
            + Nova Locação/Serviço
          </Link>
        )}
      </div>

      {locacaoError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm">
          <p><strong>Erro ao carregar dados de mão de obra:</strong> {locacaoError.message || locacaoError}</p>
        </div>
      )}

      <ObraLaborCostsTable
        locacoesEquipe={locacoesEquipe}
        onRemoverLocacao={onRemoverLocacao}
        removingLocacaoId={removingLocacaoId}
        isLoading={isLoading}
        // formatDate já está sendo importado e usado dentro de ObraLaborCostsTable
      />

      {/* Mensagem de carregamento ou de "nenhum item" é tratada dentro de ObraLaborCostsTable */}
      {/* No entanto, se isLoading for verdadeiro e não houver erro, ObraLaborCostsTable mostrará sua própria mensagem de carregamento. */}
      {/* Se não houver locações e não estiver carregando, ObraLaborCostsTable mostrará "Nenhum custo..." */}

      {/* Exemplo de como poderia ser um link para um relatório específico desta aba, se aplicável */}
      {/*
      {locacoesEquipe && locacoesEquipe.length > 0 && (
        <div className="mt-6 text-right">
          <button className="text-sm text-indigo-600 hover:text-indigo-800">
            Gerar Relatório de Mão de Obra
          </button>
        </div>
      )}
      */}
    </div>
  );
};

export default React.memo(ObraLaborTabContent);
