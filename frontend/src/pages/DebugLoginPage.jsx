import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DebugLoginPage = () => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Coletar informações de debug ao carregar a página
    const collectDebugInfo = () => {
      const info = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        localStorage: {
          hasAccessToken: !!localStorage.getItem('accessToken'),
          hasRefreshToken: !!localStorage.getItem('refreshToken'),
        },
        environment: {
          mode: import.meta.env.MODE,
          baseUrl: (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api',
        },
        network: {
          online: navigator.onLine,
          connection: navigator.connection ? {
            effectiveType: navigator.connection.effectiveType,
            downlink: navigator.connection.downlink,
            rtt: navigator.connection.rtt
          } : 'Not available'
        }
      };
      setDebugInfo(info);
    };

    collectDebugInfo();
  }, []);

  const handleBypassLogin = async () => {
    setIsLoading(true);
    setError('');
    
    console.log('🔧 [DEBUG LOGIN] Tentando bypass de login...');
    
    try {
      // Tentar o endpoint de bypass
      const response = await fetch('/api/debug/bypass-login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      console.log('🔧 [DEBUG LOGIN] Response status:', response.status);
      console.log('🔧 [DEBUG LOGIN] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🔧 [DEBUG LOGIN] Response data:', data);

      if (data.access) {
        // Salvar tokens
        localStorage.setItem('accessToken', data.access);
        if (data.refresh) {
          localStorage.setItem('refreshToken', data.refresh);
        }
        
        console.log('✅ [DEBUG LOGIN] Bypass bem-sucedido, redirecionando...');
        navigate('/');
      } else {
        throw new Error('Token de acesso não recebido');
      }
    } catch (err) {
      console.error('❌ [DEBUG LOGIN] Erro no bypass:', err);
      setError(`Erro no bypass: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNormalLogin = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await login('admin', 'admin123');
      navigate('/');
    } catch (err) {
      console.error('❌ [DEBUG LOGIN] Erro no login normal:', err);
      setError(`Erro no login normal: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          🔧 Debug Login
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Página de debug para diagnóstico de problemas de login
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          {/* Informações de Debug */}
          {debugInfo && (
            <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Informações de Debug</h3>
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                <div><strong>Timestamp:</strong> {debugInfo.timestamp}</div>
                <div><strong>URL:</strong> {debugInfo.url}</div>
                <div><strong>Modo:</strong> {debugInfo.environment.mode}</div>
                <div><strong>Base URL:</strong> {debugInfo.environment.baseUrl}</div>
                <div><strong>Online:</strong> {debugInfo.network.online ? '✅' : '❌'}</div>
                <div><strong>Tokens:</strong> Access: {debugInfo.localStorage.hasAccessToken ? '✅' : '❌'}, Refresh: {debugInfo.localStorage.hasRefreshToken ? '✅' : '❌'}</div>
                {debugInfo.network.connection !== 'Not available' && (
                  <div><strong>Conexão:</strong> {debugInfo.network.connection.effectiveType} ({debugInfo.network.connection.downlink}Mbps, {debugInfo.network.connection.rtt}ms)</div>
                )}
              </div>
            </div>
          )}

          {/* Erro */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded">
              {error}
            </div>
          )}

          {/* Botões de Teste */}
          <div className="space-y-4">
            <button
              onClick={handleBypassLogin}
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Testando...' : '🚀 Testar Bypass Login'}
            </button>

            <button
              onClick={handleNormalLogin}
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Testando...' : '🔐 Testar Login Normal (admin/admin123)'}
            </button>

            <button
              onClick={() => navigate('/login')}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              ← Voltar para Login Normal
            </button>
          </div>

          {/* Instruções */}
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">Instruções:</h4>
            <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• Use F12 para abrir o console e ver logs detalhados</li>
              <li>• Teste primeiro o bypass, depois o login normal</li>
              <li>• Anote qualquer erro que aparecer no console</li>
              <li>• Verifique a aba Network para ver requisições HTTP</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugLoginPage;