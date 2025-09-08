#!/usr/bin/env python
import os
import sys
import django
from pathlib import Path

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from core.models import AnexoCompra
from django.conf import settings

print("=== VERIFICANDO ANEXOS COM ARQUIVOS INEXISTENTES ===")

# Buscar todos os anexos
anexos = AnexoCompra.objects.all()
print(f"Total de anexos no banco: {anexos.count()}")

anexos_invalidos = []

for anexo in anexos:
    # Verificar se o arquivo existe fisicamente
    arquivo_path = anexo.arquivo.path if anexo.arquivo else None
    
    if not arquivo_path:
        print(f"  - Anexo ID {anexo.id}: Sem arquivo definido")
        anexos_invalidos.append(anexo)
        continue
    
    if not os.path.exists(arquivo_path):
        print(f"  - Anexo ID {anexo.id}: Arquivo não encontrado - {arquivo_path}")
        anexos_invalidos.append(anexo)
        continue
    
    # Verificar se o arquivo está vazio
    try:
        if os.path.getsize(arquivo_path) == 0:
            print(f"  - Anexo ID {anexo.id}: Arquivo vazio - {arquivo_path}")
            anexos_invalidos.append(anexo)
    except OSError as e:
        print(f"  - Anexo ID {anexo.id}: Erro ao acessar arquivo - {e}")
        anexos_invalidos.append(anexo)

print(f"\nEncontrados {len(anexos_invalidos)} anexos inválidos:")
for anexo in anexos_invalidos:
    print(f"  - ID: {anexo.id}, Compra: {anexo.compra_id}, Arquivo: {anexo.arquivo.name if anexo.arquivo else 'N/A'}")

if anexos_invalidos:
    resposta = input(f"\nDeseja remover {len(anexos_invalidos)} anexos inválidos? (s/n): ")
    if resposta.lower() == 's':
        for anexo in anexos_invalidos:
            print(f"Removendo anexo ID {anexo.id}...")
            anexo.delete()
        print(f"Removidos {len(anexos_invalidos)} anexos inválidos.")
    else:
        print("Operação cancelada.")
else:
    print("Nenhum anexo inválido encontrado.")

print("\n=== VERIFICAÇÃO CONCLUÍDA ===")