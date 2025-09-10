import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Placeholder icon - replace with actual icon
const LoginIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6 mr-2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
    />
  </svg>
);

const LoginPage = () => {
  const [loginField, setLoginField] = useState(''); // Renamed email to loginField for clarity
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth(); // Renamed login to authLogin to avoid conflict

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    const loginStartTime = Date.now();
    const sessionId = Math.random().toString(36).substr(2, 9);
    
    console.log(`🔐 [LOGIN DEBUG] Iniciando login ${sessionId}:`, {
      loginField,
      hasPassword: !!senha,
      passwordLength: senha.length,
      userAgent: navigator.userAgent,
      currentUrl: window.location.href,
      timestamp: new Date().toISOString()
    });
    
    const debugData = {
      sessionId,
      startTime: loginStartTime,
      loginField,
      environment: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        localStorage: {
          hasAccessToken: !!localStorage.getItem('accessToken'),
          hasRefreshToken: !!localStorage.getItem('refreshToken')
        }
      }
    };

    try {
      console.log(`🚀 [LOGIN DEBUG] Chamando authLogin para ${sessionId}`);
      await authLogin(loginField, senha);
      
      const loginTime = Date.now() - loginStartTime;
      console.log(`✅ [LOGIN DEBUG] Login bem-sucedido ${sessionId}:`, {
        loginTime: loginTime + 'ms',
        redirecting: true
      });
      
      navigate('/');
    } catch (err) {
      const loginTime = Date.now() - loginStartTime;
      console.error(`❌ [LOGIN DEBUG] Erro no login ${sessionId}:`, {
        error: err.message,
        errorType: err.name,
        loginTime: loginTime + 'ms',
        stack: err.stack
      });
      
      debugData.error = {
        message: err.message,
        type: err.name,
        stack: err.stack,
        loginTime: loginTime + 'ms'
      };
      
      setDebugInfo(debugData);
      setError(
        err.message || 'Erro ao fazer login. Verifique suas credenciais.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 shadow-xl rounded-xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400">
            SGO
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Bem-vindo! Faça login para continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="login"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Login
            </label>
            <input
              id="login"
              name="login"
              type="text"
              autoComplete="username"
              required
              value={loginField}
              onChange={e => setLoginField(e.target.value)}
              className="form-input"
              placeholder="Seu login ou email"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={senha}
              onChange={e => setSenha(e.target.value)}
              className="form-input"
              placeholder="Sua senha"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md text-sm">
              {error}
              <button
                type="button"
                onClick={() => setDebugMode(!debugMode)}
                className="mt-2 text-xs underline hover:no-underline"
              >
                {debugMode ? 'Ocultar Debug' : 'Mostrar Debug'}
              </button>
            </div>
          )}
          
          {debugMode && debugInfo && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">Informações de Debug:</h4>
              <div className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                <div><strong>Session ID:</strong> {debugInfo.sessionId}</div>
                <div><strong>Login Field:</strong> {debugInfo.loginField}</div>
                <div><strong>URL:</strong> {debugInfo.environment.url}</div>
                <div><strong>Tokens:</strong> Access: {debugInfo.environment.localStorage.hasAccessToken ? '✓' : '✗'}, Refresh: {debugInfo.environment.localStorage.hasRefreshToken ? '✓' : '✗'}</div>
                {debugInfo.error && (
                  <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded">
                    <div><strong>Erro:</strong> {debugInfo.error.message}</div>
                    <div><strong>Tipo:</strong> {debugInfo.error.type}</div>
                    <div><strong>Tempo:</strong> {debugInfo.error.loginTime}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center"
            >
              {isLoading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <>
                  <LoginIcon />
                  Entrar
                </>
              )}
            </button>
          </div>
        </form>

        <p className="text-sm text-center text-gray-600 dark:text-gray-300">
          Não tem uma conta?{' '}
          <Link
            to="/register"
            className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Registre-se aqui
          </Link>
        </p>
        
        {/* Botão de Debug/Bypass - Remover em produção */}
        <div className="text-center">
          <button
            type="button"
            onClick={async () => {
              console.log('🔧 [DEBUG] Tentando bypass de login...');
              try {
                const response = await fetch('/api/debug/bypass-login/', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({})
                });
                
                if (response.ok) {
                  const data = await response.json();
                  console.log('✅ [DEBUG] Bypass bem-sucedido:', data);
                  
                  // Salvar tokens
                  localStorage.setItem('accessToken', data.access);
                  localStorage.setItem('refreshToken', data.refresh);
                  
                  // Redirecionar
                  navigate('/');
                } else {
                  console.error('❌ [DEBUG] Erro no bypass:', response.status);
                }
              } catch (error) {
                console.error('❌ [DEBUG] Erro na requisição de bypass:', error);
              }
            }}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
          >
            🔧 Debug: Bypass Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
