import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from django.urls import resolve
from django.urls.exceptions import Resolver404

try:
    match = resolve('/api/compras/gerar-pdf-lote/')
    print('URL resolved to:', match.func)
    print('View class:', match.func.view_class)
except Resolver404 as e:
    print('URL not found:', e)