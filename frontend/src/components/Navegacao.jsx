import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';

// Placeholder icons - replace with actual icons from a library like react-icons or Heroicons
// Hamburger Icon for mobile
const HamburgerIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16m-7 6h7"
    />
  </svg>
);
const CloseIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const BuildingIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6M9 12.75h6m-6 6h6M4.5 6.75h.75m13.5 0h.75M4.5 12.75h.75m13.5 0h.75m-15 6h.75m13.5 0h.75M3 3h18M3 21h18"
    />
  </svg>
);
const UsersIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
    />
  </svg>
);
// DocumentTextIcon removed as the link is being removed
const ArrowLeftOnRectangleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
    />
  </svg>
);

// New Icons
const DashboardIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 13.5V21h6V13.5H2.25zm0-9V12h6V4.5H2.25zm9 9V21h6V13.5h-6zm0-9V12h6V4.5h-6z"
    />
  </svg>
); // Simplified grid icon
const FuncionariosIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632zM17.25 9.75h4.5"
    />
  </svg>
); // User icon with a small addition
const EquipesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.243-3.72a9.094 9.094 0 00-3.741-.479M12 12.75a3 3 0 110-6 3 3 0 010 6zm-3.375 4.875a9.094 9.094 0 01-3.741-.479 3 3 0 014.682-2.72M4.5 18.72a9.094 9.094 0 013.741-.479"
    />
  </svg>
); // Multiple users icon
const MateriaisIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21.75 9.75l-9-9-9 9 9 9 9-9zm-9 4.5V21m0-6.75V3M3 14.25h18"
    />
  </svg>
); // Box or package icon
const ComprasIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
    />
  </svg>
);
const DespesasIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V6.375m18 15V18a1.5 1.5 0 00-1.5-1.5h-15a1.5 1.5 0 00-1.5 1.5v1.125c0 .621.504 1.125 1.125 1.125h15.75Z"
    />
  </svg>
); // Bill/receipt icon
const AlocacoesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7.5 8.25h9m-9 3H12m-6.75 3h9m-9 3h9M3.75 3.75h16.5v16.5H3.75V3.75z"
    />
  </svg>
); // Calendar or schedule icon
const OcorrenciasIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
    />
  </svg>
); // Warning/alert icon
const RelatoriosIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.5 6a7.5 7.5 0 100 15 7.5 7.5 0 000-15zM21 21l-5.197-5.197M10.5 10.5V15m0 0V10.5m0 4.5H15m-4.5 0H6"
    />
  </svg>
); // Chart/graph icon
const BackupIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
    />
  </svg>
); // Database icon

// New icons for admin features
const CloudIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z"
    />
  </svg>
); // Cloud icon

const CogIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
); // Settings/cog icon

const CodeBranchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
    />
  </svg>
); // Code branch icon

// Helper for group headers
const NavGroupHeader = ({ title }) => (
  <div className="px-3 pt-4 pb-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
    {title}
  </div>
);

const NavLink = ({ to, icon, children, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname.startsWith(to);

  return (
    <Link
      to={to}
      onClick={onClick} // Added onClick prop
      className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-150 ease-in-out
                  ${
                    isActive
                      ? 'bg-primary-500 text-white shadow-md dark:bg-primary-600'
                      : 'text-gray-600 hover:bg-primary-50 hover:text-primary-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-primary-400'
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false); // Close mobile menu on logout
    navigate('/login');
  };

  const closeMobileMenu = () => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  if (!isAuthenticated) {
    return null; // Não renderiza nada se não estiver autenticado
  }

  return (
    <>
      {/* Hamburger Button - visible only on small screens */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Abrir menu" // Added attribute
      >
        {isMobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 h-screen bg-white dark:bg-gray-800 shadow-lg flex flex-col p-4 space-y-2
                   transform transition-transform duration-300 ease-in-out md:translate-x-0
                   ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="text-center py-6">
          <Link
            to="/"
            onClick={closeMobileMenu}
            className="text-2xl font-bold text-primary-600 dark:text-primary-400"
          >
            SGO
          </Link>
        </div>

        <nav className="flex-grow space-y-1 overflow-y-auto">
          <NavLink to="/" icon={<DashboardIcon />} onClick={closeMobileMenu}>
            Gerenciamento
          </NavLink>
          <NavLink
            to="/obras"
            icon={<BuildingIcon />}
            onClick={closeMobileMenu}
          >
            Obras
          </NavLink>

          <NavGroupHeader title="Cadastros" />
          <NavLink
            to="/funcionarios"
            icon={<FuncionariosIcon />}
            onClick={closeMobileMenu}
          >
            Funcionários
          </NavLink>
          <NavLink
            to="/equipes"
            icon={<EquipesIcon />}
            onClick={closeMobileMenu}
          >
            Equipes
          </NavLink>
          <NavLink
            to="/materiais"
            icon={<MateriaisIcon />}
            onClick={closeMobileMenu}
          >
            Materiais
          </NavLink>

          <NavGroupHeader title="Financeiro" />
          <NavLink
            to="/compras"
            icon={<ComprasIcon />}
            onClick={closeMobileMenu}
          >
            Compras
          </NavLink>
          <NavLink
            to="/despesas"
            icon={<DespesasIcon />}
            onClick={closeMobileMenu}
          >
            Despesas
          </NavLink>

          <NavGroupHeader title="Operacional" />
          <NavLink
            to="/locacoes"
            icon={<AlocacoesIcon />}
            onClick={closeMobileMenu}
          >
            Locações
          </NavLink>
          <NavLink
            to="/ocorrencias"
            icon={<OcorrenciasIcon />}
            onClick={closeMobileMenu}
          >
            Ocorrências
          </NavLink>

          <NavLink
            to="/relatorios"
            icon={<RelatoriosIcon />}
            onClick={closeMobileMenu}
          >
            Relatórios
          </NavLink>

          {user?.nivel_acesso === 'admin' && (
            <>
              <NavGroupHeader title="Administração" />
              <NavLink
                to="/usuarios"
                icon={<UsersIcon />}
                onClick={closeMobileMenu}
              >
                Usuários
              </NavLink>
              <NavLink
                to="/backup"
                icon={<BackupIcon />}
                onClick={closeMobileMenu}
              >
                Backup
              </NavLink>
              <NavLink
                to="/anexos-s3"
                icon={<CloudIcon />}
                onClick={closeMobileMenu}
              >
                Anexos S3
              </NavLink>
              {/* Links administrativos removidos - Tarefas e Branches */}
            </>
          )}
        </nav>

        <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <ThemeToggle onClick={closeMobileMenu} />
          <button
            onClick={handleLogout} // handleLogout already calls closeMobileMenu
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 dark:text-gray-300 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all duration-150 ease-in-out"
          >
            <ArrowLeftOnRectangleIcon />
            <span className="font-medium">Sair</span>
          </button>
        </div>
        <div className="text-center py-2 text-xs text-gray-500 dark:text-gray-400">
          <p>
            {user?.nome_completo} ({user?.nivel_acesso})
          </p>
        </div>
      </div>
      {/* Optional: Overlay for mobile menu - closes menu on click */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black opacity-50 md:hidden"
          onClick={closeMobileMenu}
        ></div>
      )}
    </>
  );
};

export default Navegacao;
