// Re-processing trigger for DespesasExtrasTable
import React, { useState } from 'react';
import { Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'; // Add icon imports

const DespesasExtrasTable = ({
  despesas,
  obras,
  onEdit,
  onDelete,
  isLoading,
}) => {
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = id => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };
  // Helper to find obra name by ID
  const getObraNome = obraId => {
    const obra = obras && obras.find(o => o.id === obraId);
    return obra ? obra.nome_obra : 'N/A';
  };

  if (isLoading) {
    return <div className="text-center py-4">Carregando despesas...</div>;
  }

  if (!despesas || despesas.length === 0) {
    return (
      <div className="text-center py-4 text-gray-600">
        Nenhuma despesa extra encontrada.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto shadow-md sm:rounded-lg">
      <table className="min-w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
          <tr>
            <th scope="col" className="px-6 py-3">
              Descrição
            </th>
            <th scope="col" className="px-6 py-3">
              Valor
            </th>
            <th scope="col" className="px-6 py-3">
              Data
            </th>
            <th scope="col" className="px-6 py-3">
              Categoria
            </th>
            <th scope="col" className="px-6 py-3">
              Obra
            </th>
            <th scope="col" className="px-6 py-3">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {despesas.map(despesa => (
            <React.Fragment key={despesa.id}>
              <tr className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                  {despesa.descricao}
                </td>
                <td className="px-6 py-4">
                  R$ {parseFloat(despesa.valor).toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  {new Date(despesa.data).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">{despesa.categoria}</td>
                <td className="px-6 py-4">{getObraNome(despesa.obra)}</td>
                <td className="px-6 py-4 flex space-x-2">
                  <button
                    onClick={() => onEdit(despesa)}
                    className="text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                    disabled={isLoading}
                    aria-label="Editar Despesa"
                    title="Editar Despesa"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(despesa.id)}
                    className="text-red-600 hover:text-red-800 disabled:text-gray-400"
                    disabled={isLoading}
                    aria-label="Excluir Despesa"
                    title="Excluir Despesa"
                  >
                    <Trash2 size={18} />
                  </button>
                  {despesa.anexos && despesa.anexos.length > 0 && (
                    <button onClick={() => toggleRow(despesa.id)}>
                      {expandedRows[despesa.id] ? <ChevronUp /> : <ChevronDown />}
                    </button>
                  )}
                </td>
              </tr>
              {expandedRows[despesa.id] && (
                <tr className="bg-gray-50">
                  <td colSpan="6" className="px-6 py-4">
                    <h4 className="font-bold">Anexos:</h4>
                    <ul className="list-disc list-inside">
                      {despesa.anexos.map(anexo => (
                        <li key={anexo.id}>
                          <a
                            href={anexo.anexo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {anexo.descricao || anexo.anexo.split('/').pop()}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DespesasExtrasTable;
