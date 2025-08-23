#!/usr/bin/env python
import os
import sys
import django
from datetime import date, timedelta
import json

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from core.models import *
from core.serializers import CompraSerializer

def test_pagamento_parcelado():
    print("=== TESTE DE PAGAMENTO PARCELADO ===")
    
    # Limpar dados de teste anteriores
    Compra.objects.filter(fornecedor__icontains='Teste Parcelado Final').delete()
    Obra.objects.filter(nome_obra__icontains='Teste Parcelado Final').delete()
    Material.objects.filter(nome__icontains='Teste Parcelado Final').delete()
    
    # Criar obra de teste
    obra = Obra.objects.create(
        nome_obra='Obra Teste Parcelado Final',
        endereco_completo='Rua Teste, 123',
        orcamento_previsto=50000.00
    )
    print(f'✅ Obra criada: {obra.id} - {obra.nome_obra}')
    
    # Criar material de teste
    material = Material.objects.create(
        nome='Material Teste Parcelado Final',
        unidade_medida='un'
    )
    print(f'✅ Material criado: {material.id} - {material.nome}')
    
    # Criar usuário de teste se não existir
    user, created = Usuario.objects.get_or_create(
        login='teste_parcelado',
        defaults={'nome_completo': 'Teste Parcelado', 'password': 'teste123'}
    )
    print(f'✅ Usuário: {user.login} (criado: {created})')
    
    # Dados da compra parcelada
    pagamento_parcelado = {
        'tipo': 'PARCELADO',
        'parcelas': [
            {
                'numero': 1,
                'valor': 1500.00,
                'data_vencimento': (date.today() + timedelta(days=30)).isoformat()
            },
            {
                'numero': 2,
                'valor': 1500.00,
                'data_vencimento': (date.today() + timedelta(days=60)).isoformat()
            }
        ]
    }
    
    compra_data = {
        'tipo': 'COMPRA',
        'obra': obra.id,
        'data_compra': date.today().isoformat(),
        'fornecedor': 'Fornecedor Teste Parcelado Final',
        'forma_pagamento': 'PARCELADO',
        'numero_parcelas': 2,
        'desconto': 0.00,
        'itens': [{
            'material': material.id,
            'quantidade': 30,
            'valor_unitario': 100.00
        }],
        'pagamento_parcelado': pagamento_parcelado
    }
    
    print('\n=== DADOS DA COMPRA ===')
    print(json.dumps(compra_data, indent=2, default=str))
    
    # Criar compra usando serializer com contexto mock
    from unittest.mock import Mock
    mock_request = Mock()
    mock_request.data = {}
    
    serializer = CompraSerializer(data=compra_data, context={'request': mock_request})
    if serializer.is_valid():
        compra = serializer.save()
        print(f'\n✅ COMPRA CRIADA COM SUCESSO!')
        print(f'ID: {compra.id}')
        print(f'Forma de pagamento: {compra.forma_pagamento}')
        print(f'Número de parcelas: {compra.numero_parcelas}')
        print(f'Valor total: R$ {compra.valor_total}')
        print(f'Valor líquido: R$ {compra.valor_liquido}')
        
        # Verificar parcelas criadas
        parcelas = ParcelaCompra.objects.filter(compra=compra).order_by('numero_parcela')
        print(f'\n=== PARCELAS CRIADAS: {parcelas.count()} ===')
        for parcela in parcelas:
            print(f'  Parcela {parcela.numero_parcela}: R$ {parcela.valor_parcela} - Vencimento: {parcela.data_vencimento} - Status: {parcela.status}')
        
        # Verificar itens da compra
        itens = compra.itens.all()
        print(f'\n=== ITENS DA COMPRA: {itens.count()} ===')
        for item in itens:
            print(f'  Material: {item.material.nome} - Qtd: {item.quantidade} - Valor Unit: R$ {item.valor_unitario} - Total: R$ {item.valor_total}')
        
        return True
    else:
        print('\n❌ ERRO NA VALIDAÇÃO:')
        print(serializer.errors)
        return False

if __name__ == '__main__':
    success = test_pagamento_parcelado()
    if success:
        print('\n🎉 TESTE CONCLUÍDO COM SUCESSO!')
    else:
        print('\n💥 TESTE FALHOU!')
        sys.exit(1)