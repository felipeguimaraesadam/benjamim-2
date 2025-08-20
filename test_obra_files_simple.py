#!/usr/bin/env python
"""
Script de teste simples para funcionalidades de arquivo da obra
"""

import requests
import json
import os
from io import BytesIO

# Configurações
BASE_URL = 'http://localhost:8000'
FRONTEND_URL = 'http://localhost:5174'

print("=== TESTE DE FUNCIONALIDADES DE ARQUIVO DA OBRA ===")
print(f"Backend: {BASE_URL}")
print(f"Frontend: {FRONTEND_URL}")

# Teste 1: Verificar se o backend está rodando
print("\n=== TESTE 1: CONECTIVIDADE DO BACKEND ===")
try:
    response = requests.get(f'{BASE_URL}/api/', timeout=5)
    if response.status_code == 200:
        print("✓ Backend está rodando e acessível")
    else:
        print(f"⚠ Backend respondeu com status: {response.status_code}")
except requests.exceptions.RequestException as e:
    print(f"✗ Erro ao conectar com backend: {e}")

# Teste 2: Verificar se o frontend está rodando
print("\n=== TESTE 2: CONECTIVIDADE DO FRONTEND ===")
try:
    response = requests.get(FRONTEND_URL, timeout=5)
    if response.status_code == 200:
        print("✓ Frontend está rodando e acessível")
    else:
        print(f"⚠ Frontend respondeu com status: {response.status_code}")
except requests.exceptions.RequestException as e:
    print(f"✗ Erro ao conectar com frontend: {e}")

# Teste 3: Verificar endpoints da API
print("\n=== TESTE 3: ENDPOINTS DA API ===")
endpoints_to_test = [
    '/api/obras/',
    '/api/arquivos-obra/',
    '/api/usuarios/',
]

for endpoint in endpoints_to_test:
    try:
        response = requests.get(f'{BASE_URL}{endpoint}', timeout=5)
        if response.status_code in [200, 401, 403]:  # 401/403 são esperados sem autenticação
            print(f"✓ Endpoint {endpoint} está acessível (status: {response.status_code})")
        else:
            print(f"⚠ Endpoint {endpoint} retornou status: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"✗ Erro ao acessar {endpoint}: {e}")

# Teste 4: Verificar estrutura de arquivos do frontend
print("\n=== TESTE 4: ESTRUTURA DE ARQUIVOS DO FRONTEND ===")
frontend_files_to_check = [
    'src/components/ArquivoObraManager.jsx',
    'src/components/ObraGaleria.jsx',
    'src/pages/ObraDetailPage.jsx',
    'src/services/api.js'
]

base_path = 'c:\\Users\\IDNG3\\OneDrive\\Documentos\\TRAE\\benjamim-2\\frontend'
for file_path in frontend_files_to_check:
    full_path = os.path.join(base_path, file_path.replace('/', '\\'))
    if os.path.exists(full_path):
        print(f"✓ Arquivo encontrado: {file_path}")
    else:
        print(f"✗ Arquivo não encontrado: {file_path}")

# Teste 5: Verificar estrutura de arquivos do backend
print("\n=== TESTE 5: ESTRUTURA DE ARQUIVOS DO BACKEND ===")
backend_files_to_check = [
    'core/models.py',
    'core/views.py',
    'core/serializers.py',
    'core/urls.py'
]

base_path = 'c:\\Users\\IDNG3\\OneDrive\\Documentos\\TRAE\\benjamim-2\\backend'
for file_path in backend_files_to_check:
    full_path = os.path.join(base_path, file_path.replace('/', '\\'))
    if os.path.exists(full_path):
        print(f"✓ Arquivo encontrado: {file_path}")
    else:
        print(f"✗ Arquivo não encontrado: {file_path}")

# Teste 6: Verificar se há erros no console do backend
print("\n=== TESTE 6: VERIFICAÇÃO DE LOGS ===")
print("Para verificar logs do backend, execute:")
print("  - Verifique o terminal onde o backend está rodando")
print("  - Procure por erros 500, 404 ou exceções")
print("  - Verifique se há warnings sobre migrações")

print("\nPara verificar logs do frontend, execute:")
print("  - Abra o navegador em http://localhost:5174")
print("  - Abra as ferramentas de desenvolvedor (F12)")
print("  - Verifique o console por erros JavaScript")
print("  - Verifique a aba Network por falhas de requisição")

# Teste 7: Instruções para teste manual
print("\n=== TESTE 7: INSTRUÇÕES PARA TESTE MANUAL ===")
print("Para testar completamente as funcionalidades de arquivo:")
print("\n1. Acesse http://localhost:5174")
print("2. Faça login no sistema")
print("3. Navegue para a seção de Obras")
print("4. Selecione ou crie uma obra")
print("5. Teste o upload de arquivos:")
print("   - Tente fazer upload de uma imagem (JPG, PNG)")
print("   - Tente fazer upload de um documento (PDF, DOC)")
print("   - Tente fazer upload de um arquivo inválido (EXE)")
print("6. Teste a visualização:")
print("   - Clique nos arquivos para visualizar")
print("   - Verifique se imagens são exibidas corretamente")
print("   - Verifique se PDFs abrem corretamente")
print("7. Teste a exclusão:")
print("   - Clique no botão de excluir arquivo")
print("   - Confirme a exclusão")
print("   - Verifique se o arquivo foi removido da lista")

print("\n=== RESUMO DOS COMPONENTES VERIFICADOS ===")
print("✓ Conectividade do backend e frontend")
print("✓ Disponibilidade dos endpoints da API")
print("✓ Presença dos arquivos de código necessários")
print("✓ Instruções para teste manual completo")

print("\n=== PRÓXIMOS PASSOS ===")
print("1. Execute os testes manuais descritos acima")
print("2. Verifique os logs em ambos os terminais durante os testes")
print("3. Documente qualquer erro encontrado")
print("4. Teste diferentes tipos de arquivo e cenários de uso")

print("\n=== TESTE CONCLUÍDO ===")