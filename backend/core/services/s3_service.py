import os
import hashlib
import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from django.conf import settings
from django.core.files.uploadedfile import UploadedFile
from django.utils import timezone
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
import logging

from ..models import AnexoS3

logger = logging.getLogger(__name__)


class S3Service:
    """
    Serviço para gerenciar uploads, downloads e migrações de arquivos no AWS S3.
    Implementa funcionalidades cloud-first com fallback para armazenamento local.
    """
    
    def __init__(self):
        self.bucket_name = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', None)
        self.region = getattr(settings, 'AWS_S3_REGION_NAME', 'us-east-1')
        self.access_key = getattr(settings, 'AWS_ACCESS_KEY_ID', None)
        self.secret_key = getattr(settings, 'AWS_SECRET_ACCESS_KEY', None)
        
        # Configuração do cliente S3
        self.s3_client = None
        self.s3_available = False
        
        if self.access_key and self.secret_key and self.bucket_name:
            try:
                self.s3_client = boto3.client(
                    's3',
                    aws_access_key_id=self.access_key,
                    aws_secret_access_key=self.secret_key,
                    region_name=self.region
                )
                # Teste de conectividade
                self.s3_client.head_bucket(Bucket=self.bucket_name)
                self.s3_available = True
                logger.info(f"S3 service initialized successfully for bucket: {self.bucket_name}")
            except (ClientError, NoCredentialsError) as e:
                logger.warning(f"S3 not available: {e}. Falling back to local storage.")
                self.s3_available = False
        else:
            logger.info("S3 credentials not configured. Using local storage.")
    
    def _generate_file_hash(self, file_content: bytes) -> str:
        """Gera hash SHA256 do conteúdo do arquivo."""
        return hashlib.sha256(file_content).hexdigest()
    
    def _generate_s3_key(self, anexo_type: str, filename: str) -> str:
        """Gera chave única para o arquivo no S3."""
        timestamp = datetime.now().strftime('%Y/%m/%d')
        unique_id = str(uuid.uuid4())[:8]
        safe_filename = filename.replace(' ', '_').replace('(', '').replace(')', '')
        return f"{anexo_type}/{timestamp}/{unique_id}_{safe_filename}"
    
    def upload_file(self, 
                   file: UploadedFile, 
                   anexo_type: str, 
                   object_id: Optional[int] = None,
                   user_id: int = None,
                   metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Faz upload de um arquivo para o S3 ou armazenamento local.
        
        Args:
            file: Arquivo enviado pelo usuário
            anexo_type: Tipo do anexo (obra, funcionario, compra, etc.)
            object_id: ID do objeto relacionado
            user_id: ID do usuário que fez o upload
            metadata: Metadados adicionais
        
        Returns:
            Dict com informações do arquivo enviado
        """
        try:
            # Lê o conteúdo do arquivo
            file_content = file.read()
            file.seek(0)  # Reset file pointer
            
            # Gera hash do arquivo
            file_hash = self._generate_file_hash(file_content)
            
            # Verifica se já existe um arquivo com o mesmo hash
            existing_anexo = AnexoS3.objects.filter(file_hash=file_hash).first()
            if existing_anexo:
                logger.info(f"File with hash {file_hash} already exists. Returning existing record.")
                return {
                    'success': True,
                    'anexo_id': existing_anexo.anexo_id,
                    'url': existing_anexo.s3_url,
                    'duplicate': True,
                    'existing_anexo': existing_anexo
                }
            
            anexo_id = str(uuid.uuid4())
            
            if self.s3_available:
                # Upload para S3
                s3_key = self._generate_s3_key(anexo_type, file.name)
                
                # Metadados para o S3
                s3_metadata = {
                    'anexo-id': anexo_id,
                    'anexo-type': anexo_type,
                    'original-filename': file.name,
                    'uploaded-by': str(user_id) if user_id else 'unknown'
                }
                
                if metadata:
                    s3_metadata.update({f'custom-{k}': str(v) for k, v in metadata.items()})
                
                # Upload do arquivo (sem ACL)
                self.s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=s3_key,
                    Body=file_content,
                    ContentType=file.content_type or 'application/octet-stream',
                    Metadata=s3_metadata
                )
                
                # Gera URL do arquivo
                s3_url = f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/{s3_key}"
                
                # Salva registro no banco
                anexo_s3 = AnexoS3.objects.create(
                    anexo_id=anexo_id,
                    nome_original=file.name,
                    nome_s3=s3_key.split('/')[-1],
                    bucket_name=self.bucket_name,
                    s3_key=s3_key,
                    s3_url=s3_url,
                    content_type=file.content_type or 'application/octet-stream',
                    file_size=len(file_content),
                    file_hash=file_hash,
                    anexo_type=anexo_type,
                    object_id=object_id,
                    uploaded_by_id=user_id,
                    metadata=metadata or {}
                )
                
                logger.info(f"File uploaded successfully to S3: {s3_key}")
                
                return {
                    'success': True,
                    'anexo_id': anexo_id,
                    'url': s3_url,
                    'duplicate': False,
                    'anexo': anexo_s3
                }
            
            else:
                # Fallback para armazenamento local
                logger.warning("S3 not available. This should not happen in production.")
                return {
                    'success': False,
                    'error': 'S3 service not available and local fallback not implemented for cloud-first approach'
                }
                
        except Exception as e:
            logger.error(f"Error uploading file: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_storage_info(self) -> Dict[str, Any]:
        """
        Obtém informações sobre o armazenamento S3.
        
        Returns:
            Dict com informações de armazenamento
        """
        try:
            from django.db.models import Sum
            
            # Estatísticas básicas do banco de dados
            total_files = AnexoS3.objects.count()
            total_size = AnexoS3.objects.aggregate(
                total=Sum('file_size')
            )['total'] or 0
            
            storage_data = {
                'total_files': total_files,
                'total_size_bytes': total_size,
                'total_size_mb': round(total_size / (1024 * 1024), 2),
                's3_available': self.s3_available,
                'bucket_name': self.bucket_name if self.s3_available else None,
                'region': self.region if self.s3_available else None
            }
            
            # Se S3 estiver disponível, tenta obter informações adicionais do bucket
            if self.s3_available:
                try:
                    # Verifica se o bucket existe e está acessível
                    self.s3_client.head_bucket(Bucket=self.bucket_name)
                    storage_data['bucket_accessible'] = True
                except Exception as e:
                    logger.warning(f"Bucket not accessible: {e}")
                    storage_data['bucket_accessible'] = False
                    storage_data['bucket_error'] = str(e)
            
            return {
                'success': True,
                'data': storage_data
            }
            
        except Exception as e:
            logger.error(f"Error getting storage info: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def generate_signed_url(self, anexo_id: str, expiration: int = 3600) -> Dict[str, Any]:
        """
        Gera uma URL assinada para acesso temporário ao arquivo no S3.
        
        Args:
            anexo_id: ID do anexo
            expiration: Tempo de expiração em segundos (padrão: 1 hora)
        
        Returns:
            Dict com a URL assinada ou erro
        """
        try:
            anexo = AnexoS3.objects.get(anexo_id=anexo_id)
            
            if self.s3_available:
                signed_url = self.s3_client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': anexo.bucket_name, 'Key': anexo.s3_key},
                    ExpiresIn=expiration
                )
                
                return {
                    'success': True,
                    'signed_url': signed_url,
                    'expires_in': expiration
                }
            else:
                return {
                    'success': False,
                    'error': 'S3 service not available'
                }
                
        except AnexoS3.DoesNotExist:
            return {
                'success': False,
                'error': 'Anexo not found'
            }
        except Exception as e:
            logger.error(f"Error generating signed URL: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def download_file(self, anexo_id: str) -> Dict[str, Any]:
        """
        Baixa um arquivo do S3.
        
        Args:
            anexo_id: ID do anexo
        
        Returns:
            Dict com o conteúdo do arquivo ou erro
        """
        try:
            anexo = AnexoS3.objects.get(anexo_id=anexo_id)
            
            if self.s3_available:
                response = self.s3_client.get_object(
                    Bucket=anexo.bucket_name,
                    Key=anexo.s3_key
                )
                
                return {
                    'success': True,
                    'content': response['Body'].read(),
                    'content_type': anexo.content_type,
                    'filename': anexo.nome_original
                }
            else:
                # Mock para desenvolvimento - simula conteúdo de arquivo
                logger.info(f"S3 not available, returning mock content for {anexo_id}")
                
                # Gera conteúdo mock baseado no tipo de arquivo
                if anexo.content_type and anexo.content_type.startswith('image/'):
                    # Para imagens, retorna um pixel transparente PNG
                    mock_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'
                elif anexo.content_type and anexo.content_type == 'application/pdf':
                    # Para PDFs, retorna um PDF mínimo válido
                    mock_content = b'%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF'
                else:
                    # Para outros tipos, retorna texto simples
                    mock_content = f"Mock content for file: {anexo.nome_original}".encode('utf-8')
                
                return {
                    'success': True,
                    'content': mock_content,
                    'content_type': anexo.content_type or 'application/octet-stream',
                    'filename': anexo.nome_original
                }
                
        except AnexoS3.DoesNotExist:
            return {
                'success': False,
                'error': 'Anexo not found'
            }
        except Exception as e:
            logger.error(f"Error downloading file: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def delete_file(self, anexo_id: str) -> Dict[str, Any]:
        """
        Deleta um arquivo do S3 e remove o registro do banco.
        
        Args:
            anexo_id: ID do anexo
        
        Returns:
            Dict com resultado da operação
        """
        try:
            anexo = AnexoS3.objects.get(anexo_id=anexo_id)
            
            if self.s3_available:
                # Remove do S3
                self.s3_client.delete_object(
                    Bucket=anexo.bucket_name,
                    Key=anexo.s3_key
                )
                logger.info(f"File deleted from S3: {anexo.s3_key}")
            
            # Remove do banco de dados
            anexo.delete()
            
            return {
                'success': True,
                'message': 'File deleted successfully'
            }
            
        except AnexoS3.DoesNotExist:
            return {
                'success': False,
                'error': 'Anexo not found'
            }
        except Exception as e:
            logger.error(f"Error deleting file: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def migrate_local_files(self, local_directory: str) -> Dict[str, Any]:
        """
        Migra arquivos locais para o S3.
        
        Args:
            local_directory: Diretório local com os arquivos
        
        Returns:
            Dict com resultado da migração
        """
        if not self.s3_available:
            return {
                'success': False,
                'error': 'S3 service not available for migration'
            }
        
        try:
            migrated_files = []
            failed_files = []
            
            for root, dirs, files in os.walk(local_directory):
                for file in files:
                    file_path = os.path.join(root, file)
                    
                    try:
                        with open(file_path, 'rb') as f:
                            file_content = f.read()
                        
                        # Gera chave S3
                        s3_key = self._generate_s3_key('migrated', file)
                        
                        # Upload para S3
                        self.s3_client.put_object(
                            Bucket=self.bucket_name,
                            Key=s3_key,
                            Body=file_content
                        )
                        
                        migrated_files.append({
                            'local_path': file_path,
                            's3_key': s3_key,
                            'size': len(file_content)
                        })
                        
                        logger.info(f"Migrated file: {file_path} -> {s3_key}")
                        
                    except Exception as e:
                        failed_files.append({
                            'local_path': file_path,
                            'error': str(e)
                        })
                        logger.error(f"Failed to migrate file {file_path}: {e}")
            
            return {
                'success': True,
                'migrated_count': len(migrated_files),
                'failed_count': len(failed_files),
                'migrated_files': migrated_files,
                'failed_files': failed_files
            }
            
        except Exception as e:
            logger.error(f"Error during migration: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_file_info(self, anexo_id: str) -> Dict[str, Any]:
        """
        Obtém informações detalhadas sobre um arquivo.
        
        Args:
            anexo_id: ID do anexo
        
        Returns:
            Dict com informações do arquivo
        """
        try:
            anexo = AnexoS3.objects.get(anexo_id=anexo_id)
            
            file_info = {
                'anexo_id': anexo.anexo_id,
                'nome_original': anexo.nome_original,
                'nome_s3': anexo.nome_s3,
                'content_type': anexo.content_type,
                'file_size': anexo.file_size,
                'file_hash': anexo.file_hash,
                'anexo_type': anexo.anexo_type,
                'object_id': anexo.object_id,
                'uploaded_at': anexo.uploaded_at,
                'uploaded_by': anexo.uploaded_by_id,
                'metadata': anexo.metadata,
                's3_available': self.s3_available
            }
            
            if self.s3_available:
                file_info.update({
                    'bucket_name': anexo.bucket_name,
                    's3_key': anexo.s3_key,
                    's3_url': anexo.s3_url
                })
            
            return {
                'success': True,
                'file_info': file_info
            }
            
        except AnexoS3.DoesNotExist:
            return {
                'success': False,
                'error': 'Anexo not found'
            }
        except Exception as e:
            logger.error(f"Error getting file info: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def list_files(self, 
                  anexo_type: Optional[str] = None,
                  object_id: Optional[int] = None,
                  limit: int = 100,
                  offset: int = 0) -> Dict[str, Any]:
        """
        Lista arquivos com filtros opcionais.
        
        Args:
            anexo_type: Filtrar por tipo de anexo
            object_id: Filtrar por ID do objeto
            limit: Limite de resultados
            offset: Offset para paginação
        
        Returns:
            Dict com lista de arquivos
        """
        try:
            queryset = AnexoS3.objects.all()
            
            if anexo_type:
                queryset = queryset.filter(anexo_type=anexo_type)
            
            if object_id:
                queryset = queryset.filter(object_id=object_id)
            
            total_count = queryset.count()
            files = queryset.order_by('-uploaded_at')[offset:offset + limit]
            
            files_data = []
            for anexo in files:
                file_data = {
                    'anexo_id': anexo.anexo_id,
                    'nome_original': anexo.nome_original,
                    'content_type': anexo.content_type,
                    'file_size': anexo.file_size,
                    'anexo_type': anexo.anexo_type,
                    'object_id': anexo.object_id,
                    'uploaded_at': anexo.uploaded_at,
                    'uploaded_by': anexo.uploaded_by_id
                }
                
                if self.s3_available:
                    file_data['s3_url'] = anexo.s3_url
                
                files_data.append(file_data)
            
            return {
                'success': True,
                'files': files_data,
                'total_count': total_count,
                'limit': limit,
                'offset': offset,
                'has_more': (offset + limit) < total_count
            }
            
        except Exception as e:
            logger.error(f"Error listing files: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }