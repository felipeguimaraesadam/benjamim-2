import { post } from './api';

interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  userId?: string;
  additionalData?: any;
}

class ErrorReporter {
  private static instance: ErrorReporter;
  private userId: string | null = null;
  private isEnabled: boolean = true;
  private reportQueue: ErrorReport[] = [];
  private isProcessingQueue: boolean = false;

  private constructor() {
    this.setupGlobalErrorHandlers();
    this.setupUnhandledRejectionHandler();
  }

  public static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter();
    }
    return ErrorReporter.instance;
  }

  public setUserId(userId: string | null): void {
    this.userId = userId;
  }

  public enable(): void {
    this.isEnabled = true;
  }

  public disable(): void {
    this.isEnabled = false;
  }

  private setupGlobalErrorHandlers(): void {
    // Capturar erros JavaScript globais
    window.addEventListener('error', (event) => {
      this.reportError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename || window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        userId: this.userId || undefined,
        additionalData: {
          type: 'javascript_error',
          lineno: event.lineno,
          colno: event.colno,
          filename: event.filename
        }
      });
    });

    // Capturar erros de recursos (imagens, scripts, etc.)
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.reportError({
          message: `Resource loading error: ${(event.target as any)?.src || (event.target as any)?.href}`,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          userId: this.userId || undefined,
          additionalData: {
            type: 'resource_error',
            element: (event.target as any)?.tagName,
            source: (event.target as any)?.src || (event.target as any)?.href
          }
        });
      }
    }, true);
  }

  private setupUnhandledRejectionHandler(): void {
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        userId: this.userId || undefined,
        additionalData: {
          type: 'unhandled_rejection',
          reason: event.reason
        }
      });
    });
  }

  public reportError(errorReport: ErrorReport): void {
    if (!this.isEnabled) return;

    // Adicionar à fila
    this.reportQueue.push(errorReport);
    
    // Processar fila se não estiver sendo processada
    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  public reportApiError(error: any, endpoint: string, method: string): void {
    if (!this.isEnabled) return;

    const errorReport: ErrorReport = {
      message: `API Error: ${method} ${endpoint} - ${error.message || 'Unknown error'}`,
      stack: error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      userId: this.userId || undefined,
      additionalData: {
        type: 'api_error',
        endpoint,
        method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data
      }
    };

    this.reportError(errorReport);
  }

  public reportCustomError(message: string, additionalData?: any): void {
    if (!this.isEnabled) return;

    const errorReport: ErrorReport = {
      message,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      userId: this.userId || undefined,
      additionalData: {
        type: 'custom_error',
        ...additionalData
      }
    };

    this.reportError(errorReport);
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.reportQueue.length === 0) return;

    this.isProcessingQueue = true;

    while (this.reportQueue.length > 0) {
      const errorReport = this.reportQueue.shift();
      if (errorReport) {
        try {
          await this.sendErrorReport(errorReport);
        } catch (sendError) {
          console.error('Falha ao enviar relatório de erro:', sendError);
          // Re-adicionar à fila se falhou (máximo 3 tentativas)
          if (!errorReport.additionalData?.retryCount || errorReport.additionalData.retryCount < 3) {
            errorReport.additionalData = {
              ...errorReport.additionalData,
              retryCount: (errorReport.additionalData?.retryCount || 0) + 1
            };
            this.reportQueue.push(errorReport);
          }
        }
      }
      
      // Pequeno delay entre envios
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isProcessingQueue = false;
  }

  private async sendErrorReport(errorReport: ErrorReport): Promise<void> {
    try {
      await post('/error-report/', errorReport);
    } catch (error) {
      // Se falhar ao enviar, armazenar localmente como fallback
      this.storeErrorLocally(errorReport);
      throw error;
    }
  }

  private storeErrorLocally(errorReport: ErrorReport): void {
    try {
      const storedErrors = JSON.parse(localStorage.getItem('pendingErrorReports') || '[]');
      storedErrors.push(errorReport);
      
      // Manter apenas os últimos 50 erros
      if (storedErrors.length > 50) {
        storedErrors.splice(0, storedErrors.length - 50);
      }
      
      localStorage.setItem('pendingErrorReports', JSON.stringify(storedErrors));
    } catch (storageError) {
      console.error('Falha ao armazenar erro localmente:', storageError);
    }
  }

  public async sendPendingErrors(): Promise<void> {
    try {
      const storedErrors = JSON.parse(localStorage.getItem('pendingErrorReports') || '[]');
      
      for (const errorReport of storedErrors) {
        try {
          await this.sendErrorReport(errorReport);
        } catch (error) {
          console.error('Falha ao enviar erro pendente:', error);
        }
      }
      
      // Limpar erros enviados com sucesso
      localStorage.removeItem('pendingErrorReports');
    } catch (error) {
      console.error('Falha ao processar erros pendentes:', error);
    }
  }

  public getStoredErrors(): ErrorReport[] {
    try {
      return JSON.parse(localStorage.getItem('pendingErrorReports') || '[]');
    } catch (error) {
      console.error('Falha ao recuperar erros armazenados:', error);
      return [];
    }
  }

  public clearStoredErrors(): void {
    try {
      localStorage.removeItem('pendingErrorReports');
    } catch (error) {
      console.error('Falha ao limpar erros armazenados:', error);
    }
  }
}

// Instância singleton
export const errorReporter = ErrorReporter.getInstance();

// Nota: O interceptor de API já está configurado no arquivo api.js
// Não precisamos duplicar aqui para evitar conflitos

// Exportar tipos para uso em outros arquivos
export type { ErrorReport }