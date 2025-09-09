#!/usr/bin/env python
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from core.models import Usuario
from django.contrib.auth import authenticate

print("=== Criando usuário de teste ===")

# Deletar usuário de teste se já existir
try:
    existing_user = Usuario.objects.get(login='test_user')
    existing_user.delete()
    print("Usuário de teste anterior removido")
except Usuario.DoesNotExist:
    pass

# Criar novo usuário de teste
test_user = Usuario.objects.create_user(
    login='test_user',
    password='test123',
    nome_completo='Usuário de Teste',
    nivel_acesso='admin'
)
test_user.is_active = True
test_user.save()

print(f"Usuário criado: {test_user.login}")
print(f"Nome: {test_user.nome_completo}")
print(f"Ativo: {test_user.is_active}")
print(f"Hash da senha: {test_user.password[:50]}...")

# Testar autenticação
print("\n=== Testando autenticação ===")
auth_user = authenticate(username='test_user', password='test123')
if auth_user:
    print("✓ Autenticação bem-sucedida!")
else:
    print("✗ Falha na autenticação")
    
# Testar verificação direta de senha
print(f"\nVerificação direta de senha: {test_user.check_password('test123')}")

# Verificar usuários existentes e suas senhas
print("\n=== Verificando usuários existentes ===")
for user in Usuario.objects.all():
    print(f"\nUsuário: {user.login}")
    print(f"  Hash: {user.password[:50]}...")
    print(f"  Verifica 'admin123': {user.check_password('admin123')}")
    print(f"  Verifica 'test123': {user.check_password('test123')}")
    print(f"  Verifica '123456': {user.check_password('123456')}")