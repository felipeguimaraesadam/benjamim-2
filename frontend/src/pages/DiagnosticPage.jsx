import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';

const DiagnosticPage = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [diagnostics, setDiagnostics] = useState({
    localStorage: {},
    apiConnection: null,
    backendHealth: null
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setIsLoading(true);
    
    // Check localStorage
    const localStorageData = {
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken'),
      hasAccessToken: !!localStorage.getItem('accessToken'),
      hasRefreshToken: !!localStorage.getItem('refreshToken')
    };

    // Test API connection
    let apiConnection = null;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://django-backend-e7od.onrender.com/api'}/health-check/`);
      apiConnection = {
        status: response.status,
        ok: response.ok,
        data: await response.json()
      };
    } catch (error) {
      apiConnection = {
        error: error.message,
        ok: false
      };
    }

    // Test backend health
    let backendHealth = null;
    try {
      const response = await apiClient.get('/health-check/');
      backendHealth = {
        status: response.status,
        ok: true,
        data: response.data
      };
    } catch (error) {
      backendHealth = {
        error: error.message,
        status: error.response?.status,
        ok: false
      };
    }

    setDiagnostics({
      localStorage: localStorageData,
      apiConnection,
      backendHealth
    });
    setIsLoading(false);
  };

  const clearLocalStorage = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    logout();
    runDiagnostics();
    alert('LocalStorage limpo! Recarregue a página.');
  };

  const testLogin = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://django-backend-e7od.onrender.com/api'}/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          login: 'admin',
          password: 'admin123'
        })
      });
      
      const data = await response.json();
      console.log('Test login result:', data);
      
      if (response.ok) {
        alert('Login de teste funcionou! Tokens recebidos.');
      } else {
        alert('Login de teste falhou: ' + JSON.stringify(data));
      }
    } catch (error) {
      alert('Erro no login de teste: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Diagnóstico do Sistema</h1>
        
        {/* Status do Usuário */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Status da Autenticação</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Usuário:</span>
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                user ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {user ? `${user.login} (${user.nivel_acesso})` : 'Não autenticado'}
              </span>
            </div>
            <div>
              <span className="font-medium">Autenticado:</span>
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {isAuthenticated ? 'Sim' : 'Não'}
              </span>
            </div>
          </div>
        </div>

        {/* LocalStorage */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">LocalStorage</h2>
          <div className="space-y-2">
            <div>
              <span className="font-medium">Access Token:</span>
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                diagnostics.localStorage.hasAccessToken ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
              }`}>
                {diagnostics.localStorage.hasAccessToken ? 'Presente' : 'Ausente'}
              </span>
            </div>
            <div>
              <span className="font-medium">Refresh Token:</span>
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                diagnostics.localStorage.hasRefreshToken ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
              }`}>
                {diagnostics.localStorage.hasRefreshToken ? 'Presente' : 'Ausente'}
              </span>
            </div>
          </div>
          <button
            onClick={clearLocalStorage}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Limpar LocalStorage
          </button>
        </div>

        {/* Conexão com API */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Conexão com Backend</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Teste Direto (fetch):</h3>
              {diagnostics.apiConnection ? (
                <div className={`p-3 rounded ${
                  diagnostics.apiConnection.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <div>Status: {diagnostics.apiConnection.status || 'Erro'}</div>
                  {diagnostics.apiConnection.data && (
                    <div>Resposta: {JSON.stringify(diagnostics.apiConnection.data, null, 2)}</div>
                  )}
                  {diagnostics.apiConnection.error && (
                    <div>Erro: {diagnostics.apiConnection.error}</div>
                  )}
                </div>
              ) : (
                <div>Carregando...</div>
              )}
            </div>
            
            <div>
              <h3 className="font-medium">Teste via ApiClient:</h3>
              {diagnostics.backendHealth ? (
                <div className={`p-3 rounded ${
                  diagnostics.backendHealth.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <div>Status: {diagnostics.backendHealth.status || 'Erro'}</div>
                  {diagnostics.backendHealth.data && (
                    <div>Resposta: {JSON.stringify(diagnostics.backendHealth.data, null, 2)}</div>
                  )}
                  {diagnostics.backendHealth.error && (
                    <div>Erro: {diagnostics.backendHealth.error}</div>
                  )}
                </div>
              ) : (
                <div>Carregando...</div>
              )}
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Ações de Teste</h2>
          <div className="space-x-4">
            <button
              onClick={runDiagnostics}
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Executando...' : 'Executar Diagnósticos'}
            </button>
            <button
              onClick={testLogin}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Testar Login (admin/admin123)
            </button>
          </div>
        </div>

        {/* Informações Técnicas */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Informações Técnicas</h2>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Frontend URL: {window.location.origin}</div>
            <div>Backend URL: {import.meta.env.VITE_API_BASE_URL || 'https://django-backend-e7od.onrender.com/api'}</div>
            <div>API Base URL: {apiClient.defaults.baseURL}</div>
            <div>User Agent: {navigator.userAgent.substring(0, 100)}...</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticPage;