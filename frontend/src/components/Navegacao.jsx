import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Placeholder icons - replace with actual icons from a library like react-icons or Heroicons
const BuildingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6M9 12.75h6m-6 6h6M4.5 6.75h.75m13.5 0h.75M4.5 12.75h.75m13.5 0h.75m-15 6h.75m13.5 0h.75M3 3h18M3 21h18" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
const DocumentTextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
const ArrowLeftOnRectangleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>;


const NavLink = ({ to, icon, children }) => {
  const location = useLocation();
  const isActive = location.pathname.startsWith(to);

  return (
    <Link
      to={to}
      className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-150 ease-in-out
                  ${isActive
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-primary-50 hover:text-primary-600'
                  }`}
    >
      {icon}
      <span className="font-medium">{children}</span>
    </Link>
  );
};

const Navegacao = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null; // Não renderiza nada se não estiver autenticado
  }

  return (
    <div className="w-64 h-screen bg-white shadow-lg fixed top-0 left-0 flex flex-col p-4 space-y-2">
      <div className="text-center py-6">
        <Link to="/" className="text-2xl font-bold text-primary-600">
          FiscalizaAI
        </Link>
      </div>

      <nav className="flex-grow space-y-1">
        <NavLink to="/obras" icon={<BuildingIcon />}>Obras</NavLink>
        {user?.nivel_acesso === 'admin' && (
          <>
            <NavLink to="/usuarios" icon={<UsersIcon />}>Usuários</NavLink>
            <NavLink to="/documentos" icon={<DocumentTextIcon />}>Documentos</NavLink>
          </>
        )}
      </nav>

      <div className="pt-2 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-150 ease-in-out"
        >
          <ArrowLeftOnRectangleIcon />
          <span className="font-medium">Sair</span>
        </button>
      </div>
      <div className="text-center py-2 text-xs text-gray-500">
        <p>{user?.nome_completo} ({user?.nivel_acesso})</p>
      </div>
    </div>
  );
};

export default Navegacao;
