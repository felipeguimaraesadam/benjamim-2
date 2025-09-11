#!/usr/bin/env python
import os
import sys
import django

# Adicionar o diretório backend ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

print("🔍 Testando importações do core/urls.py...")

try:
    from django.urls import path, include
    print("✅ Django URLs importado")
except Exception as e:
    print(f"❌ Erro ao importar Django URLs: {e}")

try:
    from rest_framework.routers import DefaultRouter
    print("✅ DefaultRouter importado")
except Exception as e:
    print(f"❌ Erro ao importar DefaultRouter: {e}")

try:
    from core.views import (
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
        media_test_view, CreateUsuarioView, ParcelaCompraViewSet,
        AnexoCompraViewSet, ArquivoObraViewSet, GerarPDFComprasLoteView
    )
    print("✅ Core views importadas")
except Exception as e:
    print(f"❌ Erro ao importar core views: {e}")

try:
    from core.views.service_views import BackupViewSet as NewBackupViewSet, TaskViewSet, AnexoS3ViewSet
    print("✅ Service views importadas")
except Exception as e:
    print(f"❌ Erro ao importar service views: {e}")

try:
    from core.health_views import health_check, database_status
    print("✅ Health views importadas")
except Exception as e:
    print(f"❌ Erro ao importar health views: {e}")

try:
    from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
    print("✅ JWT views importadas")
except Exception as e:
    print(f"❌ Erro ao importar JWT views: {e}")

try:
    from api.test_data import populate_test_data, clear_test_data
    print("✅ Test data functions importadas")
except Exception as e:
    print(f"❌ Erro ao importar test data functions: {e}")

print("\n🔄 Tentando importar o módulo core.urls completo...")
try:
    import core.urls
    print(f"✅ core.urls importado com sucesso")
    print(f"📊 Número de urlpatterns: {len(core.urls.urlpatterns)}")
except Exception as e:
    print(f"❌ Erro ao importar core.urls: {e}")
    import traceback
    traceback.print_exc()