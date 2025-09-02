#!/usr/bin/env python
import os
import sys
import django
import requests
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from core.models import Usuario
from rest_framework.authtoken.models import Token

print("=== Testando API REST com Autenticação ===")

# Buscar ou criar usuário admin
user = Usuario.objects.filter(is_superuser=True).first()
if not user:
    print("❌ Nenhum usuário admin encontrado")
    sys.exit(1)

print(f"✅ Usuário admin encontrado: {user.login}")

# Buscar ou criar token
token, created = Token.objects.get_or_create(user=user)
print(f"✅ Token: {token.key} ({'criado' if created else 'existente'})")

# Testar API REST
url = 'http://localhost:8000/api/compras/'
headers = {
    'Authorization': f'Token {token.key}',
    'Content-Type': 'application/json'
}

data = {
    "obra": 8,
    "fornecedor": "Fornecedor Teste API",
    "data_compra": "2024-01-15",
    "nota_fiscal": "NF-API-001",
    "desconto": "0.00",
    "observacoes": "Teste via API REST",
    "tipo": "COMPRA",
    "itens": [{
        "material": 2,
        "quantidade": "10.500",
        "valor_unitario": "25.75",
        "categoria_uso": "Geral"
    }]
}

print("\n--- Testando Caso Normal ---")
print(f"📊 Dados enviados para a API:")
print(json.dumps(data, indent=2, ensure_ascii=False))

try:
    response = requests.post(url, headers=headers, json=data)
    print(f"\n📈 Status Code: {response.status_code}")

    if response.status_code == 201:
        print("✅ Compra criada com sucesso!")
        result = response.json()
        print(f"ID da compra: {result.get('id')}")
        print(f"Valor total: {result.get('valor_total_bruto')}")
    else:
        print("❌ Erro na criação:")
        print(response.text)
except Exception as e:
    print(f"❌ Erro na requisição: {e}")

# Testar com valores grandes
print("\n--- Testando Caso com Números Grandes ---")
data_big = data.copy()
data_big["itens"] = [{
    "material": 2,
    "quantidade": "999999999.999",
    "valor_unitario": "999999999.99",
    "categoria_uso": "Geral"
}]
data_big["nota_fiscal"] = "NF-API-002"

try:
    response = requests.post(url, headers=headers, json=data_big)
    print(f"📈 Status Code: {response.status_code}")

    if response.status_code == 201:
        print("✅ Compra com números grandes criada com sucesso!")
        result = response.json()
        print(f"ID da compra: {result.get('id')}")
        print(f"Valor total: {result.get('valor_total_bruto')}")
    else:
        print("❌ Erro na criação:")
        print(response.text)
except Exception as e:
    print(f"❌ Erro na requisição: {e}")

# Testar com valores infinitos
print("\n--- Testando Caso com Valores Infinitos ---")
data_inf = data.copy()
data_inf["itens"] = [{
    "material": 2,
    "quantidade": "Infinity",
    "valor_unitario": "Infinity",
    "categoria_uso": "Geral"
}]
data_inf["nota_fiscal"] = "NF-API-003"

try:
    response = requests.post(url, headers=headers, json=data_inf)
    print(f"📈 Status Code: {response.status_code}")

    if response.status_code == 201:
        print("✅ Compra com valores infinitos criada!")
        result = response.json()
        print(f"ID da compra: {result.get('id')}")
        print(f"Valor total: {result.get('valor_total_bruto')}")
    else:
        print("❌ Erro na criação (esperado):")
        print(response.text)
except Exception as e:
    print(f"❌ Erro na requisição: {e}")

print("\n=== Teste da API REST Concluído ===")