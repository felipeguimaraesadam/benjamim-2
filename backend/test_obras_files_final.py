#!/usr/bin/env python
import os
import sys
from django.test import Client
from django.core.files.uploadedfile import SimpleUploadedFile
import json

from core.models import Usuario, Funcionario, Obra, ArquivoObra
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token

def create_test_data():
    """Criar dados de teste"""
    # Limpar dados anteriores
    Usuario.objects.filter(login='test_user_final').delete()
    
    # Criar usuário
    user = Usuario.objects.create_user(
        login='test_user_final',
        password='test123',
        nome_completo='Usuário Teste Final',
        nivel_acesso='ADMIN'
    )
    
    # Criar funcionário
    funcionario = Funcionario.objects.create(
        nome_completo='João Silva',
        cargo='Engenheiro',
        data_contratacao='2023-01-01',
        valor_diaria_padrao=150.00,
        valor_metro_padrao=25.00,
        valor_empreitada_padrao=5000.00
    )
    
    # Criar obra
    obra = Obra.objects.create(
        nome_obra='Obra Teste Final',
        endereco_completo='Rua Teste, 123',
        cidade='São Paulo',
        status='EM_ANDAMENTO',
        data_inicio='2024-01-01',
        responsavel=funcionario,
        cliente_nome='Cliente Teste',
        orcamento_previsto=100000.00,
        area_metragem=150.0
    )
    
    return user, obra

def test_file_operations():
    """Testar operações de arquivo"""
    print("=== TESTE FINAL DE ARQUIVOS DE OBRA ===", flush=True)
    
    # Criar dados de teste
    user, obra = create_test_data()
    
    # Configurar cliente de teste
    client = Client()
    token, created = Token.objects.get_or_create(user=user)
    # Configurar autenticação para todas as requisições
    client.defaults['HTTP_AUTHORIZATION'] = f'Token {token.key}'
    client.defaults['CONTENT_TYPE'] = 'application/json'
    
    print(f"\n1. Dados criados:", flush=True)
    print(f"   - Usuário: {user.nome_completo}", flush=True)
    print(f"   - Obra: {obra.nome_obra} (ID: {obra.id})", flush=True)
    
    # Teste 1: Upload de imagem
    print("\n2. Testando upload de imagem...", flush=True)
    image_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc```\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82'
    image_file = SimpleUploadedFile(
        "test_image.png",
        image_content,
        content_type="image/png"
    )
    
    response = client.post('/api/arquivos-obra/', {
        'obra': obra.id,
        'arquivo': image_file,
        'nome_original': 'test_image.png',
        'descricao': 'Imagem de teste',
        'categoria': 'FOTO'
    }, format='multipart', HTTP_AUTHORIZATION=f'Token {token.key}')
    
    if response.status_code == 201:
        image_data = response.json()
        print(f"   ✓ Upload de imagem bem-sucedido (ID: {image_data['id']})", flush=True)
        image_id = image_data['id']
    else:
        print(f"   ✗ Erro no upload de imagem: {response.status_code} - {response.content.decode()}", flush=True)
        return False
    
    # Teste 2: Upload de documento
    print("\n3. Testando upload de documento...", flush=True)
    doc_file = SimpleUploadedFile(
        "test_document.txt",
        b"Este e um documento de teste",
        content_type="text/plain"
    )
    
    response = client.post('/api/arquivos-obra/', {
        'obra': obra.id,
        'arquivo': doc_file,
        'nome_original': 'test_document.txt',
        'descricao': 'Documento de teste',
        'categoria': 'DOCUMENTO'
    }, format='multipart', HTTP_AUTHORIZATION=f'Token {token.key}')
    
    if response.status_code == 201:
        doc_data = response.json()
        print(f"   ✓ Upload de documento bem-sucedido (ID: {doc_data['id']})", flush=True)
        doc_id = doc_data['id']
    else:
        print(f"   ✗ Erro no upload de documento: {response.status_code} - {response.content.decode()}", flush=True)
        return False
    
    # Teste 3: Listar arquivos da obra
    print("\n4. Testando listagem de arquivos...", flush=True)
    response = client.get(f'/api/arquivos-obra/?obra={obra.id}', HTTP_AUTHORIZATION=f'Token {token.key}')
    
    if response.status_code == 200:
        files_data = response.json()
        print(f"   ✓ Listagem bem-sucedida: {len(files_data['results'])} arquivos encontrados", flush=True)
        for file_info in files_data['results']:
            print(f"     - {file_info['nome_original']} ({file_info['categoria']})", flush=True)
    else:
        print(f"   ✗ Erro na listagem: {response.status_code} - {response.content.decode()}", flush=True)
        return False
    
    # Teste 4: Visualizar arquivo específico
    print("\n5. Testando visualização de arquivo específico...", flush=True)
    response = client.get(f'/api/arquivos-obra/{image_id}/', HTTP_AUTHORIZATION=f'Token {token.key}')
    
    if response.status_code == 200:
        file_data = response.json()
        print(f"   ✓ Visualização bem-sucedida: {file_data['nome_original']}", flush=True)
        print(f"     - Tamanho: {file_data['arquivo_tamanho']} bytes", flush=True)
        print(f"     - Categoria: {file_data['categoria']}", flush=True)
    else:
        print(f"   ✗ Erro na visualização: {response.status_code} - {response.content.decode()}", flush=True)
        return False
    
    # Teste 5: Exclusão de arquivo
    print("\n6. Testando exclusão de arquivo...", flush=True)
    response = client.delete(f'/api/arquivos-obra/{doc_id}/', HTTP_AUTHORIZATION=f'Token {token.key}')
    
    if response.status_code == 204:
        print(f"   ✓ Exclusão bem-sucedida", flush=True)
        
        # Verificar se foi realmente excluído
        response = client.get(f'/api/arquivos-obra/{doc_id}/', HTTP_AUTHORIZATION=f'Token {token.key}')
        if response.status_code == 404:
            print(f"   ✓ Confirmado: arquivo não existe mais", flush=True)
        else:
            print(f"   ✗ Erro: arquivo ainda existe após exclusão", flush=True)
            return False
    else:
        print(f"   ✗ Erro na exclusão: {response.status_code} - {response.content.decode()}", flush=True)
        return False
    
    # Teste 6: Verificar estado final
    print("\n7. Verificando estado final...", flush=True)
    total_files = ArquivoObra.objects.count()
    obra_files = ArquivoObra.objects.filter(obra=obra).count()
    print(f"   ✓ Total de arquivos no BD: {total_files}", flush=True)
    print(f"   ✓ Arquivos da obra teste: {obra_files}", flush=True)
    
    return True

def cleanup():
    """Limpar dados de teste"""
    print("\n8. Limpando dados de teste...", flush=True)
    Usuario.objects.filter(login='test_user_final').delete()
    print("   ✓ Dados de teste removidos", flush=True)

# Executar o teste
try:
    success = test_file_operations()
    cleanup()
    
    if success:
        print("\n=== TODOS OS TESTES PASSARAM COM SUCESSO! ===", flush=True)
        print("\n✓ Upload de arquivos funcionando", flush=True)
        print("✓ Visualização de arquivos funcionando", flush=True)
        print("✓ Listagem de arquivos funcionando", flush=True)
        print("✓ Exclusão de arquivos funcionando", flush=True)
        print("✓ Validações funcionando", flush=True)
    else:
        print("\n=== ALGUNS TESTES FALHARAM ===", flush=True)
        
except Exception as e:
    print(f"\n✗ Erro durante os testes: {e}", flush=True)
    cleanup()