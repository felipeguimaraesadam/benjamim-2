from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.management import call_command
from core.models import (
    Obra, Funcionario, Equipe, Material, Locacao, Compra, ItemCompra, Despesa_Extra
)
import json

@csrf_exempt
@require_http_methods(["POST"])
def populate_test_data(request):
    """
    Endpoint para popular o banco de dados com dados de teste
    """
    try:
        # Executa o comando de popular dados
        call_command('populate_db')
        
        # Conta os registros criados
        counts = {
            'obras': Obra.objects.count(),
            'funcionarios': Funcionario.objects.count(),
            'equipes': Equipe.objects.count(),
            'materiais': Material.objects.count(),
            'locacoes': Locacao.objects.count(),
            'compras': Compra.objects.count(),
            'despesas': Despesa_Extra.objects.count()
        }
        
        return JsonResponse({
            'success': True,
            'message': 'Dados de teste populados com sucesso!',
            'data': counts
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Erro ao popular dados de teste: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["DELETE"])
def clear_test_data(request):
    """
    Endpoint para limpar todos os dados de teste do banco
    """
    try:
        # Conta os registros antes de deletar
        counts_before = {
            'obras': Obra.objects.count(),
            'funcionarios': Funcionario.objects.count(),
            'equipes': Equipe.objects.count(),
            'materiais': Material.objects.count(),
            'locacoes': Locacao.objects.count(),
            'compras': Compra.objects.count(),
            'despesas': Despesa_Extra.objects.count()
        }
        
        # Remove todos os dados na ordem correta (respeitando as dependências)
        Despesa_Extra.objects.all().delete()
        ItemCompra.objects.all().delete()
        Compra.objects.all().delete()
        Locacao.objects.all().delete()
        Material.objects.all().delete()
        Equipe.objects.all().delete()
        Funcionario.objects.all().delete()
        Obra.objects.all().delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Dados de teste removidos com sucesso!',
            'data': {
                'removed_counts': counts_before,
                'current_counts': {
                    'obras': Obra.objects.count(),
                    'funcionarios': Funcionario.objects.count(),
                    'equipes': Equipe.objects.count(),
                    'materiais': Material.objects.count(),
                    'locacoes': Locacao.objects.count(),
                    'compras': Compra.objects.count(),
                    'despesas': Despesa_Extra.objects.count()
                }
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Erro ao limpar dados de teste: {str(e)}'
        }, status=500)