import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

const OcorrenciasTable = ({
  ocorrencias,
  funcionarios,
  onEdit,
  onDelete,
  isLoading,
}) => {
  const getFuncionarioNome = funcionarioId => {
    // Ensure funcionarios is an array before trying to find
    if (!Array.isArray(funcionarios)) {
      return 'Carregando...'; // Or 'N/A' or some other placeholder
    }
    const funcionario = funcionarios.find(f => f.id === funcionarioId);
    return funcionario
      ? funcionario.nome_completo
      : 'Funcionário não encontrado';
  };

  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    // Use UTC date parts to avoid timezone shifts that might change the date
    const utcDate = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
    );
    return utcDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (isLoading && (!ocorrencias || ocorrencias.length === 0)) {
    return (
      <p className="text-center text-gray-500 py-4">
        Carregando ocorrências...
      </p>
    );
  }

  if (!isLoading && (!ocorrencias || ocorrencias.length === 0)) {
    return (
      <p className="text-center text-gray-500 py-4">
        Nenhuma ocorrência encontrada.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto shadow-md sm:rounded-lg">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3">
              Funcionário
            </th>
            <th scope="col" className="px-6 py-3">
              Data
            </th>
            <th scope="col" className="px-6 py-3">
              Tipo de Ocorrência
            </th>
            <th scope="col" className="px-6 py-3">
              Observação
            </th>
            <th scope="col" className="px-6 py-3 text-center">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {ocorrencias.map(ocorrencia => (
            <tr
              key={ocorrencia.id}
              className="bg-white border-b hover:bg-gray-50"
            >
              <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                {getFuncionarioNome(ocorrencia.funcionario)}
              </td>
              <td className="px-6 py-4">{formatDate(ocorrencia.data)}</td>
              <td className="px-6 py-4">{ocorrencia.tipo}</td>
              <td className="px-6 py-4">{ocorrencia.observacao || '-'}</td>
              <td className="px-6 py-4 text-center space-x-2">
                <button
                  onClick={() => onEdit(ocorrencia)}
                  className="text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                  disabled={isLoading}
                  aria-label="Editar Ocorrência"
                  title="Editar Ocorrência"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => onDelete(ocorrencia.id)}
                  className="text-red-600 hover:text-red-800 disabled:text-gray-400"
                  disabled={isLoading}
                  aria-label="Excluir Ocorrência"
                  title="Excluir Ocorrência"
                >
                  <Trash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OcorrenciasTable;
