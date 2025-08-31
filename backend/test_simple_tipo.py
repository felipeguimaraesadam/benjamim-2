#!/usr/bin/env python
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from core.models import Compra, Obra, Material, Usuario as User

def test_tipo_field_direct():
    """Test tipo field directly using Django ORM"""
    print("=== Testing 'tipo' field with Django ORM ===")
    
    # Get existing data
    obra = Obra.objects.first()
    material = Material.objects.first()
    user = User.objects.first()
    
    if not obra or not material or not user:
        print("Missing required data (obra, material, or user)")
        return False
    
    # Create a COMPRA directly
    compra = Compra.objects.create(
        obra=obra,
        tipo='COMPRA',
        observacoes='Test compra for tipo persistence - Django ORM',
        desconto=0,
        created_by=user
    )
    
    print(f"Created COMPRA with ID: {compra.id}, tipo: {compra.tipo}")
    
    # Update tipo to ORCAMENTO
    compra.tipo = 'ORCAMENTO'
    compra.observacoes = 'Updated to ORCAMENTO - Django ORM'
    compra.save()
    
    print(f"Updated COMPRA tipo to: {compra.tipo}")
    
    # Fetch from database again to verify
    compra_from_db = Compra.objects.get(id=compra.id)
    print(f"Fetched from DB - tipo: {compra_from_db.tipo}")
    
    # Check if it was saved correctly
    if compra_from_db.tipo == 'ORCAMENTO':
        print("✅ SUCCESS: 'tipo' field was correctly saved as ORCAMENTO using Django ORM")
        success = True
    else:
        print(f"❌ FAILURE: 'tipo' field was not saved correctly. Expected: ORCAMENTO, Got: {compra_from_db.tipo}")
        success = False
    
    # Clean up
    compra.delete()
    print("Test data cleaned up")
    
    return success

if __name__ == '__main__':
    success = test_tipo_field_direct()
    if success:
        print("\n🎉 Django ORM Test PASSED")
    else:
        print("\n💥 Django ORM Test FAILED")