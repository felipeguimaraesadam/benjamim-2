from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UsuarioViewSet, ObraViewSet, FuncionarioViewSet, EquipeViewSet,
    LocacaoObrasEquipesViewSet, MaterialViewSet, CompraViewSet,
    DespesaExtraViewSet, OcorrenciaFuncionarioViewSet,
    FotoObraViewSet, # Added FotoObraViewSet
    # ObrasDashboardSummaryView removed
    RelatorioFinanceiroObraView, RelatorioGeralComprasView, DashboardStatsView,
    RelatorioDesempenhoEquipeView, RelatorioCustoGeralView, ObraHistoricoCustosView,
    ObraCustosPorCategoriaView, ObraCustosPorMaterialView, # Added new views
    RelatorioFolhaPagamentoViewSet, FuncionarioDetailView, EquipeDetailView,
    MaterialDetailAPIView, RelatorioPagamentoMateriaisViewSet, GerarRelatorioPDFObraView,
    GerarRelatorioPagamentoLocacoesPDFView, LocacaoSemanalView, # Added new PDF view for Locacoes and LocacaoSemanalView
    RecursosMaisUtilizadosSemanaView # Added for analytics
)

router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet)
router.register(r'obras', ObraViewSet)
router.register(r'funcionarios', FuncionarioViewSet)
router.register(r'equipes', EquipeViewSet) # type: ignore
router.register(r'locacoes', LocacaoObrasEquipesViewSet) # type: ignore
router.register(r'materiais', MaterialViewSet) # type: ignore
router.register(r'compras', CompraViewSet, basename='compra')
router.register(r'despesas', DespesaExtraViewSet, basename='despesaextra')
router.register(r'ocorrencias', OcorrenciaFuncionarioViewSet)
router.register(r'fotosobras', FotoObraViewSet, basename='fotoobra')
router.register(r'relatorios/folha-pagamento', RelatorioFolhaPagamentoViewSet, basename='relatorio-folha-pagamento') # type: ignore
router.register(r'relatorios/pagamento-materiais', RelatorioPagamentoMateriaisViewSet, basename='relatorio-pagamento-materiais') # type: ignore

# URLs específicas devem vir ANTES do include do router para garantir que sejam resolvidas primeiro.
specific_urlpatterns = [
    path('locacoes/semana/', LocacaoSemanalView.as_view(), name='locacao-semanal'),
    path('analytics/recursos-semana/', RecursosMaisUtilizadosSemanaView.as_view(), name='analytics-recursos-semana'),
    path('relatorios/financeiro-obra/', RelatorioFinanceiroObraView.as_view(), name='relatorio-financeiro-obra'),
    path('relatorios/geral-compras/', RelatorioGeralComprasView.as_view(), name='relatorio-geral-compras'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('relatorios/desempenho-equipe/', RelatorioDesempenhoEquipeView.as_view(), name='relatorio-desempenho-equipe'),
    path('relatorios/custo-geral/', RelatorioCustoGeralView.as_view(), name='relatorio-custo-geral'),
    path('obras/<int:pk>/historico-custos/', ObraHistoricoCustosView.as_view(), name='obra-historico-custos'),
    path('obras/<int:pk>/custos-por-categoria/', ObraCustosPorCategoriaView.as_view(), name='obra-custos-categoria'),
    path('obras/<int:pk>/custos-por-material/', ObraCustosPorMaterialView.as_view(), name='obra-custos-material'),
    path('funcionarios/<int:pk>/details/', FuncionarioDetailView.as_view(), name='funcionario-details'),
    path('equipes/<int:pk>/details/', EquipeDetailView.as_view(), name='equipe-details'),
    path('materiais/<int:pk>/details/', MaterialDetailAPIView.as_view(), name='material-details'),
    path('obras/<int:pk>/gerar-relatorio-pdf/', GerarRelatorioPDFObraView.as_view(), name='gerar-relatorio-pdf-obra'),
    path('relatorios/pagamento-locacoes/pdf/', GerarRelatorioPagamentoLocacoesPDFView.as_view(), name='gerar-relatorio-pagamento-locacoes-pdf'),
]

urlpatterns = [
    # Inclui as URLs específicas primeiro
    *specific_urlpatterns,
    # Depois inclui as URLs do router
    path('', include(router.urls)), # type: ignore
]
