import os
import sys
import django
from django.conf import settings
from django.urls import resolve, reverse
from django.test import RequestFactory
from django.http import HttpRequest

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from core.views import GerarPDFComprasLoteView, CompraViewSet
from django.urls import get_resolver

def test_url_ordering():
    print("=== Testing URL Pattern Ordering ===")
    
    # Test the specific URL
    test_url = '/api/relatorios/compras-lote/pdf/'
    print(f"Testing URL: {test_url}")
    
    try:
        # Get the URL resolver
        resolver = get_resolver()
        print(f"\nURL patterns in order:")
        
        # Print all URL patterns to see the order
        for i, pattern in enumerate(resolver.url_patterns):
            print(f"{i+1}. {pattern.pattern} -> {getattr(pattern, 'callback', 'N/A')}")
            if hasattr(pattern, 'url_patterns'):
                print(f"   Includes: {len(pattern.url_patterns)} sub-patterns")
        
        # Try to resolve the URL
        print(f"\n=== Resolving {test_url} ===")
        resolved = resolve(test_url)
        print(f"Resolved to: {resolved.func}")
        print(f"View name: {resolved.view_name}")
        print(f"URL name: {resolved.url_name}")
        print(f"Args: {resolved.args}")
        print(f"Kwargs: {resolved.kwargs}")
        
        # Check if it's the correct view
        if hasattr(resolved.func, 'view_class'):
            print(f"View class: {resolved.func.view_class}")
            if resolved.func.view_class == GerarPDFComprasLoteView:
                print("✅ SUCCESS: URL resolves to GerarPDFComprasLoteView")
            else:
                print(f"❌ ERROR: URL resolves to {resolved.func.view_class}, expected GerarPDFComprasLoteView")
        else:
            print(f"❌ ERROR: Resolved to function {resolved.func}, not a class-based view")
            
    except Exception as e:
        print(f"❌ ERROR resolving URL: {e}")
        print(f"Error type: {type(e).__name__}")
    
    # Test reverse lookup
    print(f"\n=== Testing Reverse Lookup ===")
    try:
        reversed_url = reverse('gerar-pdf-compras-lote')
        print(f"✅ Reverse lookup successful: {reversed_url}")
    except Exception as e:
        print(f"❌ Reverse lookup failed: {e}")

if __name__ == '__main__':
    test_url_ordering()