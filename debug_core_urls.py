#!/usr/bin/env python
import os
import sys
import django

# Adicionar o diretório backend ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from core.urls import urlpatterns

print(f"🔍 Analisando core.urls...")
print(f"📊 Total de URLs em core.urls: {len(urlpatterns)}")
print("\n📋 Lista completa de URLs:")

for i, pattern in enumerate(urlpatterns):
    name = getattr(pattern, 'name', 'N/A')
    print(f"{i+1:2d}: {pattern.pattern} (name: {name})")

# Verificar se há URLs relacionadas a teste
test_patterns = [p for p in urlpatterns if 'test' in str(p.pattern) or 'populate' in str(p.pattern)]
print(f"\n🎯 URLs relacionadas a teste: {len(test_patterns)}")
for pattern in test_patterns:
    name = getattr(pattern, 'name', 'N/A')
    print(f"  - {pattern.pattern} (name: {name})")