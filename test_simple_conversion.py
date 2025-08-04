import os
import sys
import django
from datetime import date
from decimal import Decimal

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from core.models import Usuario, Obra, Material, Compra
from core.serializers import CompraSerializer

def test_simple_conversion():
    try:
        print("=== Teste Simples de Conversão Compra <-> Orçamento ===")
        
        # Create minimal test data
        user, created = Usuario.objects.get_or_create(
            login='testuser',
            defaults={
                'nome_completo': 'Test User',
                'nivel_acesso': 'admin'
            }
        )
        if created:
            user.set_password('testpass123')
            user.save()
        
        obra, created = Obra.objects.get_or_create(
            nome_obra='Obra Teste',
            defaults={
                'endereco_completo': 'Rua Teste, 123',
                'cidade': 'Cidade Teste',
                'status': 'Planejada'
            }
        )
        
        # Create a COMPRA directly
        compra = Compra.objects.create(
            obra=obra,
            fornecedor='Fornecedor Teste',
            data_compra=date.today(),
            tipo='COMPRA',
            status_orcamento='APROVADO',
            nota_fiscal='NF123456'
        )
        
        print(f"✓ COMPRA criada - Tipo: {compra.tipo}, Status: {compra.status_orcamento}")
        
        # Test 1: Convert COMPRA to ORCAMENTO
        print("\n--- Teste 1: Converter COMPRA para ORCAMENTO ---")
        
        # Test the serializer validation logic
        update_data = {'tipo': 'ORCAMENTO'}
        serializer = CompraSerializer(compra, data=update_data, partial=True)
        
        if serializer.is_valid():
            # Check what the validated data looks like
            print(f"Dados validados: {serializer.validated_data}")
            
            # Save the changes
            updated_compra = serializer.save()
            
            # Refresh from database
            updated_compra.refresh_from_db()
            
            print(f"✓ Após conversão - Tipo: {updated_compra.tipo}, Status: {updated_compra.status_orcamento}")
            
            if updated_compra.tipo == 'ORCAMENTO' and updated_compra.status_orcamento == 'PENDENTE':
                print("✓ SUCESSO: Conversão funcionou corretamente!")
            else:
                print(f"✗ FALHA: Conversão não funcionou como esperado")
                
            # Test 2: Convert back to COMPRA
            print("\n--- Teste 2: Converter ORCAMENTO de volta para COMPRA ---")
            
            update_data = {'tipo': 'COMPRA'}
            serializer2 = CompraSerializer(updated_compra, data=update_data, partial=True)
            
            if serializer2.is_valid():
                print(f"Dados validados: {serializer2.validated_data}")
                
                final_compra = serializer2.save()
                final_compra.refresh_from_db()
                
                print(f"✓ Após conversão de volta - Tipo: {final_compra.tipo}, Status: {final_compra.status_orcamento}")
                
                if final_compra.tipo == 'COMPRA' and final_compra.status_orcamento == 'APROVADO':
                    print("✓ SUCESSO: Conversão de volta funcionou corretamente!")
                else:
                    print(f"✗ FALHA: Conversão de volta não funcionou como esperado")
            else:
                print(f"✗ Erro na validação da conversão de volta: {serializer2.errors}")
                
        else:
            print(f"✗ Erro na validação: {serializer.errors}")
            
    except Exception as e:
        print(f"✗ Erro durante o teste: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        # Clean up
        try:
            Compra.objects.filter(fornecedor='Fornecedor Teste').delete()
            Obra.objects.filter(nome_obra='Obra Teste').delete()
            Usuario.objects.filter(login='testuser').delete()
            print("✓ Dados de teste removidos")
        except Exception as e:
            print(f"Erro ao limpar dados: {e}")

if __name__ == '__main__':
    test_simple_conversion()