#!/usr/bin/env python
import requests
import json
from django.core.management.base import BaseCommand
from core.models import Compra, Obra, Material, Usuario as User

def get_auth_token():
    """Get authentication token for API requests"""
    login_url = 'http://localhost:8000/api/token/'
    credentials = {
        'username': 'admin',
        'password': 'admin123'
    }
    
    try:
        response = requests.post(login_url, json=credentials)
        if response.status_code == 200:
            token_data = response.json()
            return token_data.get('access')
        else:
            print(f"Failed to get token. Status: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"Error getting token: {e}")
        return None

def test_tipo_field_persistence():
    """Test if the 'tipo' field is properly saved when editing a compra"""
    print("=== Testing 'tipo' field persistence ===")
    
    # Get authentication token
    token = get_auth_token()
    if not token:
        print("Failed to get authentication token")
        return False
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Get existing obras and materiais
    obras_response = requests.get('http://localhost:8000/api/obras/', headers=headers)
    materiais_response = requests.get('http://localhost:8000/api/materiais/', headers=headers)
    
    if obras_response.status_code != 200 or materiais_response.status_code != 200:
        print(f"Failed to get obras or materiais. Obras: {obras_response.status_code}, Materiais: {materiais_response.status_code}")
        return False
    
    obras_data = obras_response.json()
    materiais_data = materiais_response.json()
    
    # Handle paginated responses
    obras = obras_data.get('results', obras_data) if isinstance(obras_data, dict) else obras_data
    materiais = materiais_data.get('results', materiais_data) if isinstance(materiais_data, dict) else materiais_data
    
    if not obras or not materiais:
        print("No obras or materiais found")
        return False
    
    obra_id = obras[0]['id']
    material_id = materiais[0]['id']
    
    # Step 1: Create a COMPRA
    compra_data = {
        'obra': obra_id,
        'tipo': 'COMPRA',
        'observacoes': 'Test compra for tipo persistence',
        'desconto': 0,
        'items': [{
            'material': material_id,
            'quantidade': 10,
            'valor_unitario': 15.50,
            'categoria_uso': 'ESTRUTURA'
        }]
    }
    
    print("Creating COMPRA...")
    create_response = requests.post('http://localhost:8000/api/compras/', 
                                  json=compra_data, headers=headers)
    
    if create_response.status_code != 201:
        print(f"Failed to create COMPRA. Status: {create_response.status_code}")
        print(f"Response: {create_response.text}")
        return False
    
    compra_created = create_response.json()
    compra_id = compra_created['id']
    print(f"COMPRA created with ID: {compra_id}")
    print(f"Initial tipo: {compra_created.get('tipo')}")
    
    # Step 2: Update the COMPRA to ORCAMENTO (simulating frontend edit)
    update_data = {
        'obra': obra_id,
        'tipo': 'ORCAMENTO',  # This is the key change
        'observacoes': 'Updated to ORCAMENTO via API',
        'desconto': 0,
        'items': [{
            'material': material_id,
            'quantidade': 10,
            'valor_unitario': 15.50,
            'categoria_uso': 'ESTRUTURA'
        }]
    }
    
    print("\nUpdating COMPRA to ORCAMENTO...")
    update_response = requests.put(f'http://localhost:8000/api/compras/{compra_id}/', 
                                 json=update_data, headers=headers)
    
    if update_response.status_code != 200:
        print(f"Failed to update COMPRA. Status: {update_response.status_code}")
        print(f"Response: {update_response.text}")
        return False
    
    compra_updated = update_response.json()
    print(f"Update response tipo: {compra_updated.get('tipo')}")
    
    # Step 3: Fetch the compra again to verify it was saved correctly
    print("\nFetching updated COMPRA to verify...")
    fetch_response = requests.get(f'http://localhost:8000/api/compras/{compra_id}/', headers=headers)
    
    if fetch_response.status_code != 200:
        print(f"Failed to fetch COMPRA. Status: {fetch_response.status_code}")
        return False
    
    compra_fetched = fetch_response.json()
    print(f"Fetched tipo: {compra_fetched.get('tipo')}")
    
    # Step 4: Check directly in the database
    print("\nChecking database directly...")
    try:
        compra_db = Compra.objects.get(id=compra_id)
        print(f"Database tipo: {compra_db.tipo}")
        
        # Verify the tipo was actually saved as ORCAMENTO
        if compra_db.tipo == 'ORCAMENTO':
            print("✅ SUCCESS: 'tipo' field was correctly saved as ORCAMENTO")
            success = True
        else:
            print(f"❌ FAILURE: 'tipo' field was not saved correctly. Expected: ORCAMENTO, Got: {compra_db.tipo}")
            success = False
            
    except Compra.DoesNotExist:
        print(f"❌ FAILURE: COMPRA with ID {compra_id} not found in database")
        success = False
    
    # Step 5: Clean up
    print("\nCleaning up...")
    delete_response = requests.delete(f'http://localhost:8000/api/compras/{compra_id}/', headers=headers)
    if delete_response.status_code == 204:
        print("Test data cleaned up successfully")
    else:
        print(f"Warning: Failed to clean up test data. Status: {delete_response.status_code}")
    
    return success

if __name__ == '__main__':
    success = test_tipo_field_persistence()
    if success:
        print("\n🎉 Test PASSED: The 'tipo' field persistence is working correctly")
    else:
        print("\n💥 Test FAILED: There is an issue with 'tipo' field persistence")