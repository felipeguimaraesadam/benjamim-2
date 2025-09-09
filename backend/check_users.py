#!/usr/bin/env python
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from core.models import Usuario
from django.contrib.auth import authenticate

print("=== Verificação de Usuários ===")
print(f"Total de usuários no banco: {Usuario.objects.count()}")

print("\n=== Lista de Usuários ===")
for user in Usuario.objects.all():
    print(f"ID: {user.id}, Login: {user.login}, Nome: {user.nome_completo}, Ativo: {user.is_active}")

print("\n=== Teste de Autenticação ===")
# Testar autenticação com diferentes usuários
test_credentials = [
    ('admin', 'admin123'),
    ('gerente1', 'gerente123'),
    ('funcionario1', 'func123'),
    ('supervisor1', 'super123')
]

for login, password in test_credentials:
    print(f"\nTestando login: {login} com senha: {password}")
    user = authenticate(username=login, password=password)
    if user:
        print(f"✓ Autenticação bem-sucedida para {login}")
        print(f"  Nome: {user.nome_completo}")
        print(f"  Nível: {user.nivel_acesso}")
        print(f"  Ativo: {user.is_active}")
    else:
        print(f"✗ Falha na autenticação para {login}")
        
        # Verificar se o usuário existe
        try:
            existing_user = Usuario.objects.get(login=login)
            print(f"  Usuário existe no banco: {existing_user.login}")
            print(f"  Senha hash: {existing_user.password[:50]}...")
            print(f"  Verificação de senha: {existing_user.check_password(password)}")
        except Usuario.DoesNotExist:
            print(f"  Usuário {login} não existe no banco")