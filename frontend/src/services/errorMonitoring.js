/**
 * Serviço de Monitoramento de Erros para o Frontend
 * Captura e registra erros JavaScript, erros de rede e eventos importantes
 */

class ErrorMonitoringService {
  constructor() {
    this.errors = [];
    this.maxErrors = 100; // Máximo de erros armazenados
    this.apiEndpoint = '/api/frontend-error-log/';
    this.isEnabled = true;
    
    this.init();
  }

  init() {
    if (!this.isEnabled) return;

    // Captura erros JavaScript não tratados
    window.addEventListener('error', (event) => {
      this.captureError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    });

    // Captura erros de Promise rejeitadas
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        type: 'unhandled_promise_rejection',
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    });

    // Captura erros de recursos (imagens, scripts, etc.)
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.captureError({
          type: 'resource',
          message: `Failed to load resource: ${event.target.src || event.target.href}`,
          element: event.target.tagName,
          source: event.target.src || event.target.href,
          timestamp: new Date().toISOString(),
          url: window.location.href
        });
      }
    }, true);

    // Intercepta erros de fetch
    this.interceptFetch();
  }

  captureError(errorData) {
    // Adiciona informações do usuário se disponível
    const user = this.getCurrentUser();
    if (user) {
      errorData.user = user;
    }

    // Adiciona informações do contexto
    errorData.context = this.getContextInfo();

    // Armazena localmente
    this.errors.unshift(errorData);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Salva no localStorage para persistência
    this.saveToLocalStorage();

    // Envia para o backend (opcional)
    this.sendToBackend(errorData);

    // Log no console em desenvolvimento
    if (import.meta.env.DEV) {
      console.error('Error captured:', errorData);
    }
  }

  captureException(error, context = {}) {
    this.captureError({
      type: 'manual',
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    });
  }

  captureMessage(message, level = 'info', context = {}) {
    this.captureError({
      type: 'message',
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href
    });
  }

  interceptFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = Date.now();
      const url = args[0];
      const options = args[1] || {};
      
      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;
        
        // Log de requisições lentas
        if (duration > 5000) {
          this.captureMessage(`Slow API request: ${url} took ${duration}ms`, 'warning', {
            url,
            method: options.method || 'GET',
            duration,
            status: response.status
          });
        }
        
        // Log de erros HTTP
        if (!response.ok) {
          this.captureError({
            type: 'http_error',
            message: `HTTP ${response.status}: ${response.statusText}`,
            url,
            method: options.method || 'GET',
            status: response.status,
            statusText: response.statusText,
            duration,
            timestamp: new Date().toISOString()
          });
        }
        
        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        this.captureError({
          type: 'network_error',
          message: `Network error: ${error.message}`,
          url,
          method: options.method || 'GET',
          error: error.message,
          duration,
          timestamp: new Date().toISOString()
        });
        
        throw error;
      }
    };
  }

  getCurrentUser() {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
          id: payload.user_id,
          username: payload.username || 'unknown'
        };
      }
    } catch (error) {
      // Ignore errors when parsing token
    }
    return null;
  }

  getContextInfo() {
    return {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      screen: {
        width: window.screen.width,
        height: window.screen.height
      },
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink
      } : null,
      memory: performance.memory ? {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize
      } : null,
      timing: performance.timing ? {
        loadEventEnd: performance.timing.loadEventEnd,
        navigationStart: performance.timing.navigationStart
      } : null
    };
  }

  saveToLocalStorage() {
    try {
      const recentErrors = this.errors.slice(0, 50); // Salva apenas os 50 mais recentes
      localStorage.setItem('sgo_frontend_errors', JSON.stringify(recentErrors));
    } catch (error) {
      console.warn('Failed to save errors to localStorage:', error);
    }
  }

  loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('sgo_frontend_errors');
      if (stored) {
        this.errors = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load errors from localStorage:', error);
    }
  }

  async sendToBackend(errorData) {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.warn('No auth token available for error logging');
        return;
      }

      // Avoid logging errors about the error logging endpoint itself
      if (errorData.url && errorData.url.includes('/api/frontend-error-log/')) {
        return;
      }

      await fetch('http://localhost:8000/api/frontend-error-log/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(errorData)
      });
    } catch (error) {
      // Falha silenciosa - não queremos criar loops de erro
      if (import.meta.env.DEV) {
        console.warn('Failed to send error to backend:', error);
      }
    }
  }

  getErrors(limit = 50) {
    return this.errors.slice(0, limit);
  }

  clearErrors() {
    this.errors = [];
    localStorage.removeItem('sgo_frontend_errors');
  }

  getErrorStats() {
    const stats = {
      total: this.errors.length,
      byType: {},
      byUrl: {},
      recent: this.errors.filter(error => {
        const errorTime = new Date(error.timestamp);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return errorTime > oneHourAgo;
      }).length
    };

    this.errors.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      const url = new URL(error.url).pathname;
      stats.byUrl[url] = (stats.byUrl[url] || 0) + 1;
    });

    return stats;
  }

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }
}

// Instância singleton
const errorMonitoring = new ErrorMonitoringService();

// Carrega erros salvos
errorMonitoring.loadFromLocalStorage();

export default errorMonitoring;

// Exporta também como named export para conveniência
export { errorMonitoring };

// Hook React para usar o serviço
export const useErrorMonitoring = () => {
  return {
    captureError: (error, context) => errorMonitoring.captureException(error, context),
    captureMessage: (message, level, context) => errorMonitoring.captureMessage(message, level, context),
    getErrors: (limit) => errorMonitoring.getErrors(limit),
    getStats: () => errorMonitoring.getErrorStats(),
    clearErrors: () => errorMonitoring.clearErrors()
  };
};