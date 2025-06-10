import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth

const Navegacao = () => {
  const { user } = useAuth(); // Get user from AuthContext

  return (
    <aside className="w-64 bg-gray-800 text-white p-4">
      <h2 className="text-xl font-bold mb-4">SGO</h2>
      <nav>
        <ul>
          <li className="mb-2"><Link to="/" className="hover:text-gray-300">Dashboard</Link></li>
          <li className="mb-2"><Link to="/obras" className="hover:text-gray-300">Obras</Link></li>
          <li className="mb-2"><Link to="/funcionarios" className="hover:text-gray-300">Funcionários</Link></li>
          <li className="mb-2"><Link to="/ocorrencias" className="hover:text-gray-300">Ocorrências</Link></li>
          <li className="mb-2"><Link to="/equipes" className="hover:text-gray-300">Equipes</Link></li>
          <li className="mb-2"><Link to="/alocacoes" className="hover:text-gray-300">Alocações</Link></li>
          <li className="mb-2"><Link to="/materiais" className="hover:text-gray-300">Materiais</Link></li>
          <li className="mb-2"><Link to="/compras" className="hover:text-gray-300">Compras</Link></li>
          <li className="mb-2"><Link to="/despesas" className="hover:text-gray-300">Despesas</Link></li>
          <li className="mb-2"><Link to="/relatorios" className="hover:text-gray-300">Relatórios</Link></li>

          {/* Admin-only links */}
          {user && user.nivel_acesso === 'admin' && (
            <>
              <li className="mt-4 mb-2 border-t border-gray-700 pt-4">
                <span className="text-sm font-semibold text-gray-400">Administração</span>
              </li>
              <li className="mb-2"><Link to="/usuarios" className="hover:text-gray-300">Usuários</Link></li>
            </>
          )}
        </ul>
      </nav>
    </aside>
  );
};
export default Navegacao;
