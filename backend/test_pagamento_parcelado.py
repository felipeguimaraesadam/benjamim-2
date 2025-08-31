#!/usr/bin/env python
import os
import sys
import django

# Configurar o Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from core.models import Compra, Obra, Fornecedor, Material, ItemCompra
from core.serializers import CompraSerializer
from decimal import Decimal
from datetime import date

def test_pagamento_parcelado():
    print("=== Teste de Pagamento Parcelado ===")
    
    # Buscar dados existentes
    try:
        obra = Obra.objects.first()
        fornecedor = Fornecedor.objects.first()
        material = Material.objects.first()
        
        if not obra or not fornecedor or not material:
            print("Erro: Dados básicos não encontrados (obra, fornecedor, material)")
            return
            
        print(f"Obra: {obra.nome}")
        print(f"Fornecedor: {fornecedor.nome}")
        print(f"Material: {material.nome}")
        
        # Dados de teste para pagamento parcelado
        data = {
            'obra': obra.id,
            'fornecedor': fornecedor.id,
            'data_compra': date.today(),
            'nota_fiscal': 'NF-TEST-001',
            'valor_total_bruto': Decimal('100.00'),
            'desconto': Decimal('0.00'),
            'observacoes': 'Teste de pagamento parcelado',
            'tipo': 'COMPRA',
            'pagamento_parcelado': {
                'tipo': 'PARCELADO',
                'parcelas': [
                    {'valor': 50.00, 'data_vencimento': '2024-02-01'},
                    {'valor': 50.00, 'data_vencimento': '2024-03-01'}
                ]
            },
            'itens': [
                {
                    'material': material.id,
                    'quantidade': Decimal('1.00'),
                    'valor_unitario': Decimal('100.00'),
                    'unidade': 'UN'
                }
            ]
        }
        
        print("\n=== Dados de entrada ===")
        print(f"pagamento_parcelado: {data['pagamento_parcelado']}")
        
        # Criar compra usando o serializer
        serializer = CompraSerializer(data=data)
        if serializer.is_valid():
            compra = serializer.save()
            print(f"\n=== Compra criada com sucesso ===")
            print(f"ID: {compra.id}")
            print(f"Forma de pagamento: {compra.forma_pagamento}")
            print(f"Número de parcelas: {compra.numero_parcelas}")
            print(f"Valor entrada: {compra.valor_entrada}")
            
            # Verificar parcelas criadas
            parcelas = compra.parcelas.all()
            print(f"\n=== Parcelas criadas ({parcelas.count()}) ===")
            for i, parcela in enumerate(parcelas, 1):
                print(f"Parcela {i}: R$ {parcela.valor_parcela} - Vencimento: {parcela.data_vencimento} - Status: {parcela.status}")
                
            # Testar representação do serializer
            print("\n=== Representação do serializer ===")
            representation = CompraSerializer(compra).data
            print(f"pagamento_parcelado na resposta: {representation.get('pagamento_parcelado')}")
            
            return compra
        else:
            print(f"\n=== Erro na validação ===")
            print(f"Erros: {serializer.errors}")
            return None
            
    except Exception as e:
        print(f"Erro durante o teste: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == '__main__':
    test_pagamento_parcelado()