import React from 'react';
import { Link, useLocation } from 'react-router-dom'; // Import useLocation
import { useAuth } from '../contexts/AuthContext'; // Import useAuth

// Placeholder SVG Icon
const PlaceholderIcon = ({ className = "w-5 h-5 mr-2" }) => ( // Added className prop with default
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
  </svg>
);

const Navegacao = () => {
  const { user } = useAuth(); // Get user from AuthContext
  const location = useLocation(); // Get current location

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-64 bg-gray-800 text-white p-4">
      <h2 className="text-xl font-bold mb-4">SGO</h2>
      <nav>
        <ul>
          <li className="mb-2">
            <Link to="/" className={`flex items-center px-2 py-1 rounded hover:bg-gray-700 ${isActive('/') ? 'bg-primary-600 text-white' : ''}`}>
              <PlaceholderIcon />
              Dashboard
            </Link>
          </li>
          <li className="mb-2">
            <Link to="/obras" className={`flex items-center px-2 py-1 rounded hover:bg-gray-700 ${isActive('/obras') ? 'bg-primary-600 text-white' : ''}`}>
              <PlaceholderIcon />
              Obras
            </Link>
          </li>
          <li className="mb-2">
            <Link to="/funcionarios" className={`flex items-center px-2 py-1 rounded hover:bg-gray-700 ${isActive('/funcionarios') ? 'bg-primary-600 text-white' : ''}`}>
              <PlaceholderIcon />
              Funcionários
            </Link>
          </li>
          <li className="mb-2">
            <Link to="/ocorrencias" className={`flex items-center px-2 py-1 rounded hover:bg-gray-700 ${isActive('/ocorrencias') ? 'bg-primary-600 text-white' : ''}`}>
              <PlaceholderIcon />
              Ocorrências
            </Link>
          </li>
          <li className="mb-2">
            <Link to="/equipes" className={`flex items-center px-2 py-1 rounded hover:bg-gray-700 ${isActive('/equipes') ? 'bg-primary-600 text-white' : ''}`}>
              <PlaceholderIcon />
              Equipes
            </Link>
          </li>
          <li className="mb-2">
            <Link to="/alocacoes" className={`flex items-center px-2 py-1 rounded hover:bg-gray-700 ${isActive('/alocacoes') ? 'bg-primary-600 text-white' : ''}`}>
              <PlaceholderIcon />
              Alocações
            </Link>
          </li>
          <li className="mb-2">
            <Link to="/materiais" className={`flex items-center px-2 py-1 rounded hover:bg-gray-700 ${isActive('/materiais') ? 'bg-primary-600 text-white' : ''}`}>
              <PlaceholderIcon />
              Materiais
            </Link>
          </li>
          <li className="mb-2">
            <Link to="/compras" className={`flex items-center px-2 py-1 rounded hover:bg-gray-700 ${isActive('/compras') ? 'bg-primary-600 text-white' : ''}`}>
              <PlaceholderIcon />
              Compras
            </Link>
          </li>
          <li className="mb-2">
            <Link to="/despesas" className={`flex items-center px-2 py-1 rounded hover:bg-gray-700 ${isActive('/despesas') ? 'bg-primary-600 text-white' : ''}`}>
              <PlaceholderIcon />
              Despesas
            </Link>
          </li>
          <li className="mb-2">
            <Link to="/relatorios" className={`flex items-center px-2 py-1 rounded hover:bg-gray-700 ${isActive('/relatorios') ? 'bg-primary-600 text-white' : ''}`}>
              <PlaceholderIcon />
              Relatórios
            </Link>
          </li>

          {/* Admin-only links */}
          {user && user.nivel_acesso === 'admin' && (
            <>
              <li className="mt-4 mb-2 border-t border-gray-700 pt-4">
                <span className="text-sm font-semibold text-gray-400">Administração</span>
              </li>
              <li className="mb-2">
                <Link to="/usuarios" className={`flex items-center px-2 py-1 rounded hover:bg-gray-700 ${isActive('/usuarios') ? 'bg-primary-600 text-white' : ''}`}>
                  <PlaceholderIcon />
                  Usuários
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </aside>
  );
};
export default Navegacao;
