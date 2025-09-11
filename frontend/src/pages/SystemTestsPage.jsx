import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { testBackendHealth, testDatabaseConnection, getCurrentUserAPI, apiClient } from '../services/api';
import SpinnerIcon from '../components/utils/SpinnerIcon';

const SystemTestsPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState({
    backend: null,
    database: null,
    auth: null,
    config: null
  });
  const [systemInfo, setSystemInfo] = useState({
    frontendUrl: window.location.origin,
    backendUrl: (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api',
    environment: import.meta.env.MODE,
    hasTokens: {
      access: !!localStorage.getItem('accessToken'),
      refresh: !!localStorage.getItem('refreshToken')
    }
  });

  useEffect(() => {
    // Executar testes automaticamente ao carregar a página
    runAllTests();
  }, []);

  const runAllTests = async () => {
    setIsLoading(true);
    setTestResults({
      backend: null,
      database: null,
      auth: null,
      config: null
    });

    try {
      // Teste 1: Conectividade com Backend
      await testBackendConnection();
      
      // Teste 2: Banco de Dados
      await testDatabaseConnectionFunc();
      
      // Teste 3: Autenticação
      await testAuthentication();
      
      // Teste 4: Configurações
      await testConfigurations();
      
    } catch (error) {
      console.error('Erro durante os testes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testBackendConnection = async () => {
    try {
      const result = await testBackendHealth();
      if (result.success) {
        setTestResults(prev => ({
          ...prev,
          backend: {
            status: 'success',
            message: 'Backend conectado com sucesso',
            details: result.data,
            timestamp: new Date().toLocaleString()
          }
        }));
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        backend: {
          status: 'error',
          message: 'Falha na conexão com o backend',
          details: error.message || error,
          timestamp: new Date().toLocaleString()
        }
      }));
    }
  };

  const testDatabaseConnectionFunc = async () => {
    try {
      const result = await testDatabaseConnection();
      if (result.success) {
        setTestResults(prev => ({
          ...prev,
          database: {
            status: 'success',
            message: 'Banco de dados conectado',
            details: result.data,
            timestamp: new Date().toLocaleString()
          }
        }));
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        database: {
          status: 'error',
          message: 'Falha na conexão com banco de dados',
          details: error.message || error,
          timestamp: new Date().toLocaleString()
        }
      }));
    }
  };

  const testAuthentication = async () => {
    try {
      if (!systemInfo.hasTokens.access) {
        throw new Error('Token de acesso não encontrado');
      }
      
      const result = await getCurrentUserAPI();
      if (result.success) {
        setTestResults(prev => ({
          ...prev,
          auth: {
            status: 'success',
            message: 'Autenticação funcionando',
            details: {
              user: result.data.login,
              nivel: result.data.nivel_acesso,
              tokens: systemInfo.hasTokens
            },
            timestamp: new Date().toLocaleString()
          }
        }));
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        auth: {
          status: 'error',
          message: 'Falha na autenticação',
          details: error.message || error,
          timestamp: new Date().toLocaleString()
        }
      }));
    }
  };

  const testConfigurations = async () => {
    try {
      const configs = {
        frontend: {
          url: systemInfo.frontendUrl,
          environment: systemInfo.environment,
          apiBaseUrl: systemInfo.backendUrl
        },
        localStorage: {
          hasAccessToken: systemInfo.hasTokens.access,
          hasRefreshToken: systemInfo.hasTokens.refresh
        },
        network: {
          userAgent: navigator.userAgent,
          online: navigator.onLine,
          connection: navigator.connection ? {
            effectiveType: navigator.connection.effectiveType,
            downlink: navigator.connection.downlink,
            rtt: navigator.connection.rtt
          } : 'Não disponível'
        }
      };
      
      setTestResults(prev => ({
        ...prev,
        config: {
          status: 'success',
          message: 'Configurações carregadas',
          details: configs,
          timestamp: new Date().toLocaleString()
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        config: {
          status: 'error',
          message: 'Erro ao carregar configurações',
          details: error.message,
          timestamp: new Date().toLocaleString()
        }
      }));
    }
  };

  // Funções de população de dados removidas por segurança
  // Dados devem ser populados manualmente via interface administrativa

  const getStatusIcon = (status) => {
    if (status === 'success') {
      return (
        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    } else if (status === 'error') {
      return (
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    );
  };

  const TestCard = ({ title, test, description }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {title}
        </h3>
        {getStatusIcon(test?.status)}
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {description}
      </p>
      
      {test && (
        <div className="space-y-2">
          <div className={`p-3 rounded-md ${
            test.status === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <p className={`text-sm font-medium ${
              test.status === 'success' 
                ? 'text-green-800 dark:text-green-200'
                : 'text-red-800 dark:text-red-200'
            }`}>
              {test.message}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {test.timestamp}
            </p>
          </div>
          
          {test.details && (
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                Ver detalhes
              </summary>
              <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200 overflow-auto">
                {typeof test.details === 'object' 
                  ? JSON.stringify(test.details, null, 2)
                  : test.details
                }
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Testes do Sistema
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Diagnóstico completo de conectividade e configurações
          </p>
        </div>
        
        <button
          onClick={runAllTests}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isLoading ? (
            <>
              <SpinnerIcon />
              <span>Testando...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Executar Testes</span>
            </>
          )}
        </button>
      </div>

      {/* Informações do Sistema */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
          Informações do Sistema
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong className="text-blue-700 dark:text-blue-300">Frontend URL:</strong>
            <span className="ml-2 text-blue-600 dark:text-blue-400">{systemInfo.frontendUrl}</span>
          </div>
          <div>
            <strong className="text-blue-700 dark:text-blue-300">Backend URL:</strong>
            <span className="ml-2 text-blue-600 dark:text-blue-400">{systemInfo.backendUrl}</span>
          </div>
          <div>
            <strong className="text-blue-700 dark:text-blue-300">Ambiente:</strong>
            <span className="ml-2 text-blue-600 dark:text-blue-400">{systemInfo.environment}</span>
          </div>
          <div>
            <strong className="text-blue-700 dark:text-blue-300">Tokens:</strong>
            <span className="ml-2 text-blue-600 dark:text-blue-400">
              Access: {systemInfo.hasTokens.access ? '✅' : '❌'} | 
              Refresh: {systemInfo.hasTokens.refresh ? '✅' : '❌'}
            </span>
          </div>
        </div>
      </div>

      {/* Seção de gerenciamento de dados removida por segurança */}
      {/* Dados devem ser populados manualmente via interface administrativa */}

      {/* Grid de Testes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TestCard
          title="Conectividade Backend"
          test={testResults.backend}
          description="Verifica se o frontend consegue se comunicar com o backend"
        />
        
        <TestCard
          title="Banco de Dados"
          test={testResults.database}
          description="Testa a conexão do backend com o banco de dados"
        />
        
        <TestCard
          title="Autenticação"
          test={testResults.auth}
          description="Verifica se o sistema de autenticação está funcionando"
        />
        
        <TestCard
          title="Configurações"
          test={testResults.config}
          description="Mostra as configurações atuais do sistema"
        />
      </div>

      {/* Resumo dos Resultados */}
      {Object.values(testResults).some(test => test !== null) && (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Resumo dos Testes
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(testResults).map(([key, result]) => {
              if (!result) return null;
              return (
                <div key={key} className="text-center">
                  <div className="flex justify-center mb-2">
                    {getStatusIcon(result.status)}
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {key === 'auth' ? 'Autenticação' : 
                     key === 'config' ? 'Configurações' :
                     key === 'database' ? 'Banco de Dados' : 'Backend'}
                  </p>
                  <p className={`text-xs ${
                    result.status === 'success' 
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {result.status === 'success' ? 'OK' : 'Erro'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemTestsPage;