import React from 'react';
import { Link } from 'react-router-dom';

const Navegacao = () => {
  return (
    <aside className="w-64 bg-gray-800 text-white p-4">
      <h2 className="text-xl font-bold mb-4">SGO</h2>
      <nav>
        <ul>
          <li className="mb-2"><Link to="/" className="hover:text-gray-300">Dashboard</Link></li>
          <li className="mb-2"><Link to="/obras" className="hover:text-gray-300">Obras</Link></li>
          <li className="mb-2"><Link to="/funcionarios" className="hover:text-gray-300">Funcionários</Link></li>
          <li className="mb-2"><Link to="/equipes" className="hover:text-gray-300">Equipes</Link></li>
          <li className="mb-2"><Link to="/materiais" className="hover:text-gray-300">Materiais</Link></li>
          <li className="mb-2"><Link to="/relatorios" className="hover:text-gray-300">Relatórios</Link></li>
          {/* Add more links as needed */}
        </ul>
      </nav>
    </aside>
  );
};
export default Navegacao;
