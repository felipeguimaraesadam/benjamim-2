#!/usr/bin/env python
import os
import django
from datetime import date

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from core.serializers import CompraSerializer
from core.models import Compra, ParcelaCompra

def test_installment_creation():
    print("=== TESTE DE CRIAÇÃO DE PARCELAS ===")
    
    # Dados de teste corrigidos
    test_data = {
        'obra': 8,  # ID válido da primeira obra
        'data_compra': date.today(),
        'valor_total_bruto': 1000.00,
        'observacoes': 'Teste pagamento parcelado',
        'pagamento_parcelado': {
            'tipo': 'PARCELADO',
            'parcelas': [
                {'valor': 333.33, 'data_vencimento': '2024-02-01'},
                {'valor': 333.33, 'data_vencimento': '2024-03-01'},
                {'valor': 333.34, 'data_vencimento': '2024-04-01'}
            ]
        },
        'itens': [
            {
                'material': 2,  # ID válido do primeiro material
                'quantidade': 10,
                'valor_unitario': 100.00
            }
        ]
    }
    
    print(f"Dados enviados: {test_data}")
    print("\n--- Validando ---")
    
    # Criar um mock request para o contexto
    class MockRequest:
        def __init__(self):
            self.data = {}

    mock_request = MockRequest()
    
    # Criar serializer com contexto mock
    serializer = CompraSerializer(data=test_data, context={'request': mock_request})
    
    print(f"\n--- Debug do Serializer ---")
    print(f"Initial data: {serializer.initial_data}")
    print(f"Pagamento parcelado nos dados iniciais: {serializer.initial_data.get('pagamento_parcelado')}")
    
    if serializer.is_valid():
        print("✓ Dados válidos! Criando compra...")
        try:
            compra = serializer.save()
            print(f"✓ Compra criada com ID: {compra.id}")
            print(f"✓ Forma de pagamento: {compra.forma_pagamento}")
            print(f"✓ Número de parcelas: {compra.numero_parcelas}")
            
            # Verificar se as parcelas foram criadas
            parcelas = compra.parcelas.all()
            print(f"✓ Parcelas criadas: {parcelas.count()}")
            for parcela in parcelas:
                print(f"  - Parcela {parcela.numero_parcela}: R$ {parcela.valor_parcela} - Vencimento: {parcela.data_vencimento}")
                
        except Exception as e:
            print(f"✗ Erro ao criar compra: {e}")
    else:
        print(f"✗ Dados inválidos: {serializer.errors}")
        
        # Analisar erros específicos
        for field, errors in serializer.errors.items():
            print(f"  Campo '{field}': {errors}")

if __name__ == '__main__':
    test_installment_creation()