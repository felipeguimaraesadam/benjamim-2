# -*- coding: utf-8 -*-
import json
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from core.models import Obra, Material, Compra, ItemCompra, Usuario

def test_api_endpoint():
    print("=== TESTE DO ENDPOINT DA API ===")
    
    # Criar cliente da API
    client = APIClient()
    
    # Criar usuario para autenticacao
    user = Usuario.objects.first()
    if not user:
        user = Usuario.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123'
        )
    
    # Autenticar
    client.force_authenticate(user=user)
    
    # Obter dados de teste
    obra = Obra.objects.first()
    material = Material.objects.first()
    
    if not obra or not material:
        print("Dados de teste nao encontrados")
        return
    
    print(f"Obra: {obra.nome_obra}")
    print(f"Material: {material.nome}")
    
    # Dados para teste de pagamento unico
    compra_data = {
        'obra': obra.id,
        'fornecedor': 'Fornecedor Teste API',
        'data_compra': '2024-01-15',
        'nota_fiscal': 'NF-API-001',
        'valor_total_bruto': '1500.00',
        'desconto': '0.00',
        'valor_total_liquido': '1500.00',
        'forma_pagamento': 'unico',
        'itens': json.dumps([
            {
                'material': material.id,
                'quantidade': 10.0,
                'valor_unitario': 150.0,
                'categoria_uso': 'estrutural'
            }
        ])
    }
    
    print("\n=== TESTE 1: PAGAMENTO UNICO VIA API ===")
    
    # Contar itens antes
    itens_antes = ItemCompra.objects.count()
    compras_antes = Compra.objects.count()
    
    print(f"Itens antes: {itens_antes}")
    print(f"Compras antes: {compras_antes}")
    
    # Fazer requisicao POST
    url = reverse('compra-list')
    response = client.post(url, compra_data, format='multipart')
    
    print(f"Status da resposta: {response.status_code}")
    
    if response.status_code == 201:
        print("Compra criada com sucesso")
        response_data = response.json()
        compra_id = response_data.get('id')
        
        # Verificar se os itens foram salvos
        itens_depois = ItemCompra.objects.count()
        compras_depois = Compra.objects.count()
        
        print(f"Itens depois: {itens_depois}")
        print(f"Compras depois: {compras_depois}")
        
        if itens_depois > itens_antes:
            print("Itens foram salvos corretamente")
            
            # Verificar detalhes dos itens
            itens = ItemCompra.objects.filter(compra_id=compra_id)
            for item in itens:
                print(f"  - Item: {item.material.nome}, Qtd: {item.quantidade}, Valor: {item.valor_unitario}")
        else:
            print("Itens NAO foram salvos")
    else:
        print(f"Erro na criacao da compra: {response.status_code}")
        print(f"Resposta: {response.content.decode()}")
    
    print("\n=== RESUMO FINAL ===")
    print(f"Total de compras no banco: {Compra.objects.count()}")
    print(f"Total de itens no banco: {ItemCompra.objects.count()}")

if __name__ == '__main__':
    test_api_endpoint()