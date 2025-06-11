import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Placeholder icons - replace with actual icons from a library like react-icons or Heroicons
const BuildingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6M9 12.75h6m-6 6h6M4.5 6.75h.75m13.5 0h.75M4.5 12.75h.75m13.5 0h.75m-15 6h.75m13.5 0h.75M3 3h18M3 21h18" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
// DocumentTextIcon removed as the link is being removed
const ArrowLeftOnRectangleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>;

// New Icons
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5V21h6V13.5H2.25zm0-9V12h6V4.5H2.25zm9 9V21h6V13.5h-6zm0-9V12h6V4.5h-6z" /></svg>; // Simplified grid icon
const FuncionariosIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632zM17.25 9.75h4.5" /></svg>; // User icon with a small addition
const EquipesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.243-3.72a9.094 9.094 0 00-3.741-.479M12 12.75a3 3 0 110-6 3 3 0 010 6zm-3.375 4.875a9.094 9.094 0 01-3.741-.479 3 3 0 014.682-2.72M4.5 18.72a9.094 9.094 0 013.741-.479" /></svg>; // Multiple users icon
const MateriaisIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9.75l-9-9-9 9 9 9 9-9zm-9 4.5V21m0-6.75V3M3 14.25h18" /></svg>; // Box or package icon
const ComprasIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>;
const DespesasIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V6.375m18 15V18a1.5 1.5 0 00-1.5-1.5h-15a1.5 1.5 0 00-1.5 1.5v1.125c0 .621.504 1.125 1.125 1.125h15.75Z" /></svg>; // Bill/receipt icon
const AlocacoesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-6.75 3h9m-9 3h9M3.75 3.75h16.5v16.5H3.75V3.75z" /></svg>; // Calendar or schedule icon
const OcorrenciasIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>; // Warning/alert icon
const RelatoriosIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 100 15 7.5 7.5 0 000-15zM21 21l-5.197-5.197M10.5 10.5V15m0 0V10.5m0 4.5H15m-4.5 0H6" /></svg>; // Chart/graph icon

// Helper for group headers
const NavGroupHeader = ({ title }) => (
  <div className="px-3 pt-4 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
    {title}
  </div>
);

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
          SGO
        </Link>
      </div>

      <nav className="flex-grow space-y-1">
        <NavLink to="/" icon={<DashboardIcon />}>Dashboard</NavLink>
        <NavLink to="/obras" icon={<BuildingIcon />}>Obras</NavLink>

        <NavGroupHeader title="Cadastros" />
        <NavLink to="/funcionarios" icon={<FuncionariosIcon />}>Funcionários</NavLink>
        <NavLink to="/equipes" icon={<EquipesIcon />}>Equipes</NavLink>
        <NavLink to="/materiais" icon={<MateriaisIcon />}>Materiais</NavLink>

        <NavGroupHeader title="Financeiro" />
        <NavLink to="/compras" icon={<ComprasIcon />}>Compras</NavLink>
        <NavLink to="/despesas" icon={<DespesasIcon />}>Despesas</NavLink>

        <NavGroupHeader title="Operacional" />
        <NavLink to="/alocacoes" icon={<AlocacoesIcon />}>Alocações</NavLink>
        <NavLink to="/ocorrencias" icon={<OcorrenciasIcon />}>Ocorrências</NavLink>

        <NavLink to="/relatorios" icon={<RelatoriosIcon />}>Relatórios</NavLink>

        {user?.nivel_acesso === 'admin' && (
          <>
            <NavGroupHeader title="Administração" />
            <NavLink to="/usuarios" icon={<UsersIcon />}>Usuários</NavLink>
            {/* Documentos link removed as per requirements */}
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
