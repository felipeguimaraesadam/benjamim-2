#!/usr/bin/env python
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from django.db import connection

print("=== VERIFICANDO COMPRAS SEM ITENS USANDO SQL DIRETO ===")

# Usar SQL direto para evitar problemas com modelos
with connection.cursor() as cursor:
    # Buscar compras que não têm itens
    cursor.execute("""
        SELECT c.id, c.fornecedor, c.data_compra, c.nota_fiscal
        FROM core_compra c
        LEFT JOIN core_itemcompra i ON c.id = i.compra_id
        WHERE i.compra_id IS NULL
    """)
    
    compras_sem_itens = cursor.fetchall()
    
    print(f"Encontradas {len(compras_sem_itens)} compras sem itens:")
    for compra in compras_sem_itens:
        print(f"  - ID: {compra[0]}, Fornecedor: {compra[1]}, Data: {compra[2]}, Nota: {compra[3]}")
    
    if compras_sem_itens:
        resposta = input(f"\nDeseja remover {len(compras_sem_itens)} compras inválidas? (s/n): ")
        if resposta.lower() == 's':
            # Deletar usando SQL direto
            ids_para_deletar = [str(compra[0]) for compra in compras_sem_itens]
            cursor.execute(f"DELETE FROM core_compra WHERE id IN ({','.join(ids_para_deletar)})")
            print(f"Removidas {len(compras_sem_itens)} compras inválidas.")
        else:
            print("Operação cancelada.")
    else:
        print("Nenhuma compra inválida encontrada.")