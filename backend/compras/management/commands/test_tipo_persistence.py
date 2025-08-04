import requests
import json
from django.core.management.base import BaseCommand
from compras.models import Compra
from obras.models import Obra
from materiais.models import Material
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Test if the tipo field is properly saved when editing a compra'
    
    def get_auth_token(self):
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
                self.stdout.write(f"Failed to get token. Status: {response.status_code}")
                self.stdout.write(f"Response: {response.text}")
                return None
        except Exception as e:
            self.stdout.write(f"Error getting token: {e}")
            return None
    
    def handle(self, *args, **options):
        """Test if the 'tipo' field is properly saved when editing a compra"""
        self.stdout.write("=== Testing 'tipo' field persistence ===")
        
        # Get authentication token
        token = self.get_auth_token()
        if not token:
            self.stdout.write("Failed to get authentication token")
            return
        
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        # Get existing obras and materiais
        obras_response = requests.get('http://localhost:8000/api/obras/', headers=headers)
        materiais_response = requests.get('http://localhost:8000/api/materiais/', headers=headers)
        
        if obras_response.status_code != 200 or materiais_response.status_code != 200:
            self.stdout.write(f"Failed to get obras or materiais. Obras: {obras_response.status_code}, Materiais: {materiais_response.status_code}")
            return
        
        obras_data = obras_response.json()
        materiais_data = materiais_response.json()
        
        # Handle paginated responses
        obras = obras_data.get('results', obras_data) if isinstance(obras_data, dict) else obras_data
        materiais = materiais_data.get('results', materiais_data) if isinstance(materiais_data, dict) else materiais_data
        
        if not obras or not materiais:
            self.stdout.write("No obras or materiais found")
            return
        
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
        
        self.stdout.write("Creating COMPRA...")
        create_response = requests.post('http://localhost:8000/api/compras/', 
                                      json=compra_data, headers=headers)
        
        if create_response.status_code != 201:
            self.stdout.write(f"Failed to create COMPRA. Status: {create_response.status_code}")
            self.stdout.write(f"Response: {create_response.text}")
            return
        
        compra_created = create_response.json()
        compra_id = compra_created['id']
        self.stdout.write(f"COMPRA created with ID: {compra_id}")
        self.stdout.write(f"Initial tipo: {compra_created.get('tipo')}")
        
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
        
        self.stdout.write("\nUpdating COMPRA to ORCAMENTO...")
        update_response = requests.put(f'http://localhost:8000/api/compras/{compra_id}/', 
                                     json=update_data, headers=headers)
        
        if update_response.status_code != 200:
            self.stdout.write(f"Failed to update COMPRA. Status: {update_response.status_code}")
            self.stdout.write(f"Response: {update_response.text}")
            return
        
        compra_updated = update_response.json()
        self.stdout.write(f"Update response tipo: {compra_updated.get('tipo')}")
        
        # Step 3: Fetch the compra again to verify it was saved correctly
        self.stdout.write("\nFetching updated COMPRA to verify...")
        fetch_response = requests.get(f'http://localhost:8000/api/compras/{compra_id}/', headers=headers)
        
        if fetch_response.status_code != 200:
            self.stdout.write(f"Failed to fetch COMPRA. Status: {fetch_response.status_code}")
            return
        
        compra_fetched = fetch_response.json()
        self.stdout.write(f"Fetched tipo: {compra_fetched.get('tipo')}")
        
        # Step 4: Check directly in the database
        self.stdout.write("\nChecking database directly...")
        try:
            compra_db = Compra.objects.get(id=compra_id)
            self.stdout.write(f"Database tipo: {compra_db.tipo}")
            
            # Verify the tipo was actually saved as ORCAMENTO
            if compra_db.tipo == 'ORCAMENTO':
                self.stdout.write(self.style.SUCCESS("✅ SUCCESS: 'tipo' field was correctly saved as ORCAMENTO"))
                success = True
            else:
                self.stdout.write(self.style.ERROR(f"❌ FAILURE: 'tipo' field was not saved correctly. Expected: ORCAMENTO, Got: {compra_db.tipo}"))
                success = False
                
        except Compra.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"❌ FAILURE: COMPRA with ID {compra_id} not found in database"))
            success = False
        
        # Step 5: Clean up
        self.stdout.write("\nCleaning up...")
        delete_response = requests.delete(f'http://localhost:8000/api/compras/{compra_id}/', headers=headers)
        if delete_response.status_code == 204:
            self.stdout.write("Test data cleaned up successfully")
        else:
            self.stdout.write(f"Warning: Failed to clean up test data. Status: {delete_response.status_code}")
        
        if success:
            self.stdout.write(self.style.SUCCESS("\n🎉 Test PASSED: The 'tipo' field persistence is working correctly"))
        else:
            self.stdout.write(self.style.ERROR("\n💥 Test FAILED: There is an issue with 'tipo' field persistence"))