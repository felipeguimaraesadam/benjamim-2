#!/usr/bin/env python
import os
import sys
import django
from django.conf import settings

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from django.contrib.auth import authenticate
from core.models import Usuario
import requests
import json

print("=== Teste de Autenticação Corrigida ===")

# Testar autenticação Django
print("\n--- Testando autenticação Django ---")
user = authenticate(username='admin', password='admin123')
if user:
    print(f"✅ Autenticação Django SUCESSO: {user.login}")
else:
    print("❌ Autenticação Django FALHOU")

user2 = authenticate(username='testuser', password='test123')
if user2:
    print(f"✅ Autenticação Django SUCESSO: {user2.login}")
else:
    print("❌ Autenticação Django FALHOU para testuser")

# Testar API
print("\n--- Testando API ---")
try:
    # Teste admin
    response = requests.post('http://localhost:8002/api/token/', 
                           json={'login': 'admin', 'password': 'admin123'},
                           timeout=5)
    if response.status_code == 200:
        data = response.json()
        print(f"✅ API Login SUCESSO para admin: Token obtido")
        print(f"   Access token: {data.get('access', 'N/A')[:50]}...")
    else:
        print(f"❌ API Login FALHOU para admin: {response.status_code}")
        print(f"   Resposta: {response.text}")
        
    # Teste testuser
    response2 = requests.post('http://localhost:8002/api/token/', 
                            json={'login': 'testuser', 'password': 'test123'},
                            timeout=5)
    if response2.status_code == 200:
        data2 = response2.json()
        print(f"✅ API Login SUCESSO para testuser: Token obtido")
    else:
        print(f"❌ API Login FALHOU para testuser: {response2.status_code}")
        print(f"   Resposta: {response2.text}")
        
except requests.exceptions.ConnectionError:
    print("❌ Erro de conexão - Servidor não está rodando na porta 8002")
except Exception as e:
    print(f"❌ Erro inesperado: {e}")

print("\n=== Teste Concluído ===")