import React from 'react'; // Ensure React is imported for StrictMode
import ReactDOM from 'react-dom/client'; // Correct import for createRoot
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext'; // Import AuthProvider

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
