import json
from decimal import Decimal
from datetime import date, timedelta

from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status

from core.models import Usuario, Obra, Compra, Material, ItemCompra

class ComprasEndpointsTestCase(APITestCase):
    def setUp(self):
        """Set up data for the tests."""
        self.user = Usuario.objects.create_user(login='testuser', password='testpassword', nivel_acesso='admin')
        self.client.force_authenticate(user=self.user)

        self.obra = Obra.objects.create(
            nome_obra="Obra de Teste",
            endereco_completo="Rua Teste, 123",
            cidade="Teste",
            status="Em Andamento"
        )

        self.material = Material.objects.create(
            nome="Cimento Teste",
            unidade_medida="saco"
        )

        self.today = date.today()
        self.start_of_week = self.today - timedelta(days=self.today.weekday())

        # Create some purchases for testing
        compra1_valor = Decimal('100.50')
        self.compra1 = Compra.objects.create(
            obra=self.obra,
            data_compra=self.start_of_week,
            fornecedor="Fornecedor A",
            tipo='COMPRA'
        )
        ItemCompra.objects.create(compra=self.compra1, material=self.material, quantidade=1, valor_unitario=compra1_valor)
        self.compra1.save() # Recalculate totals

        compra2_valor = Decimal('250.00')
        self.compra2 = Compra.objects.create(
            obra=self.obra,
            data_compra=self.start_of_week + timedelta(days=2),
            fornecedor="Fornecedor B",
            tipo='COMPRA'
        )
        ItemCompra.objects.create(compra=self.compra2, material=self.material, quantidade=1, valor_unitario=compra2_valor)
        self.compra2.save()

        self.compra_orcamento = Compra.objects.create(
            obra=self.obra,
            data_compra=self.start_of_week + timedelta(days=3),
            fornecedor="Fornecedor C",
            tipo='ORCAMENTO'
        )
        ItemCompra.objects.create(compra=self.compra_orcamento, material=self.material, quantidade=1, valor_unitario=Decimal('500.00'))
        self.compra_orcamento.save()

    def test_get_compras_semanal(self):
        """
        Test the /api/compras/semanal/ endpoint.
        """
        url = reverse('compra-semanal')
        response = self.client.get(url, {'inicio': self.start_of_week.isoformat()})

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertEqual(len(data), 7)

        day1_str = self.start_of_week.isoformat()
        day3_str = (self.start_of_week + timedelta(days=2)).isoformat()

        self.assertEqual(len(data[day1_str]), 1)
        self.assertEqual(data[day1_str][0]['id'], self.compra1.id)
        self.assertEqual(Decimal(data[day1_str][0]['valor_total_liquido']), self.compra1.valor_total_liquido)

        self.assertEqual(len(data[day3_str]), 1)
        self.assertEqual(data[day3_str][0]['id'], self.compra2.id)

        day4_str = (self.start_of_week + timedelta(days=3)).isoformat()
        self.assertEqual(len(data[day4_str]), 0)

    def test_get_custo_diario_chart(self):
        """
        Test the /api/compras/custo_diario_chart/ endpoint.
        """
        compra_today_valor = Decimal('50.25')
        compra_today = Compra.objects.create(
            obra=self.obra,
            data_compra=self.today,
            tipo='COMPRA'
        )
        ItemCompra.objects.create(compra=compra_today, material=self.material, quantidade=1, valor_unitario=compra_today_valor)
        compra_today.save()
        compra_today.refresh_from_db()

        url = reverse('compra-custo-diario-chart')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertEqual(len(data), 30)

        today_data = next((item for item in data if item['date'] == self.today.isoformat()), None)

        self.assertIsNotNone(today_data)
        self.assertEqual(Decimal(today_data['total_cost']), compra_today.valor_total_liquido)
        self.assertTrue(today_data['has_compras'])

    def test_get_custo_diario_chart_with_obra_filter(self):
        """
        Test the /api/compras/custo_diario_chart/ endpoint with an obra_id filter.
        """
        other_obra = Obra.objects.create(nome_obra="Outra Obra", endereco_completo="Rua Outra, 456", cidade="Outra", status="Em Andamento")
        compra_other_obra_valor = Decimal('1000.00')
        compra_other_obra = Compra.objects.create(
            obra=other_obra,
            data_compra=self.today,
            tipo='COMPRA'
        )
        ItemCompra.objects.create(compra=compra_other_obra, material=self.material, quantidade=1, valor_unitario=compra_other_obra_valor)
        compra_other_obra.save()

        compra_today_valor = Decimal('50.25')
        compra_today = Compra.objects.create(
            obra=self.obra,
            data_compra=self.today,
            tipo='COMPRA'
        )
        ItemCompra.objects.create(compra=compra_today, material=self.material, quantidade=1, valor_unitario=compra_today_valor)
        compra_today.save()
        compra_today.refresh_from_db()

        url = reverse('compra-custo-diario-chart')
        response = self.client.get(url, {'obra_id': self.obra.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        today_data = next((item for item in data if item['date'] == self.today.isoformat()), None)

        self.assertIsNotNone(today_data)
        self.assertEqual(Decimal(today_data['total_cost']), compra_today.valor_total_liquido)
