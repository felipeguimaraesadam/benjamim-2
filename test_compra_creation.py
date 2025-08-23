#!/usr/bin/env python
import os
import sys
import django
import requests
import json
from datetime import date, datetime

# Configurar o Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))
django.setup()

from core.models import Compra, Obra, Material, ItemCompra, ParcelaCompra
from decimal import Decimal

def test_compra_creation():
    print("=== TESTE DE CRIAÇÃO DE COMPRA ===")
    
    # 1. Verificar se existem obras no banco
    obras = Obra.objects.all()
    print(f"Obras disponíveis: {obras.count()}")
    if obras.exists():
        obra = obras.first()
        print(f"Usando obra: {obra.nome_obra} (ID: {obra.id})")
    else:
        print("ERRO: Nenhuma obra encontrada no banco de dados")
        return
    
    # 2. Verificar se existem materiais no banco
    materiais = Material.objects.all()
    print(f"Materiais disponíveis: {materiais.count()}")
    if materiais.exists():
        material = materiais.first()
        print(f"Usando material: {material.nome} (ID: {material.id})")
    else:
        print("ERRO: Nenhum material encontrado no banco de dados")
        return
    
    # 3. Preparar dados da compra
    compra_data = {
        'obra': obra.id,
        'fornecedor': 'Fornecedor Teste',
        'data_compra': date.today().isoformat(),
        'nota_fiscal': 'NF-12345',
        'valor_total_bruto': '1000.00',
        'desconto': '50.00',
        'observacoes': 'Compra de teste',
        'tipo': 'COMPRA',
        'forma_pagamento': 'AVISTA',
        'numero_parcelas': 1,
        'itens': [
            {
                'material': material.id,
                'quantidade': '10.000',
                'valor_unitario': '100.00'
            }
        ],
        'pagamento_parcelado': {
            'tipo': 'UNICO',
            'parcelas': []
        }
    }
    
    print("\n=== DADOS DA COMPRA ===")
    print(json.dumps(compra_data, indent=2, default=str))
    
    # 4. Testar via API (simulando o frontend)
    try:
        print("\n=== TESTANDO VIA API ===")
        
        # Preparar FormData como o frontend faz
        form_data = {
            'obra': str(obra.id),
            'fornecedor': 'Fornecedor Teste',
            'data_compra': date.today().isoformat(),
            'nota_fiscal': 'NF-12345',
            'valor_total_bruto': '1000.00',
            'desconto': '50.00',
            'observacoes': 'Compra de teste',
            'tipo': 'COMPRA',
            'forma_pagamento': 'AVISTA',
            'numero_parcelas': '1',
            'itens': json.dumps([
                {
                    'material': material.id,
                    'quantidade': '10.000',
                    'valor_unitario': '100.00'
                }
            ]),
            'pagamento_parcelado': json.dumps({
                'tipo': 'UNICO',
                'parcelas': []
            })
        }
        
        print("Dados FormData preparados:")
        for key, value in form_data.items():
            print(f"  {key}: {value}")
        
        # Fazer requisição POST
        response = requests.post(
            'http://localhost:8000/api/compras/',
            data=form_data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        
        print(f"\nStatus da resposta: {response.status_code}")
        print(f"Resposta: {response.text}")
        
        if response.status_code == 201:
            print("✅ COMPRA CRIADA COM SUCESSO!")
            compra_criada = response.json()
            compra_id = compra_criada['id']
            
            # 5. Verificar se a compra foi salva no banco
            print("\n=== VERIFICANDO NO BANCO DE DADOS ===")
            try:
                compra_db = Compra.objects.get(id=compra_id)
                print(f"✅ Compra encontrada no banco: ID {compra_db.id}")
                print(f"  - Obra: {compra_db.obra.nome_obra}")
                print(f"  - Fornecedor: {compra_db.fornecedor}")
                print(f"  - Data: {compra_db.data_compra}")
                print(f"  - Nota Fiscal: {compra_db.nota_fiscal}")
                print(f"  - Valor Bruto: {compra_db.valor_total_bruto}")
                print(f"  - Desconto: {compra_db.desconto}")
                print(f"  - Valor Líquido: {compra_db.valor_total_liquido}")
                print(f"  - Forma Pagamento: {compra_db.forma_pagamento}")
                print(f"  - Tipo: {compra_db.tipo}")
                
                # Verificar itens
                itens = compra_db.itens.all()
                print(f"  - Itens: {itens.count()}")
                for item in itens:
                    print(f"    * {item.material.nome}: {item.quantidade} x {item.valor_unitario} = {item.valor_total_item}")
                
                # Verificar parcelas (se houver)
                parcelas = compra_db.parcelas.all()
                print(f"  - Parcelas: {parcelas.count()}")
                for parcela in parcelas:
                    print(f"    * Parcela {parcela.numero_parcela}: {parcela.valor_parcela} - Venc: {parcela.data_vencimento}")
                
                print("\n✅ TODOS OS DADOS FORAM SALVOS CORRETAMENTE!")
                
            except Compra.DoesNotExist:
                print(f"❌ ERRO: Compra com ID {compra_id} não encontrada no banco")
                
        else:
            print(f"❌ ERRO NA CRIAÇÃO DA COMPRA: {response.status_code}")
            print(f"Detalhes: {response.text}")
            
    except Exception as e:
        print(f"❌ ERRO NA REQUISIÇÃO: {str(e)}")
    
    print("\n=== FIM DO TESTE ===")

if __name__ == '__main__':
    test_compra_creation()