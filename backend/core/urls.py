from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CreateUsuarioView, UsuarioViewSet, ObraViewSet, FuncionarioViewSet, EquipeViewSet,
    LocacaoObrasEquipesViewSet, MaterialViewSet, CompraViewSet, DespesaExtraViewSet,
    OcorrenciaFuncionarioViewSet, FotoObraViewSet,
    BackupViewSet, BackupSettingsViewSet, AnexoLocacaoViewSet, AnexoDespesaViewSet,
    ParcelaCompraViewSet, AnexoCompraViewSet, ArquivoObraViewSet,
    FuncionarioDetailView, EquipeDetailView, MaterialDetailAPIView,
    RelatorioFinanceiroObraView, RelatorioGeralComprasView, DashboardStatsView,
    RelatorioDesempenhoEquipeView, RelatorioCustoGeralView, ObraHistoricoCustosView,
    ObraCustosPorCategoriaView, RelatorioFolhaPagamentoViewSet, RelatorioPagamentoMateriaisViewSet,
    GerarRelatorioPDFObraView, GerarRelatorioPagamentoLocacoesPDFView, LocacaoSemanalView,
    RecursosMaisUtilizadosSemanaView, ObraCustosPorMaterialView, ObraCustosPorCategoriaMaterialView,
    media_test_view
)
from .views.service_views import BackupViewSet as NewBackupViewSet, TaskViewSet, AnexoS3ViewSet
from .health_views import health_check
from .health import database_status
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from api.test_data import populate_test_data, clear_test_data

router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet)
router.register(r'obras', ObraViewSet)
router.register(r'funcionarios', FuncionarioViewSet)
router.register(r'equipes', EquipeViewSet)
router.register(r'locacoes', LocacaoObrasEquipesViewSet)
router.register(r'materiais', MaterialViewSet)
router.register(r'compras', CompraViewSet, basename='compra')
router.register(r'despesas', DespesaExtraViewSet)
router.register(r'ocorrencias', OcorrenciaFuncionarioViewSet)
router.register(r'fotos-obra', FotoObraViewSet)
router.register(r'anexos-locacao', AnexoLocacaoViewSet)
router.register(r'anexos-despesa', AnexoDespesaViewSet)
router.register(r'backups', BackupViewSet)
router.register(r'backup-settings', BackupSettingsViewSet, basename='backupsettings')
router.register(r'service-backups', NewBackupViewSet, basename='service-backup')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'anexos-s3', AnexoS3ViewSet, basename='anexo-s3')
router.register(r'parcelas-compra', ParcelaCompraViewSet)
router.register(r'anexos-compra', AnexoCompraViewSet)
router.register(r'arquivos-obra', ArquivoObraViewSet)


urlpatterns = [
    path('register/', CreateUsuarioView.as_view(), name='create-user'),
    # URLs específicas devem vir ANTES do router para evitar conflitos
    path('locacoes/semanal/', LocacaoSemanalView.as_view(), name='locacao-semanal'),
    path('', include(router.urls)),
    path('funcionarios/<int:pk>/details/', FuncionarioDetailView.as_view(), name='funcionario-detail'),
    path('equipes/<int:pk>/details/', EquipeDetailView.as_view(), name='equipe-detail'),
    path('materiais/<int:pk>/details/', MaterialDetailAPIView.as_view(), name='material-detail-api'),
    path('relatorios/financeiro-obra/', RelatorioFinanceiroObraView.as_view(), name='relatorio-financeiro-obra'),
    path('relatorios/geral-compras/', RelatorioGeralComprasView.as_view(), name='relatorio-geral-compras'),
    path('relatorios/dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('relatorios/desempenho-equipe/', RelatorioDesempenhoEquipeView.as_view(), name='relatorio-desempenho-equipe'),
    path('relatorios/custo-geral/', RelatorioCustoGeralView.as_view(), name='relatorio-custo-geral'),
    path('obras/<int:pk>/historico-custos/', ObraHistoricoCustosView.as_view(), name='obra-historico-custos'),
    path('obras/<int:pk>/custos-por-categoria/', ObraCustosPorCategoriaView.as_view(), name='obra-custos-por-categoria'),
    path('relatorios/folha-pagamento/', RelatorioFolhaPagamentoViewSet.as_view({'get': 'generate_report'}), name='relatorio-folha-pagamento'),
    path('relatorios/pagamento-materiais/', RelatorioPagamentoMateriaisViewSet.as_view({'get': 'gerar_relatorio_pagamentos_materiais'}), name='relatorio-pagamento-materiais'),
    path('obras/<int:pk>/gerar-pdf/', GerarRelatorioPDFObraView.as_view(), name='gerar-pdf-obra'),
    path('relatorios/pagamento-locacoes/gerar-pdf/', GerarRelatorioPagamentoLocacoesPDFView.as_view(), name='gerar-pdf-pagamento-locacoes'),
    path('relatorios/recursos-mais-utilizados/', RecursosMaisUtilizadosSemanaView.as_view(), name='recursos-mais-utilizados-semana'),
    path('obras/<int:pk>/custos-por-material/', ObraCustosPorMaterialView.as_view(), name='obra-custos-por-material'),
    path('obras/<int:pk>/gastos-por-categoria-material/', ObraCustosPorCategoriaMaterialView.as_view(), name='obra-gastos-por-categoria-material'),
    path('media-test/', media_test_view, name='media-test'),
    path('health/', health_check, name='health-check'),
    path('health/database/', database_status, name='database-status'),
    # Endpoints de dados de teste - APENAS para ambiente de desenvolvimento/teste
    path('populate-test-data/', populate_test_data, name='populate-test-data'),
    path('clear-test-data/', clear_test_data, name='clear-test-data'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
