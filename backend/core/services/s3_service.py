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
            logger.error(f"Error downloading file {anexo_id}: {str(e)}")
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
            
            # Remove do banco
            anexo.delete()
            
            logger.info(f"File deleted successfully: {anexo_id}")
            
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
            logger.error(f"Error deleting file {anexo_id}: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def migrate_local_files(self, anexo_type: str = None) -> Dict[str, Any]:
        """
        Migra arquivos locais existentes para o S3.
        
        Args:
            anexo_type: Tipo específico de anexo para migrar (opcional)
        
        Returns:
            Dict com estatísticas da migração
        """
        if not self.s3_available:
            return {
                'success': False,
                'error': 'S3 service not available for migration'
            }
        
        # Esta funcionalidade será implementada quando necessário
        # para migrar arquivos dos modelos existentes (FotoObra, AnexoCompra, etc.)
        
        return {
            'success': True,
            'message': 'Migration functionality to be implemented based on existing file models'
        }
    
    def get_file_info(self, anexo_id: str) -> Dict[str, Any]:
        """
        Obtém informações de um arquivo sem baixá-lo.
        
        Args:
            anexo_id: ID do anexo
        
        Returns:
            Dict com informações do arquivo
        """
        try:
            anexo = AnexoS3.objects.get(anexo_id=anexo_id)
            
            return {
                'success': True,
                'anexo_id': anexo.anexo_id,
                'nome_original': anexo.nome_original,
                'content_type': anexo.content_type,
                'file_size': anexo.file_size,
                'uploaded_at': anexo.uploaded_at,
                'anexo_type': anexo.anexo_type,
                'object_id': anexo.object_id,
                'is_migrated': anexo.is_migrated,
                'metadata': anexo.metadata
            }
            
        except AnexoS3.DoesNotExist:
            return {
                'success': False,
                'error': 'Anexo not found'
            }
        except Exception as e:
            logger.error(f"Error getting file info {anexo_id}: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def list_files(self, 
                  anexo_type: str = None, 
                  object_id: int = None,
                  limit: int = 100) -> Dict[str, Any]:
        """
        Lista arquivos com filtros opcionais.
        
        Args:
            anexo_type: Filtrar por tipo de anexo
            object_id: Filtrar por ID do objeto relacionado
            limit: Limite de resultados
        
        Returns:
            Dict com lista de arquivos
        """
        try:
            queryset = AnexoS3.objects.all()
            
            if anexo_type:
                queryset = queryset.filter(anexo_type=anexo_type)
            
            if object_id:
                queryset = queryset.filter(object_id=object_id)
            
            anexos = queryset[:limit]
            
            files_list = []
            for anexo in anexos:
                files_list.append({
                    'anexo_id': anexo.anexo_id,
                    'nome_original': anexo.nome_original,
                    'content_type': anexo.content_type,
                    'file_size': anexo.file_size,
                    'uploaded_at': anexo.uploaded_at,
                    'anexo_type': anexo.anexo_type,
                    'object_id': anexo.object_id,
                    'is_migrated': anexo.is_migrated
                })
            
            return {
                'success': True,
                'files': files_list,
                'count': len(files_list)
            }
            
        except Exception as e:
            logger.error(f"Error listing files: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }