from django.urls import path, include
from rest_framework.routers import DefaultRouter
from ..views import (
    ObraViewSet, FotoObraViewSet, ObraHistoricoCustosView,
    ObraCustosPorCategoriaView, ObraCustosPorMaterialView, GerarRelatorioPDFObraView
)

router = DefaultRouter()
router.register(r'', ObraViewSet, basename='obra')
router.register(r'fotos', FotoObraViewSet, basename='fotoobra')

urlpatterns = [
    path('', include(router.urls)),
    path('<int:pk>/historico-custos/', ObraHistoricoCustosView.as_view(), name='obra-historico-custos'),
    path('<int:pk>/custos-por-categoria/', ObraCustosPorCategoriaView.as_view(), name='obra-custos-categoria'),
    path('<int:pk>/custos-por-material/', ObraCustosPorMaterialView.as_view(), name='obra-custos-material'),
    path('<int:pk>/gerar-relatorio-pdf/', GerarRelatorioPDFObraView.as_view(), name='gerar-relatorio-pdf-obra'),
]