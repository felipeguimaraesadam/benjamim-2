#!/usr/bin/env python
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from django.urls import reverse
from django.conf.urls import include
from django.urls.resolvers import URLResolver, URLPattern
from core.urls import urlpatterns

print("=== DEBUG DAS URLs ===")
print(f"Total de URLs em core.urls: {len(urlpatterns)}")

# Procurar pelas URLs de teste
test_urls_found = []
for i, pattern in enumerate(urlpatterns):
    if hasattr(pattern, 'pattern'):
        pattern_str = str(pattern.pattern)
        if 'test-data' in pattern_str or 'populate' in pattern_str or 'clear' in pattern_str:
            test_urls_found.append((i, pattern_str, getattr(pattern, 'name', 'sem nome')))
            print(f"✅ URL de teste encontrada: {pattern_str} (nome: {getattr(pattern, 'name', 'sem nome')})")

if not test_urls_found:
    print("❌ Nenhuma URL de teste encontrada!")
    print("\nTodas as URLs encontradas:")
    for i, pattern in enumerate(urlpatterns):
        if hasattr(pattern, 'pattern'):
            print(f"{i+1}. {pattern.pattern} (nome: {getattr(pattern, 'name', 'sem nome')})")

# Testar se conseguimos fazer reverse das URLs de teste
try:
    populate_url = reverse('populate-test-data')
    print(f"✅ URL populate-test-data resolve para: {populate_url}")
except Exception as e:
    print(f"❌ Erro ao resolver populate-test-data: {e}")

try:
    clear_url = reverse('clear-test-data')
    print(f"✅ URL clear-test-data resolve para: {clear_url}")
except Exception as e:
    print(f"❌ Erro ao resolver clear-test-data: {e}")

print("\n=== FIM DEBUG ===")