import React from 'react';

// Placeholder SVG Icons
const PencilIcon = () => (
  <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
  </svg>
);

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
        <thead className="text-xs text-gray-700 uppercase bg-gray-100 font-bold">
          <tr>
            <th scope="col" className="px-6 py-3">Nome da Obra</th>
            <th scope="col" className="px-6 py-3">Cidade</th>
            <th scope="col" className="px-6 py-3">Status</th>
            <th scope="col" className="px-6 py-3 text-right">Data Início</th>
            <th scope="col" className="px-6 py-3 text-right">Data Prev. Fim</th>
            <th scope="col" className="px-6 py-3 text-center">Ações</th>
          </tr>
        </thead>
        <tbody>
          {obras.map((obra, index) => (
            <tr key={obra.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} border-b hover:bg-gray-100`}>
              <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                {obra.nome_obra}
              </th>
              <td className="px-6 py-4">{obra.cidade}</td>
              <td className="px-6 py-4">{obra.status}</td>
              <td className="px-6 py-4 text-right">{formatDate(obra.data_inicio)}</td>
              <td className="px-6 py-4 text-right">{formatDate(obra.data_prevista_fim)}</td>
              <td className="px-6 py-4 text-center space-x-2">
                <button
                  onClick={() => onEdit(obra)}
                  className="px-3 py-1 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                  disabled={isLoading}
                >
                  <PencilIcon /> Editar
                </button>
                <button
                  onClick={() => onDelete(obra.id)}
                  className="px-3 py-1 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-700 disabled:bg-red-300"
                  disabled={isLoading}
                >
                  <TrashIcon /> Excluir
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
