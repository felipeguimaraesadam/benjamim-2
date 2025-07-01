import React from 'react';
import { Link } from 'react-router-dom';
import ObraLaborCostsTable from '../tables/ObraLaborCostsTable'; // Importando a nova tabela

// Funções de formatação e status foram movidas para ObraLaborCostsTable.jsx

const ObraLaborTabContent = ({
  locacoesEquipe,
  obraId,
  obraNome,
  onRemoverLocacao,
  locacaoError,
  removingLocacaoId,
  isLoading
}) => {

  return (
    // Card principal para esta aba
    <div className="bg-white shadow-lg rounded-lg p-4 md:p-6 dark:bg-gray-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b pb-3 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2 sm:mb-0">
          Mão de Obra / Serviços Contratados
        </h2>
        {obraId && (
          <Link
            to="/locacoes/nova"
            state={{ obraIdParaNovaAlocacao: obraId, obraNome: obraNome }}
            // Mantendo o botão indigo, pois é uma ação primária e se destaca.
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 self-start sm:self-center dark:focus:ring-indigo-400"
          >
            + Nova Locação/Serviço
          </Link>
        )}
      </div>

      {locacaoError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm dark:bg-red-800 dark:text-red-200 dark:border-red-700">
          <p><strong>Erro ao carregar dados de mão de obra:</strong> {typeof locacaoError === 'string' ? locacaoError : locacaoError.message || 'Erro desconhecido.'}</p>
        </div>
      )}

      {/* A tabela em si não terá um fundo de card separado, ela faz parte deste card ObraLaborTabContent */}
      <ObraLaborCostsTable
        locacoesEquipe={locacoesEquipe}
        onRemoverLocacao={onRemoverLocacao}
        removingLocacaoId={removingLocacaoId}
        isLoading={isLoading}
      />
    </div>
  );
};

export default React.memo(ObraLaborTabContent);
