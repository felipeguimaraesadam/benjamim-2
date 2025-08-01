import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import { useAuth } from './contexts/AuthContext';

// Import pages
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import ObrasPage from './pages/ObrasPage';
import ObraDetailPage from './pages/ObraDetailPage';
import FuncionariosPage from './pages/FuncionariosPage';
import EquipesPage from './pages/EquipesPage';
import MateriaisPage from './pages/MateriaisPage';
import LocacoesPage from './pages/LocacoesPage';
import ComprasPage from './pages/ComprasPage';
import DespesasExtrasPage from './pages/DespesasExtrasPage';
import OcorrenciasPage from './pages/OcorrenciasPage';
import RelatoriosPage from './pages/RelatoriosPage';
import UsuariosPage from './pages/UsuariosPage';
import BackupPage from './pages/BackupPage';
import ErrorTestPage from './pages/ErrorTestPage';

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="obras">
            <Route index element={<ObrasPage />} />
            <Route path=":id" element={<ObraDetailPage />} />
          </Route>
          <Route path="funcionarios" element={<FuncionariosPage />} />
          <Route path="equipes" element={<EquipesPage />} />
          <Route path="materiais" element={<MateriaisPage />} />
          <Route path="locacoes" element={<LocacoesPage />} />
          <Route path="compras" element={<ComprasPage />} />
          <Route path="despesas" element={<DespesasExtrasPage />} />
          <Route path="ocorrencias" element={<OcorrenciasPage />} />
          <Route path="relatorios" element={<RelatoriosPage />} />

          {/* Admin Routes */}
          <Route element={<AdminLayout />}>
            <Route path="usuarios" element={<UsuariosPage />} />
            <Route path="backup" element={<BackupPage />} />
            <Route path="error-tests" element={<ErrorTestPage />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
