#!/usr/bin/env python
"""
Script de teste para funcionalidades de arquivos de obra:
- Upload de arquivos
- Visualização de arquivos
- Exclusão de arquivos
- Diferentes tipos de arquivo
- Cenários de autenticação
"""

import os
import sys
import django
import requests
import json
from io import BytesIO
from PIL import Image
import tempfile

# Configurar Django
backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
sys.path.append(backend_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from django.contrib.auth import get_user_model
from core.models import Obra, ArquivoObra, Usuario
from django.test import Client
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token

User = get_user_model()

class ObraFileTestSuite:
    def __init__(self):
        self.client = APIClient()
        self.base_url = 'http://localhost:8000/api'
        self.test_user = None
        self.test_obra = None
        self.uploaded_files = []
        
    def setup_test_data(self):
        """Criar dados de teste necessários"""
        print("\n=== Configurando dados de teste ===")
        
        # Criar usuário de teste
        try:
            self.test_user = Usuario.objects.get(username='test_user')
            print(f"✓ Usuário de teste encontrado: {self.test_user.username}")
        except Usuario.DoesNotExist:
            self.test_user = Usuario.objects.create_user(
                username='test_user',
                email='test@example.com',
                password='testpass123',
                nivel='admin'
            )
            print(f"✓ Usuário de teste criado: {self.test_user.username}")
        
        # Criar obra de teste
        try:
            self.test_obra = Obra.objects.get(nome_obra='Obra Teste Arquivos')
            print(f"✓ Obra de teste encontrada: {self.test_obra.nome_obra}")
        except Obra.DoesNotExist:
            self.test_obra = Obra.objects.create(
                nome_obra='Obra Teste Arquivos',
                endereco_completo='Rua Teste, 123',
                cidade='Cidade Teste',
                status='Em Andamento'
            )
            print(f"✓ Obra de teste criada: {self.test_obra.nome_obra}")
        
        # Autenticar cliente
        self.client.force_authenticate(user=self.test_user)
        print("✓ Cliente autenticado")
    
    def create_test_files(self):
        """Criar arquivos de teste temporários"""
        print("\n=== Criando arquivos de teste ===")
        
        test_files = {}
        
        # Criar imagem de teste
        img = Image.new('RGB', (100, 100), color='red')
        img_buffer = BytesIO()
        img.save(img_buffer, format='JPEG')
        img_buffer.seek(0)
        test_files['image'] = SimpleUploadedFile(
            'test_image.jpg',
            img_buffer.getvalue(),
            content_type='image/jpeg'
        )
        print("✓ Imagem de teste criada")
        
        # Criar documento de teste
        test_files['document'] = SimpleUploadedFile(
            'test_document.txt',
            b'Este e um documento de teste para upload.',
            content_type='text/plain'
        )
        print("✓ Documento de teste criado")
        
        # Criar arquivo PDF simulado
        test_files['pdf'] = SimpleUploadedFile(
            'test_document.pdf',
            b'%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n',
            content_type='application/pdf'
        )
        print("✓ PDF de teste criado")
        
        return test_files
    
    def test_file_upload(self):
        """Testar upload de arquivos"""
        print("\n=== Testando Upload de Arquivos ===")
        
        test_files = self.create_test_files()
        
        for file_type, file_obj in test_files.items():
            print(f"\nTestando upload de {file_type}...")
            
            # Resetar posição do arquivo
            file_obj.seek(0)
            
            data = {
                'obra': self.test_obra.id,
                'categoria': 'FOTO' if file_type == 'image' else 'DOCUMENTO',
                'descricao': f'Arquivo de teste - {file_type}'
            }
            
            response = self.client.post(
                '/api/arquivosobras/',
                data={
                    **data,
                    'arquivo': file_obj
                },
                format='multipart'
            )
            
            if response.status_code == 201:
                print(f"✓ Upload de {file_type} bem-sucedido")
                self.uploaded_files.append(response.data['id'])
                print(f"  - ID: {response.data['id']}")
                print(f"  - URL: {response.data.get('arquivo_url', 'N/A')}")
            else:
                print(f"✗ Falha no upload de {file_type}")
                print(f"  - Status: {response.status_code}")
                print(f"  - Erro: {response.data}")
    
    def test_file_listing(self):
        """Testar listagem de arquivos"""
        print("\n=== Testando Listagem de Arquivos ===")
        
        # Listar todos os arquivos da obra
        response = self.client.get(f'/api/arquivosobras/?obra={self.test_obra.id}')
        
        if response.status_code == 200:
            files = response.data
            print(f"✓ Listagem bem-sucedida - {len(files)} arquivo(s) encontrado(s)")
            
            for file_data in files:
                print(f"  - {file_data['arquivo_nome']} ({file_data['categoria']})")
                print(f"    ID: {file_data['id']}, Tamanho: {file_data.get('arquivo_tamanho', 'N/A')} bytes")
        else:
            print(f"✗ Falha na listagem")
            print(f"  - Status: {response.status_code}")
            print(f"  - Erro: {response.data}")
    
    def test_file_viewing(self):
        """Testar visualização de arquivos individuais"""
        print("\n=== Testando Visualização de Arquivos ===")
        
        if not self.uploaded_files:
            print("✗ Nenhum arquivo para testar visualização")
            return
        
        for file_id in self.uploaded_files:
            response = self.client.get(f'/api/arquivosobras/{file_id}/')
            
            if response.status_code == 200:
                file_data = response.data
                print(f"✓ Visualização do arquivo {file_id} bem-sucedida")
                print(f"  - Nome: {file_data['arquivo_nome']}")
                print(f"  - Categoria: {file_data['categoria']}")
                print(f"  - URL: {file_data.get('arquivo_url', 'N/A')}")
                
                # Testar acesso direto ao arquivo
                if file_data.get('arquivo_url'):
                    try:
                        file_response = requests.get(file_data['arquivo_url'], timeout=5)
                        if file_response.status_code == 200:
                            print(f"  ✓ Arquivo acessível via URL")
                        else:
                            print(f"  ✗ Arquivo não acessível via URL (Status: {file_response.status_code})")
                    except Exception as e:
                        print(f"  ✗ Erro ao acessar arquivo via URL: {e}")
            else:
                print(f"✗ Falha na visualização do arquivo {file_id}")
                print(f"  - Status: {response.status_code}")
                print(f"  - Erro: {response.data}")
    
    def test_file_deletion(self):
        """Testar exclusão de arquivos"""
        print("\n=== Testando Exclusão de Arquivos ===")
        
        if not self.uploaded_files:
            print("✗ Nenhum arquivo para testar exclusão")
            return
        
        # Testar exclusão individual
        for file_id in self.uploaded_files[:2]:  # Deletar apenas os primeiros 2
            response = self.client.delete(f'/api/arquivosobras/{file_id}/')
            
            if response.status_code == 204:
                print(f"✓ Exclusão do arquivo {file_id} bem-sucedida")
            else:
                print(f"✗ Falha na exclusão do arquivo {file_id}")
                print(f"  - Status: {response.status_code}")
                print(f"  - Erro: {response.data}")
        
        # Testar exclusão em lote (se houver arquivos restantes)
        remaining_files = self.uploaded_files[2:]
        if remaining_files:
            print(f"\nTestando exclusão em lote de {len(remaining_files)} arquivo(s)...")
            
            response = self.client.post(
                '/api/arquivosobras/bulk_delete/',
                data={'arquivo_ids': remaining_files},
                format='json'
            )
            
            if response.status_code == 200:
                print("✓ Exclusão em lote bem-sucedida")
                print(f"  - Resposta: {response.data}")
            else:
                print("✗ Falha na exclusão em lote")
                print(f"  - Status: {response.status_code}")
                print(f"  - Erro: {response.data}")
    
    def test_authentication_scenarios(self):
        """Testar cenários de autenticação"""
        print("\n=== Testando Cenários de Autenticação ===")
        
        # Testar sem autenticação
        unauth_client = APIClient()
        response = unauth_client.get(f'/api/arquivosobras/?obra={self.test_obra.id}')
        
        if response.status_code == 401:
            print("✓ Acesso negado sem autenticação (como esperado)")
        else:
            print(f"✗ Acesso permitido sem autenticação (Status: {response.status_code})")
        
        # Testar com usuário de nível diferente
        try:
            low_level_user = Usuario.objects.create_user(
                username='low_level_user',
                email='low@example.com',
                password='testpass123',
                nivel='funcionario'
            )
            
            low_client = APIClient()
            low_client.force_authenticate(user=low_level_user)
            
            response = low_client.get(f'/api/arquivosobras/?obra={self.test_obra.id}')
            
            if response.status_code == 200:
                print("✓ Usuário de nível baixo pode visualizar arquivos")
            else:
                print(f"✗ Usuário de nível baixo não pode visualizar arquivos (Status: {response.status_code})")
            
            # Limpar usuário de teste
            low_level_user.delete()
            
        except Exception as e:
            print(f"✗ Erro ao testar usuário de nível baixo: {e}")
    
    def test_file_validation(self):
        """Testar validações de arquivo"""
        print("\n=== Testando Validações de Arquivo ===")
        
        # Testar arquivo muito grande (simulado)
        print("\nTestando arquivo muito grande...")
        large_content = b'x' * (51 * 1024 * 1024)  # 51MB
        large_file = SimpleUploadedFile(
            'large_file.txt',
            large_content,
            content_type='text/plain'
        )
        
        response = self.client.post(
            '/api/arquivosobras/',
            data={
                'obra': self.test_obra.id,
                'categoria': 'DOCUMENTO',
                'arquivo': large_file
            },
            format='multipart'
        )
        
        if response.status_code == 400 and 'muito grande' in str(response.data).lower():
            print("✓ Validação de tamanho funcionando")
        else:
            print(f"✗ Validação de tamanho não funcionou (Status: {response.status_code})")
        
        # Testar tipo de arquivo não permitido
        print("\nTestando tipo de arquivo não permitido...")
        invalid_file = SimpleUploadedFile(
            'test.exe',
            b'MZ\x90\x00',  # Cabeçalho de arquivo executável
            content_type='application/octet-stream'
        )
        
        response = self.client.post(
            '/api/arquivosobras/',
            data={
                'obra': self.test_obra.id,
                'categoria': 'DOCUMENTO',
                'arquivo': invalid_file
            },
            format='multipart'
        )
        
        if response.status_code == 400 and 'não permitido' in str(response.data).lower():
            print("✓ Validação de tipo de arquivo funcionando")
        else:
            print(f"✗ Validação de tipo de arquivo não funcionou (Status: {response.status_code})")
    
    def cleanup(self):
        """Limpar dados de teste"""
        print("\n=== Limpando dados de teste ===")
        
        # Remover arquivos restantes
        ArquivoObra.objects.filter(obra=self.test_obra).delete()
        print("✓ Arquivos de teste removidos")
        
        # Remover obra de teste
        self.test_obra.delete()
        print("✓ Obra de teste removida")
        
        # Remover usuário de teste
        self.test_user.delete()
        print("✓ Usuário de teste removido")
    
    def run_all_tests(self):
        """Executar todos os testes"""
        print("\n" + "="*50)
        print("INICIANDO TESTES DE ARQUIVOS DE OBRA")
        print("="*50)
        
        try:
            self.setup_test_data()
            self.test_file_upload()
            self.test_file_listing()
            self.test_file_viewing()
            self.test_authentication_scenarios()
            self.test_file_validation()
            self.test_file_deletion()
            
            print("\n" + "="*50)
            print("TODOS OS TESTES CONCLUÍDOS")
            print("="*50)
            
        except Exception as e:
            print(f"\n✗ Erro durante os testes: {e}")
            import traceback
            traceback.print_exc()
        
        finally:
            try:
                self.cleanup()
            except Exception as e:
                print(f"Erro durante limpeza: {e}")

if __name__ == '__main__':
    test_suite = ObraFileTestSuite()
    test_suite.run_all_tests()