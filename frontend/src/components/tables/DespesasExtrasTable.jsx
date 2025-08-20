// Re-processing trigger for DespesasExtrasTable
import React, { useState } from 'react';
import {
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  FileText,
} from 'lucide-react';
import * as api from '../../services/api';

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

  const handleDeleteAnexo = async (despesaId, anexoId) => {
    if (window.confirm('Tem certeza que deseja excluir este anexo?')) {
      try {
        await api.deleteAnexoDespesa(anexoId);
        // This is a temporary solution. A better approach would be to update the state.
        window.location.reload();
      } catch (error) {
        console.error('Erro ao excluir anexo:', error);
        // Handle error display to the user
      }
    }
  };

  const getObraNome = obraId => {
    const obra = obras && obras.find(o => o.id === obraId);
    return obra ? obra.nome_obra : 'N/A';
  };

  const isImageFile = fileName => {
    return /\.(jpg|jpeg|png|gif)$/i.test(fileName);
  };

  if (isLoading && (!despesas || despesas.length === 0)) {
    return <div className="text-center py-4">Carregando despesas...</div>;
  }

  if (!despesas || despesas.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        Nenhuma despesa extra encontrada.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto shadow-md sm:rounded-lg">
      <table className="min-w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
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
                  {new Date(despesa.data).toLocaleDateString('pt-BR', {
                    timeZone: 'UTC',
                  })}
                </td>
                <td className="px-6 py-4">{despesa.categoria}</td>
                <td className="px-6 py-4">{getObraNome(despesa.obra)}</td>
                <td className="px-6 py-4 flex items-center space-x-2">
                  <button
                    onClick={() => onEdit(despesa)}
                    className="p-1 text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                    disabled={isLoading}
                    aria-label="Editar Despesa"
                    title="Editar Despesa"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(despesa.id)}
                    className="p-1 text-red-600 hover:text-red-800 disabled:text-gray-400"
                    disabled={isLoading}
                    aria-label="Excluir Despesa"
                    title="Excluir Despesa"
                  >
                    <Trash2 size={18} />
                  </button>
                  {despesa.anexos && despesa.anexos.length > 0 && (
                    <button
                      onClick={() => toggleRow(despesa.id)}
                      className="p-1 text-gray-600 hover:text-gray-800"
                      aria-label="Ver Anexos"
                      title="Ver Anexos"
                    >
                      {expandedRows[despesa.id] ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </button>
                  )}
                </td>
              </tr>
              {expandedRows[despesa.id] && (
                <tr className="bg-gray-50 border-b">
                  <td colSpan="6" className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-md font-semibold text-gray-800">
                        Anexos
                      </h4>
                      <button
                        onClick={() => onEdit(despesa)}
                        className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                        title="Adicionar novo anexo"
                      >
                        <PlusCircle size={16} />
                        <span>Adicionar Anexo</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {despesa.anexos.map(anexo => (
                        <div
                          key={anexo.id}
                          className="relative group border rounded-lg p-2 flex items-center space-x-3 bg-white shadow-sm"
                        >
                          <a
                            href={anexo.anexo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0"
                          >
                            {isImageFile(anexo.anexo) ? (
                              <img
                                src={anexo.anexo}
                                alt={
                                  anexo.descricao ||
                                  'Prévia do anexo de despesa'
                                }
                                className="w-16 h-16 rounded-md object-cover"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-md bg-gray-200 flex items-center justify-center">
                                <FileText
                                  size={32}
                                  className="text-gray-500"
                                />
                              </div>
                            )}
                          </a>
                          <div className="flex-grow overflow-hidden">
                            <a
                              href={anexo.anexo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-blue-700 hover:underline truncate"
                              title={
                                anexo.descricao || anexo.anexo.split('/').pop()
                              }
                            >
                              {anexo.descricao || anexo.anexo.split('/').pop()}
                            </a>
                          </div>
                          <button
                            onClick={() =>
                              handleDeleteAnexo(despesa.id, anexo.id)
                            }
                            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                            aria-label="Excluir anexo"
                            title="Excluir anexo"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
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
