import os
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from core.models import Obra, ArquivoObra, Usuario

class TestArquivoObraAPI(TestCase):
    def setUp(self):
        """Set up the test environment."""
        print("=== INICIANDO TESTES DE ARQUIVO DA OBRA (Management) ===")
        self.client = APIClient()
        self.user = Usuario.objects.create_user(
            login='testuser_management',
            password='testpass123',
            nome_completo='Test User Management',
            nivel_acesso='admin',
            is_staff=True
        )
        self.client.force_authenticate(user=self.user)

        self.obra = Obra.objects.create(
            nome_obra='Obra Teste Management',
            endereco_completo='Rua Teste, 123',
            cidade='Cidade Teste',
            status='Em Andamento',
            data_inicio='2024-01-01'
        )
        self.arquivo_id = None
        print("✓ Setup concluído")

    def test_1_upload_de_arquivo(self):
        """Test file upload functionality."""
        print("\n--- TESTE 1: UPLOAD DE ARQUIVO ---")
        test_content = b"Conteudo de teste para arquivo da obra"
        test_file = SimpleUploadedFile(
            "teste.txt",
            test_content,
            content_type="text/plain"
        )

        upload_data = {
            'obra': self.obra.id,
            'arquivo': test_file,
            'categoria': 'OUTROS',
            'descricao': 'Arquivo de teste'
        }

        response = self.client.post('/api/arquivos-obra/', upload_data, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        TestArquivoObraAPI.arquivo_id = response.data['id'] # Store for subsequent tests
        print(f"✓ Upload realizado com sucesso. ID: {self.arquivo_id}")

    def test_2_listar_arquivos(self):
        """Test listing files for a project."""
        print("\n--- TESTE 2: LISTAR ARQUIVOS ---")
        # First, ensure a file exists by uploading it
        self.test_1_upload_de_arquivo()

        response = self.client.get(f'/api/arquivos-obra/?obra={self.obra.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # The response may be paginated, so we check the results list
        self.assertGreater(len(response.data), 0)
        print(f"✓ Listagem realizada com sucesso. {len(response.data)} arquivo(s) encontrado(s)")

    def test_3_visualizar_arquivo_especifico(self):
        """Test retrieving a specific file."""
        print("\n--- TESTE 3: VISUALIZAR ARQUIVO ESPECÍFICO ---")
        self.test_1_upload_de_arquivo() # Ensure file exists
        self.assertIsNotNone(TestArquivoObraAPI.arquivo_id)
        
        response = self.client.get(f'/api/arquivos-obra/{TestArquivoObraAPI.arquivo_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], TestArquivoObraAPI.arquivo_id)
        print("✓ Visualização realizada com sucesso")

    def test_4_validacao_de_tipos_de_arquivo(self):
        """Test validation for disallowed file types."""
        print("\n--- TESTE 4: VALIDAÇÃO DE TIPOS DE ARQUIVO ---")
        invalid_file = SimpleUploadedFile(
            "teste.exe",
            b"fake executable content",
            content_type="application/x-executable"
        )
        
        upload_data = {
            'obra': self.obra.id,
            'arquivo': invalid_file,
            'categoria': 'OUTROS'
        }
        
        response = self.client.post('/api/arquivos-obra/', upload_data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        print("✓ Validação de tipo de arquivo funcionando corretamente")

    def test_5_exclusao_de_arquivo(self):
        """Test deleting a file."""
        print("\n--- TESTE 5: EXCLUSÃO DE ARQUIVO ---")
        self.test_1_upload_de_arquivo() # Ensure file exists
        self.assertIsNotNone(TestArquivoObraAPI.arquivo_id)
        
        response = self.client.delete(f'/api/arquivos-obra/{TestArquivoObraAPI.arquivo_id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify the file is gone
        response_check = self.client.get(f'/api/arquivos-obra/{TestArquivoObraAPI.arquivo_id}/')
        self.assertEqual(response_check.status_code, status.HTTP_404_NOT_FOUND)
        print("✓ Exclusão e verificação concluídas com sucesso")

    def test_6_acesso_sem_autenticacao(self):
        """Test that unauthenticated access is denied."""
        print("\n--- TESTE 6: ACESSO SEM AUTENTICAÇÃO ---")
        client_unauth = APIClient()
        response = client_unauth.get('/api/arquivos-obra/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        print("✓ Proteção de autenticação funcionando corretamente")

    def tearDown(self):
        """Clean up after tests."""
        print("=== TESTES DE ARQUIVO DA OBRA (Management) CONCLUÍDOS ===")