import React from 'react';
import { Pencil, Trash2, Eye } from 'lucide-react'; // Added Eye
import { Link } from 'react-router-dom'; // Added Link

const EquipesTable = ({
  equipes,
  funcionarios,
  onEdit,
  onDelete,
  isLoading,
}) => {
  const getFuncionarioNome = id => {
    if (!funcionarios || !id) return 'N/A';
    const funcionario = funcionarios.find(f => f.id === id);
    return funcionario
      ? funcionario.nome_completo
      : `ID: ${id} (não encontrado)`;
  };

  const getMembrosNomes = membroIds => {
    if (!funcionarios || !membroIds || membroIds.length === 0) return 'Nenhum';
    return membroIds.map(id => getFuncionarioNome(id)).join(', ');
  };

  if (isLoading && (!equipes || equipes.length === 0)) {
    return (
      <p className="text-center text-gray-500 py-4">Carregando equipes...</p>
    );
  }

  if (!isLoading && (!equipes || equipes.length === 0)) {
    return (
      <p className="text-center text-gray-500 py-4">
        Nenhuma equipe encontrada.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto shadow-md sm:rounded-lg">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3">
              Nome da Equipe
            </th>
            <th scope="col" className="px-6 py-3">
              Líder
            </th>
            <th scope="col" className="px-6 py-3">
              Qtd. Membros
            </th>
            {/* Optionally, list all member names, but can be long */}
            {/* <th scope="col" className="px-6 py-3">Membros</th> */}
            <th scope="col" className="px-6 py-3 text-center">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {equipes.map(equipe => (
            <tr key={equipe.id} className="bg-white border-b hover:bg-gray-50">
              <th
                scope="row"
                className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
              >
                {equipe.nome_equipe}
              </th>
              <td className="px-6 py-4">{getFuncionarioNome(equipe.lider)}</td>
              <td className="px-6 py-4">
                {equipe.membros ? equipe.membros.length : 0}
              </td>
              {/* <td className="px-6 py-4 truncate max-w-xs">{getMembrosNomes(equipe.membros)}</td> */}
              <td className="px-6 py-4 text-center space-x-2">
                <Link
                  to={`/equipes/${equipe.id}`}
                  title="Visualizar Detalhes da Equipe"
                  aria-label="Visualizar Detalhes da Equipe"
                  className="text-green-600 hover:text-green-800 disabled:text-gray-400 inline-block align-middle"
                >
                  <Eye size={18} />
                </Link>
                <button
                  onClick={() => onEdit(equipe)}
                  className="text-blue-600 hover:text-blue-800 disabled:text-gray-400 inline-block align-middle"
                  disabled={isLoading}
                  aria-label="Editar Equipe"
                  title="Editar Equipe"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => onDelete(equipe.id)}
                  className="text-red-600 hover:text-red-800 disabled:text-gray-400 inline-block align-middle"
                  disabled={isLoading}
                  aria-label="Excluir Equipe"
                  title="Excluir Equipe"
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

export default EquipesTable;
