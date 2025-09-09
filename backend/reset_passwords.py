#!/usr/bin/env python
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from core.models import Usuario
from django.contrib.auth import authenticate

print("=== Resetando senhas dos usuários ===")

# Definir senhas padrão para diferentes tipos de usuários
password_mapping = {
    'admin': 'admin123',
    'admin_test': 'admin123', 
    'gerente_test': 'gerente123',
    'admin2': 'admin123'
}

# Resetar senhas
for login, new_password in password_mapping.items():
    try:
        user = Usuario.objects.get(login=login)
        user.set_password(new_password)
        user.save()
        print(f"✓ Senha resetada para {login}: {new_password}")
        
        # Testar autenticação
        auth_user = authenticate(username=login, password=new_password)
        if auth_user:
            print(f"  ✓ Autenticação testada com sucesso")
        else:
            print(f"  ✗ Falha no teste de autenticação")
            
    except Usuario.DoesNotExist:
        print(f"✗ Usuário {login} não encontrado")

print("\n=== Resumo das credenciais ===")
print("Login: admin | Senha: admin123")
print("Login: admin_test | Senha: admin123")
print("Login: gerente_test | Senha: gerente123")
print("Login: admin2 | Senha: admin123")
print("Login: test_user | Senha: test123")

print("\n=== Testando todas as credenciais via API ===")
test_credentials = [
    ('admin', 'admin123'),
    ('admin_test', 'admin123'),
    ('gerente_test', 'gerente123'),
    ('admin2', 'admin123'),
    ('test_user', 'test123')
]

for login, password in test_credentials:
    user = authenticate(username=login, password=password)
    if user:
        print(f"✓ {login} / {password} - OK")
    else:
        print(f"✗ {login} / {password} - FALHA")