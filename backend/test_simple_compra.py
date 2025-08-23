#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script simples para testar uma compra via API
"""

import requests
import json
from datetime import datetime

# Configuração da API
BASE_URL = 'http://localhost:8000/api'
HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

def test_simple_compra():
    """Teste simples de uma compra"""
    print("🧪 Testando criação de compra simples...")
    
    compra_data = {
        "numero_processo": "TEST-001",
        "descricao": "Teste simples",
        "fornecedor": "Fornecedor Teste",
        "valor_total": "100.00",
        "data_compra": datetime.now().strftime('%Y-%m-%d'),
        "forma_pagamento": "unico",
        "numero_parcelas": 1,
        "tipo_compra": "compra",
        "status": "aprovada",
        "categoria_uso": "equipamentos",
        "observacoes": "Teste",
        "itens": [
            {
                "material": "Item teste",
                "quantidade": "1",
                "valor_unitario": "100.00",
                "categoria_uso": "equipamentos"
            }
        ]
    }
    
    try:
        print(f"Fazendo POST para: {BASE_URL}/compras/")
        print(f"Dados: {json.dumps(compra_data, indent=2)}")
        
        response = requests.post(f'{BASE_URL}/compras/', json=compra_data, headers=HEADERS, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Text: {response.text}")
        
        if response.status_code == 201:
            result = response.json()
            print(f"✅ Compra criada com sucesso! ID: {result['id']}")
            return result['id']
        else:
            print(f"❌ Erro: {response.status_code} - {response.text}")
            return None
            
    except requests.exceptions.ConnectionError as e:
        print(f"❌ Erro de conexão: {e}")
        print("Verifique se o servidor Django está rodando na porta 8000")
        return None
    except requests.exceptions.Timeout as e:
        print(f"❌ Timeout: {e}")
        return None
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        return None

def test_get_compras():
    """Teste para listar compras"""
    print("\n📋 Testando listagem de compras...")
    
    try:
        response = requests.get(f'{BASE_URL}/compras/', headers=HEADERS, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            compras = response.json()
            print(f"✅ {len(compras)} compras encontradas")
            for compra in compras:
                print(f"   - ID: {compra['id']} | Processo: {compra['numero_processo']} | Valor: R$ {compra['valor_total']}")
        else:
            print(f"❌ Erro ao listar: {response.text}")
            
    except Exception as e:
        print(f"❌ Erro ao listar compras: {e}")

if __name__ == '__main__':
    print("🚀 TESTE SIMPLES DO SISTEMA DE COMPRAS")
    print("=" * 40)
    
    # Primeiro, testar se conseguimos listar compras
    test_get_compras()
    
    # Depois, tentar criar uma compra
    compra_id = test_simple_compra()
    
    # Listar novamente para ver se foi criada
    if compra_id:
        test_get_compras()
    
    print("=" * 40)