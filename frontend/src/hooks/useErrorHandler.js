import { useCallback } from 'react';
import { errorReporter } from '../services/errorReporter.ts';
import { toast } from 'react-toastify';

/**
 * Hook personalizado para tratamento de erros
 * Fornece funções para capturar e reportar erros de forma consistente
 */
export const useErrorHandler = () => {
  /**
   * Captura e reporta um erro
   * @param {Error} error - O erro a ser reportado
   * @param {Object} context - Contexto adicional sobre o erro
   * @param {boolean} showToast - Se deve mostrar um toast para o usuário
   */
  const handleError = useCallback((error, context = {}, showToast = true) => {
    try {
      // Log do erro no console
      console.error('Error handled:', error, context);
      
      // Reportar erro para o backend
      errorReporter.captureError(error, {
        ...context,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
      
      // Mostrar toast para o usuário se solicitado
      if (showToast) {
        const message = error.message || 'Ocorreu um erro inesperado';
        toast.error(message, {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (reportError) {
      console.warn('Failed to handle error:', reportError);
      
      // Fallback: mostrar toast básico
      if (showToast) {
        toast.error('Ocorreu um erro inesperado', {
          position: 'top-right',
          autoClose: 5000,
        });
      }
    }
  }, []);
  
  /**
   * Wrapper para funções assíncronas que podem gerar erros
   * @param {Function} asyncFn - Função assíncrona a ser executada
   * @param {Object} context - Contexto adicional
   * @param {boolean} showToast - Se deve mostrar toast em caso de erro
   */
  const handleAsync = useCallback(async (asyncFn, context = {}, showToast = true) => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error, {
        ...context,
        asyncOperation: true,
        functionName: asyncFn.name || 'anonymous'
      }, showToast);
      throw error; // Re-throw para permitir tratamento adicional
    }
  }, [handleError]);
  
  /**
   * Wrapper para event handlers que podem gerar erros
   * @param {Function} handler - Event handler
   * @param {Object} context - Contexto adicional
   */
  const wrapEventHandler = useCallback((handler, context = {}) => {
    return (...args) => {
      try {
        return handler(...args);
      } catch (error) {
        handleError(error, {
          ...context,
          eventHandler: true,
          handlerName: handler.name || 'anonymous'
        });
      }
    };
  }, [handleError]);
  
  /**
   * Reporta um erro customizado com informações específicas
   * @param {string} message - Mensagem do erro
   * @param {Object} details - Detalhes adicionais
   * @param {string} level - Nível do erro (error, warning, info)
   */
  const reportCustomError = useCallback((message, details = {}, level = 'error') => {
    const customError = new Error(message);
    customError.name = 'CustomError';
    
    handleError(customError, {
      ...details,
      level,
      custom: true
    }, level === 'error');
  }, [handleError]);
  
  return {
    handleError,
    handleAsync,
    wrapEventHandler,
    reportCustomError
  };
};

export default useErrorHandler;