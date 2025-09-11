# ENDPOINTS DE DADOS DE TESTE
# ⚠️ IMPORTANTE: Estes endpoints devem ser usados APENAS em ambiente de desenvolvimento/teste
# Nunca disponibilize em ambiente de produção pois podem limpar todos os dados

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.management import call_command
from core.models import (
    Obra, Funcionario, Equipe, Material, Locacao_Obras_Equipes, Compra, ItemCompra, Despesa_Extra
)
import json

@csrf_exempt
@require_http_methods(["POST"])
def populate_test_data(request):
    """
    Endpoint para popular o banco de dados com dados de teste
    ⚠️ APENAS PARA AMBIENTE DE TESTE - NÃO USAR EM PRODUÇÃO
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
            'locacoes': Locacao_Obras_Equipes.objects.count(),
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
    ⚠️ APENAS PARA AMBIENTE DE TESTE - NÃO USAR EM PRODUÇÃO
    """
    try:
        # Conta os registros antes de deletar
        counts_before = {
            'obras': Obra.objects.count(),
            'funcionarios': Funcionario.objects.count(),
            'equipes': Equipe.objects.count(),
            'materiais': Material.objects.count(),
            'locacoes': Locacao_Obras_Equipes.objects.count(),
            'compras': Compra.objects.count(),
            'despesas': Despesa_Extra.objects.count()
        }
        
        # Remove todos os dados na ordem correta (respeitando as dependências)
        Despesa_Extra.objects.all().delete()
        ItemCompra.objects.all().delete()
        Compra.objects.all().delete()
        Locacao_Obras_Equipes.objects.all().delete()
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
                    'locacoes': Locacao_Obras_Equipes.objects.count(),
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