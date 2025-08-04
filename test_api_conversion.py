import requests
import json
from datetime import date
from decimal import Decimal

def get_auth_token():
    """Obtém token de autenticação JWT"""
    login_url = 'http://localhost:8000/api/token/'
    
    # Credenciais de teste - você pode ajustar conforme necessário
    credentials = {
        'login': 'admin',  # ou outro usuário de teste
        'password': 'admin123'  # ou outra senha de teste
    }
    
    try:
        response = requests.post(login_url, json=credentials)
        if response.status_code == 200:
            data = response.json()
            return data.get('access')
        else:
            print(f"Erro no login: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Erro ao fazer login: {str(e)}")
        return None

def test_api_conversion():
    try:
        print("=== Teste de Conversão via API ===")
        
        # Primeiro, obter token de autenticação
        print("Obtendo token de autenticação...")
        token = get_auth_token()
        if not token:
            print("✗ Falha na autenticação. Verifique as credenciais.")
            return
            
        print("✓ Token obtido com sucesso")
        
        # Headers com autenticação
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        base_url = 'http://localhost:8000/api'
        
        # First, let's get existing obras and materials
        print("Verificando dados existentes...")
        obras_response = requests.get(f'{base_url}/obras/', headers=headers)
        materiais_response = requests.get(f'{base_url}/materiais/', headers=headers)
        
        print(f"Status obras: {obras_response.status_code}")
        print(f"Status materiais: {materiais_response.status_code}")
        
        if obras_response.status_code != 200:
            print(f"✗ Erro ao buscar obras: {obras_response.text}")
            return
            
        if materiais_response.status_code != 200:
            print(f"✗ Erro ao buscar materiais: {materiais_response.text}")
            return
            
        obras_data = obras_response.json()
        materiais_data = materiais_response.json()
        
        # Extrair os resultados da paginação
        obras = obras_data.get('results', obras_data) if isinstance(obras_data, dict) else obras_data
        materiais = materiais_data.get('results', materiais_data) if isinstance(materiais_data, dict) else materiais_data
        
        print(f"Obras encontradas: {len(obras) if isinstance(obras, list) else 'N/A'}")
        print(f"Materiais encontrados: {len(materiais) if isinstance(materiais, list) else 'N/A'}")
        
        # Verificar se as respostas são listas e não estão vazias
        if not isinstance(obras, list) or not obras:
            print("✗ Não há obras cadastradas para teste")
            print("Dados de obras:", obras_data)
            return
            
        if not isinstance(materiais, list) or not materiais:
            print("✗ Não há materiais cadastrados para teste")
            print("Dados de materiais:", materiais_data)
            return
            
        obra_id = obras[0]['id']
        material_id = materiais[0]['id']
        
        print(f"✓ Usando obra ID: {obra_id} e material ID: {material_id}")
        
        # Create a COMPRA via API
        compra_data = {
            'obra': obra_id,
            'fornecedor': 'Fornecedor API Teste',
            'data_compra': date.today().isoformat(),
            'tipo': 'COMPRA',
            'status_orcamento': 'APROVADO',
            'nota_fiscal': 'NF-API-123',
            'itens': [{
                'material': material_id,
                'quantidade': 2,
                'valor_unitario': '15.00',
                'categoria_uso': 'Geral'
            }]
        }
        
        print("\n--- Teste 1: Criar COMPRA via API ---")
        
        response = requests.post(
            f'{base_url}/compras/',
            json=compra_data,
            headers=headers
        )
        
        if response.status_code == 201:
            compra = response.json()
            print(f"✓ COMPRA criada - ID: {compra['id']}, Tipo: {compra['tipo']}, Status: {compra['status_orcamento']}")
            
            # Test conversion to ORCAMENTO
            print("\n--- Teste 2: Converter COMPRA para ORCAMENTO via API ---")
            
            update_data = {'tipo': 'ORCAMENTO'}
            
            response = requests.patch(
                f'{base_url}/compras/{compra["id"]}/',
                json=update_data,
                headers=headers
            )
            
            if response.status_code == 200:
                updated_compra = response.json()
                print(f"✓ Conversão realizada - Tipo: {updated_compra['tipo']}, Status: {updated_compra['status_orcamento']}")
                
                if updated_compra['tipo'] == 'ORCAMENTO' and updated_compra['status_orcamento'] == 'PENDENTE':
                    print("✓ SUCESSO: Conversão via API funcionou corretamente!")
                    
                    # Test conversion back to COMPRA
                    print("\n--- Teste 3: Converter ORCAMENTO de volta para COMPRA via API ---")
                    
                    update_data = {'tipo': 'COMPRA'}
                    
                    response = requests.patch(
                        f'{base_url}/compras/{compra["id"]}/',
                        json=update_data,
                        headers=headers
                    )
                    
                    if response.status_code == 200:
                        final_compra = response.json()
                        print(f"✓ Conversão de volta realizada - Tipo: {final_compra['tipo']}, Status: {final_compra['status_orcamento']}")
                        
                        if final_compra['tipo'] == 'COMPRA' and final_compra['status_orcamento'] == 'APROVADO':
                            print("✓ SUCESSO: Conversão de volta via API funcionou corretamente!")
                        else:
                            print(f"✗ FALHA: Conversão de volta não funcionou. Tipo: {final_compra['tipo']}, Status: {final_compra['status_orcamento']}")
                    else:
                        print(f"✗ Erro ao converter de volta: {response.status_code}")
                        print(f"Resposta: {response.text}")
                else:
                    print(f"✗ FALHA: Conversão não funcionou. Tipo: {updated_compra['tipo']}, Status: {updated_compra['status_orcamento']}")
            else:
                print(f"✗ Erro ao converter para ORCAMENTO: {response.status_code}")
                print(f"Resposta: {response.text}")
                
            # Clean up
            print("\n--- Limpeza ---")
            delete_response = requests.delete(f'{base_url}/compras/{compra["id"]}/', headers=headers)
            if delete_response.status_code == 204:
                print("✓ Compra de teste removida")
            else:
                print(f"Aviso: Não foi possível remover a compra de teste (status: {delete_response.status_code})")
                
        else:
            print(f"✗ Erro ao criar COMPRA: {response.status_code}")
            print(f"Resposta: {response.text}")
            
    except Exception as e:
        print(f"✗ Erro durante o teste: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_api_conversion()