#!/usr/bin/env python
import os
import sys
import django
import requests

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from core.models import Obra

def test_endpoints():
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
    
    # Test 1: /obras/271/gastos-por-categoria-material/
    print("\n1. Testing /obras/271/gastos-por-categoria-material/")
    try:
        r1 = requests.get("http://localhost:8000/obras/271/gastos-por-categoria-material/", headers=headers)
        print(f"Status: {r1.status_code}")
        print(f"Content: {r1.text[:300]}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 2: /api/arquivos-obra/?obra=271
    print("\n2. Testing /api/arquivos-obra/?obra=271")
    try:
        r2 = requests.get("http://localhost:8000/api/arquivos-obra/?obra=271", headers=headers)
        print(f"Status: {r2.status_code}")
        print(f"Content: {r2.text[:300]}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 3: /api/locacoes/semanal/
    print("\n3. Testing /api/locacoes/semanal/")
    try:
        r3 = requests.get("http://localhost:8000/api/locacoes/semanal/", headers=headers)
        print(f"Status: {r3.status_code}")
        print(f"Content: {r3.text[:300]}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 4: Check if obra 271 exists
    print("\n4. Checking if Obra 271 exists")
    try:
        obra = Obra.objects.get(pk=271)
        print(f"Obra 271 found: {obra}")
    except Obra.DoesNotExist:
        print("Obra 271 does not exist")
        # Get first available obra
        first_obra = Obra.objects.first()
        if first_obra:
            print(f"First available obra: {first_obra.pk}")
            # Test with first available obra
            print(f"\n5. Testing with obra {first_obra.pk}")
            try:
                r4 = requests.get(f"http://localhost:8000/obras/{first_obra.pk}/gastos-por-categoria-material/", headers=headers)
                print(f"Status: {r4.status_code}")
                print(f"Content: {r4.text[:300]}")
            except Exception as e:
                print(f"Error: {e}")
            
            try:
                r5 = requests.get(f"http://localhost:8000/api/arquivos-obra/?obra={first_obra.pk}", headers=headers)
                print(f"Arquivos-obra Status: {r5.status_code}")
                print(f"Arquivos-obra Content: {r5.text[:300]}")
            except Exception as e:
                print(f"Error: {e}")
        else:
            print("No obras found in database")
    
    # Test 6: Check anexos-s3 endpoint
    print("\n6. Testing /api/anexos-s3/")
    try:
        r6 = requests.get("http://localhost:8000/api/anexos-s3/", headers=headers)
        print(f"Status: {r6.status_code}")
        print(f"Content: {r6.text[:300]}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_endpoints()