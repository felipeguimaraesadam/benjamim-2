#!/usr/bin/env python
import os
import sys
import django
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from core.models import Obra, Material, Compra, ItemCompra
from datetime import date

def test_compra_creation():
    print('=== TESTE DE CRIAÇÃO DE COMPRA ===')
    
    # Buscar dados existentes
    obra = Obra.objects.first()
    material = Material.objects.first()
    
    print(f'Obra encontrada: {obra}')
    print(f'Material encontrado: {material}')
    
    if not obra or not material:
        print('Não há obra ou material disponível para teste')
        return
    
    try:
        # Teste 1: Pagamento único
        print('\n--- TESTE 1: PAGAMENTO ÚNICO ---')
        compra1 = Compra.objects.create(
            obra=obra,
            fornecedor='Teste Fornecedor Único',
            data_compra=date(2024, 1, 15),
            valor_total_bruto=Decimal('1000.00'),
            forma_pagamento='AVISTA',
            numero_parcelas=1,
            valor_entrada=Decimal('0.00')
        )
        print(f'Compra única criada: ID {compra1.id}')
        
        # Criar item para compra única
        item1 = ItemCompra.objects.create(
            compra=compra1,
            material=material,
            quantidade=Decimal('10.0'),
            valor_unitario=Decimal('50.0')
        )
        print(f'Item criado para compra única: {item1}')
        print(f'Total de itens salvos (compra única): {compra1.itens.count()}')
        
        # Teste 2: Pagamento parcelado
        print('\n--- TESTE 2: PAGAMENTO PARCELADO ---')
        compra2 = Compra.objects.create(
            obra=obra,
            fornecedor='Teste Fornecedor Parcelado',
            data_compra=date(2024, 1, 15),
            valor_total_bruto=Decimal('1500.00'),
            forma_pagamento='PARCELADO',
            numero_parcelas=3,
            valor_entrada=Decimal('100.00')
        )
        print(f'Compra parcelada criada: ID {compra2.id}')
        
        # Criar item para compra parcelada
        item2 = ItemCompra.objects.create(
            compra=compra2,
            material=material,
            quantidade=Decimal('15.0'),
            valor_unitario=Decimal('60.0')
        )
        print(f'Item criado para compra parcelada: {item2}')
        print(f'Total de itens salvos (compra parcelada): {compra2.itens.count()}')
        
        # Criar parcelas
        print('\nCriando parcelas...')
        compra2.create_installments()
        
        print('Parcelas criadas:')
        for parcela in compra2.parcelas.all():
            print(f'  Parcela {parcela.numero_parcela}: R$ {parcela.valor_parcela} - Vencimento: {parcela.data_vencimento}')
            
            # Verificar se há números infinitos
            if str(parcela.valor_parcela) in ['inf', '-inf', 'nan']:
                print(f'  *** ERRO: Valor infinito detectado na parcela {parcela.numero_parcela}! ***')
        
        # Teste 3: Valores extremos que podem causar infinito
        print('\n--- TESTE 3: VALORES EXTREMOS ---')
        try:
            compra3 = Compra.objects.create(
                obra=obra,
                fornecedor='Teste Extremo',
                data_compra=date(2024, 1, 15),
                valor_total_bruto=Decimal('0.01'),
                forma_pagamento='PARCELADO',
                numero_parcelas=0,  # Isso deve causar erro
                valor_entrada=Decimal('0.00')
            )
            compra3.create_installments()
        except Exception as e:
            print(f'Erro esperado com parcelas = 0: {e}')
        
        try:
            compra4 = Compra.objects.create(
                obra=obra,
                fornecedor='Teste Extremo 2',
                data_compra=date(2024, 1, 15),
                valor_total_bruto=Decimal('999999999.99'),
                forma_pagamento='PARCELADO',
                numero_parcelas=999999,
                valor_entrada=Decimal('0.00')
            )
            compra4.create_installments()
            print('Parcelas com valores extremos:')
            for parcela in compra4.parcelas.all()[:3]:  # Mostrar apenas as 3 primeiras
                print(f'  Parcela {parcela.numero_parcela}: R$ {parcela.valor_parcela}')
        except Exception as e:
            print(f'Erro com valores extremos: {e}')
            
    except Exception as e:
        print(f'Erro durante o teste: {e}')
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_compra_creation()