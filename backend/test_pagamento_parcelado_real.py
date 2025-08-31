# Teste de pagamento parcelado - para executar no shell do Django
from decimal import Decimal
from datetime import date, timedelta
import json
from core.models import Obra, Material, Compra, ItemCompra, ParcelaCompra
from core.serializers import CompraSerializer
from django.contrib.auth.models import User
from unittest.mock import Mock

print("=== TESTE DE PAGAMENTO PARCELADO ===")

# Limpar dados de teste anteriores
print("Limpando dados de teste anteriores...")
Compra.objects.filter(fornecedor__icontains='Teste Parcelado').delete()
Obra.objects.filter(nome_obra__icontains='Teste Parcelado').delete()
Material.objects.filter(nome__icontains='Teste Parcelado').delete()

# Criar obra de teste
obra = Obra.objects.create(
    nome_obra='Obra Teste Parcelado',
    endereco_completo='Rua Teste, 123',
    orcamento_previsto=Decimal('50000.00')
)
print(f"✅ Obra criada: {obra.id} - {obra.nome_obra}")

# Criar material de teste
material = Material.objects.create(
    nome='Material Teste Parcelado',
    unidade='UN',
    preco_medio=Decimal('100.00')
)
print(f"✅ Material criado: {material.id} - {material.nome}")

# Criar usuário de teste se não existir
user, created = User.objects.get_or_create(
    username='teste_parcelado',
    defaults={'email': 'teste@teste.com'}
)
print(f"✅ Usuário: {user.username} (criado: {created})")

# Dados da compra parcelada
compra_data = {
    'tipo': 'COMPRA',
    'obra': obra.id,
    'data_compra': date.today().isoformat(),
    'fornecedor': 'Fornecedor Teste Parcelado',
    'forma_pagamento': 'PARCELADO',
    'numero_parcelas': 3,
    'valor_entrada': Decimal('500.00'),
    'desconto': Decimal('0.00'),
    'itens': [{
        'material': material.id,
        'quantidade': 10,
        'valor_unitario': Decimal('100.00')
    }]
}

print("\n=== DADOS DA COMPRA ===")
print(json.dumps(compra_data, indent=2, default=str))

# Mock da requisição
mock_request = Mock()
mock_request.data = compra_data
mock_request.user = user

# Criar compra usando serializer
serializer = CompraSerializer(data=compra_data, context={'request': mock_request})

if serializer.is_valid():
    compra = serializer.save()
    print(f"\n✅ COMPRA CRIADA COM SUCESSO!")
    print(f"ID: {compra.id}")
    print(f"Forma de pagamento: {compra.forma_pagamento}")
    print(f"Número de parcelas: {compra.numero_parcelas}")
    print(f"Valor total bruto: R$ {compra.valor_total_bruto}")
    print(f"Valor total líquido: R$ {compra.valor_total_liquido}")
    print(f"Valor entrada: R$ {compra.valor_entrada}")
    
    # Verificar itens criados
    itens = ItemCompra.objects.filter(compra=compra)
    print(f"\n=== ITENS DA COMPRA ({itens.count()}) ===")
    for item in itens:
        print(f"  - {item.material.nome}: {item.quantidade} x R$ {item.valor_unitario} = R$ {item.valor_total_item}")
    
    # Verificar parcelas criadas
    parcelas = ParcelaCompra.objects.filter(compra=compra)
    print(f"\n=== PARCELAS CRIADAS ({parcelas.count()}) ===")
    for parcela in parcelas:
        print(f"  Parcela {parcela.numero_parcela}: R$ {parcela.valor_parcela} - Vencimento: {parcela.data_vencimento}")
    
    if parcelas.count() == 0:
        print("❌ NENHUMA PARCELA FOI CRIADA!")
    else:
        print(f"✅ {parcelas.count()} parcelas criadas com sucesso!")
else:
    print("\n❌ ERRO NA VALIDAÇÃO:")
    print(serializer.errors)

print("\n🎉 TESTE CONCLUÍDO!")