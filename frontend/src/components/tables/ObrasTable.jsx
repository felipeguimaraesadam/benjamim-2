import React from 'react';

const ObrasTable = ({ obras, onEdit, onDelete, isLoading }) => {

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    // Adjust for timezone issues if dateString is just 'YYYY-MM-DD'
    // by ensuring it's treated as UTC to prevent off-by-one day errors.
    const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return utcDate.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  if (isLoading && (!obras || obras.length === 0)) { // Show loading only if no data yet
    return <p className="text-center text-gray-500 py-4">Carregando obras...</p>;
  }

  if (!isLoading && (!obras || obras.length === 0)) {
    return <p className="text-center text-gray-500 py-4">Nenhuma obra encontrada.</p>;
  }

  return (
    <div className="overflow-x-auto shadow-md sm:rounded-lg">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3">Nome da Obra</th>
            <th scope="col" className="px-6 py-3">Cidade</th>
            <th scope="col" className="px-6 py-3">Status</th>
            <th scope="col" className="px-6 py-3">Data Início</th>
            <th scope="col" className="px-6 py-3">Data Prev. Fim</th>
            <th scope="col" className="px-6 py-3 text-center">Ações</th>
          </tr>
        </thead>
        <tbody>
          {obras.map((obra) => (
            <tr key={obra.id} className="bg-white border-b hover:bg-gray-50">
              <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                {obra.nome_obra}
              </th>
              <td className="px-6 py-4">{obra.cidade}</td>
              <td className="px-6 py-4">{obra.status}</td>
              <td className="px-6 py-4">{formatDate(obra.data_inicio)}</td>
              <td className="px-6 py-4">{formatDate(obra.data_prevista_fim)}</td>
              <td className="px-6 py-4 text-center space-x-2">
                <button
                  onClick={() => onEdit(obra)}
                  className="font-medium text-blue-600 hover:underline disabled:text-gray-400"
                  disabled={isLoading}
                >
                  Editar
                </button>
                <button
                  onClick={() => onDelete(obra.id)}
                  className="font-medium text-red-600 hover:underline disabled:text-gray-400"
                  disabled={isLoading}
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

export default ObrasTable;
