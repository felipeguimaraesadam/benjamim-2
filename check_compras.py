#!/usr/bin/env python
import os
import sys
import django
from decimal import Decimal

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
sys.path.append('backend')
django.setup()

from core.models import Compra, Obra

def check_compras():
    print("=== VERIFICAÇÃO DE COMPRAS ===")
    
    # Total de compras
    total_compras = Compra.objects.count()
    print(f"Total de compras no sistema: {total_compras}")
    
    # Compras para obra 1
    compras_obra_1 = Compra.objects.filter(obra_id=1).count()
    print(f"Compras para obra ID=1: {compras_obra_1}")
    
    # Verificar se a compra 12 existe
    compra_12 = Compra.objects.filter(id=12).first()
    if compra_12:
        print(f"Compra ID=12 existe - Obra: {compra_12.obra_id}")
    else:
        print("Compra ID=12 não existe")
    
    # Verificar se obra 1 existe
    obra_1 = Obra.objects.filter(id=1).first()
    if obra_1:
        print(f"Obra ID=1 existe: {obra_1.nome_obra}")
    else:
        print("Obra ID=1 não existe")
    
    # Listar todas as compras
    print("\n=== TODAS AS COMPRAS ===")
    for compra in Compra.objects.all():
        obra_nome = compra.obra.nome_obra if compra.obra else "Sem obra"
        print(f"Compra ID: {compra.id} - Obra ID: {compra.obra_id} - Obra: {obra_nome}")

if __name__ == "__main__":
    check_compras()