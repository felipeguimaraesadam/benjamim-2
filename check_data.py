#!/usr/bin/env python3
"""
Check available data in the database for testing.
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"

def get_auth_token():
    """Get authentication token for API requests"""
    login_data = {
        "login": "admin",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{API_URL}/token/", json=login_data)
        if response.status_code == 200:
            token_data = response.json()
            return token_data.get('access')
        else:
            print(f"Failed to get auth token: {response.status_code}")
            return None
    except Exception as e:
        print(f"Error getting auth token: {e}")
        return None

def check_available_data():
    print("=== Checking available data ===")
    
    # Get authentication token
    token = get_auth_token()
    if not token:
        print("Failed to get authentication token")
        return
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Check obras
    print("\n1. Checking obras...")
    try:
        response = requests.get(f"{API_URL}/obras/", headers=headers)
        if response.status_code == 200:
            obras_data = response.json()
            print(f"Raw obras response type: {type(obras_data)}")
            if isinstance(obras_data, dict) and 'results' in obras_data:
                obras = obras_data['results']
            else:
                obras = obras_data
            
            if obras:
                print(f"Found {len(obras)} obras:")
                for i, obra in enumerate(obras):
                    if i >= 3:  # Show first 3
                        break
                    print(f"  ID: {obra['id']}, Name: {obra['nome_obra']}")
            else:
                print("No obras found")
        else:
            print(f"Failed to get obras: {response.status_code}")
    except Exception as e:
        print(f"Error getting obras: {e}")
    
    # Check materials
    print("\n2. Checking materials...")
    try:
        response = requests.get(f"{API_URL}/materiais/", headers=headers)
        if response.status_code == 200:
            materials_data = response.json()
            print(f"Raw materials response type: {type(materials_data)}")
            if isinstance(materials_data, dict) and 'results' in materials_data:
                materials = materials_data['results']
            else:
                materials = materials_data
            
            if materials:
                print(f"Found {len(materials)} materials:")
                for i, material in enumerate(materials):
                    if i >= 3:  # Show first 3
                        break
                    print(f"  ID: {material['id']}, Name: {material['nome']}")
            else:
                print("No materials found")
        else:
            print(f"Failed to get materials: {response.status_code}")
    except Exception as e:
        print(f"Error getting materials: {e}")
    
    # Check categoria_uso choices
    print("\n3. Checking ItemCompra model for categoria_uso choices...")
    # We'll need to check the model definition for valid choices
    
if __name__ == "__main__":
    check_available_data()