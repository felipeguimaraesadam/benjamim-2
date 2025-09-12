#!/usr/bin/env python
import os
import django
import requests
import json
from datetime import date, timedelta

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from core.models import Usuario

BASE_URL = "http://localhost:8000/api"

def get_auth_token():
    """Obter token de autenticação"""
    url = f"{BASE_URL}/token/"
    data = {
        "login": "admin",
        "password": "admin123"
    }
    
    try:
        response = requests.post(url, json=data)
        if response.status_code == 200:
            token = response.json().get('access')
            print(f"✅ Token obtido com sucesso")
            return token
        else:
            print(f"❌ Erro ao obter token: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Erro na requisição: {e}")
        return None

def test_locacoes_endpoint(token):
    """Testar endpoint de locações semanais"""
    headers = {"Authorization": f"Bearer {token}"}
    
    # Testar com diferentes parâmetros
    test_cases = [
        # Caso 1: Apenas parâmetro inicio
        {
            "url": f"{BASE_URL}/locacoes/semanal/?inicio=2024-01-15",
            "description": "Com parâmetro inicio"
        },
        # Caso 2: Com obra_id
        {
            "url": f"{BASE_URL}/locacoes/semanal/?inicio=2024-01-15&obra_id=190",
            "description": "Com inicio e obra_id"
        },
        # Caso 3: Com filtro_tipo
        {
            "url": f"{BASE_URL}/locacoes/semanal/?inicio=2024-01-15&filtro_tipo=equipe_funcionario",
            "description": "Com inicio e filtro_tipo"
        },
        # Caso 4: Sem parâmetros (deve dar erro 400)
        {
            "url": f"{BASE_URL}/locacoes/semanal/",
            "description": "Sem parâmetros (deve dar erro 400)"
        }
    ]
    
    print("\n🔍 Testando endpoint de locações semanais...\n")
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"Teste {i}: {test_case['description']}")
        print(f"URL: {test_case['url']}")
        
        try:
            response = requests.get(test_case['url'], headers=headers)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Sucesso - Retornou dados para {len(data)} dias")
                # Mostrar estrutura da resposta
                for day, locacoes in list(data.items())[:2]:  # Mostrar apenas 2 dias
                    print(f"  {day}: {len(locacoes)} locações")
            elif response.status_code == 400:
                print(f"⚠️  Erro esperado (400) - {response.json()}")
            else:
                print(f"❌ Erro {response.status_code} - {response.text[:200]}")
                
        except Exception as e:
            print(f"❌ Erro na requisição: {e}")
        
        print("-" * 50)

def main():
    print("🔍 Testando endpoint de locações semanais...")
    
    # Obter token
    token = get_auth_token()
    if not token:
        print("❌ Não foi possível obter token de autenticação")
        return
    
    # Testar endpoint
    test_locacoes_endpoint(token)

if __name__ == "__main__":
    main()