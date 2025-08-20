import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from django.urls import resolve, reverse
from django.urls.exceptions import Resolver404
from django.test import RequestFactory
from core.views import GerarPDFComprasLoteView

# Test URL resolution
print("Testing URL resolution for /api/compras/gerar-pdf-lote/")
try:
    match = resolve('/api/compras/gerar-pdf-lote/')
    print(f'URL resolved to: {match.func}')
    print(f'URL name: {match.url_name}')
    print(f'View name: {match.view_name}')
    
    # Check if it's a class-based view
    if hasattr(match.func, 'view_class'):
        print(f'View class: {match.func.view_class}')
        print(f'Is GerarPDFComprasLoteView: {match.func.view_class == GerarPDFComprasLoteView}')
    else:
        print('Not a class-based view or no view_class attribute')
        
except Resolver404 as e:
    print(f'URL not found: {e}')

# Test reverse lookup
print("\nTesting reverse lookup for 'gerar-pdf-compras-lote'")
try:
    url = reverse('gerar-pdf-compras-lote')
    print(f'Reverse URL: {url}')
except Exception as e:
    print(f'Reverse lookup failed: {e}')

# Test the view directly
print("\nTesting view instantiation")
try:
    view = GerarPDFComprasLoteView()
    print(f'View instance created: {view}')
    print(f'View methods: {[method for method in dir(view) if not method.startswith("_")]}')
except Exception as e:
    print(f'View instantiation failed: {e}')