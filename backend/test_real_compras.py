#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script para testar o sistema de compras de forma real e prática.
Cria 3 compras específicas via API e verifica se foram salvas corretamente.
"""

import requests
import json
import base64
from datetime import datetime, timedelta

# Configuração da API
BASE_URL = 'http://localhost:8000/api'
HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

def create_compra_1_complexa():
    """Compra complexa: múltiplos itens, valores variados, parcelada em 4x, com anexo"""
    print("\n=== CRIANDO COMPRA 1: COMPLEXA ===")
    
    # Criar um anexo simples (arquivo de texto base64)
    anexo_content = "Nota fiscal da compra complexa - Fornecedor XYZ Ltda"
    anexo_base64 = base64.b64encode(anexo_content.encode()).decode()
    
    compra_data = {
        "numero_processo": "PROC-2024-001",
        "descricao": "Compra complexa para teste - Equipamentos de escritório",
        "fornecedor": "Fornecedor XYZ Ltda",
        "valor_total": "15750.80",
        "data_compra": datetime.now().strftime('%Y-%m-%d'),
        "forma_pagamento": "parcelado",
        "numero_parcelas": 4,
        "tipo_compra": "compra",
        "status": "aprovada",
        "categoria_uso": "equipamentos",
        "observacoes": "Compra parcelada em 4x para equipamentos de escritório",
        "itens": [
            {
                "material": "Notebook Dell Inspiron 15",
                "quantidade": "3",
                "valor_unitario": "2500.00",
                "categoria_uso": "equipamentos"
            },
            {
                "material": "Monitor LG 24 polegadas",
                "quantidade": "6",
                "valor_unitario": "850.00",
                "categoria_uso": "equipamentos"
            },
            {
                "material": "Teclado mecânico",
                "quantidade": "3",
                "valor_unitario": "250.00",
                "categoria_uso": "equipamentos"
            },
            {
                "material": "Mouse óptico",
                "quantidade": "3",
                "valor_unitario": "75.80",
                "categoria_uso": "equipamentos"
            },
            {
                "material": "Cabo HDMI 2m",
                "quantidade": "6",
                "valor_unitario": "45.00",
                "categoria_uso": "equipamentos"
            }
        ],
        "anexos": [
            {
                "nome": "nota_fiscal_complexa.txt",
                "arquivo": anexo_base64,
                "tipo": "text/plain"
            }
        ]
    }
    
    try:
        response = requests.post(f'{BASE_URL}/compras/', json=compra_data, headers=HEADERS)
        print(f"Status: {response.status_code}")
        if response.status_code == 201:
            result = response.json()
            print(f"✅ Compra complexa criada com ID: {result['id']}")
            print(f"   - Valor total: R$ {result['valor_total']}")
            print(f"   - Itens: {len(result['itens'])}")
            print(f"   - Parcelas: {result['numero_parcelas']}")
            print(f"   - Anexos: {len(result.get('anexos', []))}")
            return result['id']
        else:
            print(f"❌ Erro ao criar compra complexa: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Exceção ao criar compra complexa: {str(e)}")
        return None

def create_compra_2_orcamento():
    """Compra de orçamento com características similares à complexa"""
    print("\n=== CRIANDO COMPRA 2: ORÇAMENTO ===")
    
    compra_data = {
        "numero_processo": "ORC-2024-002",
        "descricao": "Orçamento para equipamentos de TI - Setor Administrativo",
        "fornecedor": "TechSupply Informática",
        "valor_total": "12890.50",
        "data_compra": (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d'),
        "forma_pagamento": "parcelado",
        "numero_parcelas": 3,
        "tipo_compra": "orcamento",
        "status": "pendente",
        "categoria_uso": "equipamentos",
        "observacoes": "Orçamento para análise - equipamentos similares à compra anterior",
        "itens": [
            {
                "material": "Notebook Lenovo ThinkPad",
                "quantidade": "2",
                "valor_unitario": "3200.00",
                "categoria_uso": "equipamentos"
            },
            {
                "material": "Monitor Samsung 27 polegadas",
                "quantidade": "4",
                "valor_unitario": "950.00",
                "categoria_uso": "equipamentos"
            },
            {
                "material": "Impressora multifuncional",
                "quantidade": "1",
                "valor_unitario": "1890.50",
                "categoria_uso": "equipamentos"
            },
            {
                "material": "Roteador Wi-Fi 6",
                "quantidade": "2",
                "valor_unitario": "450.00",
                "categoria_uso": "equipamentos"
            }
        ]
    }
    
    try:
        response = requests.post(f'{BASE_URL}/compras/', json=compra_data, headers=HEADERS)
        print(f"Status: {response.status_code}")
        if response.status_code == 201:
            result = response.json()
            print(f"✅ Orçamento criado com ID: {result['id']}")
            print(f"   - Valor total: R$ {result['valor_total']}")
            print(f"   - Itens: {len(result['itens'])}")
            print(f"   - Parcelas: {result['numero_parcelas']}")
            print(f"   - Tipo: {result['tipo_compra']}")
            return result['id']
        else:
            print(f"❌ Erro ao criar orçamento: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Exceção ao criar orçamento: {str(e)}")
        return None

def create_compra_3_simples():
    """Compra simples: 1 produto, pagamento único"""
    print("\n=== CRIANDO COMPRA 3: SIMPLES ===")
    
    compra_data = {
        "numero_processo": "SIMP-2024-003",
        "descricao": "Compra simples - Cadeira ergonômica",
        "fornecedor": "Móveis & Cia",
        "valor_total": "890.00",
        "data_compra": (datetime.now() + timedelta(days=2)).strftime('%Y-%m-%d'),
        "forma_pagamento": "unico",
        "numero_parcelas": 1,
        "tipo_compra": "compra",
        "status": "aprovada",
        "categoria_uso": "mobiliario",
        "observacoes": "Compra simples com pagamento único",
        "itens": [
            {
                "material": "Cadeira ergonômica presidente",
                "quantidade": "1",
                "valor_unitario": "890.00",
                "categoria_uso": "mobiliario"
            }
        ]
    }
    
    try:
        response = requests.post(f'{BASE_URL}/compras/', json=compra_data, headers=HEADERS)
        print(f"Status: {response.status_code}")
        if response.status_code == 201:
            result = response.json()
            print(f"✅ Compra simples criada com ID: {result['id']}")
            print(f"   - Valor total: R$ {result['valor_total']}")
            print(f"   - Itens: {len(result['itens'])}")
            print(f"   - Forma pagamento: {result['forma_pagamento']}")
            return result['id']
        else:
            print(f"❌ Erro ao criar compra simples: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Exceção ao criar compra simples: {str(e)}")
        return None

def verify_compras_in_database(compra_ids):
    """Verifica se as compras foram salvas corretamente no banco"""
    print("\n=== VERIFICANDO DADOS NO BANCO ===")
    
    for compra_id in compra_ids:
        if compra_id:
            try:
                response = requests.get(f'{BASE_URL}/compras/{compra_id}/', headers=HEADERS)
                if response.status_code == 200:
                    compra = response.json()
                    print(f"\n📋 COMPRA ID {compra_id}:")
                    print(f"   - Processo: {compra['numero_processo']}")
                    print(f"   - Descrição: {compra['descricao']}")
                    print(f"   - Fornecedor: {compra['fornecedor']}")
                    print(f"   - Valor Total: R$ {compra['valor_total']}")
                    print(f"   - Forma Pagamento: {compra['forma_pagamento']}")
                    print(f"   - Parcelas: {compra['numero_parcelas']}")
                    print(f"   - Tipo: {compra['tipo_compra']}")
                    print(f"   - Status: {compra['status']}")
                    print(f"   - Categoria: {compra['categoria_uso']}")
                    
                    # Verificar itens
                    print(f"   - ITENS ({len(compra['itens'])}):")
                    for i, item in enumerate(compra['itens'], 1):
                        print(f"     {i}. {item['material']} - Qtd: {item['quantidade']} - Valor: R$ {item['valor_unitario']}")
                    
                    # Verificar anexos
                    anexos = compra.get('anexos', [])
                    if anexos:
                        print(f"   - ANEXOS ({len(anexos)}):")
                        for i, anexo in enumerate(anexos, 1):
                            print(f"     {i}. {anexo['nome']} - Tipo: {anexo.get('tipo', 'N/A')}")
                    else:
                        print(f"   - ANEXOS: Nenhum")
                    
                    print(f"   ✅ Compra verificada com sucesso!")
                else:
                    print(f"   ❌ Erro ao buscar compra {compra_id}: {response.text}")
            except Exception as e:
                print(f"   ❌ Exceção ao verificar compra {compra_id}: {str(e)}")

def main():
    """Função principal do teste"""
    print("🚀 INICIANDO TESTE REAL DO SISTEMA DE COMPRAS")
    print("=" * 50)
    
    # Criar as 3 compras
    compra_ids = []
    
    # 1. Compra complexa
    id1 = create_compra_1_complexa()
    compra_ids.append(id1)
    
    # 2. Orçamento
    id2 = create_compra_2_orcamento()
    compra_ids.append(id2)
    
    # 3. Compra simples
    id3 = create_compra_3_simples()
    compra_ids.append(id3)
    
    # Verificar se foram salvas no banco
    verify_compras_in_database(compra_ids)
    
    # Resumo final
    print("\n" + "=" * 50)
    print("📊 RESUMO DO TESTE:")
    successful_compras = [id for id in compra_ids if id is not None]
    print(f"   - Compras criadas com sucesso: {len(successful_compras)}/3")
    print(f"   - IDs das compras: {successful_compras}")
    
    if len(successful_compras) == 3:
        print("   ✅ TESTE CONCLUÍDO COM SUCESSO!")
        print("   🎉 Todas as compras foram criadas e salvas corretamente!")
    else:
        print("   ❌ TESTE FALHOU!")
        print("   ⚠️  Nem todas as compras foram criadas com sucesso.")
    
    print("=" * 50)

if __name__ == '__main__':
    main()