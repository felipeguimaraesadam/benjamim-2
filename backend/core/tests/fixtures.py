from django.contrib.auth import get_user_model
from decimal import Decimal
from datetime import datetime, date, timedelta
from django.utils import timezone

User = get_user_model()


class SGOTestFixtures:
    """
    Classe com fixtures e dados de teste para o SGO.
    """
    
    @staticmethod
    def create_test_users():
        """
        Cria usuários de teste padrão.
        """
        users = {}
        
        # Usuário administrador
        users['admin'] = User.objects.create_user(
            username='admin_sgo',
            email='admin@sgo.com',
            password='admin123',
            first_name='Admin',
            last_name='SGO',
            is_staff=True,
            is_superuser=True
        )
        
        # Usuário gerente
        users['manager'] = User.objects.create_user(
            username='gerente_sgo',
            email='gerente@sgo.com',
            password='gerente123',
            first_name='Gerente',
            last_name='SGO',
            is_staff=True
        )
        
        # Usuário operador
        users['operator'] = User.objects.create_user(
            username='operador_sgo',
            email='operador@sgo.com',
            password='operador123',
            first_name='Operador',
            last_name='SGO'
        )
        
        # Usuário cliente
        users['client'] = User.objects.create_user(
            username='cliente_sgo',
            email='cliente@sgo.com',
            password='cliente123',
            first_name='Cliente',
            last_name='SGO'
        )
        
        return users
    
    @staticmethod
    def get_obra_data():
        """
        Retorna dados de teste para Obra.
        """
        return {
            'nome': 'Obra Teste',
            'descricao': 'Descrição da obra de teste',
            'endereco': 'Rua Teste, 123',
            'cidade': 'São Paulo',
            'estado': 'SP',
            'cep': '01234-567',
            'data_inicio': date.today(),
            'data_previsao_fim': date.today() + timedelta(days=90),
            'orcamento_previsto': Decimal('100000.00'),
            'status': 'EM_ANDAMENTO',
            'responsavel_tecnico': 'João Silva',
            'contato_responsavel': '(11) 99999-9999',
            'observacoes': 'Observações da obra de teste'
        }
    
    @staticmethod
    def get_funcionario_data():
        """
        Retorna dados de teste para Funcionário.
        """
        return {
            'nome': 'João da Silva',
            'cpf': '12345678901',
            'rg': '123456789',
            'data_nascimento': date(1990, 1, 15),
            'telefone': '(11) 99999-9999',
            'email': 'joao.silva@email.com',
            'endereco': 'Rua do Funcionário, 456',
            'cidade': 'São Paulo',
            'estado': 'SP',
            'cep': '01234-567',
            'cargo': 'Pedreiro',
            'salario': Decimal('2500.00'),
            'data_admissao': date.today() - timedelta(days=365),
            'status': 'ATIVO',
            'observacoes': 'Funcionário experiente'
        }
    
    @staticmethod
    def get_equipe_data():
        """
        Retorna dados de teste para Equipe.
        """
        return {
            'nome': 'Equipe Alpha',
            'descricao': 'Equipe especializada em construção',
            'especialidade': 'Construção Civil',
            'status': 'ATIVA',
            'observacoes': 'Equipe com alta produtividade'
        }
    
    @staticmethod
    def get_locacao_data():
        """
        Retorna dados de teste para Locação.
        """
        return {
            'data_inicio': date.today(),
            'data_fim': date.today() + timedelta(days=30),
            'valor_diario': Decimal('150.00'),
            'tipo_pagamento': 'DIARIO',
            'status': 'ATIVA',
            'observacoes': 'Locação de teste'
        }
    
    @staticmethod
    def get_invalid_obra_data():
        """
        Retorna dados inválidos para testes de validação de Obra.
        """
        return {
            'nome': '',  # Nome vazio
            'endereco': 'A' * 300,  # Endereço muito longo
            'cep': '12345',  # CEP inválido
            'data_inicio': date.today() + timedelta(days=1),  # Data futura
            'data_previsao_fim': date.today() - timedelta(days=1),  # Data no passado
            'orcamento_previsto': Decimal('-1000.00'),  # Valor negativo
            'status': 'STATUS_INVALIDO'  # Status inválido
        }
    
    @staticmethod
    def get_invalid_funcionario_data():
        """
        Retorna dados inválidos para testes de validação de Funcionário.
        """
        return {
            'nome': '',  # Nome vazio
            'cpf': '123',  # CPF inválido
            'email': 'email_invalido',  # Email inválido
            'telefone': '123',  # Telefone inválido
            'data_nascimento': date.today() + timedelta(days=1),  # Data futura
            'salario': Decimal('-100.00'),  # Salário negativo
            'data_admissao': date.today() + timedelta(days=1),  # Data futura
            'status': 'STATUS_INVALIDO'  # Status inválido
        }
    
    @staticmethod
    def get_test_file_data():
        """
        Retorna dados de arquivo para testes de upload.
        """
        return {
            'pdf_content': b'%PDF-1.4 test content',
            'image_content': b'\x89PNG\r\n\x1a\n test image',
            'text_content': b'Conteudo de texto de teste',
            'filenames': {
                'pdf': 'documento_teste.pdf',
                'image': 'imagem_teste.png',
                'text': 'arquivo_teste.txt'
            },
            'content_types': {
                'pdf': 'application/pdf',
                'image': 'image/png',
                'text': 'text/plain'
            }
        }
    
    @staticmethod
    def get_api_response_templates():
        """
        Retorna templates de resposta da API para testes.
        """
        return {
            'success': {
                'success': True,
                'data': {},
                'message': 'Operação realizada com sucesso'
            },
            'error': {
                'success': False,
                'error': {
                    'message': 'Erro na operação',
                    'code': 'VALIDATION_ERROR'
                }
            },
            'paginated': {
                'success': True,
                'data': {
                    'results': [],
                    'pagination': {
                        'current_page': 1,
                        'total_pages': 1,
                        'total_items': 0,
                        'page_size': 20,
                        'has_next': False,
                        'has_previous': False,
                        'next_page': None,
                        'previous_page': None
                    }
                }
            }
        }
    
    @staticmethod
    def get_date_ranges():
        """
        Retorna intervalos de datas para testes.
        """
        today = date.today()
        return {
            'last_week': {
                'start': today - timedelta(days=7),
                'end': today
            },
            'last_month': {
                'start': today - timedelta(days=30),
                'end': today
            },
            'last_year': {
                'start': today - timedelta(days=365),
                'end': today
            },
            'next_month': {
                'start': today,
                'end': today + timedelta(days=30)
            },
            'invalid_range': {
                'start': today + timedelta(days=1),
                'end': today - timedelta(days=1)
            }
        }
    
    @staticmethod
    def get_search_terms():
        """
        Retorna termos de busca para testes.
        """
        return {
            'valid': ['teste', 'joão', 'obra', 'construção', 'alpha'],
            'invalid': ['', '   ', None],
            'special_chars': ['@#$%', '123!@#', 'test&test'],
            'long_term': 'a' * 100,
            'sql_injection': "'; DROP TABLE usuarios; --",
            'xss_attempt': '<script>alert("xss")</script>'
        }
    
    @staticmethod
    def get_pagination_params():
        """
        Retorna parâmetros de paginação para testes.
        """
        return {
            'valid': {
                'page': 1,
                'page_size': 20
            },
            'invalid_page': {
                'page': -1,
                'page_size': 20
            },
            'invalid_page_size': {
                'page': 1,
                'page_size': -10
            },
            'large_page_size': {
                'page': 1,
                'page_size': 1000
            },
            'zero_page_size': {
                'page': 1,
                'page_size': 0
            }
        }
    
    @staticmethod
    def get_filter_params():
        """
        Retorna parâmetros de filtro para testes.
        """
        today = date.today()
        return {
            'date_filters': {
                'data_inicio__gte': today - timedelta(days=30),
                'data_fim__lte': today + timedelta(days=30)
            },
            'status_filters': {
                'status': 'ATIVO',
                'status__in': ['ATIVO', 'EM_ANDAMENTO']
            },
            'search_filters': {
                'search': 'teste',
                'nome__icontains': 'joão'
            },
            'numeric_filters': {
                'salario__gte': Decimal('1000.00'),
                'orcamento__lte': Decimal('50000.00')
            }
        }
    
    @staticmethod
    def get_bulk_operation_data():
        """
        Retorna dados para testes de operações em lote.
        """
        return {
            'valid_ids': [1, 2, 3, 4, 5],
            'invalid_ids': [-1, 0, 'abc', None],
            'mixed_ids': [1, 2, -1, 'abc', 5],
            'empty_list': [],
            'large_list': list(range(1, 101)),  # 100 IDs
            'duplicate_ids': [1, 2, 2, 3, 3, 3]
        }
    
    @staticmethod
    def get_permission_test_data():
        """
        Retorna dados para testes de permissão.
        """
        return {
            'admin_permissions': [
                'add_obra', 'change_obra', 'delete_obra', 'view_obra',
                'add_funcionario', 'change_funcionario', 'delete_funcionario', 'view_funcionario',
                'add_equipe', 'change_equipe', 'delete_equipe', 'view_equipe'
            ],
            'manager_permissions': [
                'add_obra', 'change_obra', 'view_obra',
                'add_funcionario', 'change_funcionario', 'view_funcionario',
                'view_equipe'
            ],
            'operator_permissions': [
                'view_obra', 'view_funcionario', 'view_equipe'
            ],
            'client_permissions': [
                'view_obra'
            ]
        }
    
    @classmethod
    def create_complete_test_scenario(cls):
        """
        Cria um cenário completo de teste com todos os dados relacionados.
        """
        from core.models import Obra, Funcionario, Equipe, Locacao_Obras_Equipes
        
        # Criar usuários
        users = cls.create_test_users()
        
        # Criar obra
        obra_data = cls.get_obra_data()
        obra = Obra.objects.create(**obra_data)
        
        # Criar funcionários
        funcionarios = []
        for i in range(3):
            func_data = cls.get_funcionario_data()
            func_data['nome'] = f"Funcionário {i+1}"
            func_data['cpf'] = f"1234567890{i}"
            func_data['email'] = f"funcionario{i+1}@email.com"
            funcionarios.append(Funcionario.objects.create(**func_data))
        
        # Criar equipe
        equipe_data = cls.get_equipe_data()
        equipe = Equipe.objects.create(**equipe_data)
        
        # Adicionar funcionários à equipe
        for funcionario in funcionarios:
            equipe.funcionarios.add(funcionario)
        
        # Criar locação
        locacao_data = cls.get_locacao_data()
        locacao_data['obra'] = obra
        locacao_data['equipe'] = equipe
        locacao = Locacao_Obras_Equipes.objects.create(**locacao_data)
        
        return {
            'users': users,
            'obra': obra,
            'funcionarios': funcionarios,
            'equipe': equipe,
            'locacao': locacao
        }