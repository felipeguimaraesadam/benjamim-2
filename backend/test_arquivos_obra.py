#!/usr/bin/env python
import os
import sys
import django
import requests

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from rest_framework.authtoken.models import Token
from core.models import Obra, Usuario

def test_arquivos_obra():
    print("🔍 Testando endpoints de arquivos de obra...")
    
    # Obter token
    try:
        user = Usuario.objects.filter(is_superuser=True).first()
        if not user:
            user = Usuario.objects.first()
        if user:
            token, created = Token.objects.get_or_create(user=user)
            print(f"✅ Token obtido com sucesso para usuário: {user.login}")
        else:
            print("❌ Nenhum usuário encontrado")
            return
    except Exception as e:
        print(f"❌ Erro ao obter token: {str(e)}")
        return
    
    # Verificar se existe obra 271
    try:
        obra = Obra.objects.get(pk=271)
        print(f"📋 Obra encontrada: {obra.nome} (ID: {obra.pk})")
    except Obra.DoesNotExist:
        # Pegar qualquer obra disponível
        obra = Obra.objects.first()
        if obra:
            print(f"📋 Usando obra disponível: {obra.nome} (ID: {obra.pk})")
        else:
            print("❌ Nenhuma obra encontrada")
            return
    
    # Testar endpoint de arquivos de obra
    url = f"http://localhost:8000/api/arquivos-obra/?obra={obra.pk}"
    headers = {'Authorization': f'Token {token.key}'}
    
    print(f"🔍 Testando: {url}")
    
    try:
        response = requests.get(url, headers=headers)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Sucesso - {len(data)} arquivos encontrados")
            if data:
                print(f"📄 Primeiro arquivo: {data[0].get('nome_original', 'N/A')}")
        else:
            print(f"❌ Erro: {response.content.decode()}")
            
    except Exception as e:
        print(f"❌ Erro na requisição: {str(e)}")

if __name__ == '__main__':
    test_arquivos_obra()