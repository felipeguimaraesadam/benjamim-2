#!/usr/bin/env python
import os
import sys
import django
from decimal import Decimal

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from core.models import Obra, Material, Compra, ItemCompra, Usuario, Funcionario
from core.serializers import CompraSerializer

def test_materiais_obra():
    print("=== TESTE DE MATERIAIS POR OBRA ===")
    
    # Listar todas as obras
    print("\n1. OBRAS DISPONÍVEIS:")
    obras = Obra.objects.all()
    for obra in obras:
        print(f"   ID: {obra.id} - Nome: {obra.nome_obra}")
    
    # Listar todas as compras e suas obras
    print("\n2. COMPRAS POR OBRA:")
    compras = Compra.objects.all().select_related('obra')
    for compra in compras:
        obra_nome = compra.obra.nome_obra if compra.obra else "SEM OBRA"
        print(f"   Compra ID: {compra.id} - Obra ID: {compra.obra_id} - Obra: {obra_nome}")
        
        # Listar itens da compra
        itens = compra.itens.all()
        for item in itens:
            print(f"     -> Material: {item.material.nome} - Qtd: {item.quantidade}")
    
    # Testar serializer para uma obra específica
    print("\n3. TESTE DO SERIALIZER PARA OBRA ID=2:")
    compras_obra_2 = Compra.objects.filter(obra_id=2)
    print(f"   Encontradas {compras_obra_2.count()} compras para obra ID=2")
    
    for compra in compras_obra_2:
        serializer = CompraSerializer(compra)
        data = serializer.data
        print(f"   Compra {compra.id}:")
        print(f"     - Obra: {data.get('obra_details', {}).get('nome_obra', 'N/A')}")
        print(f"     - Fornecedor: {data.get('fornecedor', 'N/A')}")
        print(f"     - Itens: {len(data.get('itens', []))}")
        
        for item in data.get('itens', []):
            print(f"       * {item.get('material_nome', 'N/A')} - Qtd: {item.get('quantidade', 'N/A')}")
    
    # Criar uma compra de teste para obra ID=1 se não existir
    print("\n4. CRIANDO COMPRA DE TESTE PARA OBRA ID=1:")
    try:
        obra_1 = Obra.objects.get(id=1)
        print(f"   Obra encontrada: {obra_1.nome_obra}")
    except Obra.DoesNotExist:
        print("   Obra ID=1 não existe. Criando...")
        funcionario = Funcionario.objects.first()
        if not funcionario:
            print("   Criando funcionário de teste...")
            funcionario = Funcionario.objects.create(
                nome="Funcionário Teste",
                cargo="Gerente",
                salario=Decimal('5000.00')
            )
        obra_1 = Obra.objects.create(
            nome_obra="Obra Teste ID=1",
            endereco_completo="Endereço Teste",
            orcamento_previsto=Decimal('10000.00'),
            responsavel=funcionario
        )
        print(f"   Obra criada: {obra_1.nome_obra}")
    
    # Verificar se existe material
    material = Material.objects.first()
    if not material:
        print("   Criando material de teste...")
        material = Material.objects.create(
            nome="Material Teste",
            unidade_medida="UN",
            categoria_uso_padrao="Geral"
        )
    
    # Criar compra de teste
    compras_existentes = Compra.objects.filter(obra_id=1).count()
    print(f"   Compras existentes para obra ID=1: {compras_existentes}")
    
    if compras_existentes == 0:
        print("   Criando compra de teste...")
        compra_teste = Compra.objects.create(
            obra=obra_1,
            fornecedor="Fornecedor Teste",
            data_compra="2025-01-30",
            valor_total_bruto=Decimal('500.00'),
            tipo="COMPRA"
        )
        
        # Criar item da compra
        ItemCompra.objects.create(
            compra=compra_teste,
            material=material,
            quantidade=Decimal('10.00'),
            valor_unitario=Decimal('50.00'),
            valor_total_item=Decimal('500.00'),
            categoria_uso="Geral"
        )
        
        print(f"   Compra criada com ID: {compra_teste.id}")
    
    # Verificar novamente as compras para obra ID=1
    print("\n5. VERIFICAÇÃO FINAL - COMPRAS PARA OBRA ID=1:")
    compras_obra_1 = Compra.objects.filter(obra_id=1)
    print(f"   Total de compras: {compras_obra_1.count()}")
    
    for compra in compras_obra_1:
        serializer = CompraSerializer(compra)
        data = serializer.data
        print(f"   Compra {compra.id}:")
        print(f"     - Obra: {data.get('obra_details', {}).get('nome_obra', 'N/A')}")
        print(f"     - Fornecedor: {data.get('fornecedor', 'N/A')}")
        print(f"     - Itens: {len(data.get('itens', []))}")
        
        for item in data.get('itens', []):
            print(f"       * {item.get('material_nome', 'N/A')} - Qtd: {item.get('quantidade', 'N/A')}")

if __name__ == '__main__':
    test_materiais_obra()