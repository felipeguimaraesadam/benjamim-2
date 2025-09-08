#!/usr/bin/env python
import os
import sys
import django
from django.conf import settings

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from core.models import Usuario
from django.contrib.auth import authenticate

print("=== Corrigindo senha do testuser ===")

try:
    # Buscar o usuário testuser
    user = Usuario.objects.get(login='testuser')
    print(f"Usuário encontrado: {user.login}")
    
    # Definir nova senha
    new_password = 'test123'
    user.set_password(new_password)
    user.save()
    
    print(f"✅ Senha atualizada para: {new_password}")
    
    # Testar autenticação
    auth_user = authenticate(username='testuser', password='test123')
    if auth_user:
        print(f"✅ Autenticação SUCESSO: {auth_user.login}")
    else:
        print("❌ Autenticação ainda FALHOU")
        
except Usuario.DoesNotExist:
    print("❌ Usuário testuser não encontrado")
except Exception as e:
    print(f"❌ Erro: {e}")

print("\n=== Correção Concluída ===")