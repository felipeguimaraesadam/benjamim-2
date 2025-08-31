import json
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
from core.models import Usuario, Obra, Material, Compra, ItemCompra

class CompraFixesTestCase(TestCase):
    def setUp(self):
        """Set up the test environment with necessary objects."""
        self.client = APIClient()
        self.user = Usuario.objects.create_user(login='testuser_bugs', password='testpassword', nome_completo='Test User Bugs', nivel_acesso='admin')
        self.client.force_authenticate(user=self.user)

        self.obra = Obra.objects.create(
            nome_obra='Obra de Teste para Bugs',
            endereco_completo='Rua dos Testes, 123',
            cidade='Test City',
            status='Em Andamento'
        )
        self.material = Material.objects.create(
            nome='Material de Teste para Bugs',
            unidade_medida='un'
        )

    def test_compra_related_bug_fixes(self):
        """
        A single test to verify all the fixes related to the user's report.
        1.  Create and then Edit a purchase to confirm saving works (Issue #1).
        2.  Fetch the purchase details and verify all fields are present (Issue #2).
        3.  Verify that 'categoria_uso' is correctly placed on items, not the purchase itself (Issue #3).
        """
        # Step 1: Create a new purchase via API
        create_data = {
            "obra": self.obra.id,
            "fornecedor": "Fornecedor Original",
            "data_compra": "2025-08-30",
            "tipo": "COMPRA",
            "status_orcamento": "APROVADO",
            "forma_pagamento": "AVISTA",
            "itens": json.dumps([
                {
                    "material": self.material.id,
                    "quantidade": 10,
                    "valor_unitario": 25.50,
                    "categoria_uso": "Geral"
                }
            ])
        }

        # We use format='multipart' because the create view expects it for handling files,
        # even if we are not sending any in this specific test.
        create_response = self.client.post('/api/compras/', create_data, format='multipart')
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED, f"Failed to create purchase. Errors: {create_response.data}")

        compra_id = create_response.data['id']

        # Step 2: Update the purchase to test the edit functionality (Issue #1)
        update_data = {
            "fornecedor": "Fornecedor Atualizado",
            "observacoes": "Esta compra foi atualizada com sucesso."
        }

        # Using PATCH for partial update
        update_response = self.client.patch(f'/api/compras/{compra_id}/', update_data, format='json')
        self.assertEqual(update_response.status_code, status.HTTP_200_OK, f"Failed to update purchase. Errors: {update_response.data}")
        self.assertEqual(update_response.data['fornecedor'], "Fornecedor Atualizado")

        # Also verify the change in the database
        updated_compra_db = Compra.objects.get(id=compra_id)
        self.assertEqual(updated_compra_db.fornecedor, "Fornecedor Atualizado")
        self.assertEqual(updated_compra_db.observacoes, "Esta compra foi atualizada com sucesso.")

        # Step 3: Fetch details and verify all fields are present (Issue #2)
        details_response = self.client.get(f'/api/compras/{compra_id}/')
        self.assertEqual(details_response.status_code, status.HTTP_200_OK)

        details_data = details_response.data
        self.assertEqual(details_data['fornecedor'], "Fornecedor Atualizado")
        self.assertIsNotNone(details_data.get('status_orcamento'), "status_orcamento should not be null")
        self.assertEqual(details_data['status_orcamento'], "APROVADO")
        self.assertIsNotNone(details_data.get('forma_pagamento'), "forma_pagamento should not be null")
        self.assertEqual(details_data['forma_pagamento'], "AVISTA")

        # Step 4: Verify the placement of 'categoria_uso' (Issue #3)
        self.assertNotIn('categoria_uso', details_data, "'categoria_uso' should not be a top-level field")
        self.assertIn('itens', details_data)
        self.assertEqual(len(details_data['itens']), 1)

        item_data = details_data['itens'][0]
        self.assertIn('categoria_uso', item_data, "'categoria_uso' should be in each item")
        self.assertEqual(item_data['categoria_uso'], "Geral")

        print("\\n[SUCCESS] All targeted bug fixes have been verified by the new test case.")
