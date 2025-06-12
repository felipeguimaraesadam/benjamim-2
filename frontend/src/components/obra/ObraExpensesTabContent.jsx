import React from 'react';
import { Link } from 'react-router-dom';
import ObraDespesasExtrasTable from '../tables/ObraDespesasExtrasTable'; // Assuming path

const ObraExpensesTabContent = ({ despesasExtrasObra, isLoading, despesasExtrasObraError, obraId, obraNome }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
       <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-xl font-semibold text-gray-700">Despesas Extras da Obra</h2>
          <Link
              to="/despesas-extras" // Link to general despesas page or a modal
              state={{ obraIdParaNovaDespesa: obraId, obraNome: obraNome }} // Pass obraId and name
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-1 px-3 rounded-md shadow-sm transition duration-150 ease-in-out text-xs"
          >
              + Adicionar Despesa Extra
          </Link>
      </div>
      {despesasExtrasObraError && <p className="text-red-500 text-sm mb-2">Erro: {despesasExtrasObraError}</p>}
      <ObraDespesasExtrasTable
          despesas={despesasExtrasObra}
          isLoading={isLoading} // Pass isLoading specific to despesasExtrasObra if available
          error={despesasExtrasObraError}
      />
    </div>
  );
};

export default React.memo(ObraExpensesTabContent);
