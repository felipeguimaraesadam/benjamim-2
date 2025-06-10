from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UsuarioViewSet, ObraViewSet, FuncionarioViewSet, EquipeViewSet,
    AlocacaoObrasEquipesViewSet, MaterialViewSet, CompraViewSet,
    DespesaExtraViewSet, OcorrenciaFuncionarioViewSet,
    RelatorioFinanceiroObraView, RelatorioGeralComprasView  # Added new views
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

urlpatterns = [
    path('', include(router.urls)),
    path('relatorios/financeiro-obra/', RelatorioFinanceiroObraView.as_view(), name='relatorio-financeiro-obra'),
    path('relatorios/geral-compras/', RelatorioGeralComprasView.as_view(), name='relatorio-geral-compras'),
]
