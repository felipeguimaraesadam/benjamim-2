import React from 'react'; // Ensure React is imported for StrictMode
import ReactDOM from 'react-dom/client'; // Correct import for createRoot
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary.jsx';

import { ToastContainer } from 'react-toastify'; // Import ToastContainer
import 'react-toastify/dist/ReactToastify.css'; // Import CSS for react-toastify

// Importar sistema de relatório de erros
import { errorReporter } from './services/errorReporter.ts';

// Log de inicialização da aplicação
console.log('SGO Frontend iniciado:', {
  timestamp: new Date().toISOString(),
  environment: import.meta.env.MODE,
  version: '1.0.0',
});

// Inicializar sistema de relatório de erros
try {
  // Habilitar relatório de erros em produção
  if (import.meta.env.PROD) {
    errorReporter.enable();
  } else {
    // Em desenvolvimento, manter habilitado mas com menos verbosidade
    errorReporter.enable();
  }
  
  // Tentar enviar erros pendentes do localStorage
  errorReporter.sendPendingErrors().catch(err => {
    console.warn('Falha ao enviar erros pendentes:', err);
  });
  
  console.log('Sistema de relatório de erros inicializado');
} catch (error) {
  console.error('Falha ao inicializar sistema de relatório de erros:', error);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <App />
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
