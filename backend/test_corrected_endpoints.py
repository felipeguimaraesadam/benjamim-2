#!/usr/bin/env python
import os
import sys
import django
import requests
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from core.models import Obra, AnexoS3

def test_corrected_endpoints():
    # Get or create token
    User = get_user_model()
    user = User.objects.filter(is_superuser=True).first() or User.objects.first()
    if not user:
        print("No users found in database")
        return
    
    token, created = Token.objects.get_or_create(user=user)
    headers = {"Authorization": f"Token {token.key}"}
    
    print(f"Testing with user: {user.login}")
    print(f"Token: {token.key}")
    print("=" * 50)
    
    # Test 1: Get anexos and test download with correct anexo_id
    print("\n1. Testing /api/anexos-s3/{anexo_id}/download/ with correct anexo_id")
    try:
        # First get list of anexos
        r1 = requests.get("http://localhost:8000/api/anexos-s3/", headers=headers)
        if r1.status_code == 200:
            anexos_data = r1.json()
            if anexos_data['results']:
                anexo = anexos_data['results'][0]
                anexo_id = anexo['anexo_id']  # Use anexo_id, not id
                print(f"Testing download for anexo_id: {anexo_id}")
                print(f"Anexo details: ID={anexo['id']}, anexo_id={anexo_id}, nome={anexo['nome_original']}")
                
                # Test download endpoint with correct anexo_id
                r2 = requests.get(f"http://localhost:8000/api/anexos-s3/{anexo_id}/download/", headers=headers)
                print(f"Download Status: {r2.status_code}")
                print(f"Download Headers: {dict(r2.headers)}")
                if r2.status_code != 200:
                    print(f"Download Content: {r2.text[:500]}")
                else:
                    print(f"Download successful, content length: {len(r2.content)} bytes")
            else:
                print("No anexos found to test download")
        else:
            print(f"Failed to get anexos list: {r1.status_code} - {r1.text[:200]}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 2: POST /anexos-s3/ with correct field names
    print("\n2. Testing POST /api/anexos-s3/ with correct field names")
    try:
        # Create a test file
        test_content = "This is a test file for upload"
        files = {
            'files': ('test_upload_corrected.txt', test_content, 'text/plain')
        }
        data = {
            'entity_type': 'documento',
            'entity_id': '1'  # Optional
        }
        
        r3 = requests.post("http://localhost:8000/api/anexos-s3/", headers=headers, files=files, data=data)
        print(f"Upload Status: {r3.status_code}")
        print(f"Upload Content: {r3.text[:500]}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 3: Alternative upload endpoint
    print("\n3. Testing POST /api/anexos-s3/upload_file/ endpoint")
    try:
        # Create a test file
        test_content = "This is another test file for upload"
        files = {
            'file': ('test_upload_alt.txt', test_content, 'text/plain')
        }
        data = {
            'anexo_type': 'documento',
            'object_id': '1'  # Optional
        }
        
        r4 = requests.post("http://localhost:8000/api/anexos-s3/upload_file/", headers=headers, files=files, data=data)
        print(f"Alternative Upload Status: {r4.status_code}")
        print(f"Alternative Upload Content: {r4.text[:500]}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 4: Check database for anexos
    print("\n4. Checking AnexoS3 database records")
    try:
        anexos = AnexoS3.objects.all()[:5]
        print(f"Total anexos in database: {AnexoS3.objects.count()}")
        for anexo in anexos:
            print(f"  - ID: {anexo.id}, anexo_id: {anexo.anexo_id}, nome: {anexo.nome_original}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 5: Test obras endpoint that was returning HTML
    print("\n5. Testing /api/obras/{id}/gastos-por-categoria-material/ (API endpoint)")
    try:
        first_obra = Obra.objects.first()
        if first_obra:
            # Test API endpoint (should return JSON)
            r5 = requests.get(f"http://localhost:8000/api/obras/{first_obra.pk}/gastos-por-categoria-material/", headers=headers)
            print(f"API endpoint Status: {r5.status_code}")
            if r5.status_code == 200:
                print(f"API endpoint Content (first 300 chars): {r5.text[:300]}")
                # Check if it's JSON or HTML
                if r5.text.strip().startswith('{') or r5.text.strip().startswith('['):
                    print("✓ API endpoint returns JSON as expected")
                else:
                    print("✗ API endpoint returns HTML instead of JSON")
            else:
                print(f"API endpoint Error: {r5.text[:300]}")
        else:
            print("No obras found")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_corrected_endpoints()