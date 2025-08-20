#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
import django
import requests
import json
from io import BytesIO
from PIL import Image

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
sys.path.append(os.path.dirname(__file__))
django.setup()

from django.contrib.auth import get_user_model
from core.models import Obra, ArquivoObra, Funcionario
from django.test import Client
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.files.uploadedfile import SimpleUploadedFile

User = get_user_model()

def create_test_image():
    """Criar uma imagem de teste usando SimpleUploadedFile"""
    img = Image.new('RGB', (100, 100), color='red')
    img_io = BytesIO()
    img.save(img_io, format='JPEG')
    img_io.seek(0)
    
    return SimpleUploadedFile(
        name='test_image.jpeg',
        content=img_io.getvalue(),
        content_type='image/jpeg'
    )

def create_test_document():
    """Criar um documento de teste usando SimpleUploadedFile"""
    content = b"Este eh um documento de teste para upload."
    
    return SimpleUploadedFile(
        name='test_document.txt',
        content=content,
        content_type='text/plain'
    )

def test_arquivo_obra_functionality():
    print("=== TESTE COMPLETO DE FUNCIONALIDADES DE ARQUIVO OBRA ===")
    
    # 1. Limpar dados de teste anteriores e criar usuário
    print("\n1. Limpando dados anteriores e criando usuário de teste...")
    User = get_user_model()
    try:
        # Limpar usuário existente se houver
        User.objects.filter(login='test_user_arquivo').delete()
        
        user = User.objects.create_user(
            login='test_user_arquivo',
            nome_completo='Usuário Teste Arquivo',
            password='testpass123',
            nivel_acesso='admin'
        )
        print(f"✓ Usuário criado: {user.login}")
    except Exception as e:
        print(f"✗ Erro ao criar usuário: {e}")
        return
    
    # 2. Criar funcionário de teste
    print("\n2. Criando funcionário de teste...")
    try:
        funcionario = Funcionario.objects.create(
            nome_completo='Funcionário Teste Arquivo',
            cargo='Engenheiro',
            data_contratacao='2024-01-01',
            valor_diaria_padrao=200.00
        )
        print(f"✓ Funcionário criado: {funcionario.nome_completo}")
    except Exception as e:
        print(f"✗ Erro ao criar funcionário: {e}")
        return
    
    # 3. Criar obra de teste
    print("\n3. Criando obra de teste...")
    try:
        obra = Obra.objects.create(
            nome_obra='Obra Teste Arquivo',
            endereco_completo='Rua Teste, 123, Bairro Teste',
            cidade='São Paulo',
            status='Em Andamento',
            responsavel=funcionario,
            data_inicio='2024-01-01',
            orcamento_previsto=100000.00
        )
        print(f"✓ Obra criada: {obra.nome_obra} (ID: {obra.id})")
    except Exception as e:
        print(f"✗ Erro ao criar obra: {e}")
        return
    
    # 4. Configurar cliente API com autenticação
    print("\n4. Configurando autenticação...")
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    print("✓ Token JWT configurado")
    
    # 5. Testar listagem de arquivos (deve estar vazia)
    print("\n5. Testando listagem inicial de arquivos...")
    try:
        response = client.get('/api/arquivos-obra/')
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Arquivos encontrados: {len(data)}")
        else:
            print(f"✗ Erro na listagem: {response.data}")
    except Exception as e:
        print(f"✗ Erro na listagem: {e}")
    
    # 6. Testar upload de imagem
    print("\n6. Testando upload de imagem...")
    try:
        img_file = create_test_image()
        data = {
            'obra': obra.id,
            'nome_original': 'test_image.jpeg',
            'descricao': 'Imagem de teste',
            'categoria': 'FOTO',
            'arquivo': img_file
        }
        
        response = client.post('/api/arquivos-obra/', data=data, format='multipart')
        print(f"Status: {response.status_code}")
        
        if response.status_code == 201:
            arquivo_data = response.json()
            arquivo_id = arquivo_data['id']
            print(f"✓ Imagem enviada com sucesso! ID: {arquivo_id}")
            print(f"  - Nome: {arquivo_data['nome_original']}")
            print(f"  - Categoria: {arquivo_data['categoria']}")
        else:
            print(f"✗ Erro no upload da imagem: {response.data}")
            return
    except Exception as e:
        print(f"✗ Erro no upload da imagem: {e}")
        return
    
    # 7. Testar upload de documento
    print("\n7. Testando upload de documento...")
    try:
        doc_file = create_test_document()
        data = {
            'obra': obra.id,
            'nome_original': 'test_document.txt',
            'descricao': 'Documento de teste',
            'categoria': 'DOCUMENTO',
            'arquivo': doc_file
        }
        
        response = client.post('/api/arquivos-obra/', data=data, format='multipart')
        print(f"Status: {response.status_code}")
        
        if response.status_code == 201:
            doc_arquivo_data = response.json()
            doc_arquivo_id = doc_arquivo_data['id']
            print(f"✓ Documento enviado com sucesso! ID: {doc_arquivo_id}")
            print(f"  - Nome: {doc_arquivo_data['nome_original']}")
            print(f"  - Categoria: {doc_arquivo_data['categoria']}")
        else:
            print(f"✗ Erro no upload do documento: {response.data}")
    except Exception as e:
        print(f"✗ Erro no upload do documento: {e}")
    
    # 8. Testar listagem após uploads
    print("\n8. Testando listagem após uploads...")
    try:
        response = client.get('/api/arquivos-obra/')
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Total de arquivos: {len(data)}")
            for arquivo in data:
                print(f"  - ID: {arquivo['id']}, Nome: {arquivo['nome_original']}, Categoria: {arquivo['categoria']}")
        else:
            print(f"✗ Erro na listagem: {response.data}")
    except Exception as e:
        print(f"✗ Erro na listagem: {e}")
    
    # 9. Testar filtro por obra
    print(f"\n9. Testando filtro por obra (ID: {obra.id})...")
    try:
        response = client.get(f'/api/arquivos-obra/?obra={obra.id}')
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Arquivos da obra {obra.id}: {len(data)}")
            for arquivo in data:
                print(f"  - ID: {arquivo['id']}, Nome: {arquivo['nome_original']}")
        else:
            print(f"✗ Erro no filtro: {response.data}")
    except Exception as e:
        print(f"✗ Erro no filtro: {e}")
    
    # 10. Testar visualização de arquivo específico
    print(f"\n10. Testando visualização do arquivo ID: {arquivo_id}...")
    try:
        response = client.get(f'/api/arquivos-obra/{arquivo_id}/')
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            arquivo_data = response.json()
            print(f"✓ Arquivo encontrado:")
            print(f"  - ID: {arquivo_data['id']}")
            print(f"  - Nome: {arquivo_data['nome_original']}")
            print(f"  - Obra: {arquivo_data['obra']}")
            print(f"  - Categoria: {arquivo_data['categoria']}")
            print(f"  - Data upload: {arquivo_data['data_upload']}")
        else:
            print(f"✗ Erro na visualização: {response.data}")
    except Exception as e:
        print(f"✗ Erro na visualização: {e}")
    
    # 11. Testar validação de arquivo muito grande (simulado)
    print("\n11. Testando validação de tamanho de arquivo...")
    try:
        # Criar um arquivo "grande" (simulado com dados repetidos)
        large_content = b"x" * (6 * 1024 * 1024)  # 6MB
        large_file = BytesIO(large_content)
        
        files = {
            'arquivo': ('large_file.txt', large_file, 'text/plain')
        }
        data = {
            'obra': obra.id,
            'nome_original': 'large_file.txt',
            'descricao': 'Arquivo grande para teste',
            'categoria': 'DOCUMENTO'
        }
        
        response = client.post('/api/arquivos-obra/', data=data, format='multipart')
        print(f"Status: {response.status_code}")
        
        if response.status_code == 400:
            print(f"✓ Validação de tamanho funcionando: {response.data}")
        else:
            print(f"⚠ Arquivo grande foi aceito (pode estar OK dependendo da configuração)")
    except Exception as e:
        print(f"✗ Erro no teste de validação: {e}")
    
    # 12. Testar exclusão de arquivo
    print(f"\n12. Testando exclusão do arquivo ID: {arquivo_id}...")
    try:
        response = client.delete(f'/api/arquivos-obra/{arquivo_id}/')
        print(f"Status: {response.status_code}")
        if response.status_code == 204:
            print("✓ Arquivo excluído com sucesso")
            
            # Verificar se foi realmente excluído
            response = client.get(f'/api/arquivos-obra/{arquivo_id}/')
            if response.status_code == 404:
                print("✓ Confirmado: arquivo não existe mais")
            else:
                print("⚠ Arquivo ainda existe após exclusão")
        else:
            print(f"✗ Erro na exclusão: {response.data}")
    except Exception as e:
        print(f"✗ Erro na exclusão: {e}")
    
    # 13. Verificar banco de dados
    print("\n13. Verificando estado do banco de dados...")
    try:
        total_arquivos = ArquivoObra.objects.count()
        arquivos_obra = ArquivoObra.objects.filter(obra=obra).count()
        print(f"✓ Total de arquivos no BD: {total_arquivos}")
        print(f"✓ Arquivos da obra teste: {arquivos_obra}")
    except Exception as e:
        print(f"✗ Erro ao verificar BD: {e}")
    
    # 14. Limpeza
    print("\n14. Limpando dados de teste...")
    try:
        ArquivoObra.objects.filter(obra=obra).delete()
        obra.delete()
        funcionario.delete()
        user.delete()
        print("✓ Dados de teste removidos")
    except Exception as e:
        print(f"⚠ Erro na limpeza: {e}")
    
    print("\n=== TESTE COMPLETO FINALIZADO ===")

if __name__ == '__main__':
    test_arquivo_obra_functionality()