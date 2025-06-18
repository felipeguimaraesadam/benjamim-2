from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UsuarioViewSet, ObraViewSet, FuncionarioViewSet, EquipeViewSet,
    LocacaoObrasEquipesViewSet, MaterialViewSet, CompraViewSet,
    DespesaExtraViewSet, OcorrenciaFuncionarioViewSet, UsoMaterialViewSet,
    FotoObraViewSet, # Added FotoObraViewSet
    RelatorioFinanceiroObraView, RelatorioGeralComprasView, DashboardStatsView,
    RelatorioDesempenhoEquipeView, RelatorioCustoGeralView, ObraHistoricoCustosView,
    ObraCustosPorCategoriaView, ObraCustosPorMaterialView, # Added new views
    RelatorioFolhaPagamentoViewSet, FuncionarioDetailView, EquipeDetailView # Added EquipeDetailView
)

router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet)
router.register(r'obras', ObraViewSet)
router.register(r'funcionarios', FuncionarioViewSet)
router.register(r'equipes', EquipeViewSet)
router.register(r'locacoes', LocacaoObrasEquipesViewSet)
router.register(r'materiais', MaterialViewSet)
router.register(r'compras', CompraViewSet, basename='compra')
router.register(r'despesas', DespesaExtraViewSet, basename='despesaextra')
router.register(r'ocorrencias', OcorrenciaFuncionarioViewSet)
router.register(r'usomateriais', UsoMaterialViewSet, basename='usomaterial')
router.register(r'fotosobras', FotoObraViewSet, basename='fotoobra') # Add this line
router.register(r'relatorios/folha-pagamento', RelatorioFolhaPagamentoViewSet, basename='relatorio-folha-pagamento')


urlpatterns = [
    path('', include(router.urls)),
    path('relatorios/financeiro-obra/', RelatorioFinanceiroObraView.as_view(), name='relatorio-financeiro-obra'),
    path('relatorios/geral-compras/', RelatorioGeralComprasView.as_view(), name='relatorio-geral-compras'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('relatorios/desempenho-equipe/', RelatorioDesempenhoEquipeView.as_view(), name='relatorio-desempenho-equipe'),
    path('relatorios/custo-geral/', RelatorioCustoGeralView.as_view(), name='relatorio-custo-geral'),
    path('obras/<int:pk>/historico-custos/', ObraHistoricoCustosView.as_view(), name='obra-historico-custos'),
    path('obras/<int:pk>/custos-por-categoria/', ObraCustosPorCategoriaView.as_view(), name='obra-custos-categoria'), # New route
    path('obras/<int:pk>/custos-por-material/', ObraCustosPorMaterialView.as_view(), name='obra-custos-material'), # New route
    # Path for FuncionarioDetailView
    path('funcionarios/<int:pk>/details/', FuncionarioDetailView.as_view(), name='funcionario-details'),
    # Path for EquipeDetailView
    path('equipes/<int:pk>/details/', EquipeDetailView.as_view(), name='equipe-details'),
]
