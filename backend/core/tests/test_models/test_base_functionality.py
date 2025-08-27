from django.test import TestCase
from django.core.exceptions import ValidationError
from decimal import Decimal
from datetime import date, timedelta

from core.tests.base import SGOFullTestCase
from core.tests.fixtures import SGOTestFixtures
from core.models import Obra, Funcionario, Equipe
from core.utils.exceptions import ValidationException, BusinessRuleException


class BaseModelFunctionalityTest(SGOFullTestCase):
    """
    Testes para funcionalidades base dos modelos do SGO.
    """
    
    def setUp(self):
        super().setUp()
        self.fixtures = SGOTestFixtures()
    
    def test_obra_creation_with_valid_data(self):
        """
        Testa criação de obra com dados válidos.
        """
        obra_data = self.fixtures.get_obra_data()
        obra = Obra.objects.create(**obra_data)
        
        # Verifica se a obra foi criada corretamente
        self.assertIsNotNone(obra.id)
        self.assert_model_fields(obra, obra_data)
        
        # Verifica campos automáticos
        self.assertIsNotNone(obra.created_at)
        self.assertIsNotNone(obra.updated_at)
        
        # Verifica representação string
        self.assert_model_str_representation(obra, obra_data['nome'])
    
    def test_obra_validation_with_invalid_data(self):
        """
        Testa validação de obra com dados inválidos.
        """
        invalid_data = self.fixtures.get_invalid_obra_data()
        
        expected_errors = {
            'nome': ['Este campo não pode estar vazio.'],
            'cep': ['CEP deve ter formato válido.'],
            'orcamento_previsto': ['Valor deve ser positivo.']
        }
        
        self.assert_model_validation_error(Obra, invalid_data, expected_errors)
    
    def test_funcionario_creation_with_valid_data(self):
        """
        Testa criação de funcionário com dados válidos.
        """
        func_data = self.fixtures.get_funcionario_data()
        funcionario = Funcionario.objects.create(**func_data)
        
        # Verifica se o funcionário foi criado corretamente
        self.assertIsNotNone(funcionario.id)
        self.assert_model_fields(funcionario, func_data)
        
        # Verifica cálculo de idade
        expected_age = self.calculate_expected_age(func_data['data_nascimento'])
        self.assertEqual(funcionario.idade, expected_age)
    
    def test_funcionario_cpf_uniqueness(self):
        """
        Testa unicidade do CPF do funcionário.
        """
        func_data = self.fixtures.get_funcionario_data()
        
        # Cria primeiro funcionário
        Funcionario.objects.create(**func_data)
        
        # Tenta criar segundo funcionário com mesmo CPF
        func_data['nome'] = 'Outro Funcionário'
        func_data['email'] = 'outro@email.com'
        
        with self.assertRaises(ValidationError):
            funcionario2 = Funcionario(**func_data)
            funcionario2.full_clean()
    
    def test_equipe_funcionarios_relationship(self):
        """
        Testa relacionamento entre equipe e funcionários.
        """
        # Criar equipe
        equipe_data = self.fixtures.get_equipe_data()
        equipe = Equipe.objects.create(**equipe_data)
        
        # Criar funcionários
        funcionarios = []
        for i in range(3):
            func_data = self.fixtures.get_funcionario_data()
            func_data['nome'] = f"Funcionário {i+1}"
            func_data['cpf'] = f"1234567890{i}"
            func_data['email'] = f"func{i+1}@email.com"
            funcionarios.append(Funcionario.objects.create(**func_data))
        
        # Adicionar funcionários à equipe
        for funcionario in funcionarios:
            equipe.funcionarios.add(funcionario)
        
        # Verificar relacionamento
        self.assertEqual(equipe.funcionarios.count(), 3)
        self.assertEqual(funcionarios[0].equipes.count(), 1)
        
        # Verificar que todos os funcionários estão na equipe
        equipe_funcionarios = list(equipe.funcionarios.all())
        for funcionario in funcionarios:
            self.assertIn(funcionario, equipe_funcionarios)
    
    def test_model_soft_delete_functionality(self):
        """
        Testa funcionalidade de soft delete se implementada.
        """
        obra_data = self.fixtures.get_obra_data()
        obra = Obra.objects.create(**obra_data)
        obra_id = obra.id
        
        # Verifica se obra existe
        self.assertTrue(Obra.objects.filter(id=obra_id).exists())
        
        # Se o modelo tem soft delete, testa
        if hasattr(obra, 'is_deleted'):
            obra.delete()  # Soft delete
            
            # Verifica se ainda existe no banco mas marcada como deletada
            obra_deleted = Obra.objects.get(id=obra_id)
            self.assertTrue(obra_deleted.is_deleted)
            
            # Verifica se não aparece em queries normais
            self.assertFalse(Obra.objects.filter(id=obra_id, is_deleted=False).exists())
    
    def test_model_audit_fields(self):
        """
        Testa campos de auditoria dos modelos.
        """
        obra_data = self.fixtures.get_obra_data()
        obra = Obra.objects.create(**obra_data)
        
        # Verifica campos de criação
        self.assertIsNotNone(obra.created_at)
        self.assertIsNotNone(obra.updated_at)
        
        # Guarda timestamps originais
        original_created = obra.created_at
        original_updated = obra.updated_at
        
        # Atualiza obra
        obra.nome = 'Nome Atualizado'
        obra.save()
        
        # Recarrega do banco
        obra.refresh_from_db()
        
        # Verifica que created_at não mudou
        self.assertEqual(obra.created_at, original_created)
        
        # Verifica que updated_at foi atualizado
        self.assertGreater(obra.updated_at, original_updated)
    
    def test_model_string_representations(self):
        """
        Testa representações string dos modelos.
        """
        # Teste Obra
        obra_data = self.fixtures.get_obra_data()
        obra = Obra.objects.create(**obra_data)
        self.assertEqual(str(obra), obra_data['nome'])
        
        # Teste Funcionário
        func_data = self.fixtures.get_funcionario_data()
        funcionario = Funcionario.objects.create(**func_data)
        self.assertEqual(str(funcionario), func_data['nome'])
        
        # Teste Equipe
        equipe_data = self.fixtures.get_equipe_data()
        equipe = Equipe.objects.create(**equipe_data)
        self.assertEqual(str(equipe), equipe_data['nome'])
    
    def test_model_ordering(self):
        """
        Testa ordenação padrão dos modelos.
        """
        # Criar múltiplas obras
        obras_data = [
            {'nome': 'Obra C', **self.fixtures.get_obra_data()},
            {'nome': 'Obra A', **self.fixtures.get_obra_data()},
            {'nome': 'Obra B', **self.fixtures.get_obra_data()}
        ]
        
        for data in obras_data:
            Obra.objects.create(**data)
        
        # Verificar ordenação (assumindo ordenação por nome)
        obras = list(Obra.objects.all())
        nomes = [obra.nome for obra in obras]
        
        # Se há ordenação definida, verificar
        if hasattr(Obra._meta, 'ordering') and Obra._meta.ordering:
            if 'nome' in Obra._meta.ordering[0]:
                self.assertEqual(nomes, sorted(nomes))
    
    def calculate_expected_age(self, birth_date):
        """
        Calcula idade esperada baseada na data de nascimento.
        """
        today = date.today()
        age = today.year - birth_date.year
        
        if today.month < birth_date.month or \
           (today.month == birth_date.month and today.day < birth_date.day):
            age -= 1
        
        return age
    
    def test_decimal_field_precision(self):
        """
        Testa precisão de campos decimais.
        """
        obra_data = self.fixtures.get_obra_data()
        obra_data['orcamento_previsto'] = Decimal('123456.789')
        
        obra = Obra.objects.create(**obra_data)
        
        # Verifica se a precisão foi mantida conforme definido no modelo
        self.assertDecimalEqual(obra.orcamento_previsto, Decimal('123456.79'), places=2)
    
    def test_date_field_validation(self):
        """
        Testa validação de campos de data.
        """
        obra_data = self.fixtures.get_obra_data()
        
        # Data de fim anterior à data de início
        obra_data['data_inicio'] = date.today()
        obra_data['data_previsao_fim'] = date.today() - timedelta(days=1)
        
        # Se há validação customizada, deve falhar
        obra = Obra(**obra_data)
        
        # Verifica se a validação customizada funciona
        if hasattr(obra, 'clean'):
            with self.assertRaises(ValidationError):
                obra.clean()
    
    def test_model_permissions(self):
        """
        Testa permissões dos modelos se definidas.
        """
        # Verifica se as permissões padrão existem
        from django.contrib.auth.models import Permission
        from django.contrib.contenttypes.models import ContentType
        
        # Obra permissions
        obra_ct = ContentType.objects.get_for_model(Obra)
        obra_permissions = Permission.objects.filter(content_type=obra_ct)
        
        expected_permissions = ['add_obra', 'change_obra', 'delete_obra', 'view_obra']
        actual_permissions = [perm.codename for perm in obra_permissions]
        
        for expected in expected_permissions:
            self.assertIn(expected, actual_permissions)