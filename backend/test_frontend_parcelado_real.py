import os
import sys
import django
from decimal import Decimal
from datetime import datetime, date

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import Obra, Material, Compra, ItemCompra, ParcelaCompra
from core.serializers import CompraSerializer
from django.test import RequestFactory
from django.contrib.auth.models import AnonymousUser
import json

def test_frontend_parcelado_real():
    print("=== TESTE FRONTEND PAGAMENTO PARCELADO REAL ===")
    
    # Limpar dados anteriores
    ParcelaCompra.objects.all().delete()
    ItemCompra.objects.all().delete()
    Compra.objects.all().delete()
    
    # Criar obra
    obra, created = Obra.objects.get_or_create(
        nome="Obra Teste Parcelado",
        defaults={
            'endereco_completo': 'Rua Teste, 123',
            'status': 'ATIVO'
        }
    )
    print(f"Obra: {obra.nome} (ID: {obra.id})")
    
    # Criar material
    material, created = Material.objects.get_or_create(
        nome="Cimento Portland",
        defaults={
            'unidade_medida': 'SC',
            'categoria_uso_padrao': 'ESTRUTURA'
        }
    )
    print(f"Material: {material.nome} (ID: {material.id})")
    
    # Simular dados do frontend com pagamento parcelado
    frontend_data = {
        'tipo': 'COMPRA',
        'obra': obra.id,
        'data_compra': '2024-01-15',
        'data_pagamento': None,  # Nao deve ter data de pagamento para parcelado
        'fornecedor': 'Fornecedor Parcelado LTDA',
        'nota_fiscal': 'NF-PARCELADO-001',
        'desconto': 50.00,
        'observacoes': 'Compra com pagamento parcelado - teste frontend',
        'itens': [
            {
                'material': material.id,
                'quantidade': 10.0,
                'valor_unitario': 25.50,
                'categoria_uso': 'ESTRUTURA'
            },
            {
                'material': material.id,
                'quantidade': 5.0,
                'valor_unitario': 30.00,
                'categoria_uso': 'ACABAMENTO'
            }
        ],
        'pagamento_parcelado': json.dumps({
            'tipo': 'PARCELADO',
            'parcelas': [
                {
                    'numero': 1,
                    'valor': 133.33,
                    'dataVencimento': '2024-02-15'
                },
                {
                    'numero': 2,
                    'valor': 133.33,
                    'dataVencimento': '2024-03-15'
                },
                {
                    'numero': 3,
                    'valor': 133.34,
                    'dataVencimento': '2024-04-15'
                }
            ]
        }),
        'anexos': []
    }
    
    print("\n=== DADOS ENVIADOS PELO FRONTEND ===")
    print(f"Tipo: {frontend_data['tipo']}")
    print(f"Obra ID: {frontend_data['obra']}")
    print(f"Data da compra: {frontend_data['data_compra']}")
    print(f"Fornecedor: {frontend_data['fornecedor']}")
    print(f"Nota fiscal: {frontend_data['nota_fiscal']}")
    print(f"Desconto: R$ {frontend_data['desconto']}")
    print(f"Itens: {len(frontend_data['itens'])} itens")
    for i, item in enumerate(frontend_data['itens'], 1):
        print(f"  Item {i}: {item['quantidade']}x {material.nome} @ R$ {item['valor_unitario']} = R$ {item['quantidade'] * item['valor_unitario']}")
    
    pagamento_data = json.loads(frontend_data['pagamento_parcelado'])
    print(f"\nPagamento: {pagamento_data['tipo']}")
    if pagamento_data['tipo'] == 'PARCELADO':
        print(f"Parcelas: {len(pagamento_data['parcelas'])}")
        for parcela in pagamento_data['parcelas']:
            print(f"  Parcela {parcela['numero']}: R$ {parcela['valor']} - Vencimento: {parcela['dataVencimento']}")
    
    # Simular requisicao do frontend
    factory = RequestFactory()
    request = factory.post('/api/compras/', data=frontend_data, content_type='application/json')
    request.user = AnonymousUser()
    
    # Usar o serializer como o frontend faria
    serializer = CompraSerializer(data=frontend_data, context={'request': request})
    
    if serializer.is_valid():
        print("\n=== SERIALIZER VALIDO - CRIANDO COMPRA ===")
        compra = serializer.save()
        
        print(f"\n=== COMPRA CRIADA COM SUCESSO ===")
        print(f"ID: {compra.id}")
        print(f"Tipo: {compra.tipo}")
        print(f"Obra: {compra.obra.nome}")
        print(f"Fornecedor: {compra.fornecedor}")
        print(f"Nota fiscal: {compra.nota_fiscal}")
        print(f"Data da compra: {compra.data_compra}")
        print(f"Valor total bruto: R$ {compra.valor_total_bruto}")
        print(f"Desconto: R$ {compra.desconto}")
        print(f"Valor total liquido: R$ {compra.valor_total_liquido}")
        print(f"Forma de pagamento: {compra.forma_pagamento}")
        print(f"Numero de parcelas: {compra.numero_parcelas}")
        print(f"Valor de entrada: R$ {compra.valor_entrada}")
        
        # Verificar itens
        itens = ItemCompra.objects.filter(compra=compra)
        print(f"\n=== ITENS DA COMPRA ({itens.count()}) ===")
        for item in itens:
            print(f"- {item.material.nome}: {item.quantidade} {item.material.unidade_medida} @ R$ {item.valor_unitario} = R$ {item.valor_total} (Uso: {item.categoria_uso})")
        
        # Verificar parcelas
        parcelas = ParcelaCompra.objects.filter(compra=compra).order_by('numero_parcela')
        print(f"\n=== PARCELAS DA COMPRA ({parcelas.count()}) ===")
        for parcela in parcelas:
            print(f"Parcela {parcela.numero_parcela}: R$ {parcela.valor_parcela} - Vencimento: {parcela.data_vencimento} - Status: {parcela.status}")
        
        # Verificar totais
        print(f"\n=== VERIFICACAO DE TOTAIS ===")
        total_itens = sum(item.valor_total for item in itens)
        total_parcelas = sum(parcela.valor_parcela for parcela in parcelas)
        print(f"Total dos itens: R$ {total_itens}")
        print(f"Desconto: R$ {compra.desconto}")
        print(f"Total liquido esperado: R$ {total_itens - compra.desconto}")
        print(f"Total liquido da compra: R$ {compra.valor_total_liquido}")
        print(f"Total das parcelas: R$ {total_parcelas}")
        print(f"Valor de entrada: R$ {compra.valor_entrada}")
        print(f"Total parcelas + entrada: R$ {total_parcelas + compra.valor_entrada}")
        
        # Verificar se os valores batem
        if abs(float(compra.valor_total_liquido) - (total_parcelas + float(compra.valor_entrada))) < 0.01:
            print("VALORES CONFEREM!")
        else:
            print("VALORES NAO CONFEREM!")
            
        return True
        
    else:
        print("\n=== ERRO NO SERIALIZER ===")
        print(f"Erros: {serializer.errors}")
        return False

if __name__ == '__main__':
    success = test_frontend_parcelado_real()
    if success:
        print("\nTESTE CONCLUIDO COM SUCESSO!")
    else:
        print("\nTESTE FALHOU!")