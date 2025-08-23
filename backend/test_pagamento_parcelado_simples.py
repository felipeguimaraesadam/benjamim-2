#!/usr/bin/env python
import os
import sys
import django
from decimal import Decimal
from datetime import date

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
django.setup()

from core.models import Obra, Material, Usuario, Compra, ItemCompra, ParcelaCompra
from core.serializers import CompraSerializer
from unittest.mock import Mock

print("=== TESTE DE PAGAMENTO PARCELADO SIMPLES ===")

# Limpar dados de teste anteriores
Compra.objects.filter(fornecedor__icontains='Teste Simples').delete()
Obra.objects.filter(nome_obra__icontains='Teste Simples').delete()
Material.objects.filter(nome__icontains='Teste Simples').delete()

# Criar obra de teste
obra = Obra.objects.create(
    nome_obra='Obra Teste Simples',
    endereco_completo='Rua Teste, 123',
    orcamento_previsto=50000.00
)
print(f'Obra criada: {obra.id} - {obra.nome_obra}')

# Criar material de teste
material = Material.objects.create(
    nome='Material Teste Simples',
    unidade_medida='un'
)
print(f'Material criado: {material.id} - {material.nome}')

# Criar usuário de teste se não existir
usuario, created = Usuario.objects.get_or_create(
    login='teste_simples',
    defaults={
        'nome_completo': 'Usuário Teste Simples',
        'password': 'senha123'
    }
)
print(f'Usuário: {usuario.login} (criado: {created})')

# Dados da compra parcelada - VALORES CORRETOS
compra_data = {
    'tipo': 'COMPRA',
    'obra': obra.id,
    'data_compra': date.today().isoformat(),
    'fornecedor': 'Fornecedor Teste Simples',
    'forma_pagamento': 'PARCELADO',  # IMPORTANTE: PARCELADO
    'numero_parcelas': 3,  # 3 parcelas
    'valor_entrada': 500.00,  # Entrada de R$ 500
    'desconto': 0.00,
    'itens': [{
        'material': material.id,
        'quantidade': 10,
        'valor_unitario': 200.00  # 10 x R$ 200 = R$ 2000 total
    }]
}

print('\nDados da compra:')
for key, value in compra_data.items():
    print(f'  {key}: {value}')

# Criar mock do request
mock_request = Mock()
mock_request.user = usuario
context = {'request': mock_request}

# Criar compra usando serializer
serializer = CompraSerializer(data=compra_data, context=context)
if serializer.is_valid():
    compra = serializer.save()
    print(f'\n✅ Compra criada com sucesso!')
    print(f'ID: {compra.id}')
    print(f'Forma de pagamento: {compra.forma_pagamento}')
    print(f'Número de parcelas: {compra.numero_parcelas}')
    print(f'Valor total bruto: R$ {compra.valor_total_bruto}')
    print(f'Valor total líquido: R$ {compra.valor_total_liquido}')
    print(f'Valor entrada: R$ {compra.valor_entrada}')
    
    # Verificar itens criados
    itens = ItemCompra.objects.filter(compra=compra)
    print(f'\nItens criados: {itens.count()}')
    for item in itens:
        print(f'  {item.quantidade}x {item.material.nome} - R$ {item.valor_unitario} cada = R$ {item.valor_total_item}')
    
    # Verificar parcelas criadas
    parcelas = ParcelaCompra.objects.filter(compra=compra)
    print(f'\nParcelas criadas: {parcelas.count()}')
    for parcela in parcelas:
        print(f'  Parcela {parcela.numero_parcela}: R$ {parcela.valor_parcela} - Vencimento: {parcela.data_vencimento} - Status: {parcela.status}')
    
    # Calcular valores para verificação
    valor_a_parcelar = compra.valor_total_liquido - compra.valor_entrada
    print(f'\nVerificação dos cálculos:')
    print(f'  Valor total líquido: R$ {compra.valor_total_liquido}')
    print(f'  Valor entrada: R$ {compra.valor_entrada}')
    print(f'  Valor a parcelar: R$ {valor_a_parcelar}')
    print(f'  Valor por parcela: R$ {valor_a_parcelar / compra.numero_parcelas}')
    
else:
    print('\n❌ Erro na validação:')
    for field, errors in serializer.errors.items():
        print(f'  {field}: {errors}')

print('\n=== FIM DO TESTE ===')