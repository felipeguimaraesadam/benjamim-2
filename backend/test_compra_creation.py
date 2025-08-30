import os
import sys
import django
from datetime import date, timedelta
from decimal import Decimal

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from core.models import Obra, Material, Compra, ItemCompra, ParcelaCompra
from django.test import Client
from django.urls import reverse
import json

def test_compra_creation():
    print("=== TESTE DE CRIACAO DE COMPRA ===")
    
    # 1. Verificar/Criar dados de teste
    print("\n1. Preparando dados de teste...")
    
    # Criar obra se nao existir
    obra, created = Obra.objects.get_or_create(
        nome_obra="Obra Teste",
        defaults={
            'endereco_completo': 'Rua Teste, 123',
            'cidade': 'Teste',
            'status': 'Em Andamento',
            'data_inicio': date.today(),
            'orcamento_previsto': Decimal('50000.00')
        }
    )
    print(f"Obra: {obra.nome_obra} ({'criada' if created else 'existente'})")
    
    # Criar material se nao existir
    material, created = Material.objects.get_or_create(
        nome="Cimento Portland",
        defaults={
            'unidade_medida': 'kg'
        }
    )
    print(f"Material: {material.nome} ({'criado' if created else 'existente'})")
    
    # 2. Criar compra simples
    print("\n2. Criando compra simples...")
    
    compra_data = {
        'obra': obra.id,
        'fornecedor': 'Fornecedor Teste LTDA',
        'data_compra': date.today().isoformat(),
        'nota_fiscal': 'NF-12345',
        'valor_total_bruto': '1000.00',
        'desconto': '50.00',
        'observacoes': 'Compra de teste',
        'forma_pagamento': 'AVISTA',
        'tipo': 'COMPRA'
    }
    
    # Criar compra diretamente no modelo
    compra = Compra.objects.create(
        obra=obra,
        fornecedor=compra_data['fornecedor'],
        data_compra=date.today(),
        nota_fiscal=compra_data['nota_fiscal'],
        valor_total_bruto=Decimal(compra_data['valor_total_bruto']),
        desconto=Decimal(compra_data['desconto']),
        observacoes=compra_data['observacoes'],
        forma_pagamento=compra_data['forma_pagamento'],
        tipo=compra_data['tipo']
    )
    
    print(f"Compra criada: ID {compra.id}")
    print(f"Valor total bruto: R$ {compra.valor_total_bruto}")
    print(f"Desconto: R$ {compra.desconto}")
    print(f"Valor total liquido: R$ {compra.valor_total_liquido}")
    print(f"Fornecedor: {compra.fornecedor}")
    print(f"Nota fiscal: {compra.nota_fiscal}")
    print(f"Data de pagamento: {compra.data_pagamento}")
    
    # 3. Adicionar itens
    print("\n3. Adicionando itens a compra...")
    
    item = ItemCompra.objects.create(
        compra=compra,
        material=material,
        quantidade=Decimal('100.0'),
        valor_unitario=Decimal('9.50')
    )
    
    print(f"Item criado: {item.quantidade}x {item.material.nome}")
    print(f"Valor unitario: R$ {item.valor_unitario}")
    print(f"Valor total do item: R$ {item.valor_total_item}")
    
    # 4. Testar pagamento parcelado
    print("\n4. Testando pagamento parcelado...")
    
    compra_parcelada = Compra.objects.create(
        obra=obra,
        fornecedor='Fornecedor Parcelado LTDA',
        data_compra=date.today(),
        nota_fiscal='NF-67890',
        valor_total_bruto=Decimal('2000.00'),
        desconto=Decimal('0.00'),
        forma_pagamento='PARCELADO',
        numero_parcelas=3,
        valor_entrada=Decimal('500.00'),
        tipo='COMPRA'
    )
    
    print(f"Compra parcelada criada: ID {compra_parcelada.id}")
    print(f"Numero de parcelas: {compra_parcelada.numero_parcelas}")
    print(f"Valor de entrada: R$ {compra_parcelada.valor_entrada}")
    
    # Verificar parcelas criadas
    parcelas = ParcelaCompra.objects.filter(compra=compra_parcelada)
    print(f"Parcelas criadas: {parcelas.count()}")
    
    for parcela in parcelas:
        print(f"  Parcela {parcela.numero_parcela}: R$ {parcela.valor_parcela} - Vencimento: {parcela.data_vencimento} - Status: {parcela.status}")
    
    # 5. Verificar persistencia no banco
    print("\n5. Verificando persistencia no banco...")
    
    # Verificar compras
    total_compras = Compra.objects.count()
    print(f"Total de compras no banco: {total_compras}")
    
    # Verificar itens
    total_itens = ItemCompra.objects.count()
    print(f"Total de itens no banco: {total_itens}")
    
    # Verificar parcelas
    total_parcelas = ParcelaCompra.objects.count()
    print(f"Total de parcelas no banco: {total_parcelas}")
    
    # Verificar dados especificos
    compra_verificada = Compra.objects.get(id=compra.id)
    print(f"\nCompra {compra_verificada.id} verificada:")
    print(f"  Fornecedor: {compra_verificada.fornecedor}")
    print(f"  Nota fiscal: {compra_verificada.nota_fiscal}")
    print(f"  Valor total liquido: R$ {compra_verificada.valor_total_liquido}")
    print(f"  Forma de pagamento: {compra_verificada.forma_pagamento}")
    print(f"  Data de pagamento: {compra_verificada.data_pagamento}")
    
    # Verificar itens da compra
    itens_compra = ItemCompra.objects.filter(compra=compra_verificada)
    print(f"  Itens: {itens_compra.count()}")
    for item in itens_compra:
        print(f"    - {item.quantidade}x {item.material.nome} = R$ {item.valor_total_item}")
    
    print("\n=== TESTE CONCLUIDO COM SUCESSO ===")
    return True

if __name__ == '__main__':
    try:
        test_compra_creation()
    except Exception as e:
        print(f"ERRO NO TESTE: {e}")
        import traceback
        traceback.print_exc()