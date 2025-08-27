from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from unittest.mock import Mock, patch
import json
from datetime import datetime, date
from decimal import Decimal

User = get_user_model()


class SGOBaseTestCase(TestCase):
    """
    Classe base para testes do SGO com funcionalidades comuns.
    """
    
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.maxDiff = None  # Para comparações completas em assertDictEqual
    
    def setUp(self):
        """
        Configuração inicial para cada teste.
        """
        super().setUp()
        self.create_test_users()
    
    def create_test_users(self):
        """
        Cria usuários de teste padrão.
        """
        self.admin_user = User.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='testpass123',
            is_staff=True,
            is_superuser=True
        )
        
        self.regular_user = User.objects.create_user(
            username='user_test',
            email='user@test.com',
            password='testpass123'
        )
    
    def assertDateEqual(self, date1, date2, msg=None):
        """
        Compara duas datas ignorando o horário.
        """
        if isinstance(date1, datetime):
            date1 = date1.date()
        if isinstance(date2, datetime):
            date2 = date2.date()
        
        self.assertEqual(date1, date2, msg)
    
    def assertDecimalEqual(self, decimal1, decimal2, places=2, msg=None):
        """
        Compara dois valores decimais com precisão específica.
        """
        if not isinstance(decimal1, Decimal):
            decimal1 = Decimal(str(decimal1))
        if not isinstance(decimal2, Decimal):
            decimal2 = Decimal(str(decimal2))
        
        self.assertAlmostEqual(float(decimal1), float(decimal2), places=places, msg=msg)
    
    def create_mock_file(self, filename='test.pdf', content=b'test content', content_type='application/pdf'):
        """
        Cria um arquivo mock para testes de upload.
        """
        from django.core.files.uploadedfile import SimpleUploadedFile
        return SimpleUploadedFile(filename, content, content_type=content_type)
    
    def assert_model_fields(self, instance, expected_data, exclude_fields=None):
        """
        Verifica se os campos do modelo correspondem aos dados esperados.
        """
        if exclude_fields is None:
            exclude_fields = ['id', 'created_at', 'updated_at']
        
        for field, expected_value in expected_data.items():
            if field not in exclude_fields:
                actual_value = getattr(instance, field)
                
                # Tratamento especial para datas
                if isinstance(expected_value, (date, datetime)) and isinstance(actual_value, (date, datetime)):
                    self.assertDateEqual(actual_value, expected_value)
                # Tratamento especial para decimais
                elif isinstance(expected_value, (Decimal, float)) and isinstance(actual_value, (Decimal, float)):
                    self.assertDecimalEqual(actual_value, expected_value)
                else:
                    self.assertEqual(actual_value, expected_value, 
                                   f"Campo '{field}': esperado {expected_value}, obtido {actual_value}")


class SGOAPITestCase(APITestCase, SGOBaseTestCase):
    """
    Classe base para testes de API do SGO.
    """
    
    def setUp(self):
        super().setUp()
        self.client = APIClient()
    
    def authenticate_user(self, user=None):
        """
        Autentica um usuário para os testes de API.
        """
        if user is None:
            user = self.regular_user
        
        self.client.force_authenticate(user=user)
        return user
    
    def authenticate_admin(self):
        """
        Autentica o usuário admin para os testes de API.
        """
        return self.authenticate_user(self.admin_user)
    
    def post_json(self, url, data=None, **kwargs):
        """
        Faz uma requisição POST com dados JSON.
        """
        if data is not None:
            kwargs['data'] = json.dumps(data)
            kwargs['content_type'] = 'application/json'
        
        return self.client.post(url, **kwargs)
    
    def put_json(self, url, data=None, **kwargs):
        """
        Faz uma requisição PUT com dados JSON.
        """
        if data is not None:
            kwargs['data'] = json.dumps(data)
            kwargs['content_type'] = 'application/json'
        
        return self.client.put(url, **kwargs)
    
    def patch_json(self, url, data=None, **kwargs):
        """
        Faz uma requisição PATCH com dados JSON.
        """
        if data is not None:
            kwargs['data'] = json.dumps(data)
            kwargs['content_type'] = 'application/json'
        
        return self.client.patch(url, **kwargs)
    
    def assert_response_success(self, response, expected_status=status.HTTP_200_OK):
        """
        Verifica se a resposta foi bem-sucedida.
        """
        self.assertEqual(response.status_code, expected_status,
                        f"Esperado status {expected_status}, obtido {response.status_code}. "
                        f"Resposta: {response.content.decode()}")
        
        if hasattr(response, 'data') and isinstance(response.data, dict):
            self.assertTrue(response.data.get('success', True),
                          f"Resposta não indica sucesso: {response.data}")
    
    def assert_response_error(self, response, expected_status=status.HTTP_400_BAD_REQUEST):
        """
        Verifica se a resposta contém erro.
        """
        self.assertEqual(response.status_code, expected_status,
                        f"Esperado status {expected_status}, obtido {response.status_code}")
        
        if hasattr(response, 'data') and isinstance(response.data, dict):
            self.assertFalse(response.data.get('success', False),
                           f"Resposta indica sucesso quando deveria ser erro: {response.data}")
    
    def assert_pagination_response(self, response, expected_count=None):
        """
        Verifica se a resposta contém estrutura de paginação válida.
        """
        self.assert_response_success(response)
        
        data = response.data
        self.assertIn('pagination', data, "Resposta deve conter informações de paginação")
        
        pagination = data['pagination']
        required_fields = ['current_page', 'total_pages', 'total_items', 'page_size']
        
        for field in required_fields:
            self.assertIn(field, pagination, f"Campo '{field}' obrigatório na paginação")
        
        if expected_count is not None:
            self.assertEqual(pagination['total_items'], expected_count,
                           f"Esperado {expected_count} itens, obtido {pagination['total_items']}")
    
    def get_response_data(self, response):
        """
        Extrai os dados da resposta de forma segura.
        """
        if hasattr(response, 'data'):
            return response.data
        
        try:
            return json.loads(response.content.decode())
        except (json.JSONDecodeError, UnicodeDecodeError):
            return {}


class SGOTransactionTestCase(TransactionTestCase, SGOBaseTestCase):
    """
    Classe base para testes que requerem transações de banco de dados.
    """
    pass


class SGOMockTestCase(SGOBaseTestCase):
    """
    Classe base para testes com mocks.
    """
    
    def setUp(self):
        super().setUp()
        self.mocks = []
    
    def tearDown(self):
        """
        Limpa todos os mocks criados.
        """
        for mock in self.mocks:
            if hasattr(mock, 'stop'):
                mock.stop()
        super().tearDown()
    
    def create_mock(self, target, **kwargs):
        """
        Cria um mock e adiciona à lista para limpeza automática.
        """
        mock = patch(target, **kwargs)
        self.mocks.append(mock)
        return mock.start()
    
    def mock_external_service(self, service_path, return_value=None, side_effect=None):
        """
        Cria um mock para serviços externos.
        """
        return self.create_mock(
            service_path,
            return_value=return_value,
            side_effect=side_effect
        )


class SGOModelTestMixin:
    """
    Mixin com métodos úteis para testes de modelos.
    """
    
    def assert_model_validation_error(self, model_class, data, expected_errors=None):
        """
        Verifica se a validação do modelo falha conforme esperado.
        """
        from django.core.exceptions import ValidationError
        
        instance = model_class(**data)
        
        with self.assertRaises(ValidationError) as context:
            instance.full_clean()
        
        if expected_errors:
            errors = context.exception.error_dict
            for field, expected_messages in expected_errors.items():
                self.assertIn(field, errors, f"Campo '{field}' deveria ter erro de validação")
                
                actual_messages = [str(error) for error in errors[field]]
                for expected_msg in expected_messages:
                    self.assertTrue(
                        any(expected_msg in actual_msg for actual_msg in actual_messages),
                        f"Mensagem '{expected_msg}' não encontrada em {actual_messages}"
                    )
    
    def assert_model_str_representation(self, instance, expected_str):
        """
        Verifica a representação string do modelo.
        """
        self.assertEqual(str(instance), expected_str,
                        f"Representação string incorreta: esperado '{expected_str}', obtido '{str(instance)}'")


class SGOViewTestMixin:
    """
    Mixin com métodos úteis para testes de views.
    """
    
    def assert_template_used(self, response, template_name):
        """
        Verifica se o template correto foi usado.
        """
        self.assertContains(response, '', status_code=200)  # Verifica se a resposta é 200
        self.assertTemplateUsed(response, template_name)
    
    def assert_context_contains(self, response, key, expected_value=None):
        """
        Verifica se o contexto contém uma chave específica.
        """
        self.assertIn(key, response.context, f"Chave '{key}' não encontrada no contexto")
        
        if expected_value is not None:
            actual_value = response.context[key]
            self.assertEqual(actual_value, expected_value,
                           f"Valor do contexto '{key}': esperado {expected_value}, obtido {actual_value}")


class SGOFormTestMixin:
    """
    Mixin com métodos úteis para testes de formulários.
    """
    
    def assert_form_valid(self, form_class, data):
        """
        Verifica se o formulário é válido com os dados fornecidos.
        """
        form = form_class(data=data)
        self.assertTrue(form.is_valid(), f"Formulário deveria ser válido. Erros: {form.errors}")
        return form
    
    def assert_form_invalid(self, form_class, data, expected_errors=None):
        """
        Verifica se o formulário é inválido com os dados fornecidos.
        """
        form = form_class(data=data)
        self.assertFalse(form.is_valid(), "Formulário deveria ser inválido")
        
        if expected_errors:
            for field, expected_messages in expected_errors.items():
                self.assertIn(field, form.errors, f"Campo '{field}' deveria ter erro")
                
                actual_messages = form.errors[field]
                for expected_msg in expected_messages:
                    self.assertTrue(
                        any(expected_msg in str(actual_msg) for actual_msg in actual_messages),
                        f"Mensagem '{expected_msg}' não encontrada em {actual_messages}"
                    )
        
        return form


# Classe combinada para testes completos
class SGOFullTestCase(SGOAPITestCase, SGOModelTestMixin, SGOViewTestMixin, SGOFormTestMixin):
    """
    Classe que combina todas as funcionalidades de teste do SGO.
    """
    pass