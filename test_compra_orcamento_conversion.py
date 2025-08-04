#!/usr/bin/env python
import os
import sys
import django
from datetime import date
from decimal import Decimal

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from core.models import Compra, Obra, Material, Usuario
from core.serializers import CompraSerializer
from rest_framework.test import APIClient

def test_compra_orcamento_conversion():
    print("=== Teste de Conversão Compra <-> Orçamento (Direto no Django) ===")
    
    # Create test data
    try:
        # Get or create test user
        user, created = Usuario.objects.get_or_create(
            login='testuser',
            defaults={
                'is_staff': True, 
                'is_superuser': True,
                'nivel_acesso': 'ADMIN',
                'nome_completo': 'Usuário Teste'
            }
        )
        if created:
            user.set_password('testpass')
            user.save()
            print("✓ Usuário de teste criado")
        
        # Get or create test obra
        obra, created = Obra.objects.get_or_create(
            nome_obra='Obra Teste',
            defaults={
                'endereco_completo': 'Rua Teste, 123',
                'data_inicio': date.today(),
                'orcamento_previsto': Decimal('100000.00')
            }
        )
        if created:
            print("✓ Obra de teste criada")
        
        # Get or create test material
        material, created = Material.objects.get_or_create(
            nome='Material Teste',
            defaults={
                'unidade_medida': 'UN',
                'quantidade_em_estoque': 100
            }
        )
        if created:
            print("✓ Material de teste criado")
        
        # Test 1: Create a COMPRA and verify it has APROVADO status
        print("\n--- Teste 1: Criar COMPRA usando Serializer ---")
        compra_data = {
            'obra': obra.id,
            'fornecedor': 'Fornecedor Teste',
            'data_compra': date.today(),
            'nota_fiscal': 'NF123456',
            'tipo': 'COMPRA',
            'itens': [{
                'material': material.id,
                'quantidade': 5,
                'valor_unitario': Decimal('10.00'),
                'categoria_uso': 'Geral'
            }]
        }
        
        serializer = CompraSerializer(data=compra_data)
        if serializer.is_valid():
            compra = serializer.save()
            print(f"✓ Compra criada - ID: {compra.id}, Tipo: {compra.tipo}, Status: {compra.status_orcamento}")
            
            if compra.tipo == 'COMPRA' and compra.status_orcamento == 'APROVADO':
                print("✓ Status correto para COMPRA (APROVADO)")
            else:
                print(f"✗ Status incorreto para COMPRA. Esperado: APROVADO, Atual: {compra.status_orcamento}")
        else:
            print(f"✗ Erro ao criar compra: {serializer.errors}")
            return
        
        # Test 2: Convert COMPRA to ORCAMENTO
        print("\n--- Teste 2: Converter COMPRA para ORCAMENTO ---")
        update_data = {
            'tipo': 'ORCAMENTO'
        }
        
        serializer = CompraSerializer(compra, data=update_data, partial=True)
        if serializer.is_valid():
            compra_updated = serializer.save()
            print(f"✓ Compra atualizada - ID: {compra_updated.id}, Tipo: {compra_updated.tipo}, Status: {compra_updated.status_orcamento}")
            
            if compra_updated.tipo == 'ORCAMENTO' and compra_updated.status_orcamento == 'PENDENTE':
                print("✓ Conversão para ORCAMENTO bem-sucedida (PENDENTE)")
            else:
                print(f"✗ Conversão falhou. Esperado: ORCAMENTO/PENDENTE, Atual: {compra_updated.tipo}/{compra_updated.status_orcamento}")
        else:
            print(f"✗ Erro ao converter para orçamento: {serializer.errors}")
        
        # Test 3: Convert ORCAMENTO back to COMPRA
        print("\n--- Teste 3: Converter ORCAMENTO para COMPRA ---")
        update_data = {
            'tipo': 'COMPRA'
        }
        
        serializer = CompraSerializer(compra_updated, data=update_data, partial=True)
        if serializer.is_valid():
            compra_final = serializer.save()
            print(f"✓ Orçamento atualizado - ID: {compra_final.id}, Tipo: {compra_final.tipo}, Status: {compra_final.status_orcamento}")
            
            if compra_final.tipo == 'COMPRA' and compra_final.status_orcamento == 'APROVADO':
                print("✓ Conversão para COMPRA bem-sucedida (APROVADO)")
            else:
                print(f"✗ Conversão falhou. Esperado: COMPRA/APROVADO, Atual: {compra_final.tipo}/{compra_final.status_orcamento}")
        else:
            print(f"✗ Erro ao converter para compra: {serializer.errors}")
        
        # Test 4: Test API endpoint
        print("\n--- Teste 4: Testar API REST ---")
        client = APIClient()
        client.force_authenticate(user=user)
        
        # Test PATCH request to convert to ORCAMENTO
        response = client.patch(f'/api/compras/{compra_final.id}/', {'tipo': 'ORCAMENTO'})
        if response.status_code == 200:
            data = response.json()
            print(f"✓ API PATCH bem-sucedida - Tipo: {data['tipo']}, Status: {data['status_orcamento']}")
            
            if data['tipo'] == 'ORCAMENTO' and data['status_orcamento'] == 'PENDENTE':
                print("✓ API converteu corretamente para ORCAMENTO")
            else:
                print(f"✗ API não converteu corretamente. Esperado: ORCAMENTO/PENDENTE, Atual: {data['tipo']}/{data['status_orcamento']}")
        else:
            print(f"✗ Erro na API: {response.status_code} - {response.content}")
        
        # Clean up
        compra_final.delete()
        print("\n✓ Dados de teste removidos")
        
    except Exception as e:
        print(f"✗ Erro durante o teste: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_compra_orcamento_conversion()