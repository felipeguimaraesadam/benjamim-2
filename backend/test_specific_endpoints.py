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
from core.models import Obra

def test_specific_endpoints():
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
    
    # Test 1: /api/locacoes/semanal/ with required parameters
    print("\n1. Testing /api/locacoes/semanal/ with required 'inicio' parameter")
    try:
        # Get current date and format it
        inicio = datetime.now().strftime('%Y-%m-%d')
        r1 = requests.get(f"http://localhost:8000/api/locacoes/semanal/?inicio={inicio}", headers=headers)
        print(f"Status: {r1.status_code}")
        print(f"Content: {r1.text[:500]}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 2: /anexos-s3/{id}/download/ - first get available anexos
    print("\n2. Testing /api/anexos-s3/{id}/download/")
    try:
        # First get list of anexos
        r2 = requests.get("http://localhost:8000/api/anexos-s3/", headers=headers)
        if r2.status_code == 200:
            anexos_data = r2.json()
            if anexos_data['results']:
                anexo_id = anexos_data['results'][0]['id']
                print(f"Testing download for anexo ID: {anexo_id}")
                
                # Test download endpoint
                r3 = requests.get(f"http://localhost:8000/api/anexos-s3/{anexo_id}/download/", headers=headers)
                print(f"Download Status: {r3.status_code}")
                print(f"Download Headers: {dict(r3.headers)}")
                if r3.status_code != 200:
                    print(f"Download Content: {r3.text[:500]}")
                else:
                    print(f"Download successful, content length: {len(r3.content)} bytes")
            else:
                print("No anexos found to test download")
        else:
            print(f"Failed to get anexos list: {r2.status_code} - {r2.text[:200]}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 3: POST /anexos-s3/ - test file upload
    print("\n3. Testing POST /api/anexos-s3/ (file upload)")
    try:
        # Create a test file
        test_content = "This is a test file for upload"
        files = {
            'arquivo': ('test_upload.txt', test_content, 'text/plain')
        }
        data = {
            'nome_original': 'test_upload.txt',
            'tipo_anexo': 'documento'
        }
        
        r4 = requests.post("http://localhost:8000/api/anexos-s3/", headers=headers, files=files, data=data)
        print(f"Upload Status: {r4.status_code}")
        print(f"Upload Content: {r4.text[:500]}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 4: Check URL patterns for obras gastos
    print("\n4. Testing different URL patterns for obras gastos")
    try:
        # Test with existing obra
        first_obra = Obra.objects.first()
        if first_obra:
            # Test API endpoint
            r5 = requests.get(f"http://localhost:8000/api/obras/{first_obra.pk}/gastos-por-categoria-material/", headers=headers)
            print(f"API endpoint Status: {r5.status_code}")
            if r5.status_code != 200:
                print(f"API endpoint Content: {r5.text[:300]}")
            else:
                print(f"API endpoint successful")
        else:
            print("No obras found")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_specific_endpoints()