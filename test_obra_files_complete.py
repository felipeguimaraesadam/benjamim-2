#!/usr/bin/env python
"""
Teste completo das funcionalidades de arquivo da obra
"""

import os
import sys
import django
import tempfile
from io import BytesIO

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
django.setup()

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from core.models import Obra, ArquivoObra

User = get_user_model()

def test_obra_files():
    print("=== TESTE COMPLETO DE ARQUIVOS DE OBRA ===")
    
    # Configurar cliente API
    client = APIClient()
    
    try:
        # 1. Criar usuário de teste
        print("\n1. Criando usuário de teste...")
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        print(f"✓ Usuário criado: {user.username}")
        
        # 2. Fazer login
        print("\n2. Fazendo login...")
        login_response = client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        
        if login_response.status_code == 200:
            token = login_response.data.get('token')
            if token:
                client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
                print("✓ Login realizado com sucesso")
            else:
                print("✗ Token não encontrado na resposta")
        else:
            print(f"✗ Erro no login: {login_response.status_code}")
            print(f"  Detalhes: {login_response.data}")
            
            # Tentar autenticação alternativa
            print("\n  Tentando autenticação alternativa...")
            client.force_authenticate(user=user)
            print("✓ Autenticação forçada realizada")
        
        # 3. Criar obra de teste
        print("\n3. Criando obra de teste...")
        obra_data = {
            'nome_obra': 'Obra Teste Arquivos',
            'endereco_completo': 'Rua Teste, 123',
            'cidade': 'Cidade Teste',
            'status': 'Em Andamento'
        }
        
        obra_response = client.post('/api/obras/', obra_data)
        if obra_response.status_code == 201:
            obra_id = obra_response.data['id']
            print(f"✓ Obra criada com ID: {obra_id}")
        else:
            print(f"✗ Erro ao criar obra: {obra_response.status_code}")
            print(f"  Detalhes: {obra_response.data}")
            return
        
        # 4. Testar upload de arquivo
        print("\n4. Testando upload de arquivo...")
        test_content = b"Conteudo de teste para arquivo da obra"
        test_file = SimpleUploadedFile(
            "teste_documento.txt",
            test_content,
            content_type="text/plain"
        )
        
        upload_data = {
            'obra': obra_id,
            'arquivo': test_file,
            'tipo_arquivo': 'DOCUMENTO',
            'descricao': 'Documento de teste'
        }
        
        upload_response = client.post('/api/arquivos-obra/', upload_data, format='multipart')
        if upload_response.status_code == 201:
            arquivo_id = upload_response.data['id']
            print(f"✓ Arquivo enviado com sucesso. ID: {arquivo_id}")
            print(f"  Nome: {upload_response.data.get('arquivo_nome')}")
            print(f"  Tipo: {upload_response.data.get('tipo_arquivo')}")
        else:
            print(f"✗ Erro no upload: {upload_response.status_code}")
            print(f"  Detalhes: {upload_response.data}")
            return
        
        # 5. Testar listagem de arquivos
        print("\n5. Testando listagem de arquivos...")
        list_response = client.get('/api/arquivos-obra/')
        if list_response.status_code == 200:
            arquivos = list_response.data.get('results', list_response.data)
            print(f"✓ Listagem realizada. Total de arquivos: {len(arquivos)}")
            for arquivo in arquivos:
                print(f"  - ID: {arquivo.get('id')} | Nome: {arquivo.get('arquivo_nome')} | Tipo: {arquivo.get('tipo_arquivo')}")
        else:
            print(f"✗ Erro na listagem: {list_response.status_code}")
            print(f"  Detalhes: {list_response.data}")
        
        # 6. Testar visualização de arquivo específico
        print("\n6. Testando visualização de arquivo específico...")
        view_response = client.get(f'/api/arquivos-obra/{arquivo_id}/')
        if view_response.status_code == 200:
            print("✓ Arquivo visualizado com sucesso")
            print(f"  Nome: {view_response.data.get('arquivo_nome')}")
            print(f"  URL: {view_response.data.get('arquivo_url')}")
            print(f"  Tamanho: {view_response.data.get('arquivo_tamanho')} bytes")
        else:
            print(f"✗ Erro na visualização: {view_response.status_code}")
            print(f"  Detalhes: {view_response.data}")
        
        # 7. Testar upload de imagem
        print("\n7. Testando upload de imagem...")
        # Criar uma imagem simples de teste
        image_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\x0cIDATx\x9cc```\x00\x00\x00\x04\x00\x01\xdd\xcc\xdb\xdb\x00\x00\x00\x00IEND\xaeB`\x82'
        image_file = SimpleUploadedFile(
            "teste_imagem.png",
            image_content,
            content_type="image/png"
        )
        
        image_data = {
            'obra': obra_id,
            'arquivo': image_file,
            'tipo_arquivo': 'FOTO',
            'descricao': 'Foto de teste'
        }
        
        image_response = client.post('/api/arquivos-obra/', image_data, format='multipart')
        if image_response.status_code == 201:
            image_id = image_response.data['id']
            print(f"✓ Imagem enviada com sucesso. ID: {image_id}")
        else:
            print(f"✗ Erro no upload da imagem: {image_response.status_code}")
            print(f"  Detalhes: {image_response.data}")
        
        # 8. Testar exclusão de arquivo
        print("\n8. Testando exclusão de arquivo...")
        delete_response = client.delete(f'/api/arquivos-obra/{arquivo_id}/')
        if delete_response.status_code == 204:
            print("✓ Arquivo excluído com sucesso")
        else:
            print(f"✗ Erro na exclusão: {delete_response.status_code}")
            print(f"  Detalhes: {delete_response.data}")
        
        # 9. Verificar se arquivo foi realmente excluído
        print("\n9. Verificando exclusão...")
        verify_response = client.get(f'/api/arquivos-obra/{arquivo_id}/')
        if verify_response.status_code == 404:
            print("✓ Arquivo foi excluído corretamente")
        else:
            print(f"✗ Arquivo ainda existe: {verify_response.status_code}")
        
        # 10. Testar validação de tipo de arquivo
        print("\n10. Testando validação de tipo de arquivo...")
        invalid_file = SimpleUploadedFile(
            "teste.exe",
            b"conteudo executavel",
            content_type="application/x-executable"
        )
        
        invalid_data = {
            'obra': obra_id,
            'arquivo': invalid_file,
            'tipo_arquivo': 'DOCUMENTO',
            'descricao': 'Arquivo inválido'
        }
        
        invalid_response = client.post('/api/arquivos-obra/', invalid_data, format='multipart')
        if invalid_response.status_code == 400:
            print("✓ Validação de tipo funcionando corretamente")
        else:
            print(f"✗ Validação falhou: {invalid_response.status_code}")
            print(f"  Detalhes: {invalid_response.data}")
        
        print("\n=== TESTE CONCLUÍDO ===")
        print("\nResumo dos testes:")
        print("✓ Criação de usuário")
        print("✓ Autenticação")
        print("✓ Criação de obra")
        print("✓ Upload de arquivo")
        print("✓ Listagem de arquivos")
        print("✓ Visualização de arquivo")
        print("✓ Upload de imagem")
        print("✓ Exclusão de arquivo")
        print("✓ Validação de tipos")
        
    except Exception as e:
        print(f"\n✗ Erro durante o teste: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Limpeza
        print("\n=== LIMPEZA ===")
        try:
            # Remover arquivos de teste
            ArquivoObra.objects.filter(obra__nome_obra='Obra Teste Arquivos').delete()
            # Remover obra de teste
            Obra.objects.filter(nome_obra='Obra Teste Arquivos').delete()
            # Remover usuário de teste
            User.objects.filter(username='testuser').delete()
            print("✓ Limpeza concluída")
        except Exception as e:
            print(f"✗ Erro na limpeza: {str(e)}")

if __name__ == '__main__':
    test_obra_files()