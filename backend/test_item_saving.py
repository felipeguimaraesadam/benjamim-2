#!/usr/bin/env python
import os
import sys
import django
from datetime import date
from decimal import Decimal

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from core.models import Compra, ItemCompra, Material, Obra, Usuario
from core.serializers import CompraSerializer
from django.test import RequestFactory

def test_item_saving():
    print("=== TESTE DE SALVAMENTO DE ITENS ===")
    
    # Criar dados de teste
    try:
        obra = Obra.objects.first()
        if not obra:
            print("Erro: Nenhuma obra encontrada")
            return
            
        material = Material.objects.first()
        if not material:
            print("Erro: Nenhum material encontrado")
            return
            
        print(f"Obra: {obra.nome_obra}")
        print(f"Material: {material.nome}")
        
        # Dados da compra com itens
        compra_data = {
            'obra': obra.id,
            'fornecedor': 'Fornecedor Teste',
            'data_compra': date(2024, 1, 15),
            'nota_fiscal': 'NF-12345',
            'valor_total_bruto': Decimal('1000.00'),
            'desconto': Decimal('0.00'),
            'valor_total_liquido': Decimal('1000.00'),
            'forma_pagamento': 'AVISTA',
            'numero_parcelas': 1,
            'tipo': 'COMPRA',
            'itens': [
                {
                    'material': material.id,
                    'quantidade': Decimal('10.00'),
                    'valor_unitario': Decimal('100.00'),
                    'valor_total_item': Decimal('1000.00')
                }
            ]
        }
        
        print("\n=== TESTE 1: CRIAÇÃO DIRETA NO MODELO ===")
        
        # Teste 1: Criar compra diretamente
        compra_direta = Compra.objects.create(
            obra=obra,
            fornecedor='Fornecedor Direto',
            data_compra=date(2024, 1, 15),
            nota_fiscal='NF-DIRETO',
            valor_total_bruto=Decimal('500.00'),
            forma_pagamento='AVISTA',
            numero_parcelas=1,
            tipo='COMPRA'
        )
        
        # Criar item diretamente
        item_direto = ItemCompra.objects.create(
            compra=compra_direta,
            material=material,
            quantidade=Decimal('5.00'),
            valor_unitario=Decimal('100.00'),
            valor_total_item=Decimal('500.00')
        )
        
        print(f"Compra criada diretamente: ID {compra_direta.id}")
        print(f"Item criado diretamente: ID {item_direto.id}")
        
        # Verificar se o item foi salvo
        itens_salvos = ItemCompra.objects.filter(compra=compra_direta)
        print(f"Itens encontrados para compra direta: {itens_salvos.count()}")
        for item in itens_salvos:
            print(f"  - Material: {item.material.nome}, Qtd: {item.quantidade}, Valor: {item.valor_total_item}")
        
        print("\n=== TESTE 2: CRIAÇÃO VIA SERIALIZER ===")
        
        # Criar um request mock
        factory = RequestFactory()
        request = factory.post('/api/compras/', compra_data)
        request.data = compra_data  # Adicionar o atributo data
        
        # Criar um usuário mock
        user = Usuario.objects.first()
        if not user:
            user = Usuario.objects.create_user('testuser', 'test@test.com', 'testpass')
        request.user = user
        
        # Usar o serializer
        serializer = CompraSerializer(data=compra_data, context={'request': request})
        
        if serializer.is_valid():
            print("Dados válidos no serializer")
            compra_serializer = serializer.save()
            print(f"Compra criada via serializer: ID {compra_serializer.id}")
            
            # Verificar se os itens foram salvos
            itens_salvos = ItemCompra.objects.filter(compra=compra_serializer)
            print(f"Itens encontrados para compra via serializer: {itens_salvos.count()}")
            for item in itens_salvos:
                print(f"  - Material: {item.material.nome}, Qtd: {item.quantidade}, Valor: {item.valor_total_item}")
                
            # Verificar o valor total recalculado
            compra_serializer.refresh_from_db()
            print(f"Valor total bruto recalculado: {compra_serializer.valor_total_bruto}")
            
        else:
            print("Erros no serializer:")
            for field, errors in serializer.errors.items():
                print(f"  {field}: {errors}")
        
        print("\n=== TESTE 3: PAGAMENTO PARCELADO ===")
        
        compra_parcelado_data = {
            'obra': obra.id,
            'fornecedor': 'Fornecedor Parcelado',
            'data_compra': date(2024, 1, 15),
            'nota_fiscal': 'NF-PARCELADO',
            'valor_total_bruto': Decimal('2000.00'),
            'desconto': Decimal('0.00'),
            'valor_total_liquido': Decimal('2000.00'),
            'forma_pagamento': 'PARCELADO',
            'numero_parcelas': 3,
            'valor_entrada': Decimal('500.00'),
            'tipo': 'COMPRA',
            'itens': [
                {
                    'material': material.id,
                    'quantidade': Decimal('20.00'),
                    'valor_unitario': Decimal('100.00'),
                    'valor_total_item': Decimal('2000.00')
                }
            ]
        }
        
        serializer_parcelado = CompraSerializer(data=compra_parcelado_data, context={'request': request})
        
        if serializer_parcelado.is_valid():
            print("Dados válidos para pagamento parcelado")
            compra_parcelado = serializer_parcelado.save()
            print(f"Compra parcelada criada: ID {compra_parcelado.id}")
            
            # Verificar itens
            itens_parcelado = ItemCompra.objects.filter(compra=compra_parcelado)
            print(f"Itens para compra parcelada: {itens_parcelado.count()}")
            for item in itens_parcelado:
                print(f"  - Material: {item.material.nome}, Qtd: {item.quantidade}, Valor: {item.valor_total_item}")
            
            # Verificar parcelas
            parcelas = compra_parcelado.parcelas.all()
            print(f"Parcelas criadas: {parcelas.count()}")
            for i, parcela in enumerate(parcelas, 1):
                print(f"  Parcela {i}: Valor {parcela.valor_parcela}, Vencimento {parcela.data_vencimento}")
                
        else:
            print("Erros no serializer parcelado:")
            for field, errors in serializer_parcelado.errors.items():
                print(f"  {field}: {errors}")
        
        print("\n=== RESUMO FINAL ===")
        total_compras = Compra.objects.count()
        total_itens = ItemCompra.objects.count()
        print(f"Total de compras no banco: {total_compras}")
        print(f"Total de itens no banco: {total_itens}")
        
    except Exception as e:
        print(f"Erro durante o teste: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_item_saving()