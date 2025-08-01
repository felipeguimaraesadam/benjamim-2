import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../services/api'; // Use the created apiClient
import { jwtDecode } from 'jwt-decode'; // Correct named import

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
      setUser({
        id: decodedToken.user_id,
        login: decodedToken.login,
        nome_completo: decodedToken.nome_completo,
        nivel_acesso: decodedToken.nivel_acesso,
      });
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
            setUser({
              id: decodedToken.user_id,
              login: decodedToken.login,
              nome_completo: decodedToken.nome_completo,
              nivel_acesso: decodedToken.nivel_acesso,
              // Add any other relevant user fields from your token
            });
            apiClient.defaults.headers.common['Authorization'] =
              `Bearer ${accessToken}`;
          } else {
            // Access token expired, try to refresh
            if (refreshToken) {
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
  }, [refreshToken]); // Add refreshToken to dependency array

  const login = async (loginUsername, password) => {
    try {
      console.log('Attempting login with data:', {
        login: loginUsername,
        type_login: typeof loginUsername,
        password: password, // Be cautious logging passwords in production
        type_password: typeof password,
      });
      const response = await apiClient.post('/token/', {
        login: loginUsername, // Ensure this matches backend expectation (login vs username)
        password: password,
      });
      const { access, refresh } = response.data;

      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      setAccessToken(access);
      setRefreshToken(refresh);

      apiClient.defaults.headers.common['Authorization'] = `Bearer ${access}`;

      const decodedToken = jwtDecode(access);
      setUser({
        id: decodedToken.user_id,
        login: decodedToken.login,
        nome_completo: decodedToken.nome_completo,
        nivel_acesso: decodedToken.nivel_acesso,
      });
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      logout(); // Clear any partial state
      // Consider throwing error or returning more specific error info
      if (error.response && error.response.status === 401) {
        throw new Error('Credenciais inválidas. Verifique seu login e senha.');
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
    // Navigate to login or home page can be handled by the component calling logout
    // or by ProtectedRoute redirecting.
  };



  const contextValue = {
    user,
    accessToken,
    // refreshToken is usually not exposed directly to components
    isLoading,
    isAuthenticated: !!user && !!accessToken && !isLoading, // More robust check
    login,
    logout,
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
