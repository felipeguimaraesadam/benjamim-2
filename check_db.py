#!/usr/bin/env python
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from core.models import AnexoS3, ArquivoObra

print('=== Database Status ===')
print(f'AnexoS3 count: {AnexoS3.objects.count()}')
print(f'ArquivoObra count: {ArquivoObra.objects.count()}')
print(f'ArquivoObra with s3_anexo_id: {ArquivoObra.objects.filter(s3_anexo_id__isnull=False).count()}')

if AnexoS3.objects.exists():
    anexo = AnexoS3.objects.first()
    print('\n=== Sample AnexoS3 ===')
    print(f'ID: {anexo.anexo_id}')
    print(f'Nome: {anexo.nome_original}')
    print(f'Tipo: {anexo.anexo_type}')
    print(f'Object ID: {anexo.object_id}')
    print(f'S3 Key: {anexo.s3_key}')
    print(f'Bucket: {anexo.bucket_name}')
    print(f'Upload: {anexo.uploaded_at}')

if ArquivoObra.objects.exists():
    arquivo = ArquivoObra.objects.first()
    print('\n=== Sample ArquivoObra ===')
    print(f'ID: {arquivo.id}')
    print(f'Nome: {arquivo.nome_original}')
    print(f'S3 Anexo ID: {arquivo.s3_anexo_id}')
    print(f'S3 URL: {arquivo.s3_url}')
    print(f'Arquivo local: {arquivo.arquivo}')
    print(f'Upload: {arquivo.uploaded_at}')

print('\n=== Checking S3 Service ===')
from core.services.s3_service import S3Service
s3_service = S3Service()
print(f'S3 Available: {s3_service.s3_available}')
if s3_service.s3_available:
    print(f'Bucket: {s3_service.bucket_name}')
else:
    print('S3 not configured or not available')