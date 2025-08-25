#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from core.models import Usuario

print("=== VERIFICANDO E CRIANDO USUÁRIOS DE TESTE ===")

# Verificar usuários existentes
print("\n📋 Usuários existentes:")
users = Usuario.objects.all()
if users.exists():
    for user in users:
        print(f"- {user.login} (admin: {user.is_superuser}, ativo: {user.is_active})")
else:
    print("❌ Nenhum usuário encontrado")

# Criar usuário de teste se não existir
test_login = 'admin'
test_user = Usuario.objects.filter(login=test_login).first()

if not test_user:
    print(f"\n🔧 Criando usuário de teste: {test_login}")
    try:
        test_user = Usuario.objects.create_superuser(
            login=test_login,
            password='admin123',
            nome_completo='Administrador Teste',
            nivel_acesso='admin'
        )
        print(f"✅ Usuário {test_login} criado com sucesso!")
    except Exception as e:
        print(f"❌ Erro ao criar usuário: {e}")
else:
    print(f"\n✅ Usuário {test_login} já existe")
    # Verificar se a senha está correta
    if test_user.check_password('admin123'):
        print("✅ Senha 'admin123' está correta")
    else:
        print("❌ Senha 'admin123' não confere, atualizando...")
        test_user.set_password('admin123')
        test_user.save()
        print("✅ Senha atualizada para 'admin123'")

# Criar usuário alternativo
alt_login = 'testuser'
alt_user = Usuario.objects.filter(login=alt_login).first()

if not alt_user:
    print(f"\n🔧 Criando usuário alternativo: {alt_login}")
    try:
        alt_user = Usuario.objects.create_user(
            login=alt_login,
            password='test123',
            nome_completo='Usuário de Teste',
            nivel_acesso='gerente'
        )
        print(f"✅ Usuário {alt_login} criado com sucesso!")
    except Exception as e:
        print(f"❌ Erro ao criar usuário alternativo: {e}")
else:
    print(f"\n✅ Usuário {alt_login} já existe")

print("\n📋 Usuários finais:")
for user in Usuario.objects.all():
    print(f"- {user.login} (admin: {user.is_superuser}, ativo: {user.is_active})")

print("\n🎯 CREDENCIAIS PARA TESTE:")
print("Login: admin | Senha: admin123")
print("Login: testuser | Senha: test123")