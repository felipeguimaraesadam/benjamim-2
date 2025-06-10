import React from 'react';

const FuncionariosTable = ({ funcionarios, onEdit, onDelete, isLoading }) => {

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    // Assuming dateString from backend is 'YYYY-MM-DD' or includes time but we only care about date part
    const date = new Date(dateString);
     // Adjust for timezone issues if dateString is just 'YYYY-MM-DD'
    const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return utcDate.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (isLoading && (!funcionarios || funcionarios.length === 0)) {
    return <p className="text-center text-gray-500 py-4">Carregando funcionários...</p>;
  }

  if (!isLoading && (!funcionarios || funcionarios.length === 0)) {
    return <p className="text-center text-gray-500 py-4">Nenhum funcionário encontrado.</p>;
  }

  return (
    <div className="overflow-x-auto shadow-md sm:rounded-lg">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3">Nome Completo</th>
            <th scope="col" className="px-6 py-3">Cargo</th>
            <th scope="col" className="px-6 py-3">Salário</th>
            <th scope="col" className="px-6 py-3">Data Contratação</th>
            <th scope="col" className="px-6 py-3 text-center">Ações</th>
          </tr>
        </thead>
        <tbody>
          {funcionarios.map((funcionario) => (
            <tr key={funcionario.id} className="bg-white border-b hover:bg-gray-50">
              <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                {funcionario.nome_completo}
              </th>
              <td className="px-6 py-4">{funcionario.cargo}</td>
              <td className="px-6 py-4">{formatCurrency(funcionario.salario)}</td>
              <td className="px-6 py-4">{formatDate(funcionario.data_contratacao)}</td>
              <td className="px-6 py-4 text-center space-x-2">
                <button
                  onClick={() => onEdit(funcionario)}
                  className="font-medium text-blue-600 hover:underline disabled:text-gray-400"
                  disabled={isLoading}
                >
                  Editar
                </button>
                <button
                  onClick={() => onDelete(funcionario.id)}
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

export default FuncionariosTable;
