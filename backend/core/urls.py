from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UsuarioViewSet, ObraViewSet, FuncionarioViewSet, EquipeViewSet,
    LocacaoObrasEquipesViewSet, MaterialViewSet, CompraViewSet,
    DespesaExtraViewSet, OcorrenciaFuncionarioViewSet, FotoObraViewSet,
    AnexoLocacaoViewSet, AnexoDespesaViewSet, BackupViewSet,
    BackupSettingsViewSet, FuncionarioDetailView, EquipeDetailView,
    MaterialDetailAPIView, RelatorioFinanceiroObraView,
    RelatorioGeralComprasView, DashboardStatsView,
    RelatorioDesempenhoEquipeView, RelatorioCustoGeralView,
    ObraHistoricoCustosView, ObraCustosPorCategoriaView,
    RelatorioFolhaPagamentoViewSet, RelatorioPagamentoMateriaisViewSet,
    GerarRelatorioPDFObraView, GerarRelatorioPagamentoLocacoesPDFView,
    LocacaoSemanalView, RecursosMaisUtilizadosSemanaView,
    ObraCustosPorMaterialView, ObraCustosPorCategoriaMaterialView,
    FrontendErrorLogView
)

router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet)
router.register(r'obras', ObraViewSet)
router.register(r'funcionarios', FuncionarioViewSet)
router.register(r'equipes', EquipeViewSet)
router.register(r'locacoes', LocacaoObrasEquipesViewSet)
router.register(r'materiais', MaterialViewSet)
router.register(r'compras', CompraViewSet)
router.register(r'despesas', DespesaExtraViewSet)
router.register(r'ocorrencias', OcorrenciaFuncionarioViewSet)
router.register(r'fotos-obra', FotoObraViewSet)
router.register(r'anexos-locacao', AnexoLocacaoViewSet)
router.register(r'anexos-despesa', AnexoDespesaViewSet)
router.register(r'backups', BackupViewSet)
router.register(r'backup-settings', BackupSettingsViewSet, basename='backupsettings')


urlpatterns = [
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
    path('locacoes/semanal/', LocacaoSemanalView.as_view(), name='locacao-semanal'),
    path('relatorios/recursos-mais-utilizados/', RecursosMaisUtilizadosSemanaView.as_view(), name='recursos-mais-utilizados-semana'),
    path('obras/<int:pk>/custos-por-material/', ObraCustosPorMaterialView.as_view(), name='obra-custos-por-material'),
    path('obras/<int:pk>/custos-por-categoria-material/', ObraCustosPorCategoriaMaterialView.as_view(), name='obra-custos-por-categoria-material'),
    path('frontend-error-log/', FrontendErrorLogView.as_view(), name='frontend-error-log'),
]
