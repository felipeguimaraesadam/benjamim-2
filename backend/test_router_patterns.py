import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from django.urls import resolve
from rest_framework.routers import DefaultRouter
from core.views import CompraViewSet

# Create a router to see what patterns it generates
router = DefaultRouter()
router.register(r'compras', CompraViewSet)

print("Router URL patterns:")
for pattern in router.urls:
    print(f"Pattern: {pattern.pattern}")
    print(f"Name: {pattern.name}")
    print(f"Callback: {pattern.callback}")
    print("---")

# Test specific URLs
test_urls = [
    '/api/compras/',
    '/api/compras/1/',
    '/api/compras/gerar-pdf-lote/',
    '/compras/',
    '/compras/1/',
    '/compras/gerar-pdf-lote/',
]

print("\nURL Resolution Tests:")
for url in test_urls:
    try:
        match = resolve(url)
        print(f"{url} -> {match.func} (name: {match.url_name})")
    except Exception as e:
        print(f"{url} -> ERROR: {e}")