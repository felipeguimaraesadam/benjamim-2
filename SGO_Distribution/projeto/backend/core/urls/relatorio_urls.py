from django.urls import path, include
from rest_framework.routers import DefaultRouter
from ..views import (
    RelatorioFinanceiroObraView, RelatorioGeralComprasView, RelatorioDesempenhoEquipeView,
    RelatorioCustoGeralView, RelatorioFolhaPagamentoViewSet, RelatorioPagamentoMateriaisViewSet,
    GerarRelatorioPagamentoLocacoesPDFView
)

router = DefaultRouter()
router.register(r'folha-pagamento', RelatorioFolhaPagamentoViewSet, basename='relatorio-folha-pagamento')
router.register(r'pagamento-materiais', RelatorioPagamentoMateriaisViewSet, basename='relatorio-pagamento-materiais')

urlpatterns = [
    path('', include(router.urls)),
    path('financeiro-obra/', RelatorioFinanceiroObraView.as_view(), name='relatorio-financeiro-obra'),
    path('geral-compras/', RelatorioGeralComprasView.as_view(), name='relatorio-geral-compras'),
    path('desempenho-equipe/', RelatorioDesempenhoEquipeView.as_view(), name='relatorio-desempenho-equipe'),
    path('custo-geral/', RelatorioCustoGeralView.as_view(), name='relatorio-custo-geral'),
    path('pagamento-locacoes/pdf/', GerarRelatorioPagamentoLocacoesPDFView.as_view(), name='gerar-relatorio-pagamento-locacoes-pdf'),
]