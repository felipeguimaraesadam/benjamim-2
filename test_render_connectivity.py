#!/usr/bin/env python3
"""
Script para testar conectividade com os serviços no Render
"""

import requests
import json
from datetime import datetime

# URLs dos serviços no Render
BACKEND_URL = "https://django-backend-e7od.onrender.com"
FRONTEND_URL = "https://frontend-s7jt.onrender.com"

def test_backend_health():
    """Testa o endpoint de health check do backend"""
    print("🔍 Testando Backend Health Check...")
    try:
        response = requests.get(f"{BACKEND_URL}/api/health-check/", timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Backend está funcionando!")
            print(f"Status: {data.get('status')}")
            print(f"Timestamp: {data.get('timestamp')}")
            print(f"Database: {data.get('database_status')}")
            return True
        else:
            print(f"❌ Backend retornou erro: {response.status_code}")
            print(f"Resposta: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Erro ao conectar com o backend: {e}")
        return False

def test_frontend():
    """Testa se o frontend está acessível"""
    print("\n🔍 Testando Frontend...")
    try:
        response = requests.get(FRONTEND_URL, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Frontend está acessível!")
            print(f"Content-Type: {response.headers.get('content-type')}")
            return True
        else:
            print(f"❌ Frontend retornou erro: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Erro ao conectar com o frontend: {e}")
        return False

def test_cors():
    """Testa se o CORS está configurado corretamente"""
    print("\n🔍 Testando CORS...")
    try:
        headers = {
            'Origin': FRONTEND_URL,
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Content-Type'
        }
        
        response = requests.options(f"{BACKEND_URL}/api/health-check/", 
                                  headers=headers, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
        }
        
        print("Headers CORS:")
        for key, value in cors_headers.items():
            if value:
                print(f"  {key}: {value}")
            else:
                print(f"  {key}: ❌ Não encontrado")
                
        if cors_headers['Access-Control-Allow-Origin']:
            print("✅ CORS parece estar configurado")
            return True
        else:
            print("❌ CORS não está configurado corretamente")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Erro ao testar CORS: {e}")
        return False

def test_api_endpoints():
    """Testa outros endpoints da API"""
    print("\n🔍 Testando outros endpoints...")
    
    endpoints = [
        "/api/",
        "/api/auth/",
        "/admin/"
    ]
    
    results = {}
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{BACKEND_URL}{endpoint}", timeout=30)
            results[endpoint] = {
                'status_code': response.status_code,
                'accessible': response.status_code < 500
            }
            print(f"  {endpoint}: {response.status_code} {'✅' if response.status_code < 500 else '❌'}")
        except requests.exceptions.RequestException as e:
            results[endpoint] = {
                'status_code': None,
                'accessible': False,
                'error': str(e)
            }
            print(f"  {endpoint}: ❌ Erro - {e}")
    
    return results

def main():
    print("🚀 TESTE DE CONECTIVIDADE - RENDER")
    print("=" * 50)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Frontend URL: {FRONTEND_URL}")
    print(f"Timestamp: {datetime.now()}")
    print("=" * 50)
    
    # Executar testes
    backend_ok = test_backend_health()
    frontend_ok = test_frontend()
    cors_ok = test_cors()
    api_results = test_api_endpoints()
    
    # Resumo
    print("\n📊 RESUMO DOS TESTES")
    print("=" * 30)
    print(f"Backend Health: {'✅' if backend_ok else '❌'}")
    print(f"Frontend: {'✅' if frontend_ok else '❌'}")
    print(f"CORS: {'✅' if cors_ok else '❌'}")
    
    # Status geral
    all_ok = backend_ok and frontend_ok and cors_ok
    print(f"\n🎯 Status Geral: {'✅ TUDO OK' if all_ok else '❌ PROBLEMAS ENCONTRADOS'}")
    
    if not all_ok:
        print("\n🔧 PRÓXIMOS PASSOS:")
        if not backend_ok:
            print("- Verificar logs do backend no Render")
            print("- Confirmar se o banco PostgreSQL está conectado")
        if not frontend_ok:
            print("- Verificar se o build do frontend foi bem-sucedido")
        if not cors_ok:
            print("- Verificar configurações de CORS no Django")
            print("- Confirmar se as URLs estão corretas no render.yaml")

if __name__ == "__main__":
    main()