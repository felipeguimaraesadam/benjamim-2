import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

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
      setErrorStats(err.message || 'Falha ao buscar estatísticas do dashboard.');
      console.error("Fetch Dashboard Stats Error:", err);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">Dashboard</h1>

      {isLoadingStats && <p className="text-center text-gray-600">Carregando estatísticas...</p>}
      {errorStats && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Erro ao carregar estatísticas: </strong>
          <span className="block sm:inline">{errorStats}</span>
        </div>
      )}

      {stats && !isLoadingStats && !errorStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Card for Obras em Andamento */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Obras em Andamento</h3>
            <p className="text-3xl font-bold text-primary-600">{stats.obras_em_andamento}</p>
          </div>

          {/* Card for Custo Total Mês Corrente */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Custo Total do Mês</h3>
            <p className="text-3xl font-bold text-primary-600">
              R$ {parseFloat(stats.custo_total_mes_corrente).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* Card for Total de Funcionários */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total de Funcionários</h3>
            <p className="text-3xl font-bold text-primary-600">{stats.total_funcionarios}</p>
          </div>
        </div>
      )}

      {/* Placeholder for other dashboard content */}
      {/* Example: <p className="text-gray-600">Mais conteúdo do dashboard aqui...</p> */}
    </div>
  );
};

export default DashboardPage;
