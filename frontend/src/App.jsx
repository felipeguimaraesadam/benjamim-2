import React from 'react';
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
import EquipesPage from './pages/EquipesPage';
import MateriaisPage from './pages/MateriaisPage';
import RelatoriosPage from './pages/RelatoriosPage';
import DespesasExtrasPage from './pages/DespesasExtrasPage';
import AlocacoesPage from './pages/AlocacoesPage';

const router = createBrowserRouter([
  {
    element: <ProtectedRoute />, // Protect all routes within this element
    children: [
      {
        path: '/',
        element: <Layout />, // Layout is now a child of ProtectedRoute
        children: [
          {
            index: true, // Corresponds to '/'
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
          // Add other CRUD/report pages as children of Layout here
        ],
      }
    ]
  },
  {
    path: '/login',
    element: <LoginPage />, // Login page does not use ProtectedRoute or main Layout
  },
  // TODO: Add a catch-all 404 route if desired
  // {
  //   path: '*',
  //   element: <NotFoundPage /> // Example, if you create a NotFoundPage
  // }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
