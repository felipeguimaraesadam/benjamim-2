#!/usr/bin/env python
import os
import sys
import django
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from core.models import Compra, ItemCompra, ParcelaCompra, Obra, Material, Usuario
from datetime import date

def test_parcelas_creation():
    print("=== TESTE DE CRIAÇÃO DE PARCELAS ===")
    
    # Buscar dados existentes
    try:
        obra = Obra.objects.first()
        material = Material.objects.first()
        user = Usuario.objects.first()
        
        if not obra or not material or not user:
            print("ERRO: Dados necessários não encontrados")
            return
            
        print(f"Obra: {obra.id} - {obra.nome_obra}")
        print(f"Material: {material.id} - {material.nome}")
        print(f"Usuário: {user.login}")
        
        # Criar compra parcelada
        compra_data = {
            'obra': obra,
            'fornecedor': 'Fornecedor Teste',
            'data_compra': date.today(),
            'nota_fiscal': 'NF-TEST-001',
            'valor_total_bruto': Decimal('1000.00'),
            'desconto': Decimal('0.00'),
            'valor_total_liquido': Decimal('1000.00'),
            'forma_pagamento': 'PARCELADO',
            'numero_parcelas': 3,
            'valor_entrada': Decimal('200.00')
        }
        
        print("\n=== CRIANDO COMPRA ===")
        compra = Compra.objects.create(**compra_data)
        print(f"Compra criada: ID {compra.id}")
        print(f"Forma pagamento: {compra.forma_pagamento}")
        print(f"Número de parcelas: {compra.numero_parcelas}")
        print(f"Valor entrada: {compra.valor_entrada}")
        print(f"Valor total líquido: {compra.valor_total_liquido}")
        
        # Criar item da compra
        item_data = {
            'compra': compra,
            'material': material,
            'quantidade': Decimal('10.00'),
            'valor_unitario': Decimal('100.00'),
            'categoria_uso': 'Geral'
        }
        
        print("\n=== CRIANDO ITEM ===")
        item = ItemCompra.objects.create(**item_data)
        print(f"Item criado: {item.quantidade}x {item.material.nome}")
        print(f"Valor total do item: {item.valor_total_item}")
        
        # Recalcular valor total da compra
        compra.valor_total_bruto = sum(item.valor_total_item for item in compra.itens.all())
        compra.save()
        print(f"Valor total bruto recalculado: {compra.valor_total_bruto}")
        print(f"Valor total líquido final: {compra.valor_total_liquido}")
        
        # Verificar parcelas antes da criação
        parcelas_antes = ParcelaCompra.objects.filter(compra=compra).count()
        print(f"\n=== PARCELAS ANTES DA CRIAÇÃO: {parcelas_antes} ===")
        
        # Chamar create_installments
        print("\n=== CHAMANDO create_installments() ===")
        try:
            compra.create_installments()
            print("create_installments() executado com sucesso")
        except Exception as e:
            print(f"ERRO ao executar create_installments(): {e}")
            import traceback
            traceback.print_exc()
            return
        
        # Verificar parcelas após a criação
        parcelas_depois = ParcelaCompra.objects.filter(compra=compra)
        print(f"\n=== PARCELAS APÓS CRIAÇÃO: {parcelas_depois.count()} ===")
        
        for parcela in parcelas_depois:
            print(f"Parcela {parcela.numero_parcela}: R$ {parcela.valor_parcela} - Vencimento: {parcela.data_vencimento} - Status: {parcela.status}")
        
        # Verificar cálculos
        valor_a_parcelar = compra.valor_total_liquido - compra.valor_entrada
        valor_parcela_esperado = valor_a_parcelar / compra.numero_parcelas
        print(f"\n=== VERIFICAÇÃO DE CÁLCULOS ===")
        print(f"Valor a parcelar: {valor_a_parcelar}")
        print(f"Valor por parcela esperado: {valor_parcela_esperado}")
        
        # Limpar dados de teste
        print("\n=== LIMPANDO DADOS DE TESTE ===")
        compra.delete()
        print("Compra de teste removida")
        
    except Exception as e:
        print(f"ERRO GERAL: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_parcelas_creation()