#!/usr/bin/env python
import os
import sys
import django
import requests

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from core.models import AnexoS3

def test_download():
    print("🔍 Testando download de anexos...")
    
    # Obter token de autenticação
    User = get_user_model()
    user = User.objects.first()
    if not user:
        print("❌ Nenhum usuário encontrado")
        return
    
    token, created = Token.objects.get_or_create(user=user)
    print("✅ Token obtido com sucesso")
    
    # Buscar um anexo existente
    anexo = AnexoS3.objects.first()
    if not anexo:
        print("❌ Nenhum anexo encontrado")
        return
    
    print(f"📄 Anexo encontrado: {anexo.nome_original} (ID: {anexo.anexo_id})")
    
    # Testar download usando anexo_id (UUID) como lookup
    url = f"http://localhost:8000/api/anexos-s3/{anexo.anexo_id}/download/"
    headers = {'Authorization': f'Token {token.key}'}
    
    print(f"🔍 Testando download: {url}")
    print(f"📋 Anexo PK: {anexo.pk}, UUID: {anexo.anexo_id}")
    
    try:
        response = requests.get(url, headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print(f"✅ Download bem-sucedido")
            print(f"Content-Type: {response.headers.get('content-type')}")
            print(f"Content-Length: {response.headers.get('content-length')}")
            print(f"Content (primeiros 100 chars): {response.content[:100]}")
        else:
            print(f"❌ Erro no download")
            print(f"Resposta: {response.text[:500]}")
            
    except Exception as e:
        print(f"❌ Erro na requisição: {e}")

if __name__ == "__main__":
    test_download()