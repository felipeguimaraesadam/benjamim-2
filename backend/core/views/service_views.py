from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from django.http import Http404
from django.core.files.uploadedfile import UploadedFile
import logging

from ..models import BackupLog, TaskHistory, AnexoS3
from ..serializers import BackupLogSerializer, TaskHistorySerializer
from ..serializers.service_serializers import AnexoS3Serializer
from ..services.backup_service import BackupService
from ..services.task_service import TaskService
from ..services.s3_service import S3Service
from ..permissions import IsNivelAdmin, IsNivelGerente

logger = logging.getLogger(__name__)


class BackupViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar backups do sistema.
    """
    queryset = BackupLog.objects.all().order_by('-created_at')
    serializer_class = BackupLogSerializer
    permission_classes = [IsNivelAdmin]
    parser_classes = [MultiPartParser, FormParser]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.backup_service = BackupService()
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtros opcionais
        backup_type = self.request.query_params.get('backup_type')
        status_filter = self.request.query_params.get('status')
        user_id = self.request.query_params.get('user_id')
        
        if backup_type:
            queryset = queryset.filter(backup_type=backup_type)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if user_id:
            queryset = queryset.filter(created_by_id=user_id)
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def create_backup(self, request):
        """
        Cria um novo backup do sistema.
        """
        backup_type = request.data.get('backup_type', 'manual')
        description = request.data.get('description', '')
        user_id = request.user.id if request.user.is_authenticated else None
        
        try:
            result = self.backup_service.create_backup(
                backup_type=backup_type,
                user_id=user_id,
                description=description
            )
            
            if result['success']:
                return Response({
                    'success': True,
                    'message': 'Backup criado com sucesso',
                    'backup_id': result['backup_id'],
                    'duplicate': result.get('duplicate', False),
                    'file_size': result.get('file_size'),
                    's3_uploaded': result.get('s3_uploaded', False)
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'success': False,
                    'error': result['error']
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error in create_backup view: {str(e)}")
            return Response({
                'success': False,
                'error': 'Erro interno do servidor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def upload_backup(self, request):
        """
        Faz upload de um arquivo de backup.
        """
        if 'backup_file' not in request.FILES:
            return Response({
                'success': False,
                'error': 'Arquivo de backup é obrigatório'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        backup_file = request.FILES['backup_file']
        description = request.data.get('description', '')
        user_id = request.user.id if request.user.is_authenticated else None
        
        try:
            result = self.backup_service.upload_backup(
                backup_file=backup_file,
                user_id=user_id,
                description=description
            )
            
            if result['success']:
                return Response({
                    'success': True,
                    'message': 'Backup enviado com sucesso',
                    'backup_id': result['backup_id'],
                    'duplicate': result.get('duplicate', False),
                    'file_size': result.get('file_size'),
                    'validation': result.get('validation'),
                    's3_uploaded': result.get('s3_uploaded', False)
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'success': False,
                    'error': result['error']
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error in upload_backup view: {str(e)}")
            return Response({
                'success': False,
                'error': 'Erro interno do servidor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def list_backups(self, request):
        """
        Lista backups com filtros opcionais.
        """
        backup_type = request.query_params.get('backup_type')
        user_id = request.query_params.get('user_id')
        limit = int(request.query_params.get('limit', 50))
        
        try:
            result = self.backup_service.list_backups(
                backup_type=backup_type,
                user_id=int(user_id) if user_id else None,
                limit=limit
            )
            
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'error': result['error']
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error in list_backups view: {str(e)}")
            return Response({
                'success': False,
                'error': 'Erro interno do servidor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def backup_info(self, request, pk=None):
        """
        Obtém informações detalhadas de um backup.
        """
        try:
            backup = self.get_object()
            result = self.backup_service.get_backup_info(backup.backup_id)
            
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'error': result['error']
                }, status=status.HTTP_404_NOT_FOUND)
                
        except Http404:
            return Response({
                'success': False,
                'error': 'Backup não encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error in backup_info view: {str(e)}")
            return Response({
                'success': False,
                'error': 'Erro interno do servidor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar tarefas e histórico do sistema.
    """
    queryset = TaskHistory.objects.all().order_by('-created_at')
    serializer_class = TaskHistorySerializer
    permission_classes = [IsNivelAdmin | IsNivelGerente]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.task_service = TaskService()
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtros opcionais
        task_type = self.request.query_params.get('task_type')
        status_filter = self.request.query_params.get('status')
        user_id = self.request.query_params.get('user_id')
        priority = self.request.query_params.get('priority')
        
        if task_type:
            queryset = queryset.filter(task_type=task_type)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if user_id:
            queryset = queryset.filter(created_by_id=user_id)
        
        if priority:
            queryset = queryset.filter(priority=priority)
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def create_task(self, request):
        """
        Cria uma nova tarefa.
        """
        required_fields = ['task_type', 'title']
        for field in required_fields:
            if field not in request.data:
                return Response({
                    'success': False,
                    'error': f'Campo obrigatório: {field}'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        task_type = request.data['task_type']
        title = request.data['title']
        description = request.data.get('description', '')
        metadata = request.data.get('metadata', {})
        estimated_duration = request.data.get('estimated_duration')
        priority = request.data.get('priority', 'medium')
        user_id = request.user.id if request.user.is_authenticated else None
        
        try:
            result = self.task_service.create_task(
                task_type=task_type,
                title=title,
                description=description,
                user_id=user_id,
                metadata=metadata,
                estimated_duration=estimated_duration,
                priority=priority
            )
            
            if result['success']:
                return Response(result, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'success': False,
                    'error': result['error']
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error in create_task view: {str(e)}")
            return Response({
                'success': False,
                'error': 'Erro interno do servidor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """
        Atualiza o status de uma tarefa.
        """
        try:
            task = self.get_object()
            new_status = request.data.get('status')
            progress_percentage = request.data.get('progress_percentage')
            error_message = request.data.get('error_message')
            metadata_update = request.data.get('metadata_update', {})
            
            if not new_status:
                return Response({
                    'success': False,
                    'error': 'Status é obrigatório'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            result = self.task_service.update_task_status(
                task_id=task.task_id,
                status=new_status,
                progress_percentage=progress_percentage,
                error_message=error_message,
                metadata_update=metadata_update
            )
            
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'error': result['error']
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Http404:
            return Response({
                'success': False,
                'error': 'Tarefa não encontrada'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error in update_status view: {str(e)}")
            return Response({
                'success': False,
                'error': 'Erro interno do servidor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def cancel_task(self, request, pk=None):
        """
        Cancela uma tarefa.
        """
        try:
            task = self.get_object()
            reason = request.data.get('reason', '')
            
            result = self.task_service.cancel_task(
                task_id=task.task_id,
                reason=reason
            )
            
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'error': result['error']
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Http404:
            return Response({
                'success': False,
                'error': 'Tarefa não encontrada'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error in cancel_task view: {str(e)}")
            return Response({
                'success': False,
                'error': 'Erro interno do servidor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def running_tasks(self, request):
        """
        Obtém lista de tarefas em execução.
        """
        try:
            result = self.task_service.get_running_tasks()
            
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'error': result['error']
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error in running_tasks view: {str(e)}")
            return Response({
                'success': False,
                'error': 'Erro interno do servidor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Obtém estatísticas das tarefas.
        """
        days = int(request.query_params.get('days', 30))
        task_type = request.query_params.get('task_type')
        user_id = request.query_params.get('user_id')
        
        try:
            result = self.task_service.get_task_statistics(
                days=days,
                task_type=task_type,
                user_id=int(user_id) if user_id else None
            )
            
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'error': result['error']
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error in statistics view: {str(e)}")
            return Response({
                'success': False,
                'error': 'Erro interno do servidor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def cleanup_old_tasks(self, request):
        """
        Remove tarefas antigas do histórico.
        """
        days = int(request.data.get('days', 90))
        
        try:
            result = self.task_service.cleanup_old_tasks(days=days)
            
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'error': result['error']
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error in cleanup_old_tasks view: {str(e)}")
            return Response({
                'success': False,
                'error': 'Erro interno do servidor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AnexoS3ViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar anexos no S3.
    """
    queryset = AnexoS3.objects.all().order_by('-uploaded_at')
    serializer_class = AnexoS3Serializer
    permission_classes = [IsNivelAdmin | IsNivelGerente]
    parser_classes = [MultiPartParser, FormParser]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.s3_service = S3Service()
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtros opcionais
        anexo_type = self.request.query_params.get('anexo_type')
        object_id = self.request.query_params.get('object_id')
        user_id = self.request.query_params.get('user_id')
        
        if anexo_type:
            queryset = queryset.filter(anexo_type=anexo_type)
        
        if object_id:
            queryset = queryset.filter(object_id=object_id)
        
        if user_id:
            queryset = queryset.filter(uploaded_by_id=user_id)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """
        Cria um novo anexo S3 via upload de arquivo.
        """
        files = request.FILES.getlist('files')
        if not files:
            return Response({
                'success': False,
                'error': 'Nenhum arquivo foi enviado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        entity_type = request.data.get('entity_type', 'general')
        entity_id = request.data.get('entity_id')
        user_id = request.user.id if request.user.is_authenticated else None
        
        uploaded_files = []
        errors = []
        
        for file in files:
            try:
                # Converte entity_id para int se fornecido
                object_id = int(entity_id) if entity_id else None
                
                result = self.s3_service.upload_file(
                    file=file,
                    anexo_type=entity_type,
                    object_id=object_id,
                    user_id=user_id,
                    metadata={}
                )
                
                if result['success']:
                    uploaded_files.append(result)
                else:
                    errors.append(f"{file.name}: {result['error']}")
                    
            except ValueError:
                errors.append(f"{file.name}: entity_id deve ser um número válido")
            except Exception as e:
                logger.error(f"Error uploading file {file.name}: {str(e)}")
                errors.append(f"{file.name}: Erro interno do servidor")
        
        if uploaded_files:
            return Response({
                'success': True,
                'uploaded_files': uploaded_files,
                'errors': errors if errors else None
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'success': False,
                'error': 'Nenhum arquivo foi enviado com sucesso',
                'errors': errors
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def upload_file(self, request):
        """
        Faz upload de um arquivo para o S3.
        """
        if 'file' not in request.FILES:
            return Response({
                'success': False,
                'error': 'Arquivo é obrigatório'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        file = request.FILES['file']
        anexo_type = request.data.get('anexo_type', 'general')
        object_id = request.data.get('object_id')
        metadata = request.data.get('metadata', {})
        user_id = request.user.id if request.user.is_authenticated else None
        
        try:
            # Converte object_id para int se fornecido
            if object_id:
                object_id = int(object_id)
            
            result = self.s3_service.upload_file(
                file=file,
                anexo_type=anexo_type,
                object_id=object_id,
                user_id=user_id,
                metadata=metadata
            )
            
            if result['success']:
                return Response(result, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'success': False,
                    'error': result['error']
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except ValueError:
            return Response({
                'success': False,
                'error': 'object_id deve ser um número válido'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error in upload_file view: {str(e)}")
            return Response({
                'success': False,
                'error': 'Erro interno do servidor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def download_url(self, request, pk=None):
        """
        Obtém URL de download temporária para um anexo.
        """
        try:
            anexo = self.get_object()
            expiration = int(request.query_params.get('expiration', 3600))  # 1 hora por padrão
            
            result = self.s3_service.generate_signed_url(
                anexo_id=str(anexo.id),
                expiration=expiration
            )
            
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'error': result['error']
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Http404:
            return Response({
                'success': False,
                'error': 'Anexo não encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error in download_url view: {str(e)}")
            return Response({
                'success': False,
                'error': 'Erro interno do servidor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['delete'])
    def delete_file(self, request, pk=None):
        """
        Remove um arquivo do S3 e do banco de dados.
        """
        try:
            anexo = self.get_object()
            
            result = self.s3_service.delete_file(anexo_id=anexo.id)
            
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'error': result['error']
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Http404:
            return Response({
                'success': False,
                'error': 'Anexo não encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error in delete_file view: {str(e)}")
            return Response({
                'success': False,
                'error': 'Erro interno do servidor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def migrate_to_s3(self, request):
        """
        Migra anexos locais para o S3.
        """
        anexo_type = request.data.get('anexo_type')
        object_id = request.data.get('object_id')
        user_id = request.user.id if request.user.is_authenticated else None
        
        try:
            # Converte object_id para int se fornecido
            if object_id:
                object_id = int(object_id)
            
            result = self.s3_service.migrate_local_files_to_s3(
                anexo_type=anexo_type,
                object_id=object_id,
                user_id=user_id
            )
            
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'error': result['error']
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except ValueError:
            return Response({
                'success': False,
                'error': 'object_id deve ser um número válido'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error in migrate_to_s3 view: {str(e)}")
            return Response({
                'success': False,
                'error': 'Erro interno do servidor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def list_files(self, request):
        """
        Lista arquivos no S3 com filtros opcionais.
        """
        anexo_type = request.query_params.get('anexo_type')
        object_id = request.query_params.get('object_id')
        limit = int(request.query_params.get('limit', 50))
        
        try:
            # Converte object_id para int se fornecido
            if object_id:
                object_id = int(object_id)
            
            result = self.s3_service.list_files(
                anexo_type=anexo_type,
                object_id=object_id,
                limit=limit
            )
            
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'error': result['error']
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except ValueError:
            return Response({
                'success': False,
                'error': 'object_id deve ser um número válido'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error in list_files view: {str(e)}")
            return Response({
                'success': False,
                'error': 'Erro interno do servidor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def storage_info(self, request):
        """
        Obtém informações sobre o armazenamento S3.
        """
        try:
            result = self.s3_service.get_storage_info()
            
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'error': result['error']
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error in storage_info view: {str(e)}")
            return Response({
                'success': False,
                'error': 'Erro interno do servidor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Obtém estatísticas dos anexos S3.
        """
        try:
            from django.db.models import Count
            from ..models import AnexoS3
            
            # Estatísticas básicas dos anexos
            total_anexos = AnexoS3.objects.count()
            anexos_por_tipo = AnexoS3.objects.values('anexo_type').annotate(
                count=Count('id')
            ).order_by('-count')
            
            # Informações de armazenamento
            storage_result = self.s3_service.get_storage_info()
            storage_info = storage_result.get('data', {}) if storage_result.get('success') else {}
            
            statistics_data = {
                'total_anexos': total_anexos,
                'anexos_por_tipo': list(anexos_por_tipo),
                'storage_info': storage_info,
                'success': True
            }
            
            return Response(statistics_data, status=status.HTTP_200_OK)
                
        except Exception as e:
            logger.error(f"Error in statistics view: {str(e)}")
            return Response({
                'success': False,
                'error': 'Erro interno do servidor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)