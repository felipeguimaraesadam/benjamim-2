import os
import sys
import django
import requests
import json

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def get_auth_token():
    """Obter token de autenticação"""
    try:
        # Usar o usuário admin existente (campo login em vez de username)
        user = User.objects.get(login='admin')
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    except User.DoesNotExist:
        print("❌ Usuário admin não encontrado")
        return None

def test_upload_anexo():
    """Testar upload de anexo via requests"""
    print("🔍 Testando upload de anexos...")
    
    # Obter token
    token = get_auth_token()
    if not token:
        return
    
    print("✅ Token obtido com sucesso")
    
    # URL do servidor local
    base_url = "http://localhost:8000"
    
    # Headers de autenticação
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    print("\n🔍 Teste 1: Upload via create (POST /api/anexos-s3/)...")
    
    # Criar arquivo de teste
    files = {
        'files': ('test_upload.txt', b'Test file content for upload', 'text/plain')
    }
    
    data = {
        'entity_type': 'test',
        'entity_id': '1',
    }
    
    try:
        response = requests.post(
            f"{base_url}/api/anexos-s3/",
            headers=headers,
            data=data,
            files=files,
            timeout=30
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code == 201:
            print("✅ Upload bem-sucedido")
            print(f"   Resposta: {response.json()}")
        else:
            print(f"❌ Erro no upload: {response.status_code}")
            print(f"   Resposta: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Erro de conexão: {e}")
    
    print("\n🔍 Teste 2: Upload via upload_file action...")
    
    files2 = {
        'file': ('test_upload2.txt', b'Test file content for upload 2', 'text/plain')
    }
    
    data2 = {
        'anexo_type': 'test',
        'object_id': '1',
    }
    
    try:
        response = requests.post(
            f"{base_url}/api/anexos-s3/upload_file/",
            headers=headers,
            data=data2,
            files=files2,
            timeout=30
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code == 201:
            print("✅ Upload bem-sucedido")
            print(f"   Resposta: {response.json()}")
        else:
            print(f"❌ Erro no upload: {response.status_code}")
            print(f"   Resposta: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Erro de conexão: {e}")
    
    print("\n🔍 Teste 3: Verificando configuração S3...")
    from core.services.s3_service import S3Service
    s3_service = S3Service()
    
    print(f"   S3 disponível: {s3_service.s3_available}")
    print(f"   Bucket: {s3_service.bucket_name}")
    print(f"   Região: {s3_service.region}")
    print(f"   Access Key configurada: {'Sim' if s3_service.access_key else 'Não'}")
    print(f"   Secret Key configurada: {'Sim' if s3_service.secret_key else 'Não'}")

if __name__ == '__main__':
    test_upload_anexo()