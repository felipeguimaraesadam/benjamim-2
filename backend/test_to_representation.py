#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.serializers import CompraSerializer
from core.models import Compra

print("=== TESTE TO_REPRESENTATION ===")

try:
    compra = Compra.objects.get(id=25)
    print(f"Compra ID: {compra.id}")
    print(f"Forma pagamento: {compra.forma_pagamento}")
    print(f"Número parcelas: {compra.numero_parcelas}")
    
    serializer = CompraSerializer(compra)
    data = serializer.data
    
    print("\n=== DADOS SERIALIZER ===")
    print(f"Forma pagamento: {data.get('forma_pagamento')}")
    print(f"Número parcelas: {data.get('numero_parcelas')}")
    
    pagamento_parcelado = data.get('pagamento_parcelado')
    print(f"\nPagamento parcelado presente: {pagamento_parcelado is not None}")
    
    if pagamento_parcelado:
        print(f"Tipo: {pagamento_parcelado.get('tipo')}")
        parcelas = pagamento_parcelado.get('parcelas', [])
        print(f"Parcelas: {len(parcelas)}")
        for i, p in enumerate(parcelas, 1):
            print(f"  {i}: R$ {p.get('valor')} - {p.get('data_vencimento')}")
    else:
        print("Dados pagamento_parcelado: None")
        
except Exception as e:
    print(f"Erro: {e}")
    import traceback
    traceback.print_exc()