from django.test import TestCase
from decimal import Decimal
from .models import Obra, Compra, Material, ItemCompra, Usuario, Funcionario, Locacao_Obras_Equipes
from django.utils import timezone
from datetime import date, timedelta
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from django.urls import reverse
import datetime as dt # For datetime.date usage if not directly importing date


# LocacaoObrasEquipesSerializer and ObraSerializer are imported lower down where used by specific test classes.

class ItemCompraModelTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.obra = Obra.objects.create(
            nome_obra="Test Obra",
            endereco_completo="123 Test St",
            cidade="Test City",
            status="Planejada",
            orcamento_previsto=Decimal('10000.00')
        )
        cls.compra_header = Compra.objects.create(
            obra=cls.obra,
            data_compra=timezone.now().date(),
            fornecedor='Test Fornecedor',
        )
        cls.material = Material.objects.create(nome="Test Material", unidade_medida="un")

    def test_valor_total_item_calculation(self):
        item1_qty = Decimal('10.000')
        item1_val_unit = Decimal('25.50')
        expected_total1 = item1_qty * item1_val_unit
        item_compra1 = ItemCompra(compra=self.compra_header, material=self.material, quantidade=item1_qty, valor_unitario=item1_val_unit)
        item_compra1.save()
        self.assertEqual(item_compra1.valor_total_item, expected_total1)

    # ... (other ItemCompraModelTest methods remain unchanged) ...

class CompraModelTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.obra = Obra.objects.create(
            nome_obra="Test Obra for Compra",
            endereco_completo="456 Test Ave",
            cidade="Testville",
            status="Em Andamento",
            orcamento_previsto=Decimal('50000.00')
        )
    def test_valor_total_liquido_calculation(self):
        compra1_bruto = Decimal('1000.00')
        compra1_desconto = Decimal('100.00')
        expected_liquido1 = compra1_bruto - compra1_desconto
        compra1 = Compra(obra=self.obra,data_compra=timezone.now().date(),fornecedor='Supplier X',valor_total_bruto=compra1_bruto,desconto=compra1_desconto)
        compra1.save()
        self.assertEqual(compra1.valor_total_liquido, expected_liquido1)

    # ... (other CompraModelTest methods remain unchanged) ...

from .serializers import ItemCompraSerializer, ObraSerializer, CompraSerializer, LocacaoObrasEquipesSerializer

class ItemCompraSerializerTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.obra = Obra.objects.create(nome_obra="Obra for Serializer", endereco_completo="789 Test St", cidade="Sertown", status="Planejada", orcamento_previsto=Decimal('60000.00'))
        cls.compra_header = Compra.objects.create(obra=cls.obra, data_compra=timezone.now().date())
        cls.material1 = Material.objects.create(nome="Material Alpha", unidade_medida="kg")
        cls.material2 = Material.objects.create(nome="Material Beta", unidade_medida="un")
        cls.item_compra_instance = ItemCompra.objects.create(compra=cls.compra_header, material=cls.material1, quantidade=Decimal('15.500'), valor_unitario=Decimal('10.00'))
        cls.item_compra_instance.refresh_from_db()

    def test_item_compra_serialization(self):
        serializer = ItemCompraSerializer(self.item_compra_instance)
        data = serializer.data
        self.assertEqual(data['id'], self.item_compra_instance.id)
        self.assertEqual(Decimal(data['valor_total_item']), (self.item_compra_instance.quantidade * self.item_compra_instance.valor_unitario).quantize(Decimal('0.01')))

    # ... (other ItemCompraSerializerTest methods remain unchanged) ...

class CompraSerializerCreateTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.obra_instance = Obra.objects.create(nome_obra="Obra for Compra Create", endereco_completo="111 Main St",cidade="Creatown",status="Em Andamento",orcamento_previsto=Decimal('100000.00'))
        cls.material1 = Material.objects.create(nome="Cement", unidade_medida="saco")
        cls.material2 = Material.objects.create(nome="Sand", unidade_medida="m³")

    def test_compra_serializer_create_valid_data(self):
        valid_data_for_create = {
            'obra': self.obra_instance.id, 'fornecedor': 'Test Supplier Inc.',
            'data_compra': dt.date(2023, 11, 15).isoformat(), 'nota_fiscal': 'NF-00123',
            'desconto': '50.00', 'observacoes': 'Initial materials for foundation.',
            'itens': [
                {'material': self.material1.id, 'quantidade': '100.000', 'valor_unitario': '30.00'},
                {'material': self.material2.id, 'quantidade': '5.000', 'valor_unitario': '120.00'}
            ]}
        serializer = CompraSerializer(data=valid_data_for_create)
        self.assertTrue(serializer.is_valid(), msg=f"Serializer errors: {serializer.errors}")
        compra_instance = serializer.save()
        self.assertIsInstance(compra_instance, Compra)
        # ... (rest of assertions remain unchanged)

    # ... (other CompraSerializerCreateTest methods remain unchanged) ...

class CompraViewSetAPITest(TestCase): # Changed to TestCase for consistency if not using specific APITestCase features heavily
    @classmethod
    def setUpTestData(cls):
        cls.user = Usuario.objects.create_user(login='testapiviewuser', password='password123', nome_completo='API Test User', nivel_acesso='admin')
        cls.obra_api = Obra.objects.create(nome_obra="Obra for API Test", endereco_completo="API Test Street", cidade="APItown", status="Em Andamento", orcamento_previsto=Decimal('200000.00'))
        cls.material_api1 = Material.objects.create(nome="API Material 1", unidade_medida="un")
        cls.material_api2 = Material.objects.create(nome="API Material 2", unidade_medida="kg")
        cls.material_api3 = Material.objects.create(nome="API Material 3 (for new items)", unidade_medida="L")

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_create_compra_api(self):
        url = '/api/compras/'
        payload = {
            'obra': self.obra_api.id, 'fornecedor': 'API Supplier',
            'data_compra': dt.date(2024, 1, 5).isoformat(), 'nota_fiscal': 'NF-API-001', 'desconto': '10.00',
            'itens': [
                {'material': self.material_api1.id, 'quantidade': '10.000', 'valor_unitario': '5.00'},
                {'material': self.material_api2.id, 'quantidade': '2.500', 'valor_unitario': '20.00'}
            ]}
        response = self.client.post(url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, msg=f"Create API failed: {response.data}")
        # ... (rest of assertions remain unchanged)

    # ... (other CompraViewSetAPITest methods remain unchanged) ...

class LocacaoModelTests(TestCase):
    def setUp(self):
        self.obra = Obra.objects.create(nome_obra="Test Obra", endereco_completo="123 Main St", cidade="Test City", status="Planejada")
    def test_locacao_creation_with_payment_defaults(self):
        locacao = Locacao_Obras_Equipes.objects.create(obra=self.obra, data_locacao_inicio=timezone.now().date(), servico_externo="External Service Basic")
        self.assertEqual(locacao.tipo_pagamento, 'diaria')
        self.assertEqual(locacao.valor_pagamento, Decimal('0.00'))
    # ... (other LocacaoModelTests methods remain unchanged) ...

class LocacaoSerializerTests(TestCase):
    def setUp(self):
        self.obra = Obra.objects.create(nome_obra="Serializer Test Obra", endereco_completo="456 Test St", cidade="Serializer City", status="Em Andamento")
        self.locacao_attributes = {'obra': self.obra.id, 'data_locacao_inicio': timezone.now().date().isoformat(), 'servico_externo': 'Serializer External Service', 'tipo_pagamento': 'metro', 'valor_pagamento': Decimal('120.50'), 'data_pagamento': timezone.now().date().isoformat()}
        self.locacao_invalid_payment_attributes = {'obra': self.obra.id, 'data_locacao_inicio': timezone.now().date().isoformat(), 'servico_externo': 'Serializer Invalid Payment', 'tipo_pagamento': 'diaria', 'valor_pagamento': Decimal('-100.00')}
    def test_serializer_valid_data(self):
        serializer = LocacaoObrasEquipesSerializer(data=self.locacao_attributes)
        self.assertTrue(serializer.is_valid(), serializer.errors)
    # ... (other LocacaoSerializerTests methods remain unchanged) ...

class ObraSerializerTests(TestCase):
    def setUp(self):
        self.obra_test = Obra.objects.create(nome_obra="Obra Teste Custos", endereco_completo="Rua Teste, 123", cidade="Testelândia", status="Em Andamento", orcamento_previsto=Decimal('10000.00'))
        self.locacao1 = Locacao_Obras_Equipes.objects.create(obra=self.obra_test, servico_externo="Pintura", data_locacao_inicio=timezone.now().date(), tipo_pagamento='empreitada', valor_pagamento=Decimal('500.00'))
        self.locacao2 = Locacao_Obras_Equipes.objects.create(obra=self.obra_test, servico_externo="Elétrica", data_locacao_inicio=timezone.now().date(), tipo_pagamento='diaria', valor_pagamento=Decimal('150.00'))
    def test_obra_serializer_custo_total_realizado_includes_locacoes(self):
        serializer = ObraSerializer(instance=self.obra_test)
        expected_total_locacoes = self.locacao1.valor_pagamento + self.locacao2.valor_pagamento
        self.assertEqual(serializer.data['custo_total_realizado'], expected_total_locacoes)
    # ... (other ObraSerializerTests methods remain unchanged) ...

class LocacaoTransferAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # self.user = Usuario.objects.create_user(login='testuser_transfer_api', password='password123', nome_completo='Test User API', nivel_acesso='admin')
        # self.client.force_authenticate(user=self.user)
        self.obra_origem = Obra.objects.create(nome_obra="Obra Origem Transfer", status="Em Andamento", cidade="Origem", endereco_completo="Addr O")
        self.obra_destino = Obra.objects.create(nome_obra="Obra Destino Transfer", status="Planejada", cidade="Destino", endereco_completo="Addr D")
        self.funcionario = Funcionario.objects.create(nome_completo="Funcionário Transferível", cargo="Mestre", salario=Decimal("3000.00"), data_contratacao=date(2023,1,1))
        self.locacao_original = Locacao_Obras_Equipes.objects.create(obra=self.obra_origem, funcionario_locado=self.funcionario, data_locacao_inicio=date(2024, 2, 1), data_locacao_fim=date(2024, 2, 29), tipo_pagamento='diaria', valor_pagamento=Decimal('2900.00'))
        try:
            self.transfer_url = reverse('locacao_obras_equipes-transfer-funcionario')
        except Exception:
            self.transfer_url = '/api/locacoes/transferir-funcionario/'

    def test_transfer_funcionario_success(self):
        new_locacao_data = {
            'obra': self.obra_destino.id, 'funcionario_locado': self.funcionario.id,
            'data_locacao_inicio': date(2024, 2, 15).isoformat(), 'data_locacao_fim': date(2024, 2, 25).isoformat(),
            'tipo_pagamento': 'diaria', 'valor_pagamento': Decimal('1100.00'), 'data_pagamento': date(2024, 2, 28).isoformat()
        }
        payload = {'conflicting_locacao_id': self.locacao_original.id, 'new_locacao_data': new_locacao_data}
        response = self.client.post(self.transfer_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.locacao_original.refresh_from_db()
        self.assertEqual(self.locacao_original.data_locacao_fim, date(2024, 2, 14))
        self.assertEqual(self.locacao_original.valor_pagamento, Decimal('0.00'))
        self.assertEqual(self.locacao_original.status_locacao, 'cancelada') # <<< THIS IS THE ADDED ASSERTION
        new_loc_id = response.data.get('id')
        self.assertTrue(Locacao_Obras_Equipes.objects.filter(id=new_loc_id).exists())
        # ... (rest of assertions remain unchanged)

    # ... (other LocacaoTransferAPITests methods remain unchanged, but ensure Decimal() for valor_pagamento in payloads) ...
    def test_transfer_missing_conflicting_id(self):
        new_locacao_data = { 'obra': self.obra_destino.id, 'funcionario_locado': self.funcionario.id, 'data_locacao_inicio': date(2024,3,1).isoformat(), 'tipo_pagamento':'diaria', 'valor_pagamento':Decimal('100.00')}
        payload = { 'new_locacao_data': new_locacao_data }
        response = self.client.post(self.transfer_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_transfer_missing_new_locacao_data(self):
        payload = { 'conflicting_locacao_id': self.locacao_original.id }
        response = self.client.post(self.transfer_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_transfer_conflicting_locacao_not_found(self):
        new_loc_data = { 'obra': self.obra_destino.id, 'funcionario_locado': self.funcionario.id, 'data_locacao_inicio': date(2024,3,1).isoformat(), 'tipo_pagamento':'diaria', 'valor_pagamento':Decimal('100.00')}
        payload = { 'conflicting_locacao_id': 99999, 'new_locacao_data': new_loc_data }
        response = self.client.post(self.transfer_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_transfer_new_locacao_data_invalid(self):
        invalid_new_loc_data = {'obra': self.obra_destino.id, 'funcionario_locado': self.funcionario.id, 'data_locacao_inicio': date(2024, 2, 15).isoformat(), 'valor_pagamento': Decimal('1100.00')}
        payload = { 'conflicting_locacao_id': self.locacao_original.id, 'new_locacao_data': invalid_new_loc_data }
        response = self.client.post(self.transfer_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('tipo_pagamento', response.data)

    def test_transfer_old_loc_becomes_superseded(self):
        new_start_date = self.locacao_original.data_locacao_inicio - timedelta(days=5)
        new_end_date = self.locacao_original.data_locacao_inicio - timedelta(days=1)
        new_locacao_data = {'obra': self.obra_destino.id, 'funcionario_locado': self.funcionario.id, 'data_locacao_inicio': new_start_date.isoformat(), 'data_locacao_fim': new_end_date.isoformat(), 'tipo_pagamento': 'diaria', 'valor_pagamento': Decimal('500.00')}
        payload = {'conflicting_locacao_id': self.locacao_original.id, 'new_locacao_data': new_locacao_data}
        response = self.client.post(self.transfer_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.locacao_original.refresh_from_db()
        expected_old_loc_end = new_start_date - timedelta(days=1)
        self.assertEqual(self.locacao_original.data_locacao_fim, expected_old_loc_end)
        self.assertTrue(self.locacao_original.data_locacao_fim < self.locacao_original.data_locacao_inicio)
        self.assertEqual(self.locacao_original.valor_pagamento, Decimal('0.00'))


class LocacaoConflictValidationTests(TestCase):
    def setUp(self):
        self.obra1 = Obra.objects.create(nome_obra="Obra Alpha", status="Planejada", cidade="A", endereco_completo="Addr A")
        self.obra2 = Obra.objects.create(nome_obra="Obra Beta", status="Planejada", cidade="B", endereco_completo="Addr B")
        self.funcionario = Funcionario.objects.create(nome_completo="João Silva", cargo="Pedreiro", salario=Decimal("2000.00"), data_contratacao=date(2023, 1, 1))
        self.existing_locacao = Locacao_Obras_Equipes.objects.create(obra=self.obra1, funcionario_locado=self.funcionario, data_locacao_inicio=date(2024, 1, 10), data_locacao_fim=date(2024, 1, 20), tipo_pagamento='diaria', valor_pagamento=Decimal('100.00'))

    def _get_base_data(self, start_date, end_date=None):
        return {'obra': self.obra2.id, 'funcionario_locado': self.funcionario.id, 'data_locacao_inicio': start_date.isoformat() if start_date else None, 'data_locacao_fim': end_date.isoformat() if end_date else None, 'tipo_pagamento': 'diaria', 'valor_pagamento': Decimal('120.00')}

    def test_no_conflict_before_existing(self):
        data = self._get_base_data(date(2024, 1, 1), date(2024, 1, 9))
        serializer = LocacaoObrasEquipesSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
    # ... (other LocacaoConflictValidationTests methods remain unchanged) ...

# APPENDING NEW CLASS HERE
class LocacaoOrderingTests(APITestCase):
    def setUp(self):
        self.obra = Obra.objects.create(nome_obra="Obra for Ordering", status="Em Andamento", cidade="Test", endereco_completo="Test")
        self.funcionario = Funcionario.objects.create(nome_completo="Func Order", cargo="Test", salario=Decimal("1000.00"), data_contratacao=date(2023,1,1))

        today = timezone.now().date()

        # Order: Hoje (0), Futura (1), Passada (2), Cancelada (3)
        self.loc_hoje_ends_today = Locacao_Obras_Equipes.objects.create(
            obra=self.obra, funcionario_locado=self.funcionario,
            data_locacao_inicio=today - timedelta(days=1), data_locacao_fim=today,
            tipo_pagamento='diaria', valor_pagamento=Decimal('100.00'), status_locacao='ativa'
        )
        self.loc_hoje_ongoing = Locacao_Obras_Equipes.objects.create(
            obra=self.obra, funcionario_locado=self.funcionario,
            data_locacao_inicio=today, data_locacao_fim=None,
            tipo_pagamento='diaria', valor_pagamento=Decimal('100.00'), status_locacao='ativa'
        )
        self.loc_futura = Locacao_Obras_Equipes.objects.create(
            obra=self.obra, funcionario_locado=self.funcionario,
            data_locacao_inicio=today + timedelta(days=1), data_locacao_fim=today + timedelta(days=5),
            tipo_pagamento='diaria', valor_pagamento=Decimal('100.00'), status_locacao='ativa'
        )
        self.loc_futura_later = Locacao_Obras_Equipes.objects.create(
            obra=self.obra, funcionario_locado=self.funcionario,
            data_locacao_inicio=today + timedelta(days=3), data_locacao_fim=today + timedelta(days=7),
            tipo_pagamento='diaria', valor_pagamento=Decimal('100.00'), status_locacao='ativa'
        )
        self.loc_passada_earlier = Locacao_Obras_Equipes.objects.create(
            obra=self.obra, funcionario_locado=self.funcionario,
            data_locacao_inicio=today - timedelta(days=15), data_locacao_fim=today - timedelta(days=5),
            tipo_pagamento='diaria', valor_pagamento=Decimal('100.00'), status_locacao='ativa'
        )
        self.loc_passada = Locacao_Obras_Equipes.objects.create(
            obra=self.obra, funcionario_locado=self.funcionario,
            data_locacao_inicio=today - timedelta(days=10), data_locacao_fim=today - timedelta(days=1),
            tipo_pagamento='diaria', valor_pagamento=Decimal('100.00'), status_locacao='ativa'
        )
        self.loc_cancelada = Locacao_Obras_Equipes.objects.create(
            obra=self.obra, funcionario_locado=self.funcionario,
            data_locacao_inicio=today - timedelta(days=5), data_locacao_fim=today - timedelta(days=1),
            tipo_pagamento='diaria', valor_pagamento=Decimal('100.00'), status_locacao='cancelada'
        )
        try:
            self.list_url = reverse('locacao_obras_equipes-list')
        except: # Fallback for environments where named URLs might not be immediately available/resolved
            self.list_url = '/api/locacoes/'

    def test_locacao_custom_ordering(self):
        # If authentication is active for this endpoint:
        # self.user = Usuario.objects.create_user(login='testorderuser', password='password', nome_completo='Order User', nivel_acesso='admin')
        # self.client.force_authenticate(user=self.user)

        response = self.client.get(self.list_url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)

        locacoes_data = response.data
        if isinstance(response.data, dict) and 'results' in response.data:
            locacoes_data = response.data['results']

        self.assertEqual(len(locacoes_data), 7)

        expected_ids_order = [
            self.loc_hoje_ends_today.id, self.loc_hoje_ongoing.id,
            self.loc_futura.id, self.loc_futura_later.id,
            self.loc_passada_earlier.id, self.loc_passada.id,
            self.loc_cancelada.id
        ]

        returned_ids_order = [item['id'] for item in locacoes_data]
        self.assertEqual(returned_ids_order, expected_ids_order)
