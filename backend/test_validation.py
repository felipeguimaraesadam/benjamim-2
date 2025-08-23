# Teste de validação do backend
from core.models import Obra, Usuario
from core.serializers import CompraSerializer
from django.test import RequestFactory

print("\n=== TESTE: Validação do Backend ===")

# Buscar uma obra existente
obra = Obra.objects.first()
if not obra:
    print("❌ ERRO: Nenhuma obra encontrada no banco")
    exit(1)

# Buscar um usuário existente
user = Usuario.objects.first()
if not user:
    print("❌ ERRO: Nenhum usuário encontrado no banco")
    exit(1)

# Criar request mock
factory = RequestFactory()
request = factory.post('/api/compras/')
request.user = user

# TESTE 1: Compra SEM itens (deve falhar)
print("\n--- Teste 1: Compra sem itens ---")
compra_data_sem_itens = {
    'obra': obra.id,
    'fornecedor': 'Fornecedor Teste',
    'data_compra': '2025-01-22',
    'nota_fiscal': 'NF-TESTE-SEM-ITENS',
    'valor_total_bruto': 0.00,
    'forma_pagamento': 'AVISTA',
    'numero_parcelas': 1,
    'tipo': 'COMPRA',
    'itens': []  # LISTA VAZIA - deve falhar
}

serializer1 = CompraSerializer(data=compra_data_sem_itens, context={'request': request})
if serializer1.is_valid():
    print("❌ ERRO CRÍTICO: Backend aceitou compra sem itens!")
    teste1_ok = False
else:
    print("✅ SUCESSO: Backend rejeitou compra sem itens")
    print(f"Erros: {serializer1.errors}")
    teste1_ok = True

# TESTE 2: Compra COM itens válidos (deve passar)
print("\n--- Teste 2: Compra com itens válidos ---")
compra_data_com_itens = {
    'obra': obra.id,
    'fornecedor': 'Fornecedor Teste',
    'data_compra': '2025-01-22',
    'nota_fiscal': 'NF-TESTE-COM-ITENS',
    'valor_total_bruto': 100.00,
    'forma_pagamento': 'AVISTA',
    'numero_parcelas': 1,
    'tipo': 'COMPRA',
    'itens': [
        {
            'material': 1,  # Assumindo que existe material com ID 1
            'quantidade': 10.0,
            'valor_unitario': 10.0,
            'categoria_uso': 'Geral'
        }
    ]
}

serializer2 = CompraSerializer(data=compra_data_com_itens, context={'request': request})
if serializer2.is_valid():
    print("✅ SUCESSO: Backend aceitou compra com itens válidos")
    teste2_ok = True
else:
    print("❌ ERRO: Backend rejeitou compra com itens válidos")
    print(f"Erros: {serializer2.errors}")
    teste2_ok = False

# RESUMO
print("\n=== RESUMO DOS TESTES ===")
print(f"Rejeição de compra sem itens: {'✅ OK' if teste1_ok else '❌ FALHOU'}")
print(f"Aceitação de compra com itens: {'✅ OK' if teste2_ok else '❌ FALHOU'}")

if teste1_ok and teste2_ok:
    print("\n🎉 TODOS OS TESTES PASSARAM - Validação do backend está funcionando!")
else:
    print("\n⚠️  ALGUNS TESTES FALHARAM - Há problemas na validação do backend!")