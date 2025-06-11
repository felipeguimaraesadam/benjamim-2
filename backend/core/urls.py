from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UsuarioViewSet, ObraViewSet, FuncionarioViewSet, EquipeViewSet,
    AlocacaoObrasEquipesViewSet, MaterialViewSet, CompraViewSet,
    DespesaExtraViewSet, OcorrenciaFuncionarioViewSet, UsoMaterialViewSet,
    RelatorioFinanceiroObraView, RelatorioGeralComprasView, DashboardStatsView,
    RelatorioDesempenhoEquipeView, RelatorioCustoGeralView, ObraHistoricoCustosView,
    ObraCustosPorCategoriaView, ObraCustosPorMaterialView # Added new views
)

router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet)
router.register(r'obras', ObraViewSet)
router.register(r'funcionarios', FuncionarioViewSet)
router.register(r'equipes', EquipeViewSet)
router.register(r'alocacoes', AlocacaoObrasEquipesViewSet)
router.register(r'materiais', MaterialViewSet)
router.register(r'compras', CompraViewSet)
router.register(r'despesas', DespesaExtraViewSet)
router.register(r'ocorrencias', OcorrenciaFuncionarioViewSet)
router.register(r'usomateriais', UsoMaterialViewSet, basename='usomaterial')

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
]
