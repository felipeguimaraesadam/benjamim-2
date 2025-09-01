#!/usr/bin/env python
import os
import sys
import django
import requests
import json
from datetime import date, datetime

# --- Test Report Setup ---
test_results = {
    "test_name": "Criação de Compra via API",
    "timestamp": datetime.now().isoformat(),
    "summary": {
        "total_tests": 0,
        "passed_tests": 0,
        "failed_tests": 0,
        "success_rate": 0.0
    },
    "details": []
}

def add_test_detail(name, success, message, details=None):
    """Adiciona um resultado de teste detalhado."""
    test_results["summary"]["total_tests"] += 1
    if success:
        test_results["summary"]["passed_tests"] += 1
    else:
        test_results["summary"]["failed_tests"] += 1

    test_results["details"].append({
        "check_name": name,
        "status": "PASS" if success else "FAIL",
        "message": message,
        "details": details or {}
    })

def generate_report():
    """Calcula o resumo e gera o arquivo JSON do relatório."""
    summary = test_results["summary"]
    if summary["total_tests"] > 0:
        summary["success_rate"] = (summary["passed_tests"] / summary["total_tests"]) * 100
    else:
        summary["success_rate"] = 0.0

    report_filename = f"../integration_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_filename, 'w', encoding='utf-8') as f:
        json.dump(test_results, f, indent=2, ensure_ascii=False)

    print(f"\n📄 Relatório de teste de integração salvo em: {report_filename}")
    # Retorna um código de saída baseado no sucesso
    return summary["failed_tests"] == 0

# --- Django Setup ---
def setup_django():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
    sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))
    try:
        django.setup()
        return True
    except Exception as e:
        add_test_detail("Configuração Django", False, f"Falha ao configurar Django: {e}")
        return False

# --- Test Logic ---
def test_compra_creation():
    from core.models import Compra, Obra, Material
    from decimal import Decimal

    print("=== TESTE DE CRIAÇÃO DE COMPRA ===")
    
    # 1. Verificar se existem obras no banco
    obras = Obra.objects.all()
    if obras.exists():
        obra = obras.first()
        add_test_detail("Verificar Obras", True, f"Obra encontrada: {obra.nome_obra} (ID: {obra.id})")
    else:
        add_test_detail("Verificar Obras", False, "Nenhuma obra encontrada no banco de dados.")
        return False # Aborta o teste

    # 2. Verificar se existem materiais no banco
    materiais = Material.objects.all()
    if materiais.exists():
        material = materiais.first()
        add_test_detail("Verificar Materiais", True, f"Material encontrado: {material.nome} (ID: {material.id})")
    else:
        add_test_detail("Verificar Materiais", False, "Nenhum material encontrado no banco de dados.")
        return False # Aborta o teste

    # 3. Preparar dados e testar via API
    try:
        form_data = {
            'obra': str(obra.id),
            'fornecedor': 'Fornecedor Teste API',
            'data_compra': date.today().isoformat(),
            'nota_fiscal': f'NF-API-{int(datetime.now().timestamp())}',
            'valor_total_bruto': '1000.00',
            'desconto': '50.00',
            'observacoes': 'Compra de teste via API',
            'tipo': 'COMPRA',
            'forma_pagamento': 'AVISTA',
            'numero_parcelas': '1',
            'itens': json.dumps([{'material': material.id, 'quantidade': '10.000', 'valor_unitario': '100.00'}]),
            'pagamento_parcelado': json.dumps({'tipo': 'UNICO', 'parcelas': []})
        }
        
        response = requests.post('http://localhost:8000/api/compras/', data=form_data)
        
        if response.status_code == 201:
            compra_criada = response.json()
            compra_id = compra_criada['id']
            add_test_detail("Criação de Compra via API", True, f"Compra criada com sucesso (ID: {compra_id}).", {"status_code": 201, "response": compra_criada})
            
            # 4. Verificar no banco de dados
            try:
                compra_db = Compra.objects.get(id=compra_id)
                add_test_detail("Verificação no Banco de Dados", True, f"Compra ID {compra_id} encontrada no banco.")
                # Adicionar mais verificações se necessário (ex: valores)
                return True
            except Compra.DoesNotExist:
                add_test_detail("Verificação no Banco de Dados", False, f"Compra com ID {compra_id} não encontrada no banco após criação.")
                return False
        else:
            add_test_detail("Criação de Compra via API", False, f"Falha ao criar compra. Status: {response.status_code}", {"status_code": response.status_code, "response_text": response.text})
            return False
            
    except Exception as e:
        add_test_detail("Criação de Compra via API", False, f"Erro na requisição: {str(e)}")
        return False

# --- Main Execution ---
if __name__ == '__main__':
    if not setup_django():
        generate_report()
        sys.exit(1)

    test_compra_creation()

    print("\n=== FIM DO TESTE ===")

    if not generate_report():
        sys.exit(1)
    sys.exit(0)