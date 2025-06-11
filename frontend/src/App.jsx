import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import {
  createBrowserRouter,
  RouterProvider,
  Outlet // Outlet is mainly for Layout, not directly here if Layout handles it.
} from 'react-router-dom';

// Layout component
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute'; // Import ProtectedRoute

// Page components
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ObrasPage from './pages/ObrasPage';
import FuncionariosPage from './pages/FuncionariosPage';
import OcorrenciasPage from './pages/OcorrenciasPage'; // Import OcorrenciasPage
import EquipesPage from './pages/EquipesPage';
import MateriaisPage from './pages/MateriaisPage';
import RelatoriosPage from './pages/RelatoriosPage';
import DespesasExtrasPage from './pages/DespesasExtrasPage';
import AlocacoesPage from './pages/AlocacoesPage';
import ComprasPage from './pages/ComprasPage'; // Import ComprasPage
import UsuariosPage from './pages/UsuariosPage'; // Import UsuariosPage

const router = createBrowserRouter([
  {
    // General authenticated routes
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <Layout />,
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: 'obras',
            element: <ObrasPage />,
          },
          {
            path: 'funcionarios',
            element: <FuncionariosPage />,
          },
          {
            path: 'ocorrencias',
            element: <OcorrenciasPage />,
          },
          {
            path: 'equipes',
            element: <EquipesPage />,
          },
          {
            path: 'materiais',
            element: <MateriaisPage />,
          },
          {
            path: 'relatorios',
            element: <RelatoriosPage />,
          },
          {
            path: 'despesas',
            element: <DespesasExtrasPage />,
          },
          {
            path: 'alocacoes',
            element: <AlocacoesPage />,
          },
          {
            path: 'compras',
            element: <ComprasPage />,
          },
        ],
      }
    ]
  },
  {
    // Admin-specific routes
    element: <ProtectedRoute isAdminRoute={true} />,
    children: [
      {
        path: '/usuarios', // Path for admin user management
        element: <Layout />, // Still use the main layout
        children: [
          {
            index: true,
            element: <UsuariosPage />,
          }
        ]
      }
      // Add other admin-only routes here if needed
    ]
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
