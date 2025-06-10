import React from 'react';

const DespesasExtrasTable = ({ despesas, obras, onEdit, onDelete, isLoading }) => {
  // Helper to find obra name by ID
  const getObraNome = (obraId) => {
    const obra = obras && obras.find(o => o.id === obraId);
    return obra ? obra.nome_obra : 'N/A';
  };

  if (isLoading) {
    return <div className="text-center py-4">Carregando despesas...</div>;
  }

  if (!despesas || despesas.length === 0) {
    return <div className="text-center py-4 text-gray-600">Nenhuma despesa extra encontrada.</div>;
  }

  return (
    <div className="overflow-x-auto shadow-md sm:rounded-lg">
      <table className="min-w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
          <tr>
            <th scope="col" className="px-6 py-3">Descrição</th>
            <th scope="col" className="px-6 py-3">Valor</th>
            <th scope="col" className="px-6 py-3">Data</th>
            <th scope="col" className="px-6 py-3">Categoria</th>
            <th scope="col" className="px-6 py-3">Obra</th>
            <th scope="col" className="px-6 py-3">Ações</th>
          </tr>
        </thead>
        <tbody>
          {despesas.map((despesa) => (
            <tr key={despesa.id} className="bg-white border-b hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{despesa.descricao}</td>
              <td className="px-6 py-4">R$ {parseFloat(despesa.valor).toFixed(2)}</td>
              <td className="px-6 py-4">{new Date(despesa.data).toLocaleDateString()}</td>
              <td className="px-6 py-4">{despesa.categoria}</td>
              <td className="px-6 py-4">{getObraNome(despesa.obra)}</td>
              <td className="px-6 py-4 flex space-x-2">
                <button
                  onClick={() => onEdit(despesa)}
                  className="font-medium text-blue-600 hover:underline"
                >
                  Editar
                </button>
                <button
                  onClick={() => onDelete(despesa.id)}
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

export default DespesasExtrasTable;
