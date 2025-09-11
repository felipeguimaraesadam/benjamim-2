#!/usr/bin/env python
import os
import sys
import django

# Adicionar o diretório backend ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from django.urls import get_resolver
from django.conf import settings

def list_urls(urlpatterns, prefix=''):
    """Lista todas as URLs disponíveis"""
    urls = []
    for pattern in urlpatterns:
        if hasattr(pattern, 'url_patterns'):
            # É um include, recursivamente lista as URLs
            urls.extend(list_urls(pattern.url_patterns, prefix + str(pattern.pattern)))
        else:
            # É uma URL individual
            url = prefix + str(pattern.pattern)
            name = getattr(pattern, 'name', None)
            urls.append((url, name))
    return urls

if __name__ == '__main__':
    print("🔍 Listando todas as URLs disponíveis...")
    resolver = get_resolver()
    urls = list_urls(resolver.url_patterns)
    
    print(f"\n📋 Total de URLs encontradas: {len(urls)}\n")
    
    # Filtrar URLs que contêm 'test-data' ou 'populate'
    test_urls = [url for url in urls if 'test' in url[0] or 'populate' in url[0] or 'clear' in url[0]]
    
    if test_urls:
        print("🎯 URLs relacionadas a dados de teste:")
        for url, name in test_urls:
            print(f"  - {url} (name: {name})")
    else:
        print("❌ Nenhuma URL relacionada a dados de teste encontrada!")
    
    # Mostrar algumas URLs da API para verificar se core.urls está sendo carregado
    api_urls = [url for url in urls if 'api/' in url[0]][:10]
    print(f"\n🔗 Primeiras 10 URLs da API:")
    for url, name in api_urls:
        print(f"  - {url} (name: {name})")