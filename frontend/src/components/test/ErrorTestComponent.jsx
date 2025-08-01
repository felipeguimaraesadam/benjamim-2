import React from 'react';
import { errorMonitoring } from '../../services/errorMonitoring';

const ErrorTestComponent = () => {
  const testJavaScriptError = () => {
    try {
      // Força um erro JavaScript
      const obj = null;
      obj.nonExistentMethod();
    } catch (error) {
      errorMonitoring.captureError(error, {
        context: 'Manual Test',
        component: 'ErrorTestComponent'
      });
    }
  };

  const testNetworkError = async () => {
    try {
      // Simula um erro de rede
      const response = await fetch('/api/non-existent-endpoint');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      errorMonitoring.captureError(error, {
        context: 'Network Test',
        component: 'ErrorTestComponent',
        url: '/api/non-existent-endpoint',
        method: 'GET'
      });
      console.log('Erro de rede capturado:', error.message);
    }
  };

  const testUnhandledPromiseRejection = () => {
    // Simula uma promise rejeitada não tratada
    Promise.reject(new Error('Test unhandled promise rejection'));
  };

  const testSlowApiRequest = async () => {
    // Simula uma requisição lenta
    const startTime = Date.now();
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      const endTime = Date.now();
      
      errorMonitoring.captureError(new Error('Slow API simulation'), {
        context: 'Performance Test',
        component: 'ErrorTestComponent',
        duration: endTime - startTime
      });
    } catch (error) {
      errorMonitoring.captureError(error, {
        context: 'Performance Test Error',
        component: 'ErrorTestComponent'
      });
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h3>🧪 Teste de Monitoramento de Erros</h3>
      <p>Use os botões abaixo para testar o sistema de monitoramento:</p>
      
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={testJavaScriptError}
          style={{ padding: '10px', backgroundColor: '#ff6b6b', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Testar Erro JavaScript
        </button>
        
        <button 
          onClick={testNetworkError}
          style={{ padding: '10px', backgroundColor: '#ffa726', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Testar Erro de Rede
        </button>
        
        <button 
          onClick={testUnhandledPromiseRejection}
          style={{ padding: '10px', backgroundColor: '#ef5350', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Testar Promise Rejeitada
        </button>
        
        <button 
          onClick={testSlowApiRequest}
          style={{ padding: '10px', backgroundColor: '#ab47bc', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Testar Requisição Lenta
        </button>
      </div>
      
      <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <small>
          <strong>💡 Dica:</strong> Os erros capturados podem ser visualizados através do botão "Ver Logs de Erro" no cabeçalho da página.
        </small>
      </div>
    </div>
  );
};

export default ErrorTestComponent;