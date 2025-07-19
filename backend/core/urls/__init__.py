from django.urls import path, include
from rest_framework.routers import DefaultRouter
from ..views import (
    CreateUsuarioView, UsuarioViewSet, FuncionarioViewSet, EquipeViewSet,
    LocacaoObrasEquipesViewSet, MaterialViewSet, CompraViewSet,
    DespesaExtraViewSet, OcorrenciaFuncionarioViewSet,
    DashboardStatsView, FuncionarioDetailView, EquipeDetailView,
    MaterialDetailAPIView, LocacaoSemanalView,
    RecursosMaisUtilizadosSemanaView, BackupViewSet, BackupSettingsViewSet
)

router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet)
router.register(r'funcionarios', FuncionarioViewSet)
router.register(r'equipes', EquipeViewSet)
router.register(r'locacoes', LocacaoObrasEquipesViewSet)
router.register(r'materiais', MaterialViewSet)
router.register(r'compras', CompraViewSet, basename='compra')
router.register(r'despesas', DespesaExtraViewSet, basename='despesaextra')
router.register(r'ocorrencias', OcorrenciaFuncionarioViewSet)
router.register(r'backups', BackupViewSet)
router.register(r'backup-settings', BackupSettingsViewSet)

urlpatterns = [
    path('register/', CreateUsuarioView.as_view(), name='create-user'),
    path('locacoes/semana/', LocacaoSemanalView.as_view(), name='locacao-semanal'),
    path('analytics/recursos-semana/', RecursosMaisUtilizadosSemanaView.as_view(), name='analytics-recursos-semana'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('funcionarios/<int:pk>/details/', FuncionarioDetailView.as_view(), name='funcionario-details'),
    path('equipes/<int:pk>/details/', EquipeDetailView.as_view(), name='equipe-details'),
    path('materiais/<int:pk>/details/', MaterialDetailAPIView.as_view(), name='material-details'),
    path('', include(router.urls)),
    path('obras/', include('core.urls.obra_urls')),
    path('relatorios/', include('core.urls.relatorio_urls')),
]