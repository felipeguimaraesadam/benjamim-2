import os
import sys
import django
import requests
import json

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from core.models import AnexoS3

def get_auth_token():
    """Obtém token de autenticação"""
    try:
        response = requests.post('http://localhost:8000/api/token/', {
            'login': 'admin',
            'password': 'admin123'
        })
        if response.status_code == 200:
            return response.json()['access']
        else:
            print(f"Erro ao obter token: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Erro na requisição de token: {e}")
        return None

def test_anexos_s3_endpoints():
    """Testa os endpoints de anexos S3"""
    print("🔍 Testando endpoints de anexos S3...")
    
    # Obter token
    token = get_auth_token()
    if not token:
        print("❌ Falha ao obter token de autenticação")
        return
    
    print("✅ Token obtido com sucesso")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    base_url = 'http://localhost:8000/api/anexos-s3/'
    
    # Teste 1: Listar anexos S3
    print("\n🔍 Teste 1: Listando anexos S3...")
    try:
        response = requests.get(base_url, headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Sucesso - {len(data.get('results', []))} anexos encontrados")
            
            # Se há anexos, testar download do primeiro
            if data.get('results'):
                anexo = data['results'][0]
                anexo_id = anexo['id']
                print(f"Primeiro anexo: ID={anexo_id}, Nome={anexo.get('nome_original', 'N/A')}")
                
                # Teste 2: Download do anexo
                print(f"\n🔍 Teste 2: Download do anexo {anexo_id}...")
                download_url = f"{base_url}{anexo_id}/download/"
                try:
                    download_response = requests.get(download_url, headers=headers)
                    print(f"Status: {download_response.status_code}")
                    if download_response.status_code == 200:
                        content_type = download_response.headers.get('content-type', 'N/A')
                        content_length = len(download_response.content)
                        print(f"✅ Download bem-sucedido")
                        print(f"   Content-Type: {content_type}")
                        print(f"   Tamanho: {content_length} bytes")
                        
                        # Verificar se o conteúdo não está corrompido
                        if content_length > 0:
                            print(f"   Primeiros 50 bytes: {download_response.content[:50]}")
                        else:
                            print("   ⚠️  Conteúdo vazio")
                    else:
                        print(f"❌ Erro no download: {download_response.status_code}")
                        print(f"   Resposta: {download_response.text[:200]}")
                except Exception as e:
                    print(f"❌ Erro na requisição de download: {e}")
                
                # Teste 3: URL de download temporária
                print(f"\n🔍 Teste 3: URL de download temporária...")
                download_url_endpoint = f"{base_url}{anexo_id}/download_url/"
                try:
                    url_response = requests.get(download_url_endpoint, headers=headers)
                    print(f"Status: {url_response.status_code}")
                    if url_response.status_code == 200:
                        url_data = url_response.json()
                        print(f"✅ URL temporária gerada")
                        print(f"   URL: {url_data.get('url', 'N/A')[:100]}...")
                    else:
                        print(f"❌ Erro ao gerar URL: {url_response.status_code}")
                        print(f"   Resposta: {url_response.text[:200]}")
                except Exception as e:
                    print(f"❌ Erro na requisição de URL: {e}")
            else:
                print("ℹ️  Nenhum anexo encontrado para testar download")
        else:
            print(f"❌ Erro ao listar anexos: {response.status_code}")
            print(f"   Resposta: {response.text[:200]}")
    except Exception as e:
        print(f"❌ Erro na requisição de listagem: {e}")
    
    # Teste 4: Verificar anexos no banco de dados
    print("\n🔍 Teste 4: Verificando anexos no banco de dados...")
    try:
        anexos_count = AnexoS3.objects.count()
        print(f"Total de anexos S3 no banco: {anexos_count}")
        
        if anexos_count > 0:
            primeiro_anexo = AnexoS3.objects.first()
            print(f"Primeiro anexo:")
            print(f"   ID: {primeiro_anexo.anexo_id}")
            print(f"   Nome original: {primeiro_anexo.nome_original}")
            print(f"   Content-Type: {primeiro_anexo.content_type}")
            print(f"   Tamanho: {primeiro_anexo.file_size} bytes")
            print(f"   Bucket: {primeiro_anexo.bucket_name}")
            print(f"   S3 Key: {primeiro_anexo.s3_key}")
    except Exception as e:
        print(f"❌ Erro ao verificar banco de dados: {e}")

if __name__ == '__main__':
    test_anexos_s3_endpoints()