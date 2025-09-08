#!/usr/bin/env python
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from core.models import Compra

print("Campos do modelo Compra:")
for field in Compra._meta.fields:
    print(f"- {field.name}: {field.__class__.__name__}")

print("\nVerificando se existem compras no banco:")
compras_count = Compra.objects.count()
print(f"Total de compras: {compras_count}")

if compras_count > 0:
    primeira_compra = Compra.objects.first()
    print(f"\nPrimeira compra (ID: {primeira_compra.id}):")
    for field in Compra._meta.fields:
        try:
            value = getattr(primeira_compra, field.name)
            print(f"- {field.name}: {value}")
        except Exception as e:
            print(f"- {field.name}: ERRO - {e}")