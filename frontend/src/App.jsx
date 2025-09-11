import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';

// Import pages
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DebugLoginPage from './pages/DebugLoginPage';
import ObrasPage from './pages/ObrasPage';
import ObraDetailPage from './pages/ObraDetailPage';
import FuncionariosPage from './pages/FuncionariosPage';
import FuncionarioDetailPage from './pages/FuncionarioDetailPage';
import EquipesPage from './pages/EquipesPage';
import EquipeDetailPage from './pages/EquipeDetailPage';
import MateriaisPage from './pages/MateriaisPage';
import MaterialDetailPage from './pages/MaterialDetailPage';
import LocacoesPage from './pages/LocacoesPage';
import ComprasPage from './pages/ComprasPage';
import CompraDetailsPage from './pages/CompraDetailsPage';
import DespesasExtrasPage from './pages/DespesasExtrasPage';
import OcorrenciasPage from './pages/OcorrenciasPage';
import RelatoriosPage from './pages/RelatoriosPage';
import RelatorioPagamentoPage from './pages/RelatorioPagamentoPage';
import UsuariosPage from './pages/UsuariosPage';
import BackupPage from './pages/BackupPage';
import DiagnosticPage from './pages/DiagnosticPage';
import SystemTestsPage from './pages/SystemTestsPage';
import AnexosS3Page from './pages/AnexosS3Page';
// Páginas administrativas removidas - TasksPage e BranchesPage
import SystemMonitorPage from './pages/SystemMonitorPage';

function App() {

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/debug-login" element={<DebugLoginPage />} />

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
          <Route path="funcionarios">
            <Route index element={<FuncionariosPage />} />
            <Route path=":id" element={<FuncionarioDetailPage />} />
          </Route>
          <Route path="equipes">
            <Route index element={<EquipesPage />} />
            <Route path=":id" element={<EquipeDetailPage />} />
          </Route>
          <Route path="materiais">
            <Route index element={<MateriaisPage />} />
            <Route path=":id" element={<MaterialDetailPage />} />
          </Route>
          <Route path="locacoes" element={<LocacoesPage />} />
          <Route path="compras">
            <Route index element={<ComprasPage />} />
            <Route path="nova" element={<ComprasPage />} />
            <Route path=":id" element={<CompraDetailsPage />} />
          </Route>
          <Route path="despesas" element={<DespesasExtrasPage />} />
          <Route path="ocorrencias" element={<OcorrenciasPage />} />
          <Route path="relatorios" element={<RelatoriosPage />} />
          <Route path="relatorios/pagamento/:tipoRelatorio" element={<RelatorioPagamentoPage />} />

          {/* Admin Routes */}
          <Route element={<AdminLayout />}>
            <Route path="usuarios" element={<UsuariosPage />} />
            <Route path="backup" element={<BackupPage />} />
            <Route path="anexos-s3" element={<AnexosS3Page />} />
            {/* Rotas administrativas removidas - tasks e branches */}
            <Route path="diagnostico" element={<DiagnosticPage />} />
            <Route path="system-tests" element={<SystemTestsPage />} />
            <Route path="system-monitor" element={<SystemMonitorPage />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
