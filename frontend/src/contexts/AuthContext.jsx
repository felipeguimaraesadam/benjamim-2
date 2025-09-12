import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../services/api'; // Use the created apiClient
import { jwtDecode } from 'jwt-decode'; // Correct named import
import { errorReporter } from '../services/errorReporter.ts'; // Import error reporter

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem('accessToken') || null
  );
  const [refreshToken, setRefreshToken] = useState(
    localStorage.getItem('refreshToken') || null
  );
  const [isLoading, setIsLoading] = useState(true); // Start with loading true

  const refreshAuthToken = async () => {
    if (!refreshToken) {
      setIsLoading(false); // Ensure loading stops if no refresh token
      return logout(); // or simply return if no refresh token
    }

    // Set loading true if not already, for UI feedback during refresh
    // setIsLoading(true); // Could be problematic if called during initial load's setIsLoading(false)

    try {
      const response = await apiClient.post('/token/refresh/', {
        refresh: refreshToken,
      });
      const { access, refresh: newRefreshToken } = response.data; // Backend might or might not return a new refresh token

      localStorage.setItem('accessToken', access);
      if (newRefreshToken) {
        // If backend provides a new refresh token (e.g. with rotation)
        localStorage.setItem('refreshToken', newRefreshToken);
        setRefreshToken(newRefreshToken);
      }
      setAccessToken(access);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${access}`;

      const decodedToken = jwtDecode(access);
      const userData = {
        id: decodedToken.user_id,
        login: decodedToken.login,
        nome_completo: decodedToken.nome_completo,
        nivel_acesso: decodedToken.nivel_acesso,
      };
      
      setUser(userData);
      
      // Configurar error reporter com ID do usuário
      try {
        errorReporter.setUserId(decodedToken.user_id.toString());
      } catch (err) {
        console.warn('Falha ao configurar error reporter:', err);
      }
      // setIsLoading(false); // Set loading false after successful refresh
      return access; // Return new access token
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout(); // Important: logout if refresh fails
      // setIsLoading(false); // Set loading false after failed refresh
      return null;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      if (accessToken) {
        try {
          const decodedToken = jwtDecode(accessToken);
          const currentTime = Date.now() / 1000;

          if (decodedToken.exp > currentTime) {
            const userData = {
            id: decodedToken.user_id,
            login: decodedToken.login,
            nome_completo: decodedToken.nome_completo,
            nivel_acesso: decodedToken.nivel_acesso,
            // Add any other relevant user fields from your token
          };
          
          setUser(userData);
          
          // Configurar error reporter com ID do usuário
          try {
            errorReporter.setUserId(decodedToken.user_id.toString());
          } catch (err) {
            console.warn('Falha ao configurar error reporter:', err);
          }
            apiClient.defaults.headers.common['Authorization'] =
              `Bearer ${accessToken}`;
          } else {
            // Access token expired, try to refresh
            const storedRefreshToken = localStorage.getItem('refreshToken');
            if (storedRefreshToken) {
              await refreshAuthToken(); // This will set user if successful
            } else {
              // No refresh token, logout
              logout();
            }
          }
        } catch (error) {
          console.error('Error decoding token on initial load:', error);
          logout(); // Clear corrupted token or state
        }
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, []); // Remove refreshToken dependency to prevent infinite loops

  const login = async (loginUsername, password) => {
    const startTime = Date.now();
    console.log('🔐 [AUTH DEBUG] Iniciando processo de login:', {
      timestamp: new Date().toISOString(),
      login: loginUsername,
      loginLength: loginUsername?.length,
      passwordLength: password?.length,
      apiBaseUrl: apiClient.defaults.baseURL,
      currentUrl: window.location.href,
      userAgent: navigator.userAgent.substring(0, 100)
    });

    try {
      console.log('🌐 [AUTH DEBUG] Fazendo requisição para /api/token/');
      
      const requestData = {
        login: loginUsername,
        password: password,
      };
      
      console.log('📤 [AUTH DEBUG] Dados da requisição:', {
        url: `${apiClient.defaults.baseURL}/api/token/`,
        method: 'POST',
        headers: apiClient.defaults.headers,
        dataKeys: Object.keys(requestData)
      });

      const response = await apiClient.post('/api/token/', requestData);
      
      console.log('✅ [AUTH DEBUG] Resposta recebida:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        dataKeys: Object.keys(response.data || {}),
        hasAccess: !!response.data?.access,
        hasRefresh: !!response.data?.refresh,
        responseTime: Date.now() - startTime + 'ms'
      });

      const { access, refresh } = response.data;

      if (!access || !refresh) {
        console.error('❌ [AUTH DEBUG] Tokens ausentes na resposta:', {
          access: !!access,
          refresh: !!refresh,
          responseData: response.data
        });
        throw new Error('Resposta inválida do servidor - tokens ausentes');
      }

      console.log('💾 [AUTH DEBUG] Salvando tokens no localStorage');
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      setAccessToken(access);
      setRefreshToken(refresh);

      apiClient.defaults.headers.common['Authorization'] = `Bearer ${access}`;

      console.log('🔍 [AUTH DEBUG] Decodificando token JWT');
      const decodedToken = jwtDecode(access);
      console.log('👤 [AUTH DEBUG] Dados do usuário decodificados:', {
        userId: decodedToken.user_id,
        login: decodedToken.login,
        nomeCompleto: decodedToken.nome_completo,
        nivelAcesso: decodedToken.nivel_acesso,
        exp: new Date(decodedToken.exp * 1000).toISOString()
      });

      const userData = {
        id: decodedToken.user_id,
        login: decodedToken.login,
        nome_completo: decodedToken.nome_completo,
        nivel_acesso: decodedToken.nivel_acesso,
      };
      
      setUser(userData);
      
      // Configurar error reporter com ID do usuário
      try {
        errorReporter.setUserId(decodedToken.user_id.toString());
      } catch (err) {
        console.warn('Falha ao configurar error reporter:', err);
      }
      
      console.log('🎉 [AUTH DEBUG] Login realizado com sucesso!', {
        totalTime: Date.now() - startTime + 'ms',
        userId: decodedToken.user_id
      });
      
      return true;
    } catch (error) {
      const errorTime = Date.now() - startTime;
      console.error('❌ [AUTH DEBUG] Erro no login:', {
        errorTime: errorTime + 'ms',
        errorType: error.constructor.name,
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        responseHeaders: error.response?.headers,
        requestUrl: error.config?.url,
        requestMethod: error.config?.method,
        requestHeaders: error.config?.headers,
        networkError: !error.response,
        stack: error.stack?.split('\n').slice(0, 3)
      });
      
      logout(); // Clear any partial state
      
      if (error.response && error.response.status === 401) {
        throw new Error('Credenciais inválidas. Verifique seu login e senha.');
      }
      
      if (!error.response) {
        throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
      }
      
      throw new Error(
        'Erro ao tentar fazer login. Tente novamente mais tarde.'
      );
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    delete apiClient.defaults.headers.common['Authorization'];
    
    // Limpar ID do usuário no error reporter
    try {
      errorReporter.setUserId(null);
    } catch (err) {
      console.warn('Falha ao limpar error reporter:', err);
    }
    
    // Navigate to login or home page can be handled by the component calling logout
    // or by ProtectedRoute redirecting.
  };

  const register = async userData => {
    try {
      const response = await apiClient.post('/register/', userData);
      // Assuming the register endpoint returns the user data but doesn't log them in
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error);
      if (error.response && error.response.data) {
        // Extract and throw the specific error message from the backend
        const errorMessages = Object.values(error.response.data)
          .flat()
          .join(' ');
        throw new Error(
          errorMessages || 'Erro ao registrar. Verifique os dados.'
        );
      }
      throw new Error('Erro ao tentar registrar. Tente novamente mais tarde.');
    }
  };

  const contextValue = {
    user,
    accessToken,
    // refreshToken is usually not exposed directly to components
    isLoading,
    isAuthenticated: !!user && !!accessToken && !isLoading, // More robust check
    login,
    logout,
    register,
    refreshAuthToken, // Expose for manual refresh if needed or for interceptor
    // attemptRefreshAndRetry // Could expose this for a more manual interceptor setup
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined && import.meta.env.MODE !== 'test') {
    // Allow undefined in tests
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
