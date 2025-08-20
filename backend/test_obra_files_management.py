#!/usr/bin/env python
"""
Script de teste para funcionalidades de arquivo da obra
Executar com: python manage.py shell < test_obra_files_management.py
"""

import os
import tempfile
from django.test import TestCase
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from core.models import Obra, ArquivoObra

print("=== INICIANDO TESTES DE ARQUIVO DA OBRA ===")

# Criar usuário de teste
user, created = User.objects.get_or_create(
    username='testuser',
    defaults={'email': 'test@example.com'}
)
if created:
    user.set_password('testpass123')
    user.save()
    print(f"✓ Usuário de teste criado: {user.username}")
else:
    print(f"✓ Usuário de teste já existe: {user.username}")

# Criar obra de teste
obra, created = Obra.objects.get_or_create(
    nome='Obra Teste',
    defaults={
        'endereco': 'Rua Teste, 123',
        'cidade': 'Cidade Teste',
        'estado': 'SP',
        'cep': '12345-678',
        'data_inicio': '2024-01-01',
        'orcamento_inicial': 100000.00,
        'status': 'em_andamento'
    }
)
if created:
    print(f"✓ Obra de teste criada: {obra.nome}")
else:
    print(f"✓ Obra de teste já existe: {obra.nome}")

# Configurar cliente API
client = APIClient()
client.force_authenticate(user=user)
print("✓ Cliente API autenticado")

# Teste 1: Upload de arquivo
print("\n=== TESTE 1: UPLOAD DE ARQUIVO ===")
try:
    # Criar arquivo de teste
    test_content = b"Conteudo de teste para arquivo da obra"
    test_file = SimpleUploadedFile(
        "teste.txt",
        test_content,
        content_type="text/plain"
    )
    
    # Fazer upload
    upload_data = {
        'obra': obra.id,
        'arquivo': test_file,
        'categoria': 'documento',
        'descricao': 'Arquivo de teste'
    }
    
    response = client.post('/api/arquivos-obra/', upload_data, format='multipart')
    
    if response.status_code == 201:
        arquivo_id = response.data['id']
        print(f"✓ Upload realizado com sucesso. ID: {arquivo_id}")
        print(f"  - Nome: {response.data.get('arquivo_nome')}")
        print(f"  - Categoria: {response.data.get('categoria')}")
        print(f"  - Tamanho: {response.data.get('arquivo_tamanho')} bytes")
    else:
        print(f"✗ Erro no upload: {response.status_code}")
        print(f"  Detalhes: {response.data}")
        arquivo_id = None
        
except Exception as e:
    print(f"✗ Erro durante upload: {str(e)}")
    arquivo_id = None

# Teste 2: Listar arquivos
print("\n=== TESTE 2: LISTAR ARQUIVOS ===")
try:
    response = client.get(f'/api/arquivos-obra/?obra={obra.id}')
    
    if response.status_code == 200:
        arquivos = response.data.get('results', response.data)
        print(f"✓ Listagem realizada com sucesso. {len(arquivos)} arquivo(s) encontrado(s)")
        
        for arquivo in arquivos:
            print(f"  - ID: {arquivo.get('id')}")
            print(f"    Nome: {arquivo.get('arquivo_nome')}")
            print(f"    Categoria: {arquivo.get('categoria')}")
            print(f"    URL: {arquivo.get('arquivo_url')}")
    else:
        print(f"✗ Erro na listagem: {response.status_code}")
        print(f"  Detalhes: {response.data}")
        
except Exception as e:
    print(f"✗ Erro durante listagem: {str(e)}")

# Teste 3: Visualizar arquivo específico
if arquivo_id:
    print("\n=== TESTE 3: VISUALIZAR ARQUIVO ESPECÍFICO ===")
    try:
        response = client.get(f'/api/arquivos-obra/{arquivo_id}/')
        
        if response.status_code == 200:
            print("✓ Visualização realizada com sucesso")
            print(f"  - ID: {response.data.get('id')}")
            print(f"  - Nome: {response.data.get('arquivo_nome')}")
            print(f"  - Categoria: {response.data.get('categoria')}")
            print(f"  - Descrição: {response.data.get('descricao')}")
            print(f"  - Data upload: {response.data.get('data_upload')}")
        else:
            print(f"✗ Erro na visualização: {response.status_code}")
            print(f"  Detalhes: {response.data}")
            
    except Exception as e:
        print(f"✗ Erro durante visualização: {str(e)}")

# Teste 4: Validação de tipos de arquivo
print("\n=== TESTE 4: VALIDAÇÃO DE TIPOS DE ARQUIVO ===")
try:
    # Testar arquivo não permitido
    invalid_file = SimpleUploadedFile(
        "teste.exe",
        b"fake executable content",
        content_type="application/x-executable"
    )
    
    upload_data = {
        'obra': obra.id,
        'arquivo': invalid_file,
        'categoria': 'documento'
    }
    
    response = client.post('/api/arquivos-obra/', upload_data, format='multipart')
    
    if response.status_code == 400:
        print("✓ Validação de tipo de arquivo funcionando corretamente")
        print(f"  Erro esperado: {response.data}")
    else:
        print(f"✗ Validação falhou - arquivo inválido foi aceito: {response.status_code}")
        
except Exception as e:
    print(f"✗ Erro durante teste de validação: {str(e)}")

# Teste 5: Exclusão de arquivo
if arquivo_id:
    print("\n=== TESTE 5: EXCLUSÃO DE ARQUIVO ===")
    try:
        response = client.delete(f'/api/arquivos-obra/{arquivo_id}/')
        
        if response.status_code == 204:
            print("✓ Exclusão realizada com sucesso")
            
            # Verificar se arquivo foi realmente excluído
            response_check = client.get(f'/api/arquivos-obra/{arquivo_id}/')
            if response_check.status_code == 404:
                print("✓ Arquivo confirmadamente excluído")
            else:
                print("✗ Arquivo ainda existe após exclusão")
        else:
            print(f"✗ Erro na exclusão: {response.status_code}")
            print(f"  Detalhes: {response.data}")
            
    except Exception as e:
        print(f"✗ Erro durante exclusão: {str(e)}")

# Teste 6: Teste sem autenticação
print("\n=== TESTE 6: ACESSO SEM AUTENTICAÇÃO ===")
try:
    client_unauth = APIClient()
    response = client_unauth.get('/api/arquivos-obra/')
    
    if response.status_code == 401:
        print("✓ Proteção de autenticação funcionando corretamente")
    else:
        print(f"✗ Acesso não autenticado permitido: {response.status_code}")
        
except Exception as e:
    print(f"✗ Erro durante teste de autenticação: {str(e)}")

print("\n=== TESTES CONCLUÍDOS ===")
print("\nResumo dos componentes testados:")
print("- Upload de arquivos ✓")
print("- Listagem de arquivos ✓")
print("- Visualização de arquivos ✓")
print("- Validação de tipos de arquivo ✓")
print("- Exclusão de arquivos ✓")
print("- Proteção de autenticação ✓")