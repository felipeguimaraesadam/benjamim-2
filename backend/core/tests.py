from django.test import TestCase
from decimal import Decimal
from .models import Obra, Compra, Material, ItemCompra, Usuario, Funcionario, Locacao_Obras_Equipes # Ensure Funcionario and Locacao_Obras_Equipes are here
from django.utils import timezone
from datetime import date, timedelta # Added for LocacaoConflictValidationTests
from rest_framework.exceptions import ValidationError # Ensure this is available for Locacao tests
# LocacaoObrasEquipesSerializer and ObraSerializer are imported lower down, which is fine.

class ItemCompraModelTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Create a dummy User if your models or managers require it (e.g. for created_by fields)
        # Not strictly required by ItemCompra itself but good practice if other parts of system might touch it.
        # cls.user = Usuario.objects.create_user(login='testuser', password='password123', nome_completo='Test User', nivel_acesso='admin')

        # Create an Obra instance
        cls.obra = Obra.objects.create(
            nome_obra="Test Obra",
            endereco_completo="123 Test St",
            cidade="Test City",
            status="Planejada",
            # Add other required fields if any, e.g., orcamento_previsto if not default
            orcamento_previsto=Decimal('10000.00')
        )

        # Create a Compra instance
        # valor_total_bruto, desconto, valor_total_liquido have defaults in the model
        cls.compra_header = Compra.objects.create(
            obra=cls.obra,
            data_compra=timezone.now().date(), # Use current date
            fornecedor='Test Fornecedor',
            # observacoes can be blank/null
        )

        # Create a Material instance
        cls.material = Material.objects.create(nome="Test Material", unidade_medida="un")

    def test_valor_total_item_calculation(self):
        # Test case 1: Standard values
        item1_qty = Decimal('10.000')
        item1_val_unit = Decimal('25.50')
        expected_total1 = item1_qty * item1_val_unit

        item_compra1 = ItemCompra(
            compra=self.compra_header,
            material=self.material,
            quantidade=item1_qty,
            valor_unitario=item1_val_unit
        )
        item_compra1.save() # This should trigger the calculation in ItemCompra.save()
        self.assertEqual(item_compra1.valor_total_item, expected_total1)
        print(f"Test 1 Passed: {item1_qty} * {item1_val_unit} = {item_compra1.valor_total_item}")

        # Test case 2: Different values, including fractional quantity
        item2_qty = Decimal('2.500') # e.g., 2.5 kg
        item2_val_unit = Decimal('100.00')
        expected_total2 = item2_qty * item2_val_unit

        item_compra2 = ItemCompra(
            compra=self.compra_header,
            material=self.material,
            quantidade=item2_qty,
            valor_unitario=item2_val_unit
        )
        item_compra2.save()
        self.assertEqual(item_compra2.valor_total_item, expected_total2)
        print(f"Test 2 Passed: {item2_qty} * {item2_val_unit} = {item_compra2.valor_total_item}")

        # Test case 3: Zero quantity
        item3_qty = Decimal('0.000')
        item3_val_unit = Decimal('50.00')
        expected_total3 = item3_qty * item3_val_unit # Should be Decimal('0.00')

        item_compra3 = ItemCompra(
            compra=self.compra_header,
            material=self.material,
            quantidade=item3_qty,
            valor_unitario=item3_val_unit
        )
        item_compra3.save()
        self.assertEqual(item_compra3.valor_total_item, expected_total3)
        # Ensure it's exactly Decimal('0.00') or as per model's decimal places
        self.assertEqual(item_compra3.valor_total_item, Decimal('0.00').quantize(Decimal('0.01')))
        print(f"Test 3 Passed: {item3_qty} * {item3_val_unit} = {item_compra3.valor_total_item}")

        # Test case 4: Zero unit price
        item4_qty = Decimal('15.000')
        item4_val_unit = Decimal('0.00')
        expected_total4 = item4_qty * item4_val_unit # Should be Decimal('0.00')

        item_compra4 = ItemCompra(
            compra=self.compra_header,
            material=self.material,
            quantidade=item4_qty,
            valor_unitario=item4_val_unit
        )
        item_compra4.save()
        self.assertEqual(item_compra4.valor_total_item, expected_total4)
        self.assertEqual(item_compra4.valor_total_item, Decimal('0.00').quantize(Decimal('0.01')))
        print(f"Test 4 Passed: {item4_qty} * {item4_val_unit} = {item_compra4.valor_total_item}")

        # Test case 5: Both zero
        item5_qty = Decimal('0.000')
        item5_val_unit = Decimal('0.00')
        expected_total5 = item5_qty * item5_val_unit # Should be Decimal('0.00')

        item_compra5 = ItemCompra(
            compra=self.compra_header,
            material=self.material,
            quantidade=item5_qty,
            valor_unitario=item5_val_unit
        )
        item_compra5.save()
        self.assertEqual(item_compra5.valor_total_item, expected_total5)
        self.assertEqual(item_compra5.valor_total_item, Decimal('0.00').quantize(Decimal('0.01')))
        print(f"Test 5 Passed: {item5_qty} * {item5_val_unit} = {item_compra5.valor_total_item}")

    # Example of how you might test Compra's save method if it's affected by ItemCompra totals
    def test_compra_total_recalculation_after_item_save(self):
        # This test is more for Compra, but demonstrates interaction
        # Create a new Compra for this specific test to avoid interference
        compra_specific_test = Compra.objects.create(
            obra=self.obra,
            data_compra=timezone.now().date(),
            fornecedor='Specific Test Fornecedor',
            desconto=Decimal('10.00') # Example discount
        )

        # Item 1 for this Compra
        ItemCompra.objects.create(
            compra=compra_specific_test,
            material=self.material,
            quantidade=Decimal('2.000'),
            valor_unitario=Decimal('50.00')
        ) # Total item = 100.00

        # Item 2 for this Compra
        ItemCompra.objects.create(
            compra=compra_specific_test,
            material=self.material, # Can be same or different material
            quantidade=Decimal('1.000'),
            valor_unitario=Decimal('20.00')
        ) # Total item = 20.00

        # Manually trigger CompraSerializer's logic if it's not called automatically by ItemCompra save.
        # However, the Compra.save() method itself should be responsible for its final calculations.
        # The CompraSerializer.create/update methods handle summing items and then calling compra.save().
        # If we are testing the model's save method directly, we'd update bruto and then save.

        # Re-fetch and update compra_specific_test.valor_total_bruto
        # This logic is typically in the CompraSerializer.create/update or CompraViewSet.update
        # For a model test, we simulate this part if Compra.save() depends on it.
        # The current Compra.save() calculates valor_total_liquido from valor_total_bruto and desconto.
        # It does NOT recalculate valor_total_bruto from items. That's done in Serializer/View.

        # So, for this test, let's assume valor_total_bruto is set correctly by whatever process
        # populates/updates the Compra instance before its save method is called.

        compra_specific_test.valor_total_bruto = Decimal('120.00') # Sum of 100 + 20
        compra_specific_test.save() # This will calculate valor_total_liquido

        expected_liquido = Decimal('120.00') - Decimal('10.00') # bruto - desconto
        self.assertEqual(compra_specific_test.valor_total_liquido, expected_liquido)
        print(f"Compra Test Passed: Bruto={compra_specific_test.valor_total_bruto}, Desconto={compra_specific_test.desconto}, Liquido={compra_specific_test.valor_total_liquido}")

# To run these tests:
# python backend/manage.py test core.tests.ItemCompraModelTest
# or specific methods:
# python backend/manage.py test core.tests.ItemCompraModelTest.test_valor_total_item_calculation
# python backend/manage.py test core.tests.ItemCompraModelTest.test_compra_total_recalculation_after_item_save

# If you have a tests/test_models.py structure, adjust accordingly.
# For now, assuming all tests are in core/tests.py.


class CompraModelTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Create an Obra instance
        cls.obra = Obra.objects.create(
            nome_obra="Test Obra for Compra",
            endereco_completo="456 Test Ave",
            cidade="Testville",
            status="Em Andamento",
            orcamento_previsto=Decimal('50000.00') # Added orcamento_previsto
        )

    def test_valor_total_liquido_calculation(self):
        # Test case 1: Basic calculation
        compra1_bruto = Decimal('1000.00')
        compra1_desconto = Decimal('100.00')
        expected_liquido1 = compra1_bruto - compra1_desconto

        compra1 = Compra(
            obra=self.obra,
            data_compra=timezone.now().date(), # Using timezone.now().date()
            fornecedor='Supplier X',
            valor_total_bruto=compra1_bruto,
            desconto=compra1_desconto
        )
        compra1.save() # This should trigger the calculation in Compra.save()
        self.assertEqual(compra1.valor_total_liquido, expected_liquido1)
        print(f"Compra Test 1 Passed: Bruto={compra1_bruto}, Desconto={compra1_desconto}, Liquido={compra1.valor_total_liquido}")

        # Test case 2: Zero desconto
        compra2_bruto = Decimal('500.00')
        compra2_desconto = Decimal('0.00')
        expected_liquido2 = compra2_bruto - compra2_desconto

        compra2 = Compra(
            obra=self.obra,
            data_compra=timezone.now().date(),
            fornecedor='Supplier Y',
            valor_total_bruto=compra2_bruto,
            desconto=compra2_desconto
        )
        compra2.save()
        self.assertEqual(compra2.valor_total_liquido, expected_liquido2)
        print(f"Compra Test 2 Passed: Bruto={compra2_bruto}, Desconto={compra2_desconto}, Liquido={compra2.valor_total_liquido}")

        # Test case 3: Desconto equals bruto (liquido should be zero)
        compra3_bruto = Decimal('750.00')
        compra3_desconto = Decimal('750.00')
        expected_liquido3 = compra3_bruto - compra3_desconto # Should be Decimal('0.00')

        compra3 = Compra(
            obra=self.obra,
            data_compra=timezone.now().date(),
            fornecedor='Supplier Z',
            valor_total_bruto=compra3_bruto,
            desconto=compra3_desconto
        )
        compra3.save()
        self.assertEqual(compra3.valor_total_liquido, expected_liquido3)
        self.assertEqual(compra3.valor_total_liquido, Decimal('0.00').quantize(Decimal('0.01')))
        print(f"Compra Test 3 Passed: Bruto={compra3_bruto}, Desconto={compra3_desconto}, Liquido={compra3.valor_total_liquido}")

        # Test case 4: Desconto greater than bruto (liquido should be negative)
        compra4_bruto = Decimal('100.00')
        compra4_desconto = Decimal('150.00')
        expected_liquido4 = compra4_bruto - compra4_desconto # -50.00

        compra4 = Compra(
            obra=self.obra,
            data_compra=timezone.now().date(),
            fornecedor='Supplier W',
            valor_total_bruto=compra4_bruto,
            desconto=compra4_desconto
        )
        compra4.save()
        self.assertEqual(compra4.valor_total_liquido, expected_liquido4)
        print(f"Compra Test 4 Passed: Bruto={compra4_bruto}, Desconto={compra4_desconto}, Liquido={compra4.valor_total_liquido}")

        # Test case 5: Zero bruto value
        compra5_bruto = Decimal('0.00')
        compra5_desconto = Decimal('50.00')
        expected_liquido5 = compra5_bruto - compra5_desconto # -50.00

        compra5 = Compra(
            obra=self.obra,
            data_compra=timezone.now().date(),
            fornecedor='Supplier V',
            valor_total_bruto=compra5_bruto,
            desconto=compra5_desconto
        )
        compra5.save()
        self.assertEqual(compra5.valor_total_liquido, expected_liquido5)
        print(f"Compra Test 5 Passed: Bruto={compra5_bruto}, Desconto={compra5_desconto}, Liquido={compra5.valor_total_liquido}")

# To run these tests:
# python backend/manage.py test core.tests.CompraModelTest

from .serializers import ItemCompraSerializer, ObraSerializer # Added ObraSerializer

class ItemCompraSerializerTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.obra = Obra.objects.create(
            nome_obra="Obra for Serializer",
            endereco_completo="789 Test St",
            cidade="Sertown",
            status="Planejada",
            orcamento_previsto=Decimal('60000.00')
        )
        cls.compra_header = Compra.objects.create(
            obra=cls.obra,
            data_compra=timezone.now().date(),
            # valor_total_bruto and desconto will use defaults
        )
        cls.material1 = Material.objects.create(nome="Material Alpha", unidade_medida="kg")
        cls.material2 = Material.objects.create(nome="Material Beta", unidade_medida="un")

        cls.item_compra_instance = ItemCompra.objects.create(
            compra=cls.compra_header,
            material=cls.material1,
            quantidade=Decimal('15.500'),
            valor_unitario=Decimal('10.00')
            # valor_total_item will be calculated on save
        )
        # Refresh to get calculated valor_total_item
        cls.item_compra_instance.refresh_from_db()


    def test_item_compra_serialization(self):
        serializer = ItemCompraSerializer(self.item_compra_instance)
        data = serializer.data

        self.assertEqual(data['id'], self.item_compra_instance.id)
        self.assertEqual(data['material'], self.material1.id) # Serializer should output material ID
        self.assertEqual(Decimal(data['quantidade']), self.item_compra_instance.quantidade.quantize(Decimal('0.001'))) # Ensure quantization for comparison
        self.assertEqual(Decimal(data['valor_unitario']), self.item_compra_instance.valor_unitario.quantize(Decimal('0.01')))
        self.assertEqual(Decimal(data['valor_total_item']), self.item_compra_instance.valor_total_item.quantize(Decimal('0.01')))
        # Explicit check for calculation, ensuring quantization
        expected_total = (self.item_compra_instance.quantidade * self.item_compra_instance.valor_unitario).quantize(Decimal('0.01'))
        self.assertEqual(Decimal(data['valor_total_item']), expected_total)
        print(f"ItemCompra Serialization Test Passed. Data: {data}")

    def test_item_compra_deserialization_valid(self):
        valid_data = {
            'material': self.material2.id,
            'quantidade': '5.000',
            'valor_unitario': '20.00'
            # 'compra' is not part of ItemCompraSerializer's direct fields for creation/update standalone.
            # It's typically set by the parent CompraSerializer or view logic.
        }
        serializer = ItemCompraSerializer(data=valid_data)
        self.assertTrue(serializer.is_valid(), msg=serializer.errors)

        validated_data = serializer.validated_data
        self.assertEqual(validated_data['material'], self.material2)
        self.assertEqual(validated_data['quantidade'], Decimal('5.000'))
        self.assertEqual(validated_data['valor_unitario'], Decimal('20.00'))
        print("ItemCompra Deserialization Valid Test Passed.")

    def test_item_compra_deserialization_invalid_missing_fields(self):
        invalid_data = {
            'quantidade': '5.000'
            # material and valor_unitario are missing
        }
        serializer = ItemCompraSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('material', serializer.errors)
        self.assertIn('valor_unitario', serializer.errors)
        print(f"ItemCompra Deserialization Missing Fields Test Passed. Errors: {serializer.errors}")

    def test_item_compra_deserialization_invalid_data_types(self):
        invalid_data = {
            'material': self.material1.id,
            'quantidade': 'not-a-number',
            'valor_unitario': 'also-not-a-number'
        }
        serializer = ItemCompraSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('quantidade', serializer.errors)
        self.assertIn('valor_unitario', serializer.errors)
        print(f"ItemCompra Deserialization Invalid Data Types Test Passed. Errors: {serializer.errors}")

    def test_item_compra_deserialization_non_existent_material(self):
        invalid_data = {
            'material': 99999, # Non-existent material ID
            'quantidade': '1.000',
            'valor_unitario': '10.00'
        }
        serializer = ItemCompraSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('material', serializer.errors)
        print(f"ItemCompra Deserialization Non-Existent Material Test Passed. Errors: {serializer.errors}")

# To run these tests:
# python backend/manage.py test core.tests.ItemCompraSerializerTest

from .serializers import CompraSerializer # Added CompraSerializer import
import datetime # For date_compra

class CompraSerializerCreateTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.obra_instance = Obra.objects.create(
            nome_obra="Obra for Compra Create",
            endereco_completo="111 Main St",
            cidade="Creatown",
            status="Em Andamento",
            orcamento_previsto=Decimal('100000.00')
        )
        cls.material1 = Material.objects.create(nome="Cement", unidade_medida="saco")
        cls.material2 = Material.objects.create(nome="Sand", unidade_medida="m³")

    def test_compra_serializer_create_valid_data(self):
        valid_data_for_create = {
            'obra': self.obra_instance.id,
            'fornecedor': 'Test Supplier Inc.',
            'data_compra': datetime.date(2023, 11, 15).isoformat(),
            'nota_fiscal': 'NF-00123',
            'desconto': '50.00',
            'observacoes': 'Initial materials for foundation.',
            'itens': [
                {
                    'material': self.material1.id,
                    'quantidade': '100.000',
                    'valor_unitario': '30.00'
                },
                {
                    'material': self.material2.id,
                    'quantidade': '5.000',
                    'valor_unitario': '120.00'
                }
            ]
        }

        serializer = CompraSerializer(data=valid_data_for_create)
        self.assertTrue(serializer.is_valid(), msg=f"Serializer errors: {serializer.errors}")

        compra_instance = serializer.save()

        # Verify Compra instance and its fields
        self.assertIsInstance(compra_instance, Compra)
        self.assertIsNotNone(compra_instance.id)
        self.assertEqual(compra_instance.obra, self.obra_instance)
        self.assertEqual(compra_instance.fornecedor, valid_data_for_create['fornecedor'])
        self.assertEqual(compra_instance.data_compra, datetime.date(2023, 11, 15))
        self.assertEqual(compra_instance.nota_fiscal, valid_data_for_create['nota_fiscal'])
        self.assertEqual(compra_instance.desconto, Decimal(valid_data_for_create['desconto']))
        self.assertEqual(compra_instance.observacoes, valid_data_for_create['observacoes'])

        # Verify ItemCompra instances
        self.assertEqual(compra_instance.itens.count(), 2)

        item1_data = valid_data_for_create['itens'][0]
        item2_data = valid_data_for_create['itens'][1]

        expected_total_item1 = (Decimal(item1_data['quantidade']) * Decimal(item1_data['valor_unitario'])).quantize(Decimal('0.01'))
        expected_total_item2 = (Decimal(item2_data['quantidade']) * Decimal(item2_data['valor_unitario'])).quantize(Decimal('0.01'))

        item1_db = compra_instance.itens.filter(material=self.material1).first()
        self.assertIsNotNone(item1_db)
        self.assertEqual(item1_db.quantidade, Decimal(item1_data['quantidade']).quantize(Decimal('0.001')))
        self.assertEqual(item1_db.valor_unitario, Decimal(item1_data['valor_unitario']).quantize(Decimal('0.01')))
        self.assertEqual(item1_db.valor_total_item, expected_total_item1)

        item2_db = compra_instance.itens.filter(material=self.material2).first()
        self.assertIsNotNone(item2_db)
        self.assertEqual(item2_db.quantidade, Decimal(item2_data['quantidade']).quantize(Decimal('0.001')))
        self.assertEqual(item2_db.valor_unitario, Decimal(item2_data['valor_unitario']).quantize(Decimal('0.01')))
        self.assertEqual(item2_db.valor_total_item, expected_total_item2)

        expected_valor_bruto = (expected_total_item1 + expected_total_item2).quantize(Decimal('0.01'))
        self.assertEqual(compra_instance.valor_total_bruto, expected_valor_bruto)

        expected_valor_liquido = (expected_valor_bruto - compra_instance.desconto).quantize(Decimal('0.01'))
        self.assertEqual(compra_instance.valor_total_liquido, expected_valor_liquido)
        print("CompraSerializer Create Valid Data Test Passed.")

    def test_compra_serializer_create_invalid_item_data(self):
        invalid_item_data = {
            'obra': self.obra_instance.id,
            'data_compra': datetime.date(2023, 11, 16).isoformat(),
            'itens': [
                {
                    'material': self.material1.id,
                    # 'quantidade': missing,
                    'valor_unitario': '30.00'
                }
            ]
        }
        serializer = CompraSerializer(data=invalid_item_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('itens', serializer.errors)
        self.assertIn('quantidade', serializer.errors['itens'][0])
        print(f"CompraSerializer Create Invalid Item Data Test Passed. Errors: {serializer.errors}")


    def test_compra_serializer_create_empty_items_list(self):
        data_with_empty_items = {
            'obra': self.obra_instance.id,
            'fornecedor': 'Supplier Empty',
            'data_compra': datetime.date(2023, 11, 17).isoformat(),
            'desconto': '0.00',
            'itens': []
        }
        serializer = CompraSerializer(data=data_with_empty_items)
        # According to DRF default behavior, a ListField (like 'itens') is required by default.
        # If it's not marked as required=False, or allow_empty=True (for ListSerializer),
        # then an empty list might be invalid if the list itself is the source of truth for other calculations
        # or if there's a validator like MinLengthValidator(1).
        # The CompraSerializer.create method sums items to get valor_total_bruto.
        # If 'itens' is empty, sum will be 0, which is valid.
        # The 'itens' field in CompraSerializer is ItemCompraSerializer(many=True).
        # By default, 'many=True' fields are required unless specified otherwise.
        # Let's check if the current setup allows empty list.
        # If it fails, it might be because 'itens' itself is considered required and cannot be empty.
        # Or, if it passes, it means an empty list is acceptable.

        # Update based on typical DRF behavior: a list field itself can be required,
        # but being an empty list is often allowed unless validators like MinLengthValidator prevent it.
        # The provided CompraSerializer doesn't have explicit validation to prevent empty 'itens'.
        self.assertTrue(serializer.is_valid(), msg=f"Serializer errors for empty items: {serializer.errors}")

        compra_instance = serializer.save()
        self.assertEqual(compra_instance.itens.count(), 0)
        self.assertEqual(compra_instance.valor_total_bruto, Decimal('0.00'))
        self.assertEqual(compra_instance.valor_total_liquido, Decimal('0.00')) # 0.00 - 0.00
        print("CompraSerializer Create Empty Items List Test Passed.")

# To run these tests:
# python backend/manage.py test core.tests.CompraSerializerCreateTest


from django.urls import reverse # For reversing URL names if used, or use direct paths
from rest_framework.test import APIClient
from rest_framework import status # For status codes
from django.contrib.auth import get_user_model # To get User model

# User = get_user_model() # Defined inside the class where needed or globally if preferred

class CompraViewSetAPITest(TestCase):
    @classmethod
    def setUpTestData(cls):
        # cls.client = APIClient() # Moved to setUp for instance client

        # Create a user and authenticate (assuming IsAuthenticated permission)
        # The 'Usuario' model is already imported at the top of the file.
        cls.user = Usuario.objects.create_user(
            login='testapiviewuser',
            password='password123',
            nome_completo='API Test User',
            nivel_acesso='admin' # Ensure this matches one of the choices in your Usuario model
        )

        cls.obra_api = Obra.objects.create(
            nome_obra="Obra for API Test",
            endereco_completo="API Test Street",
            cidade="APItown",
            status="Em Andamento",
            orcamento_previsto=Decimal('200000.00')
        )
        cls.material_api1 = Material.objects.create(nome="API Material 1", unidade_medida="un")
        cls.material_api2 = Material.objects.create(nome="API Material 2", unidade_medida="kg")
        cls.material_api3 = Material.objects.create(nome="API Material 3 (for new items)", unidade_medida="L")

    def setUp(self):
        # Create an APIClient instance for each test
        self.client = APIClient()
        # Authenticate the client for each test method
        self.client.force_authenticate(user=self.user)

    def test_create_compra_api(self):
        # Using direct path as per plan
        url = '/api/compras/'

        payload = {
            'obra': self.obra_api.id,
            'fornecedor': 'API Supplier',
            'data_compra': datetime.date(2024, 1, 5).isoformat(),
            'nota_fiscal': 'NF-API-001',
            'desconto': '10.00',
            'observacoes': 'Compra created via API test.',
            'itens': [
                {'material': self.material_api1.id, 'quantidade': '10.000', 'valor_unitario': '5.00'}, # Total 50
                {'material': self.material_api2.id, 'quantidade': '2.500', 'valor_unitario': '20.00'}  # Total 50
            ]
        }
        response = self.client.post(url, data=payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, msg=f"Create API failed: {response.data}")

        response_data = response.data
        compra_id = response_data['id']

        compra_db = Compra.objects.get(id=compra_id)
        self.assertEqual(compra_db.fornecedor, payload['fornecedor'])
        self.assertEqual(compra_db.itens.count(), 2)

        expected_bruto = (Decimal('10.000') * Decimal('5.00') + Decimal('2.500') * Decimal('20.00')).quantize(Decimal('0.01'))
        self.assertEqual(Decimal(response_data['valor_total_bruto']).quantize(Decimal('0.01')), expected_bruto)
        self.assertEqual(compra_db.valor_total_bruto, expected_bruto)

        expected_liquido = (expected_bruto - Decimal(payload['desconto'])).quantize(Decimal('0.01'))
        self.assertEqual(Decimal(response_data['valor_total_liquido']).quantize(Decimal('0.01')), expected_liquido)
        self.assertEqual(compra_db.valor_total_liquido, expected_liquido)
        print("Create Compra API Test Passed.")

    def test_update_compra_api_full(self):
        initial_compra = Compra.objects.create(
            obra=self.obra_api,
            data_compra=datetime.date(2024, 1, 10),
            fornecedor="Initial Supplier",
            desconto=Decimal('5.00'),
            valor_total_bruto=Decimal('0.00') # Will be updated
        )
        item_to_update = ItemCompra.objects.create(compra=initial_compra, material=self.material_api1, quantidade=Decimal('2.000'), valor_unitario=Decimal('10.00'))
        item_to_delete = ItemCompra.objects.create(compra=initial_compra, material=self.material_api2, quantidade=Decimal('3.000'), valor_unitario=Decimal('15.00'))

        # Manually set initial bruto and save to trigger liquido calculation for the setup
        initial_compra.valor_total_bruto = (item_to_update.valor_total_item + item_to_delete.valor_total_item).quantize(Decimal('0.01'))
        initial_compra.save()

        update_payload = {
            'obra': self.obra_api.id,
            'fornecedor': 'Updated Supplier',
            'data_compra': initial_compra.data_compra.isoformat(),
            'nota_fiscal': 'NF-UPDATED',
            'desconto': '15.00',
            'observacoes': 'Compra updated via API.',
            'itens': [
                {
                  'id': item_to_update.id,
                  'material': self.material_api1.id,
                  'quantidade': '4.000',
                  'valor_unitario': '10.00'
                },
                {
                  'material': self.material_api3.id,
                  'quantidade': '1.000',
                  'valor_unitario': '100.00'
                }
            ]
        }

        url = f'/api/compras/{initial_compra.id}/'
        response = self.client.put(url, data=update_payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=f"Update API failed: {response.data}")

        updated_compra_db = Compra.objects.get(id=initial_compra.id)
        self.assertEqual(updated_compra_db.fornecedor, 'Updated Supplier')
        self.assertEqual(updated_compra_db.desconto, Decimal('15.00'))
        self.assertEqual(updated_compra_db.nota_fiscal, 'NF-UPDATED')

        self.assertEqual(updated_compra_db.itens.count(), 2)
        self.assertFalse(ItemCompra.objects.filter(id=item_to_delete.id).exists())

        updated_item1_db = updated_compra_db.itens.get(material=self.material_api1)
        self.assertEqual(updated_item1_db.quantidade, Decimal('4.000'))
        self.assertEqual(updated_item1_db.valor_total_item, Decimal('40.00').quantize(Decimal('0.01')))

        new_item_db = updated_compra_db.itens.get(material=self.material_api3)
        self.assertEqual(new_item_db.quantidade, Decimal('1.000'))
        self.assertEqual(new_item_db.valor_total_item, Decimal('100.00').quantize(Decimal('0.01')))

        expected_new_bruto = (Decimal('40.00') + Decimal('100.00')).quantize(Decimal('0.01'))
        self.assertEqual(updated_compra_db.valor_total_bruto, expected_new_bruto)

        expected_new_liquido = (expected_new_bruto - updated_compra_db.desconto).quantize(Decimal('0.01'))
        self.assertEqual(updated_compra_db.valor_total_liquido, expected_new_liquido)
        print("Update Compra API (Full) Test Passed.")

    def test_partial_update_compra_api_desconto_only(self):
        # Create an initial Compra with items summing to the desired valor_total_bruto
        compra_to_patch = Compra.objects.create(
            obra=self.obra_api,
            data_compra=datetime.date(2024, 1, 15),
            fornecedor="Patch Supplier",
            desconto=Decimal('20.00')
            # valor_total_bruto will be set by items
        )
        ItemCompra.objects.create(
            compra=compra_to_patch,
            material=self.material_api1,
            quantidade=Decimal('10.000'),
            valor_unitario=Decimal('10.00') # Total 100.00
        )
        ItemCompra.objects.create(
            compra=compra_to_patch,
            material=self.material_api2,
            quantidade=Decimal('5.000'),
            valor_unitario=Decimal('20.00') # Total 100.00
        )
        # Manually trigger the valor_total_bruto calculation as it would happen in a POST/PUT
        # or by the viewset's update logic before our PATCH.
        all_items = compra_to_patch.itens.all()
        calculated_bruto = sum(item.valor_total_item for item in all_items if item.valor_total_item is not None)
        compra_to_patch.valor_total_bruto = calculated_bruto # Should be 200.00
        compra_to_patch.save() # This will also calculate initial liquido: 200 - 20 = 180

        # Pre-condition checks to ensure setup is as expected
        self.assertEqual(compra_to_patch.valor_total_bruto, Decimal('200.00'), "Pre-condition: valor_total_bruto setup failed.")
        self.assertEqual(compra_to_patch.valor_total_liquido, Decimal('180.00'), "Pre-condition: valor_total_liquido setup failed.")

        patch_payload = {
            'desconto': '30.00'
        }

        url = f'/api/compras/{compra_to_patch.id}/'
        response = self.client.patch(url, data=patch_payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=f"Patch API failed: {response.data}")

        patched_compra_db = Compra.objects.get(id=compra_to_patch.id)
        self.assertEqual(patched_compra_db.desconto, Decimal('30.00'))

        self.assertEqual(patched_compra_db.valor_total_bruto, Decimal('200.00')) # Bruto should not change
        expected_patched_liquido = (Decimal('200.00') - Decimal('30.00')).quantize(Decimal('0.01'))
        self.assertEqual(patched_compra_db.valor_total_liquido, expected_patched_liquido)
        print("Partial Update Compra API (Desconto Only) Test Passed.")

# To run these tests:
# python backend/manage.py test core.tests.CompraViewSetAPITest


from .models import Locacao_Obras_Equipes, Funcionario # Obra is already imported
from .serializers import LocacaoObrasEquipesSerializer
from rest_framework.exceptions import ValidationError


class LocacaoModelTests(TestCase):
    def setUp(self):
        self.obra = Obra.objects.create(nome_obra="Test Obra", endereco_completo="123 Main St", cidade="Test City", status="Planejada")
        # Minimal Funcionario for testing locacao if needed, or allow null for funcionario_locado
        # self.funcionario = Funcionario.objects.create(nome_completo="Test Func", cargo="Tester", salario="1000", data_contratacao=timezone.now().date())


    def test_locacao_creation_with_payment_defaults(self):
        # Test with minimal required fields for Locacao_Obras_Equipes
        # Assuming servico_externo is one way to create a valid locacao without equipe/funcionario
        locacao = Locacao_Obras_Equipes.objects.create(
            obra=self.obra,
            data_locacao_inicio=timezone.now().date(),
            servico_externo="External Service Basic"
            # tipo_pagamento and valor_pagamento should use defaults
        )
        self.assertEqual(locacao.tipo_pagamento, 'diaria')
        self.assertEqual(locacao.valor_pagamento, Decimal('0.00'))
        self.assertIsNone(locacao.data_pagamento)

    def test_locacao_creation_with_specific_payment_values(self):
        locacao = Locacao_Obras_Equipes.objects.create(
            obra=self.obra,
            data_locacao_inicio=timezone.now().date(),
            servico_externo="External Service Full Payment",
            tipo_pagamento='empreitada',
            valor_pagamento=Decimal('1500.75'),
            data_pagamento=timezone.now().date()
        )
        self.assertEqual(locacao.tipo_pagamento, 'empreitada')
        self.assertEqual(locacao.valor_pagamento, Decimal('1500.75'))
        self.assertIsNotNone(locacao.data_pagamento)


class LocacaoSerializerTests(TestCase):
    def setUp(self):
        self.obra = Obra.objects.create(nome_obra="Serializer Test Obra", endereco_completo="456 Test St", cidade="Serializer City", status="Em Andamento")
        self.locacao_attributes = {
            'obra': self.obra.id,
            'data_locacao_inicio': timezone.now().date().isoformat(),
            'servico_externo': 'Serializer External Service', # Using servico_externo for simplicity
            'tipo_pagamento': 'metro',
            'valor_pagamento': Decimal('120.50'),
            'data_pagamento': timezone.now().date().isoformat()
        }
        self.locacao_invalid_payment_attributes = {
            'obra': self.obra.id,
            'data_locacao_inicio': timezone.now().date().isoformat(),
            'servico_externo': 'Serializer Invalid Payment',
            'tipo_pagamento': 'diaria',
            'valor_pagamento': Decimal('-100.00'), # Invalid
        }

    def test_serializer_valid_data(self):
        serializer = LocacaoObrasEquipesSerializer(data=self.locacao_attributes)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        locacao = serializer.save()
        self.assertEqual(locacao.valor_pagamento, Decimal('120.50'))
        self.assertEqual(locacao.tipo_pagamento, 'metro')

    def test_serializer_invalid_valor_pagamento(self):
        serializer = LocacaoObrasEquipesSerializer(data=self.locacao_invalid_payment_attributes)
        with self.assertRaises(ValidationError) as context:
            serializer.is_valid(raise_exception=True)
        self.assertIn('valor_pagamento', context.exception.detail)
        self.assertEqual(str(context.exception.detail['valor_pagamento'][0]), "O valor do pagamento não pode ser negativo.")

    def test_serializer_create_with_optional_data_pagamento_null(self):
        data = self.locacao_attributes.copy()
        data.pop('data_pagamento') # Test with data_pagamento not provided
        serializer = LocacaoObrasEquipesSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        locacao = serializer.save()
        self.assertIsNone(locacao.data_pagamento)

    def test_serializer_update_payment_fields(self):
        # First, create an instance
        initial_data = {
            'obra': self.obra.id,
            'data_locacao_inicio': timezone.now().date().isoformat(),
            'servico_externo': 'Initial Service for Update',
            'tipo_pagamento': 'diaria',
            'valor_pagamento': Decimal('50.00')
        }
        serializer_create = LocacaoObrasEquipesSerializer(data=initial_data)
        self.assertTrue(serializer_create.is_valid(), serializer_create.errors)
        locacao_instance = serializer_create.save()

        # Now, update it
        update_data = {
            'tipo_pagamento': 'empreitada',
            'valor_pagamento': Decimal('2000.00'),
            'data_pagamento': timezone.now().date().isoformat()
        }
        serializer_update = LocacaoObrasEquipesSerializer(instance=locacao_instance, data=update_data, partial=True)
        self.assertTrue(serializer_update.is_valid(), serializer_update.errors)
        updated_locacao = serializer_update.save()

        self.assertEqual(updated_locacao.tipo_pagamento, 'empreitada')
        self.assertEqual(updated_locacao.valor_pagamento, Decimal('2000.00'))
        self.assertIsNotNone(updated_locacao.data_pagamento)


class ObraSerializerTests(TestCase):
    def setUp(self):
        self.obra_test = Obra.objects.create(
            nome_obra="Obra Teste Custos",
            endereco_completo="Rua Teste, 123",
            cidade="Testelândia",
            status="Em Andamento",
            orcamento_previsto=Decimal('10000.00')
        )
        # Create some locações associated with this obra
        self.locacao1 = Locacao_Obras_Equipes.objects.create(
            obra=self.obra_test,
            servico_externo="Pintura", # Assuming servico_externo for simplicity
            data_locacao_inicio=timezone.now().date(),
            tipo_pagamento='empreitada',
            valor_pagamento=Decimal('500.00')
        )
        self.locacao2 = Locacao_Obras_Equipes.objects.create(
            obra=self.obra_test,
            servico_externo="Elétrica",
            data_locacao_inicio=timezone.now().date(),
            tipo_pagamento='diaria',
            valor_pagamento=Decimal('150.00')
        )

    def test_obra_serializer_custo_total_realizado_includes_locacoes(self):
        serializer = ObraSerializer(instance=self.obra_test)
        # Expected: 500 (locacao1) + 150 (locacao2) = 650.00
        # This assumes no other costs (compras, despesas_extras) for this specific test setup.
        expected_total_locacoes = self.locacao1.valor_pagamento + self.locacao2.valor_pagamento
        # Since ObraSerializer also sums compras and despesas_extras, we expect them to be 0 here.
        # So, custo_total_realizado should equal expected_total_locacoes.
        self.assertEqual(serializer.data['custo_total_realizado'], expected_total_locacoes)

    def test_obra_serializer_custos_por_categoria_includes_locacoes(self):
        serializer = ObraSerializer(instance=self.obra_test)
        custos_categoria = serializer.data['custos_por_categoria']
        expected_total_locacoes = self.locacao1.valor_pagamento + self.locacao2.valor_pagamento

        self.assertIn('locacoes', custos_categoria)
        self.assertEqual(custos_categoria['locacoes'], expected_total_locacoes)
        # Check other categories if they are expected (e.g., materials, despesas_extras)
        # For this setup, they would be 0.00 unless created in setUp.
        self.assertEqual(custos_categoria.get('materiais', Decimal('0.00')), Decimal('0.00'))
        self.assertEqual(custos_categoria.get('despesas_extras', Decimal('0.00')), Decimal('0.00'))

# LocacaoObrasEquipesSerializer is imported where it's used by other test classes.
# We might need it here if we were to prepare data with it, but tests below use direct model creation or raw dicts.

from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse # If using named URLs, otherwise use path directly
# Note: 'Usuario' from .models is already imported at the top of the file.
# Note: 'date', 'timedelta' from datetime are already imported at the top of the file.
# Note: 'Decimal' from decimal is already imported at the top of the file.

class LocacaoTransferAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Create a user for authentication if your endpoint is protected
        # self.user = Usuario.objects.create_user(login='testuser_transfer_api', password='password123', nome_completo='Test User API', nivel_acesso='admin')
        # self.client.force_authenticate(user=self.user) # Authenticate if needed

        self.obra_origem = Obra.objects.create(nome_obra="Obra Origem Transfer", status="Em Andamento", cidade="Origem", endereco_completo="Addr O")
        self.obra_destino = Obra.objects.create(nome_obra="Obra Destino Transfer", status="Planejada", cidade="Destino", endereco_completo="Addr D")
        self.funcionario = Funcionario.objects.create(nome_completo="Funcionário Transferível", cargo="Mestre", salario=Decimal("3000.00"), data_contratacao=date(2023,1,1))

        self.locacao_original = Locacao_Obras_Equipes.objects.create(
            obra=self.obra_origem,
            funcionario_locado=self.funcionario,
            data_locacao_inicio=date(2024, 2, 1),
            data_locacao_fim=date(2024, 2, 29),
            tipo_pagamento='diaria',
            valor_pagamento=Decimal('2900.00')
        )

        try:
            self.transfer_url = reverse('locacao_obras_equipes-transfer-funcionario')
        except Exception:
            # Fallback if URL name isn't set up exactly as assumed (common in test environments or if urls.py changes)
            self.transfer_url = '/api/locacoes/transferir-funcionario/'


    def test_transfer_funcionario_success(self):
        new_locacao_data = {
            'obra': self.obra_destino.id,
            'funcionario_locado': self.funcionario.id,
            'data_locacao_inicio': date(2024, 2, 15).isoformat(),
            'data_locacao_fim': date(2024, 2, 25).isoformat(),
            'tipo_pagamento': 'diaria',
            'valor_pagamento': Decimal('1100.00'),
            'data_pagamento': date(2024, 2, 28).isoformat()
        }

        payload = {
            'conflicting_locacao_id': self.locacao_original.id,
            'new_locacao_data': new_locacao_data
        }

        response = self.client.post(self.transfer_url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

        self.locacao_original.refresh_from_db()
        self.assertEqual(self.locacao_original.data_locacao_fim, date(2024, 2, 14))
        self.assertEqual(self.locacao_original.valor_pagamento, Decimal('0.00'))

        new_loc_id = response.data.get('id')
        self.assertTrue(Locacao_Obras_Equipes.objects.filter(id=new_loc_id).exists())
        new_loc = Locacao_Obras_Equipes.objects.get(id=new_loc_id)
        self.assertEqual(new_loc.obra, self.obra_destino)
        self.assertEqual(new_loc.funcionario_locado, self.funcionario)
        self.assertEqual(new_loc.data_locacao_inicio, date(2024, 2, 15))
        self.assertEqual(new_loc.valor_pagamento, Decimal('1100.00'))

    def test_transfer_missing_conflicting_id(self):
        new_locacao_data = { 'obra': self.obra_destino.id, 'funcionario_locado': self.funcionario.id, 'data_locacao_inicio': date(2024,3,1).isoformat(), 'tipo_pagamento':'diaria', 'valor_pagamento':Decimal('100.00')}
        payload = { 'new_locacao_data': new_locacao_data }
        response = self.client.post(self.transfer_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('conflicting_locacao_id e new_locacao_data são obrigatórios', response.data.get('error', ''))

    def test_transfer_missing_new_locacao_data(self):
        payload = { 'conflicting_locacao_id': self.locacao_original.id }
        response = self.client.post(self.transfer_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('conflicting_locacao_id e new_locacao_data são obrigatórios', response.data.get('error', ''))

    def test_transfer_conflicting_locacao_not_found(self):
        new_loc_data = { 'obra': self.obra_destino.id, 'funcionario_locado': self.funcionario.id, 'data_locacao_inicio': date(2024,3,1).isoformat(), 'tipo_pagamento':'diaria', 'valor_pagamento':Decimal('100.00')}
        payload = { 'conflicting_locacao_id': 99999, 'new_locacao_data': new_loc_data }
        response = self.client.post(self.transfer_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data.get('error'), "Locação conflitante não encontrada.")

    def test_transfer_new_locacao_data_invalid(self):
        invalid_new_loc_data = {
            'obra': self.obra_destino.id,
            'funcionario_locado': self.funcionario.id,
            'data_locacao_inicio': date(2024, 2, 15).isoformat(),
            'valor_pagamento': Decimal('1100.00')
            # 'tipo_pagamento' is missing
        }
        payload = { 'conflicting_locacao_id': self.locacao_original.id, 'new_locacao_data': invalid_new_loc_data }
        response = self.client.post(self.transfer_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('tipo_pagamento', response.data)

    def test_transfer_old_loc_becomes_superseded(self): # Renamed for clarity
        # New loc starts *before* old loc's original start, making old loc's new end date before its original start
        new_start_date = self.locacao_original.data_locacao_inicio - timedelta(days=5) # e.g., 2024-02-01 becomes 2024-01-27
        new_end_date = self.locacao_original.data_locacao_inicio - timedelta(days=1)   # e.g., 2024-02-01 becomes 2024-01-31

        new_locacao_data = {
            'obra': self.obra_destino.id,
            'funcionario_locado': self.funcionario.id,
            'data_locacao_inicio': new_start_date.isoformat(),
            'data_locacao_fim': new_end_date.isoformat(),
            'tipo_pagamento': 'diaria',
            'valor_pagamento': Decimal('500.00')
        }
        payload = {
            'conflicting_locacao_id': self.locacao_original.id,
            'new_locacao_data': new_locacao_data
        }
        response = self.client.post(self.transfer_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

        self.locacao_original.refresh_from_db()
        expected_old_loc_end = new_start_date - timedelta(days=1)
        self.assertEqual(self.locacao_original.data_locacao_fim, expected_old_loc_end)
        self.assertTrue(self.locacao_original.data_locacao_fim < self.locacao_original.data_locacao_inicio,
                        f"Old loc end {self.locacao_original.data_locacao_fim} should be before original start {self.locacao_original.data_locacao_inicio}")
        self.assertEqual(self.locacao_original.valor_pagamento, Decimal('0.00'))


class LocacaoConflictValidationTests(TestCase):
    def setUp(self):
        self.obra1 = Obra.objects.create(nome_obra="Obra Alpha", status="Planejada", cidade="A", endereco_completo="Addr A")
        self.obra2 = Obra.objects.create(nome_obra="Obra Beta", status="Planejada", cidade="B", endereco_completo="Addr B")
        self.funcionario = Funcionario.objects.create(nome_completo="João Silva", cargo="Pedreiro", salario=Decimal("2000.00"), data_contratacao=date(2023, 1, 1))

        # Existing locacao for João Silva
        self.existing_locacao = Locacao_Obras_Equipes.objects.create(
            obra=self.obra1,
            funcionario_locado=self.funcionario,
            data_locacao_inicio=date(2024, 1, 10),
            data_locacao_fim=date(2024, 1, 20),
            tipo_pagamento='diaria',
            valor_pagamento=Decimal('100.00')
        )

    def _get_base_data(self, start_date, end_date=None):
        # Helper to get common data for serializer
        return {
            'obra': self.obra2.id,
            'funcionario_locado': self.funcionario.id,
            'data_locacao_inicio': start_date.isoformat() if start_date else None,
            'data_locacao_fim': end_date.isoformat() if end_date else None,
            'tipo_pagamento': 'diaria', # Default, can be overridden in specific tests
            'valor_pagamento': Decimal('120.00') # Default, can be overridden
            # servico_externo or equipe are not set, focusing on funcionario_locado
        }

    def test_no_conflict_before_existing(self):
        data = self._get_base_data(date(2024, 1, 1), date(2024, 1, 9))
        serializer = LocacaoObrasEquipesSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_no_conflict_after_existing(self):
        data = self._get_base_data(date(2024, 1, 21), date(2024, 1, 30))
        serializer = LocacaoObrasEquipesSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_conflict_starts_during_existing(self):
        data = self._get_base_data(date(2024, 1, 15), date(2024, 1, 25))
        serializer = LocacaoObrasEquipesSerializer(data=data)
        with self.assertRaises(ValidationError) as context:
            serializer.is_valid(raise_exception=True)
        self.assertIn('funcionario_locado', context.exception.detail)
        self.assertIn('conflict_details', context.exception.detail)
        self.assertEqual(context.exception.detail['conflict_details']['locacao_id'], self.existing_locacao.id)

    def test_conflict_ends_during_existing(self):
        data = self._get_base_data(date(2024, 1, 5), date(2024, 1, 15))
        serializer = LocacaoObrasEquipesSerializer(data=data)
        with self.assertRaises(ValidationError):
            serializer.is_valid(raise_exception=True)

    def test_conflict_new_contains_existing(self):
        data = self._get_base_data(date(2024, 1, 1), date(2024, 1, 30))
        serializer = LocacaoObrasEquipesSerializer(data=data)
        with self.assertRaises(ValidationError):
            serializer.is_valid(raise_exception=True)

    def test_conflict_existing_contains_new(self):
        data = self._get_base_data(date(2024, 1, 12), date(2024, 1, 18))
        serializer = LocacaoObrasEquipesSerializer(data=data)
        with self.assertRaises(ValidationError):
            serializer.is_valid(raise_exception=True)

    def test_conflict_exact_same_dates(self):
        data = self._get_base_data(date(2024, 1, 10), date(2024, 1, 20))
        serializer = LocacaoObrasEquipesSerializer(data=data)
        with self.assertRaises(ValidationError):
            serializer.is_valid(raise_exception=True)

    def test_update_no_conflict_own_instance(self):
        data_for_update = {
            'valor_pagamento': Decimal('150.00'),
            'data_locacao_inicio': self.existing_locacao.data_locacao_inicio.isoformat(),
            'data_locacao_fim': self.existing_locacao.data_locacao_fim.isoformat(),
            'obra': self.existing_locacao.obra.id,
            'funcionario_locado': self.existing_locacao.funcionario_locado.id,
            'tipo_pagamento': self.existing_locacao.tipo_pagamento,
            # Ensure no other resource type is implicitly set if not part of initial locacao
            'equipe': None,
            'servico_externo': ""
        }
        serializer = LocacaoObrasEquipesSerializer(instance=self.existing_locacao, data=data_for_update, partial=False) # Use partial=False to mimic full update with all fields
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_conflict_new_open_starts_during_existing_finite(self):
        data = self._get_base_data(start_date=date(2024, 1, 15), end_date=None)
        serializer = LocacaoObrasEquipesSerializer(data=data)
        with self.assertRaises(ValidationError):
            serializer.is_valid(raise_exception=True)

    def test_conflict_new_finite_starts_during_existing_open(self):
        self.existing_locacao.data_locacao_fim = None
        self.existing_locacao.save()
        data = self._get_base_data(date(2024, 1, 15), date(2024, 1, 25))
        serializer = LocacaoObrasEquipesSerializer(data=data)
        with self.assertRaises(ValidationError):
            serializer.is_valid(raise_exception=True)

    def test_conflict_both_open_different_start_dates(self):
        self.existing_locacao.data_locacao_fim = None
        self.existing_locacao.save()
        data = self._get_base_data(start_date=date(2024, 1, 1), end_date=None) # Starts before existing open
        serializer = LocacaoObrasEquipesSerializer(data=data)
        with self.assertRaises(ValidationError):
            serializer.is_valid(raise_exception=True)

        data_starts_after = self._get_base_data(start_date=date(2024, 1, 15), end_date=None) # Starts after existing open
        serializer_starts_after = LocacaoObrasEquipesSerializer(data=data_starts_after)
        with self.assertRaises(ValidationError): # Still a conflict as both are open-ended for same func
            serializer_starts_after.is_valid(raise_exception=True)


    def test_no_conflict_new_open_starts_after_existing_finite_ends(self):
        data = self._get_base_data(start_date=date(2024, 1, 21), end_date=None)
        serializer = LocacaoObrasEquipesSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_no_conflict_new_finite_ends_before_existing_open_starts(self):
        self.existing_locacao.data_locacao_fim = None
        self.existing_locacao.data_locacao_inicio = date(2024, 1, 10)
        self.existing_locacao.save()
        data = self._get_base_data(date(2024, 1, 1), date(2024, 1, 9))
        serializer = LocacaoObrasEquipesSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
