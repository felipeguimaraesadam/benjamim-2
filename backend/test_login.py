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
from django.contrib.auth import authenticate
from django.contrib.auth.backends import ModelBackend

def test_django_auth():
    """Testa autenticação diretamente no Django"""
    print("=== Teste de Autenticação Django ===")
    
    # Listar usuários existentes
    usuarios = Usuario.objects.all()
    print(f"Usuários encontrados: {usuarios.count()}")
    for user in usuarios:
        print(f"- Login: {user.login}, Nome: {user.nome_completo}, Ativo: {user.is_active}")
    
    # Testar autenticação com credenciais conhecidas
    test_credentials = [
        ('admin', 'admin123'),
        ('testuser', 'test123')
    ]
    
    for login, password in test_credentials:
        print(f"\n--- Testando login: {login} com senha: {password} ---")
        
        # Verificar se usuário existe
        try:
            user = Usuario.objects.get(login=login)
            print(f"✅ Usuário encontrado: {user.nome_completo}")
            print(f"   Username field: {user.USERNAME_FIELD}")
            print(f"   Is active: {user.is_active}")
            print(f"   Is staff: {user.is_staff}")
            print(f"   Is superuser: {user.is_superuser}")
            
            # Testar senha manualmente
            password_check = user.check_password(password)
            print(f"   Check password result: {password_check}")
            
            # Testar autenticação usando username (que deveria ser login)
            print(f"   Testando authenticate com username={login}")
            auth_user1 = authenticate(username=login, password=password)
            print(f"   Resultado authenticate(username): {'✅ SUCESSO' if auth_user1 else '❌ FALHOU'}")
            
            # Testar autenticação usando login diretamente
            print(f"   Testando authenticate com login={login}")
            auth_user2 = authenticate(login=login, password=password)
            print(f"   Resultado authenticate(login): {'✅ SUCESSO' if auth_user2 else '❌ FALHOU'}")
            
            # Testar backend diretamente
            backend = ModelBackend()
            print(f"   Testando ModelBackend diretamente")
            auth_user3 = backend.authenticate(None, username=login, password=password)
            print(f"   Resultado ModelBackend: {'✅ SUCESSO' if auth_user3 else '❌ FALHOU'}")
                    
        except Usuario.DoesNotExist:
            print(f"❌ Usuário {login} não encontrado")
        except Exception as e:
            print(f"❌ Erro inesperado: {e}")

def test_api_auth():
    """Testa autenticação via API"""
    print("\n=== Teste de Autenticação API ===")
    
    # URL do endpoint de token
    token_url = 'http://localhost:8001/api/token/'
    
    test_credentials = [
        ('admin', 'admin123'),
        ('testuser', 'test123')
    ]
    
    for login, password in test_credentials:
        print(f"\n--- Testando API login: {login} ---")
        
        try:
            payload = {
                'login': login,
                'password': password
            }
            print(f"   Payload: {payload}")
            
            response = requests.post(token_url, payload, timeout=10)
            
            print(f"   Status Code: {response.status_code}")
            print(f"   Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Login API SUCESSO para {login}")
                print(f"   Access token: {data.get('access', 'N/A')[:50]}...")
                print(f"   Refresh token: {data.get('refresh', 'N/A')[:50]}...")
            else:
                print(f"   ❌ Login API FALHOU para {login}")
                try:
                    error_data = response.json()
                    print(f"   Erro JSON: {error_data}")
                except:
                    print(f"   Erro texto: {response.text}")
                    
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Erro de conexão: {e}")
        except Exception as e:
            print(f"   ❌ Erro inesperado: {e}")

if __name__ == '__main__':
    test_django_auth()
    test_api_auth()
    print("\n=== Teste Concluído ===")