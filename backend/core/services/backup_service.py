import os
import hashlib
import uuid
import sqlite3
import tempfile
from datetime import datetime
from typing import Optional, Dict, Any, List
from django.conf import settings
from django.core.files.uploadedfile import UploadedFile
from django.utils import timezone
from django.core.management import call_command
from django.db import connection
import logging

from ..models import BackupLog, TaskHistory
from .s3_service import S3Service

logger = logging.getLogger(__name__)


class BackupService:
    """
    Serviço para gerenciar backups do sistema.
    Inclui funcionalidades de criação, upload, verificação de duplicatas e restauração.
    """
    
    def __init__(self):
        self.s3_service = S3Service()
        self.backup_dir = getattr(settings, 'BACKUP_DIR', '/tmp/backups')
        
        # Cria diretório de backup se não existir
        os.makedirs(self.backup_dir, exist_ok=True)
    
    def _generate_backup_id(self) -> str:
        """Gera ID único para o backup."""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_id = str(uuid.uuid4())[:8]
        return f"backup_{timestamp}_{unique_id}"
    
    def _calculate_file_hash(self, file_path: str) -> str:
        """Calcula hash SHA256 de um arquivo."""
        hash_sha256 = hashlib.sha256()
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_sha256.update(chunk)
        return hash_sha256.hexdigest()
    
    def _validate_sqlite_file(self, file_path: str) -> Dict[str, Any]:
        """
        Valida se o arquivo é um banco SQLite válido.
        
        Args:
            file_path: Caminho para o arquivo
        
        Returns:
            Dict com resultado da validação
        """
        try:
            conn = sqlite3.connect(file_path)
            cursor = conn.cursor()
            
            # Verifica se é um banco SQLite válido
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            
            # Obtém informações básicas do banco
            cursor.execute("PRAGMA database_list;")
            db_info = cursor.fetchall()
            
            cursor.execute("PRAGMA user_version;")
            user_version = cursor.fetchone()[0]
            
            conn.close()
            
            return {
                'valid': True,
                'tables_count': len(tables),
                'tables': [table[0] for table in tables],
                'user_version': user_version,
                'database_info': db_info
            }
            
        except sqlite3.Error as e:
            return {
                'valid': False,
                'error': f"Invalid SQLite file: {str(e)}"
            }
        except Exception as e:
            return {
                'valid': False,
                'error': f"Error validating file: {str(e)}"
            }
    
    def create_backup(self, 
                     backup_type: str = 'manual',
                     user_id: int = None,
                     description: str = '') -> Dict[str, Any]:
        """
        Cria um backup do banco de dados atual.
        
        Args:
            backup_type: Tipo do backup (manual, full, incremental)
            user_id: ID do usuário que solicitou o backup
            description: Descrição do backup
        
        Returns:
            Dict com resultado da operação
        """
        backup_id = self._generate_backup_id()
        
        # Cria registro de log do backup
        backup_log = BackupLog.objects.create(
            backup_id=backup_id,
            backup_type=backup_type,
            status='in_progress',
            created_by_id=user_id,
            metadata={
                'description': description,
                'created_at': timezone.now().isoformat()
            }
        )
        
        # Cria tarefa de histórico
        task = TaskHistory.objects.create(
            task_id=f"backup_{backup_id}_{uuid.uuid4().hex[:8]}",
            task_type='backup',
            title=f"Backup {backup_type.title()}",
            description=f"Criando backup do tipo {backup_type}: {description}",
            status='in_progress',
            created_by_id=user_id,
            metadata={
                'backup_id': backup_id,
                'backup_type': backup_type
            }
        )
        
        try:
            # Gera nome do arquivo de backup
            backup_filename = f"{backup_id}.sqlite"
            backup_path = os.path.join(self.backup_dir, backup_filename)
            
            # Cria backup usando Django
            if settings.DATABASES['default']['ENGINE'] == 'django.db.backends.sqlite3':
                # Para SQLite, copia o arquivo diretamente
                db_path = settings.DATABASES['default']['NAME']
                import shutil
                shutil.copy2(db_path, backup_path)
            else:
                # Para outros bancos, usa dumpdata
                with open(backup_path.replace('.sqlite', '.json'), 'w') as f:
                    call_command('dumpdata', stdout=f, indent=2)
                backup_path = backup_path.replace('.sqlite', '.json')
            
            # Calcula hash do arquivo
            file_hash = self._calculate_file_hash(backup_path)
            file_size = os.path.getsize(backup_path)
            
            # Verifica se já existe backup com mesmo hash
            existing_backup = BackupLog.objects.filter(
                file_hash=file_hash,
                status='completed'
            ).first()
            
            if existing_backup:
                # Marca como duplicata
                backup_log.is_duplicate = True
                backup_log.original_backup = existing_backup
                backup_log.status = 'completed'
                backup_log.file_hash = file_hash
                backup_log.file_size = file_size
                backup_log.completed_at = timezone.now()
                backup_log.save()
                
                # Remove arquivo duplicado
                os.remove(backup_path)
                
                # Atualiza tarefa
                task.status = 'completed'
                task.completed_at = timezone.now()
                task.metadata.update({
                    'duplicate': True,
                    'original_backup_id': existing_backup.backup_id
                })
                task.save()
                
                logger.info(f"Backup {backup_id} is duplicate of {existing_backup.backup_id}")
                
                return {
                    'success': True,
                    'backup_id': backup_id,
                    'duplicate': True,
                    'original_backup_id': existing_backup.backup_id,
                    'message': 'Backup is duplicate of existing backup'
                }
            
            # Upload para S3 se disponível
            s3_result = None
            if self.s3_service.s3_available:
                with open(backup_path, 'rb') as f:
                    # Cria um objeto similar ao UploadedFile
                    class BackupFile:
                        def __init__(self, file_path, content):
                            self.name = os.path.basename(file_path)
                            self.content_type = 'application/x-sqlite3'
                            self._content = content
                            self._size = len(content)
                        
                        def read(self):
                            return self._content
                        
                        def seek(self, pos):
                            pass
                    
                    file_content = f.read()
                    backup_file = BackupFile(backup_path, file_content)
                    
                    s3_result = self.s3_service.upload_file(
                        file=backup_file,
                        anexo_type='backup',
                        object_id=backup_log.id,
                        user_id=user_id,
                        metadata={
                            'backup_id': backup_id,
                            'backup_type': backup_type,
                            'description': description
                        }
                    )
            
            # Atualiza registro do backup
            backup_log.status = 'completed'
            backup_log.file_path = backup_path
            backup_log.file_size = file_size
            backup_log.file_hash = file_hash
            backup_log.completed_at = timezone.now()
            
            if s3_result and s3_result.get('success'):
                backup_log.metadata.update({
                    's3_anexo_id': s3_result.get('anexo_id'),
                    's3_url': s3_result.get('url')
                })
            
            backup_log.save()
            
            # Atualiza tarefa
            task.status = 'completed'
            task.completed_at = timezone.now()
            task.progress_percentage = 100
            task.metadata.update({
                'file_size': file_size,
                'file_hash': file_hash,
                's3_uploaded': s3_result.get('success', False) if s3_result else False
            })
            task.save()
            
            # Remove arquivo local se foi enviado para S3
            if s3_result and s3_result.get('success'):
                os.remove(backup_path)
            
            logger.info(f"Backup {backup_id} created successfully")
            
            return {
                'success': True,
                'backup_id': backup_id,
                'duplicate': False,
                'file_size': file_size,
                'file_hash': file_hash,
                's3_uploaded': s3_result.get('success', False) if s3_result else False
            }
            
        except Exception as e:
            # Atualiza registros com erro
            backup_log.status = 'failed'
            backup_log.error_message = str(e)
            backup_log.save()
            
            task.status = 'failed'
            task.error_message = str(e)
            task.save()
            
            logger.error(f"Error creating backup {backup_id}: {str(e)}")
            
            return {
                'success': False,
                'backup_id': backup_id,
                'error': str(e)
            }
    
    def upload_backup(self, 
                     backup_file: UploadedFile,
                     user_id: int = None,
                     description: str = '') -> Dict[str, Any]:
        """
        Faz upload de um arquivo de backup SQLite.
        
        Args:
            backup_file: Arquivo de backup enviado
            user_id: ID do usuário que fez o upload
            description: Descrição do backup
        
        Returns:
            Dict com resultado da operação
        """
        backup_id = self._generate_backup_id()
        
        # Cria registro de log do backup
        backup_log = BackupLog.objects.create(
            backup_id=backup_id,
            backup_type='manual',
            status='in_progress',
            created_by_id=user_id,
            metadata={
                'description': description,
                'original_filename': backup_file.name,
                'uploaded_at': timezone.now().isoformat()
            }
        )
        
        # Cria tarefa de histórico
        task = TaskHistory.objects.create(
            task_id=f"upload_{backup_id}_{uuid.uuid4().hex[:8]}",
            task_type='backup',
            title="Upload de Backup",
            description=f"Upload de arquivo de backup: {backup_file.name}",
            status='in_progress',
            created_by_id=user_id,
            metadata={
                'backup_id': backup_id,
                'original_filename': backup_file.name
            }
        )
        
        try:
            # Salva arquivo temporariamente para validação
            temp_path = os.path.join(self.backup_dir, f"temp_{backup_id}")
            
            with open(temp_path, 'wb') as temp_file:
                for chunk in backup_file.chunks():
                    temp_file.write(chunk)
            
            # Valida se é um arquivo SQLite válido
            validation = self._validate_sqlite_file(temp_path)
            
            if not validation['valid']:
                os.remove(temp_path)
                
                backup_log.status = 'failed'
                backup_log.error_message = validation['error']
                backup_log.save()
                
                task.status = 'failed'
                task.error_message = validation['error']
                task.save()
                
                return {
                    'success': False,
                    'backup_id': backup_id,
                    'error': validation['error']
                }
            
            # Calcula hash do arquivo
            file_hash = self._calculate_file_hash(temp_path)
            file_size = os.path.getsize(temp_path)
            
            # Verifica se já existe backup com mesmo hash
            existing_backup = BackupLog.objects.filter(
                file_hash=file_hash,
                status='completed'
            ).first()
            
            if existing_backup:
                # Marca como duplicata
                backup_log.is_duplicate = True
                backup_log.original_backup = existing_backup
                backup_log.status = 'completed'
                backup_log.file_hash = file_hash
                backup_log.file_size = file_size
                backup_log.completed_at = timezone.now()
                backup_log.save()
                
                # Remove arquivo temporário
                os.remove(temp_path)
                
                # Atualiza tarefa
                task.status = 'completed'
                task.completed_at = timezone.now()
                task.metadata.update({
                    'duplicate': True,
                    'original_backup_id': existing_backup.backup_id,
                    'validation': validation
                })
                task.save()
                
                logger.info(f"Uploaded backup {backup_id} is duplicate of {existing_backup.backup_id}")
                
                return {
                    'success': True,
                    'backup_id': backup_id,
                    'duplicate': True,
                    'original_backup_id': existing_backup.backup_id,
                    'validation': validation,
                    'message': 'Backup is duplicate of existing backup'
                }
            
            # Move arquivo para local definitivo
            final_path = os.path.join(self.backup_dir, f"{backup_id}.sqlite")
            os.rename(temp_path, final_path)
            
            # Upload para S3 se disponível
            s3_result = None
            if self.s3_service.s3_available:
                backup_file.seek(0)  # Reset file pointer
                s3_result = self.s3_service.upload_file(
                    file=backup_file,
                    anexo_type='backup',
                    object_id=backup_log.id,
                    user_id=user_id,
                    metadata={
                        'backup_id': backup_id,
                        'description': description,
                        'validation': validation
                    }
                )
            
            # Atualiza registro do backup
            backup_log.status = 'completed'
            backup_log.file_path = final_path
            backup_log.file_size = file_size
            backup_log.file_hash = file_hash
            backup_log.completed_at = timezone.now()
            backup_log.metadata.update({
                'validation': validation
            })
            
            if s3_result and s3_result.get('success'):
                backup_log.metadata.update({
                    's3_anexo_id': s3_result.get('anexo_id'),
                    's3_url': s3_result.get('url')
                })
            
            backup_log.save()
            
            # Atualiza tarefa
            task.status = 'completed'
            task.completed_at = timezone.now()
            task.progress_percentage = 100
            task.metadata.update({
                'file_size': file_size,
                'file_hash': file_hash,
                'validation': validation,
                's3_uploaded': s3_result.get('success', False) if s3_result else False
            })
            task.save()
            
            # Remove arquivo local se foi enviado para S3
            if s3_result and s3_result.get('success'):
                os.remove(final_path)
            
            logger.info(f"Backup {backup_id} uploaded successfully")
            
            return {
                'success': True,
                'backup_id': backup_id,
                'duplicate': False,
                'file_size': file_size,
                'file_hash': file_hash,
                'validation': validation,
                's3_uploaded': s3_result.get('success', False) if s3_result else False
            }
            
        except Exception as e:
            # Remove arquivo temporário se existir
            temp_path = os.path.join(self.backup_dir, f"temp_{backup_id}")
            if os.path.exists(temp_path):
                os.remove(temp_path)
            
            # Atualiza registros com erro
            backup_log.status = 'failed'
            backup_log.error_message = str(e)
            backup_log.save()
            
            task.status = 'failed'
            task.error_message = str(e)
            task.save()
            
            logger.error(f"Error uploading backup {backup_id}: {str(e)}")
            
            return {
                'success': False,
                'backup_id': backup_id,
                'error': str(e)
            }
    
    def list_backups(self, 
                    backup_type: str = None,
                    user_id: int = None,
                    limit: int = 50) -> Dict[str, Any]:
        """
        Lista backups com filtros opcionais.
        
        Args:
            backup_type: Filtrar por tipo de backup
            user_id: Filtrar por usuário
            limit: Limite de resultados
        
        Returns:
            Dict com lista de backups
        """
        try:
            queryset = BackupLog.objects.all()
            
            if backup_type:
                queryset = queryset.filter(backup_type=backup_type)
            
            if user_id:
                queryset = queryset.filter(created_by_id=user_id)
            
            backups = queryset[:limit]
            
            backups_list = []
            for backup in backups:
                backups_list.append({
                    'backup_id': backup.backup_id,
                    'backup_type': backup.backup_type,
                    'status': backup.status,
                    'file_size': backup.file_size,
                    'created_at': backup.created_at,
                    'completed_at': backup.completed_at,
                    'is_duplicate': backup.is_duplicate,
                    'created_by': backup.created_by.username if backup.created_by else None,
                    'metadata': backup.metadata
                })
            
            return {
                'success': True,
                'backups': backups_list,
                'count': len(backups_list)
            }
            
        except Exception as e:
            logger.error(f"Error listing backups: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_backup_info(self, backup_id: str) -> Dict[str, Any]:
        """
        Obtém informações detalhadas de um backup.
        
        Args:
            backup_id: ID do backup
        
        Returns:
            Dict com informações do backup
        """
        try:
            backup = BackupLog.objects.get(backup_id=backup_id)
            
            return {
                'success': True,
                'backup_id': backup.backup_id,
                'backup_type': backup.backup_type,
                'status': backup.status,
                'file_path': backup.file_path,
                'file_size': backup.file_size,
                'file_hash': backup.file_hash,
                'created_at': backup.created_at,
                'completed_at': backup.completed_at,
                'is_duplicate': backup.is_duplicate,
                'original_backup_id': backup.original_backup.backup_id if backup.original_backup else None,
                'created_by': backup.created_by.username if backup.created_by else None,
                'error_message': backup.error_message,
                'metadata': backup.metadata
            }
            
        except BackupLog.DoesNotExist:
            return {
                'success': False,
                'error': 'Backup not found'
            }
        except Exception as e:
            logger.error(f"Error getting backup info {backup_id}: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }