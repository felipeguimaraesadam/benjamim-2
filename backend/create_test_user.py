import os
import django

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from core.models import Usuario

def create_test_superuser():
    """
    Creates a superuser for testing purposes if it doesn't already exist.
    """
    if not Usuario.objects.filter(login='admin').exists():
        Usuario.objects.create_superuser(
            login='admin',
            password='adminpassword', # Use a more secure password
            nome_completo='Admin Test User'
        )
        print("Superuser 'admin' created successfully.")
    else:
        print("Superuser 'admin' already exists.")

if __name__ == '__main__':
    create_test_superuser()
