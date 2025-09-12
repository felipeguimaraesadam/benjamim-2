#!/usr/bin/env python
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from core.models import Obra

print('Obras disponíveis:')
obras = Obra.objects.all()[:5]
if obras:
    for obra in obras:
        print(f'ID: {obra.id}, Nome: {obra.nome_obra}')
else:
    print('Nenhuma obra encontrada no sistema')