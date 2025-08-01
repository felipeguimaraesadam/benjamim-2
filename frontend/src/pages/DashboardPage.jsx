import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import * as api from '../services/api';

// Placeholder SVG Icons
const BuildingIcon = ({ className = 'w-8 h-8 text-primary-500 mb-3' }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    ></path>
  </svg>
);

const MoneyIcon = ({ className = 'w-8 h-8 text-primary-500 mb-3' }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
    ></path>
  </svg>
);

const UsersIcon = ({ className = 'w-8 h-8 text-primary-500 mb-3' }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 016-6h6a6 6 0 016 6v1h-3M15 21a2 2 0 002-2v-1a2 2 0 00-2-2h-3a2 2 0 00-2 2v1a2 2 0 002 2h3zm-3-14a2 2 0 012-2h3a2 2 0 012 2v2a2 2 0 01-2 2h-3a2 2 0 01-2-2v-2z"
    ></path>
  </svg>
);

// Icon for Relatórios (ChartBarIcon or similar)
const ChartBarIcon = ({ className = 'w-7 h-7 mr-3 text-primary-500' }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    ></path>
  </svg>
);

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [errorStats, setErrorStats] = useState(null);

  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    setErrorStats(null);
    try {
      const response = await api.getDashboardStats();
      setStats(response.data);
    } catch (err) {
      setErrorStats(
        err.message || 'Falha ao buscar estatísticas do dashboard.'
      );
      console.error('Fetch Dashboard Stats Error:', err);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">
        Dashboard
      </h1>

      {isLoadingStats && (
        <p className="text-center text-gray-600 dark:text-gray-400">
          Carregando estatísticas...
        </p>
      )}
      {errorStats && (
        <div
          className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-6"
          role="alert"
        >
          <strong className="font-bold">Erro ao carregar estatísticas: </strong>
          <span className="block sm:inline">{errorStats}</span>
        </div>
      )}

      {stats && !isLoadingStats && !errorStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Card for Obras em Andamento */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center text-center">
            <BuildingIcon />
            <h3 className="text-md font-medium text-gray-600 dark:text-gray-300 mb-1">
              Obras em Andamento
            </h3>
            <p className="text-3xl font-bold text-primary-600">
              {stats.obras_em_andamento}
            </p>
          </div>

          {/* Card for Custo Total Mês Corrente */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center text-center">
            <MoneyIcon />
            <h3 className="text-md font-medium text-gray-600 dark:text-gray-300 mb-1">
              Custo Total do Mês
            </h3>
            <p className="text-3xl font-bold text-primary-600">
              R${' '}
              {parseFloat(stats.custo_total_mes_corrente).toLocaleString(
                'pt-BR',
                { minimumFractionDigits: 2, maximumFractionDigits: 2 }
              )}
            </p>
          </div>

          {/* Card for Total de Funcionários */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center text-center">
            <UsersIcon />
            <h3 className="text-md font-medium text-gray-600 dark:text-gray-300 mb-1">
              Total de Funcionários
            </h3>
            <p className="text-3xl font-bold text-primary-600">
              {stats.total_funcionarios}
            </p>
          </div>
        </div>
      )}

      {/* Placeholder for other dashboard content */}
      {/* Example: <p className="text-gray-600">Mais conteúdo do dashboard aqui...</p> */}

      {/* Quick Access Section */}
      <div className="mt-10">
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-5">
          Acesso Rápido
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Shortcut to Obras */}
          <Link
            to="/obras"
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out flex items-center text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-gray-700 group"
          >
            <BuildingIcon className="w-7 h-7 mr-4 text-primary-500 group-hover:text-primary-600 transition-colors" />
            <div>
              <h3 className="text-lg font-semibold group-hover:text-primary-600 transition-colors">
                Gerenciar Obras
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                Visualizar e cadastrar obras.
              </p>
            </div>
          </Link>

          {/* Shortcut to Funcionários */}
          <Link
            to="/funcionarios"
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out flex items-center text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-gray-700 group"
          >
            <UsersIcon className="w-7 h-7 mr-4 text-primary-500 group-hover:text-primary-600 transition-colors" />
            <div>
              <h3 className="text-lg font-semibold group-hover:text-primary-600 transition-colors">
                Gerenciar Funcionários
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                Administrar quadro de funcionários.
              </p>
            </div>
          </Link>

          {/* Shortcut to Relatórios */}
          <Link
            to="/relatorios"
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out flex items-center text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-gray-700 group"
          >
            <ChartBarIcon className="w-7 h-7 mr-4 text-primary-500 group-hover:text-primary-600 transition-colors" />
            <div>
              <h3 className="text-lg font-semibold group-hover:text-primary-600 transition-colors">
                Ver Relatórios
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                Analisar dados e informações.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
