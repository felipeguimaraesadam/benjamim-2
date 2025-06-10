from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UsuarioViewSet, ObraViewSet, FuncionarioViewSet, EquipeViewSet, AlocacaoObrasEquipesViewSet, MaterialViewSet, CompraViewSet, DespesaExtraViewSet, OcorrenciaFuncionarioViewSet

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
]
