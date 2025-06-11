import React from 'react';

const UsuariosTable = ({ users, onEdit, onDelete, isLoading }) => {

  const formatNivelAcesso = (nivel) => {
    if (!nivel) return 'N/A';
    // Capitalize first letter
    return nivel.charAt(0).toUpperCase() + nivel.slice(1);
  };

  if (isLoading && (!users || users.length === 0)) {
    return <p className="text-center text-gray-500 py-4">Carregando usuários...</p>;
  }

  if (!isLoading && (!users || users.length === 0)) {
    return <p className="text-center text-gray-500 py-4">Nenhum usuário encontrado.</p>;
  }

  return (
    <div className="overflow-x-auto shadow-md sm:rounded-lg">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3">Nome Completo</th>
            <th scope="col" className="px-6 py-3">Login</th>
            <th scope="col" className="px-6 py-3">Nível de Acesso</th>
            <th scope="col" className="px-6 py-3 text-center">Ações</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                {user.nome_completo}
              </td>
              <td className="px-6 py-4">{user.login}</td>
              <td className="px-6 py-4">{formatNivelAcesso(user.nivel_acesso)}</td>
              <td className="px-6 py-4 text-center space-x-2">
                <button
                  onClick={() => onEdit(user)}
                  className="font-medium text-blue-600 hover:underline disabled:text-gray-400"
                  disabled={isLoading}
                >
                  Editar
                </button>
                <button
                  onClick={() => onDelete(user.id)}
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

export default UsuariosTable;
