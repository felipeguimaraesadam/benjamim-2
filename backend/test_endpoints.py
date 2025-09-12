#!/usr/bin/env python
"""
Script para testar os endpoints corrigidos com autenticação
"""

import requests
import json
import sys

# Configurações
BASE_URL = "http://localhost:8000/api"
USERNAME = "admin"  # Ajuste conforme necessário
PASSWORD = "admin"  # Ajuste conforme necessário

def get_auth_token():
    """Obtém token de autenticação"""
    try:
        response = requests.post(f"{BASE_URL}/token/", {
            "login": USERNAME,
            "password": PASSWORD
        })
        if response.status_code == 200:
            return response.json()["access"]
        else:
            print(f"Erro ao obter token: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Erro na requisição de token: {e}")
        return None

def test_endpoint(url, token, method="GET", data=None):
    """Testa um endpoint específico"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data)
        
        print(f"\n{method} {url}")
        print(f"Status: {response.status_code}")
        
        if response.status_code < 400:
            print("✅ Sucesso")
            if response.content:
                try:
                    content = response.json()
                    if isinstance(content, list):
                        print(f"Retornou {len(content)} itens")
                    elif isinstance(content, dict):
                        print(f"Retornou objeto com {len(content)} campos")
                except:
                    print(f"Retornou {len(response.content)} bytes")
        else:
            print("❌ Erro")
            print(f"Resposta: {response.text[:200]}...")
            
        return response.status_code < 400
        
    except Exception as e:
        print(f"\n{method} {url}")
        print(f"❌ Erro na requisição: {e}")
        return False

def main():
    print("🔍 Testando endpoints corrigidos...\n")
    
    # Obter token
    token = get_auth_token()
    if not token:
        print("❌ Não foi possível obter token de autenticação")
        sys.exit(1)
    
    print("✅ Token obtido com sucesso")
    
    # Lista de endpoints para testar
    endpoints = [
        # Endpoint de locações semanal
        f"{BASE_URL}/locacoes/semanal/?inicio=2024-01-15",
        
        # Endpoint de gastos por categoria material (usando obra ID 190)
        f"{BASE_URL}/obras/190/gastos-por-categoria-material/",
        
        # Endpoint de arquivos obra
        f"{BASE_URL}/arquivos-obra/",
        
        # Endpoint de anexos S3
        f"{BASE_URL}/anexos-s3/",
    ]
    
    success_count = 0
    total_count = len(endpoints)
    
    for endpoint in endpoints:
        if test_endpoint(endpoint, token):
            success_count += 1
    
    print(f"\n📊 Resultado: {success_count}/{total_count} endpoints funcionando")
    
    if success_count == total_count:
        print("🎉 Todos os endpoints estão funcionando!")
    else:
        print("⚠️  Alguns endpoints ainda apresentam problemas")

if __name__ == "__main__":
    main()