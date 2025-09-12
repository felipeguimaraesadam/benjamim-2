#!/usr/bin/env python
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from django.urls import reverse, resolve
from django.test import RequestFactory
from core.views.views import LocacaoSemanalView
from core.models import Usuario
from rest_framework.test import force_authenticate

def test_url_resolution():
    """Testar se a URL está sendo resolvida corretamente"""
    print("🔍 Testando resolução de URLs...\n")
    
    try:
        # Testar resolução da URL
        url = '/api/locacoes/semanal/'
        print(f"Testando URL: {url}")
        
        resolved = resolve(url)
        print(f"✅ URL resolvida com sucesso")
        print(f"View: {resolved.func}")
        print(f"View class: {resolved.func.view_class}")
        print(f"URL name: {resolved.url_name}")
        
    except Exception as e:
        print(f"❌ Erro ao resolver URL: {e}")
        return False
    
    return True

def test_view_directly():
    """Testar a view diretamente"""
    print("\n🔍 Testando view diretamente...\n")
    
    try:
        # Criar uma requisição de teste
        factory = RequestFactory()
        request = factory.get('/api/locacoes/semanal/?inicio=2024-01-15')
        
        # Obter usuário admin
        admin_user = Usuario.objects.get(login='admin')
        force_authenticate(request, user=admin_user)
        
        # Instanciar a view
        view = LocacaoSemanalView()
        view.setup(request)
        
        # Executar a view
        response = view.get(request)
        
        print(f"✅ View executada com sucesso")
        print(f"Status code: {response.status_code}")
        print(f"Response data type: {type(response.data)}")
        
        if hasattr(response, 'data'):
            if isinstance(response.data, dict):
                print(f"Response keys: {list(response.data.keys())[:5]}")
            else:
                print(f"Response data: {str(response.data)[:200]}")
        
    except Exception as e:
        print(f"❌ Erro ao executar view: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

def check_url_patterns():
    """Verificar padrões de URL registrados"""
    print("\n🔍 Verificando padrões de URL registrados...\n")
    
    from django.urls import get_resolver
    
    resolver = get_resolver()
    
    # Procurar por padrões relacionados a locacoes
    def find_patterns(urlpatterns, prefix=''):
        patterns = []
        for pattern in urlpatterns:
            if hasattr(pattern, 'url_patterns'):
                # É um include, recursivamente buscar
                patterns.extend(find_patterns(pattern.url_patterns, prefix + str(pattern.pattern)))
            else:
                full_pattern = prefix + str(pattern.pattern)
                if 'locacoes' in full_pattern or 'semanal' in full_pattern:
                    patterns.append(full_pattern)
        return patterns
    
    locacao_patterns = find_patterns(resolver.url_patterns)
    
    print("Padrões encontrados relacionados a 'locacoes' ou 'semanal':")
    for pattern in locacao_patterns:
        print(f"  - {pattern}")
    
    if not locacao_patterns:
        print("❌ Nenhum padrão encontrado para locacoes/semanal")
    
    return len(locacao_patterns) > 0

def main():
    print("🔧 Debug de URLs e Views\n")
    
    # Verificar padrões de URL
    patterns_ok = check_url_patterns()
    
    # Testar resolução de URL
    resolution_ok = test_url_resolution()
    
    # Testar view diretamente
    view_ok = test_view_directly()
    
    print("\n📊 Resumo dos testes:")
    print(f"Padrões de URL: {'✅' if patterns_ok else '❌'}")
    print(f"Resolução de URL: {'✅' if resolution_ok else '❌'}")
    print(f"Execução da view: {'✅' if view_ok else '❌'}")

if __name__ == "__main__":
    main()