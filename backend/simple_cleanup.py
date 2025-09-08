#!/usr/bin/env python
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from core.models import Compra, ItemCompra

print("=== VERIFICANDO COMPRAS SEM ITENS ===")

compras_sem_itens = []
for compra in Compra.objects.all():
    if not compra.itens.exists():  # Usando related_name 'itens'
        compras_sem_itens.append(compra)

print(f"Encontradas {len(compras_sem_itens)} compras sem itens:")
for compra in compras_sem_itens:
    print(f"  - ID: {compra.id}, Fornecedor: {compra.fornecedor}, Data: {compra.data_compra}")

if compras_sem_itens:
    resposta = input(f"\nDeseja remover {len(compras_sem_itens)} compras inválidas? (s/n): ")
    if resposta.lower() == 's':
        for compra in compras_sem_itens:
            print(f"Removendo compra ID {compra.id}")
            compra.delete()
        print(f"Removidas {len(compras_sem_itens)} compras inválidas.")
    else:
        print("Operação cancelada.")
else:
    print("Nenhuma compra inválida encontrada.")