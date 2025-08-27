import os
import sys
import django
from django.conf import settings

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

# Import after Django setup
from rest_framework.test import APIClient
from core.models import Usuario

# Create a DRF test client
client = APIClient()

# Get the admin user and authenticate
try:
    admin_user = Usuario.objects.get(login='admin')
    client.force_authenticate(user=admin_user)
    print(f"Authenticated as: {admin_user.login} (nivel: {admin_user.nivel_acesso})")
except Usuario.DoesNotExist:
    print("Admin user not found")
    sys.exit(1)

# Test the dashboard endpoint
response = client.get('/api/dashboard/stats/')
print(f"Status Code: {response.status_code}")
print(f"Response Content: {response.content.decode()}")

if response.status_code == 200:
    print("Dashboard endpoint is working correctly!")
else:
    print(f"Dashboard endpoint failed with status {response.status_code}")