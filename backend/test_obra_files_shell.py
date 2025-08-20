# -*- coding: utf-8 -*-
# Teste simples das funcionalidades de arquivo da obra no Django shell
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from core.models import Obra, ArquivoObra
from django.urls import reverse

User = get_user_model()

print("=== TESTE SIMPLES DE ARQUIVOS DE OBRA ===")

# 1. Configurar cliente API
client = APIClient()

try:
    # 2. Criar usuário de teste
    print("\n1. Criando usuário de teste...")
    user, created = User.objects.get_or_create(
        login='testuser',
        defaults={
            'nome_completo': 'Usuario Teste',
        }
    )
    if created:
        user.set_password('testpass123')
        user.save()
    print(f"✓ Usuário: {user.login} ({'criado' if created else 'existente'})")
    
    # 3. Autenticar
    print("\n2. Autenticando usuário...")
    client.force_authenticate(user=user)
    print("✓ Usuário autenticado")
    
    # 4. Criar obra de teste
    print("\n3. Criando obra de teste...")
    obra, created = Obra.objects.get_or_create(
        nome_obra='Obra Teste Arquivos',
        defaults={
            'endereco_completo': 'Rua Teste, 123',
            'cidade': 'Cidade Teste',
            'status': 'Em Andamento'
        }
    )
    print(f"✓ Obra: {obra.nome_obra} (ID: {obra.id}) ({'criada' if created else 'existente'})")
    
    # 5. Verificar URLs disponíveis
    print("\n4. Verificando URLs disponíveis...")
    try:
        url_arquivos = reverse('arquivoobra-list')
        print(f"✓ URL arquivos-obra: {url_arquivos}")
    except Exception as e:
        print(f"✗ Erro ao obter URL: {e}")
        url_arquivos = '/api/arquivos-obra/'
        print(f"Usando URL padrão: {url_arquivos}")
    
    # 6. Testar listagem de arquivos primeiro
    print("\n5. Testando listagem de arquivos...")
    list_response = client.get(url_arquivos)
    print(f"Status da listagem: {list_response.status_code}")
    
    if list_response.status_code == 200:
        try:
            data = list_response.json() if hasattr(list_response, 'json') else list_response.data
            arquivos = data.get('results', data) if isinstance(data, dict) else data
            print(f"✓ Listagem realizada. Total de arquivos: {len(arquivos) if isinstance(arquivos, list) else 'N/A'}")
        except Exception as e:
            print(f"✓ Listagem realizada, mas erro ao processar dados: {e}")
    else:
        print(f"✗ Erro na listagem: {list_response.status_code}")
        try:
            print(f"  Detalhes: {list_response.data if hasattr(list_response, 'data') else 'Sem detalhes'}")
        except:
            print("  Sem detalhes de erro disponíveis")
    
    # 7. Testar upload de arquivo
    print("\n6. Testando upload de arquivo...")
    test_content = b"Conteudo de teste para arquivo da obra"
    test_file = SimpleUploadedFile(
        "teste_documento.txt",
        test_content,
        content_type="text/plain"
    )
    
    upload_data = {
        'obra': obra.id,
        'arquivo': test_file,
        'tipo_arquivo': 'DOCUMENTO',
        'descricao': 'Documento de teste'
    }
    
    upload_response = client.post(url_arquivos, upload_data, format='multipart')
    print(f"Status do upload: {upload_response.status_code}")
    
    if upload_response.status_code == 201:
        try:
            data = upload_response.json() if hasattr(upload_response, 'json') else upload_response.data
            arquivo_id = data.get('id')
            print(f"✓ Arquivo enviado com sucesso. ID: {arquivo_id}")
            print(f"  Nome: {data.get('arquivo_nome', 'N/A')}")
            print(f"  Tipo: {data.get('tipo_arquivo', 'N/A')}")
        except Exception as e:
            print(f"✓ Upload realizado, mas erro ao processar resposta: {e}")
            arquivo_id = None
    else:
        print(f"✗ Erro no upload: {upload_response.status_code}")
        try:
            print(f"  Detalhes: {upload_response.data if hasattr(upload_response, 'data') else 'Sem detalhes'}")
        except:
            print("  Sem detalhes de erro disponíveis")
        arquivo_id = None
    
    # 8. Verificar arquivos no banco de dados
    print("\n7. Verificando arquivos no banco de dados...")
    arquivos_db = ArquivoObra.objects.filter(obra=obra)
    print(f"✓ Arquivos no banco: {arquivos_db.count()}")
    for arquivo in arquivos_db[:3]:  # Mostrar apenas os primeiros 3
        print(f"  - ID: {arquivo.id} | Nome: {arquivo.nome_original} | Tipo: {arquivo.tipo_arquivo}")
    
    print("\n=== TESTE CONCLUÍDO ===")
    
except Exception as e:
    print(f"\n✗ Erro durante o teste: {str(e)}")
    import traceback
    traceback.print_exc()

print("\n=== RESUMO ===")
print("Funcionalidades testadas:")
print("- Criação de usuário e obra")
print("- Autenticação")
print("- Verificação de URLs")
print("- Listagem de arquivos")
print("- Upload de arquivo")
print("- Verificação no banco de dados")