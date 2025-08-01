import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ErrorTestComponent from '../components/test/ErrorTestComponent';
import ErrorMonitoringPanel from '../components/admin/ErrorMonitoringPanel';
import { useAuth } from '../contexts/AuthContext';

const ErrorTestPage = () => {
  const [showErrorPanel, setShowErrorPanel] = useState(false);
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Testes de Monitoramento de Erros
        </h1>
        <div className="flex items-center space-x-3">
          {user && user.is_superuser && (
            <button
              onClick={() => setShowErrorPanel(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Ver Logs de Erro</span>
            </button>
          )}
          <Link
            to="/backup"
            className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Voltar para Backups
          </Link>
        </div>
      </div>
      
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Página de Desenvolvimento
            </h3>
            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
              <p>
                Esta página é destinada apenas para testes de desenvolvimento do sistema de monitoramento de erros.
                Use os botões abaixo para simular diferentes tipos de erros e verificar se estão sendo capturados corretamente.
              </p>
              <p className="mt-1">
                Use o botão "Ver Logs de Erro" no cabeçalho para abrir o painel de monitoramento e ver os erros capturados.
              </p>
            </div>
          </div>
        </div>
      </div>

      <ErrorTestComponent />
      
      {showErrorPanel && (
        <ErrorMonitoringPanel 
          isOpen={showErrorPanel} 
          onClose={() => setShowErrorPanel(false)} 
        />
      )}
    </div>
  );
};

export default ErrorTestPage;