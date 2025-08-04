#!/usr/bin/env python3
"""
Direct API test to verify if the 'tipo' field persistence issue is in the backend or frontend.
This script tests the API endpoints directly without involving the frontend.
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"

def get_auth_token():
    """Get authentication token for API requests"""
    login_data = {
        "login": "admin",  # Default admin user
        "password": "admin123"  # Default admin password
    }
    
    try:
        response = requests.post(f"{API_URL}/token/", json=login_data)
        if response.status_code == 200:
            token_data = response.json()
            return token_data.get('access')
        else:
            print(f"Failed to get auth token: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"Error getting auth token: {e}")
        return None

def test_tipo_persistence():
    print("=== Testing 'tipo' field persistence via direct API calls ===")
    
    # Get authentication token
    print("\n0. Getting authentication token...")
    token = get_auth_token()
    if not token:
        print("✗ Failed to get authentication token. Exiting.")
        return
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    print("✓ Authentication token obtained")
    
    # Step 1: Create a COMPRA
    print("\n1. Creating a COMPRA...")
    compra_data = {
        "obra": 1,  # Assuming obra with ID 1 exists
        "fornecedor": "Test Supplier",
        "data_compra": datetime.now().strftime("%Y-%m-%d"),
        "nota_fiscal": "NF123456",
        "valor_total_bruto": "1000.00",
        "desconto": "0.00",
        "observacoes": "Test purchase for tipo persistence",
        "tipo": "COMPRA",
        "itens": [
            {
                "material": 1,  # Assuming material with ID 1 exists
                "quantidade": 10,
                "valor_unitario": "100.00",
                "categoria_uso": "OBRA"
            }
        ]
    }
    
    try:
        response = requests.post(f"{API_URL}/compras/", json=compra_data, headers=headers)
        if response.status_code == 201:
            compra = response.json()
            compra_id = compra['id']
            print(f"✓ COMPRA created successfully with ID: {compra_id}")
            print(f"  Initial tipo: {compra.get('tipo')}")
            print(f"  Initial status_orcamento: {compra.get('status_orcamento')}")
        else:
            print(f"✗ Failed to create COMPRA: {response.status_code}")
            print(f"  Response: {response.text}")
            return
    except Exception as e:
        print(f"✗ Error creating COMPRA: {e}")
        return
    
    # Step 2: Update the COMPRA to ORCAMENTO
    print(f"\n2. Updating COMPRA {compra_id} to ORCAMENTO...")
    update_data = {
        "obra": compra['obra'],
        "fornecedor": compra['fornecedor'],
        "data_compra": compra['data_compra'],
        "nota_fiscal": compra['nota_fiscal'],
        "valor_total_bruto": compra['valor_total_bruto'],
        "desconto": compra['desconto'],
        "observacoes": compra['observacoes'],
        "tipo": "ORCAMENTO",  # Change to ORCAMENTO
        "itens": compra['itens']
    }
    
    try:
        response = requests.put(f"{API_URL}/compras/{compra_id}/", json=update_data, headers=headers)
        if response.status_code == 200:
            updated_compra = response.json()
            print(f"✓ COMPRA updated successfully")
            print(f"  Updated tipo: {updated_compra.get('tipo')}")
            print(f"  Updated status_orcamento: {updated_compra.get('status_orcamento')}")
        else:
            print(f"✗ Failed to update COMPRA: {response.status_code}")
            print(f"  Response: {response.text}")
            return
    except Exception as e:
        print(f"✗ Error updating COMPRA: {e}")
        return
    
    # Step 3: Fetch the updated COMPRA to verify persistence
    print(f"\n3. Fetching COMPRA {compra_id} to verify persistence...")
    try:
        response = requests.get(f"{API_URL}/compras/{compra_id}/", headers=headers)
        if response.status_code == 200:
            fetched_compra = response.json()
            print(f"✓ COMPRA fetched successfully")
            print(f"  Fetched tipo: {fetched_compra.get('tipo')}")
            print(f"  Fetched status_orcamento: {fetched_compra.get('status_orcamento')}")
            
            # Verify the change was persisted
            if fetched_compra.get('tipo') == 'ORCAMENTO':
                print("\n✓ SUCCESS: 'tipo' field was correctly persisted as ORCAMENTO")
            else:
                print(f"\n✗ FAILURE: 'tipo' field was not persisted correctly. Expected: ORCAMENTO, Got: {fetched_compra.get('tipo')}")
                
        else:
            print(f"✗ Failed to fetch COMPRA: {response.status_code}")
            print(f"  Response: {response.text}")
            return
    except Exception as e:
        print(f"✗ Error fetching COMPRA: {e}")
        return
    
    # Step 4: Clean up - delete the test COMPRA
    print(f"\n4. Cleaning up - deleting test COMPRA {compra_id}...")
    try:
        response = requests.delete(f"{API_URL}/compras/{compra_id}/", headers=headers)
        if response.status_code == 204:
            print("✓ Test COMPRA deleted successfully")
        else:
            print(f"⚠ Warning: Failed to delete test COMPRA: {response.status_code}")
    except Exception as e:
        print(f"⚠ Warning: Error deleting test COMPRA: {e}")
    
    print("\n=== Test completed ===")

if __name__ == "__main__":
    test_tipo_persistence()