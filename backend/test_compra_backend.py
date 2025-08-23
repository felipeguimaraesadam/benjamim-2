#!/usr/bin/env python
"""
Teste para reproduzir o problema dos "números infinitos" no backend.
Este script testa diretamente o serializer sem simular requisições HTTP.
"""

import os
import sys
import django
import json
from decimal import Decimal

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from core.models import Obra, Material, Compra, ItemCompra, Funcionario
from core.serializers import CompraSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

def test_compra_creation():
    print("=== TESTE DE CRIAÇÃO DE COMPRA ===")
    
    # Garantir que os dados de teste existam usando get_or_create
    try:
        responsavel_func, _ = Funcionario.objects.get_or_create(
            nome_completo='Funcionário Teste para Compra',
            defaults={'cargo': 'Tester', 'data_contratacao': '2023-01-01'}
        )

        obra, obra_created = Obra.objects.get_or_create(
            id=8,
            defaults={
                'nome_obra': 'Obra de Teste para Compra',
                'endereco_completo': 'Rua Teste, 123',
                'cidade': 'Cidade Teste',
                'status': 'Em Andamento',
                'responsavel': responsavel_func
            }
        )
        if obra_created:
            print("✅ Obra de teste criada (ID 8)")
        else:
            print("✅ Obra de teste encontrada (ID 8)")

        material, material_created = Material.objects.get_or_create(
            id=2,
            defaults={'nome': 'Material de Teste para Compra', 'unidade_medida': 'un'}
        )
        if material_created:
            print("✅ Material de teste criado (ID 2)")
        else:
            print("✅ Material de teste encontrado (ID 2)")

    except Exception as e:
        print(f"❌ Erro ao preparar dados de teste: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Simular dados que o frontend envia (incluindo possíveis "números infinitos")
    test_cases = [
        {
            "name": "Caso Normal",
            "data": {
                "obra": 8,
                "fornecedor": "Fornecedor Teste",
                "data_compra": "2024-01-15",
                "nota_fiscal": "NF-12345",
                "desconto": "0.00",
                "observacoes": "Teste normal",
                "tipo": "COMPRA",
                "itens": [
                    {
                        "material": 2,
                        "quantidade": "10.000",
                        "valor_unitario": "25.50",
                        "categoria_uso": "Geral"
                    }
                ]
            }
        },
        {
            "name": "Caso com Números Grandes",
            "data": {
                "obra": 8,
                "fornecedor": "Fornecedor Teste 2",
                "data_compra": "2024-01-15",
                "nota_fiscal": "NF-12346",
                "desconto": "0.00",
                "observacoes": "Teste com números grandes",
                "tipo": "COMPRA",
                "itens": [
                    {
                        "material": 2,
                        "quantidade": "999999999.999",
                        "valor_unitario": "999999999.99",
                        "categoria_uso": "Geral"
                    }
                ]
            }
        },
        {
            "name": "Caso com Strings Inválidas",
            "data": {
                "obra": 8,
                "fornecedor": "Fornecedor Teste 3",
                "data_compra": "2024-01-15",
                "nota_fiscal": "NF-12347",
                "desconto": "0.00",
                "observacoes": "Teste com strings inválidas",
                "tipo": "COMPRA",
                "itens": [
                    {
                        "material": 2,
                        "quantidade": "abc",
                        "valor_unitario": "xyz",
                        "categoria_uso": "Geral"
                    }
                ]
            }
        },
        {
            "name": "Caso com Valores Infinitos",
            "data": {
                "obra": 8,
                "fornecedor": "Fornecedor Teste 4",
                "data_compra": "2024-01-15",
                "nota_fiscal": "NF-12348",
                "desconto": "0.00",
                "observacoes": "Teste com valores infinitos",
                "tipo": "COMPRA",
                "itens": [
                    {
                        "material": 2,
                        "quantidade": "Infinity",
                        "valor_unitario": "Infinity",
                        "categoria_uso": "Geral"
                    }
                ]
            }
        },
        {
            "name": "Caso com Valor Unitário Zero",
            "data": {
                "obra": 8,
                "fornecedor": "Fornecedor Teste 5",
                "data_compra": "2024-01-16",
                "nota_fiscal": "NF-ZERO",
                "desconto": "0.00",
                "observacoes": "Teste com item de valor zero",
                "tipo": "COMPRA",
                "itens": [
                    {
                        "material": 2,
                        "quantidade": "5.000",
                        "valor_unitario": "0.00",
                        "categoria_uso": "Geral"
                    }
                ]
            }
        }
    ]
    
    for test_case in test_cases:
        print(f"\n--- {test_case['name']} ---")
        
        try:
            data = test_case['data'].copy()
            
            print(f"📊 Dados enviados para o serializer:")
            for key, value in data.items():
                if key == 'itens':
                    print(f"  {key}: {json.dumps(value, indent=4)}")
                else:
                    print(f"  {key}: {value}")
            
            # Criar serializer diretamente (sem request HTTP)
            serializer = CompraSerializer(data=data)
            
            # Validar dados
            if serializer.is_valid():
                print("✅ Dados válidos")
                
                # Tentar criar a compra
                try:
                    compra = serializer.save()
                    print(f"✅ Compra criada com sucesso: ID {compra.id}")
                    print(f"   Valor total bruto: {compra.valor_total_bruto}")
                    print(f"   Valor total líquido: {compra.valor_total_liquido}")
                    
                    # Verificar itens criados
                    for item in compra.itens.all():
                        print(f"   Item: {item.material.nome}")
                        print(f"     Quantidade: {item.quantidade} (tipo: {type(item.quantidade)})")
                        print(f"     Valor unitário: {item.valor_unitario} (tipo: {type(item.valor_unitario)})")
                        print(f"     Valor total: {item.valor_total_item}")
                        
                        # Verificar se há "números infinitos"
                        if str(item.quantidade) == 'inf' or str(item.valor_unitario) == 'inf':
                            print(f"🚨 PROBLEMA ENCONTRADO: Números infinitos detectados!")
                        elif item.quantidade > 999999 or item.valor_unitario > 999999:
                            print(f"⚠️  NÚMEROS MUITO GRANDES detectados!")
                    
                except Exception as e:
                    print(f"❌ Erro ao criar compra: {e}")
                    print(f"   Tipo do erro: {type(e)}")
                    import traceback
                    traceback.print_exc()
            else:
                print(f"❌ Dados inválidos: {serializer.errors}")
                
        except Exception as e:
            print(f"❌ Erro geral: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    test_compra_creation()