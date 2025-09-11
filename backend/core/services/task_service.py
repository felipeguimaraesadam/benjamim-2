import uuid
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List, Callable
from django.utils import timezone
from django.db import transaction
from django.core.exceptions import ValidationError
import logging

from ..models import TaskHistory

logger = logging.getLogger(__name__)


class TaskService:
    """
    Serviço para gerenciar tarefas e histórico do sistema.
    Permite criar, atualizar, monitorar e executar tarefas com rastreamento completo.
    """
    
    # Status válidos para tarefas
    VALID_STATUSES = [
        'pending',      # Aguardando execução
        'in_progress',  # Em execução
        'completed',    # Concluída com sucesso
        'failed',       # Falhou na execução
        'cancelled',    # Cancelada
        'paused'        # Pausada
    ]
    
    # Tipos de tarefa válidos
    VALID_TASK_TYPES = [
        'backup',       # Tarefas de backup
        'migration',    # Migrações de dados
        'upload',       # Upload de arquivos
        'sync',         # Sincronização
        'maintenance',  # Manutenção do sistema
        'deployment',   # Deploy/implantação
        'cleanup',      # Limpeza de dados
        'report',       # Geração de relatórios
        'custom'        # Tarefas customizadas
    ]
    
    def __init__(self):
        self._running_tasks = {}  # Cache de tarefas em execução
    
    def create_task(self,
                   task_type: str,
                   title: str,
                   description: str = '',
                   user_id: int = None,
                   metadata: Dict[str, Any] = None,
                   estimated_duration: int = None,
                   priority: str = 'medium') -> Dict[str, Any]:
        """
        Cria uma nova tarefa.
        
        Args:
            task_type: Tipo da tarefa
            title: Título da tarefa
            description: Descrição detalhada
            user_id: ID do usuário que criou a tarefa
            metadata: Dados adicionais da tarefa
            estimated_duration: Duração estimada em segundos
            priority: Prioridade (low, medium, high, critical)
        
        Returns:
            Dict com resultado da operação
        """
        try:
            # Valida parâmetros
            if task_type not in self.VALID_TASK_TYPES:
                raise ValidationError(f"Invalid task type: {task_type}")
            
            if priority not in ['low', 'medium', 'high', 'critical']:
                priority = 'medium'
            
            # Gera ID único para a tarefa
            task_id = f"{task_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
            
            # Cria registro da tarefa
            task = TaskHistory.objects.create(
                task_id=task_id,
                task_type=task_type,
                title=title,
                description=description,
                status='pending',
                created_by_id=user_id,
                metadata=metadata or {},
                estimated_duration=estimated_duration,
                priority=priority
            )
            
            logger.info(f"Task created: {task_id} - {title}")
            
            return {
                'success': True,
                'task_id': task_id,
                'task': {
                    'id': task.id,
                    'task_id': task.task_id,
                    'task_type': task.task_type,
                    'title': task.title,
                    'description': task.description,
                    'status': task.status,
                    'priority': task.priority,
                    'created_at': task.created_at,
                    'estimated_duration': task.estimated_duration
                }
            }
            
        except Exception as e:
            logger.error(f"Error creating task: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def update_task_status(self,
                          task_id: str,
                          status: str,
                          progress_percentage: int = None,
                          error_message: str = None,
                          metadata_update: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Atualiza o status de uma tarefa.
        
        Args:
            task_id: ID da tarefa
            status: Novo status
            progress_percentage: Percentual de progresso (0-100)
            error_message: Mensagem de erro se aplicável
            metadata_update: Atualizações nos metadados
        
        Returns:
            Dict com resultado da operação
        """
        try:
            # Valida status
            if status not in self.VALID_STATUSES:
                raise ValidationError(f"Invalid status: {status}")
            
            # Busca a tarefa
            task = TaskHistory.objects.get(task_id=task_id)
            
            # Atualiza campos
            old_status = task.status
            task.status = status
            
            if progress_percentage is not None:
                if 0 <= progress_percentage <= 100:
                    task.progress_percentage = progress_percentage
            
            if error_message:
                task.error_message = error_message
            
            # Atualiza timestamps baseado no status
            now = timezone.now()
            if status == 'in_progress' and old_status == 'pending':
                task.started_at = now
            elif status in ['completed', 'failed', 'cancelled']:
                if not task.started_at:
                    task.started_at = now
                task.completed_at = now
                
                # Calcula duração real
                if task.started_at:
                    duration = (now - task.started_at).total_seconds()
                    task.actual_duration = int(duration)
            
            # Atualiza metadados
            if metadata_update:
                if task.metadata:
                    task.metadata.update(metadata_update)
                else:
                    task.metadata = metadata_update
            
            task.save()
            
            # Remove do cache se concluída
            if status in ['completed', 'failed', 'cancelled'] and task_id in self._running_tasks:
                del self._running_tasks[task_id]
            
            logger.info(f"Task {task_id} status updated: {old_status} -> {status}")
            
            return {
                'success': True,
                'task_id': task_id,
                'old_status': old_status,
                'new_status': status,
                'progress': task.progress_percentage
            }
            
        except TaskHistory.DoesNotExist:
            return {
                'success': False,
                'error': 'Task not found'
            }
        except Exception as e:
            logger.error(f"Error updating task {task_id}: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_task(self, task_id: str) -> Dict[str, Any]:
        """
        Obtém informações detalhadas de uma tarefa.
        
        Args:
            task_id: ID da tarefa
        
        Returns:
            Dict com informações da tarefa
        """
        try:
            task = TaskHistory.objects.get(task_id=task_id)
            
            return {
                'success': True,
                'task': {
                    'id': task.id,
                    'task_id': task.task_id,
                    'task_type': task.task_type,
                    'title': task.title,
                    'description': task.description,
                    'status': task.status,
                    'priority': task.priority,
                    'progress_percentage': task.progress_percentage,
                    'created_at': task.created_at,
                    'started_at': task.started_at,
                    'completed_at': task.completed_at,
                    'estimated_duration': task.estimated_duration,
                    'actual_duration': task.actual_duration,
                    'created_by': task.created_by.username if task.created_by else None,
                    'error_message': task.error_message,
                    'metadata': task.metadata
                }
            }
            
        except TaskHistory.DoesNotExist:
            return {
                'success': False,
                'error': 'Task not found'
            }
        except Exception as e:
            logger.error(f"Error getting task {task_id}: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def list_tasks(self,
                  task_type: str = None,
                  status: str = None,
                  user_id: int = None,
                  priority: str = None,
                  limit: int = 50,
                  offset: int = 0,
                  order_by: str = '-created_at') -> Dict[str, Any]:
        """
        Lista tarefas com filtros opcionais.
        
        Args:
            task_type: Filtrar por tipo de tarefa
            status: Filtrar por status
            user_id: Filtrar por usuário
            priority: Filtrar por prioridade
            limit: Limite de resultados
            offset: Offset para paginação
            order_by: Campo para ordenação
        
        Returns:
            Dict com lista de tarefas
        """
        try:
            queryset = TaskHistory.objects.all()
            
            # Aplica filtros
            if task_type:
                queryset = queryset.filter(task_type=task_type)
            
            if status:
                queryset = queryset.filter(status=status)
            
            if user_id:
                queryset = queryset.filter(created_by_id=user_id)
            
            if priority:
                queryset = queryset.filter(priority=priority)
            
            # Ordenação
            queryset = queryset.order_by(order_by)
            
            # Paginação
            total_count = queryset.count()
            tasks = queryset[offset:offset + limit]
            
            tasks_list = []
            for task in tasks:
                tasks_list.append({
                    'id': task.id,
                    'task_id': task.task_id,
                    'task_type': task.task_type,
                    'title': task.title,
                    'description': task.description,
                    'status': task.status,
                    'priority': task.priority,
                    'progress_percentage': task.progress_percentage,
                    'created_at': task.created_at,
                    'started_at': task.started_at,
                    'completed_at': task.completed_at,
                    'estimated_duration': task.estimated_duration,
                    'actual_duration': task.actual_duration,
                    'created_by': task.created_by.username if task.created_by else None,
                    'error_message': task.error_message
                })
            
            return {
                'success': True,
                'tasks': tasks_list,
                'total_count': total_count,
                'count': len(tasks_list),
                'offset': offset,
                'limit': limit
            }
            
        except Exception as e:
            logger.error(f"Error listing tasks: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_running_tasks(self) -> Dict[str, Any]:
        """
        Obtém lista de tarefas em execução.
        
        Returns:
            Dict com tarefas em execução
        """
        try:
            running_tasks = TaskHistory.objects.filter(
                status='in_progress'
            ).order_by('-started_at')
            
            tasks_list = []
            for task in running_tasks:
                # Calcula tempo decorrido
                elapsed_time = None
                if task.started_at:
                    elapsed_time = int((timezone.now() - task.started_at).total_seconds())
                
                tasks_list.append({
                    'task_id': task.task_id,
                    'task_type': task.task_type,
                    'title': task.title,
                    'status': task.status,
                    'priority': task.priority,
                    'progress_percentage': task.progress_percentage,
                    'started_at': task.started_at,
                    'elapsed_time': elapsed_time,
                    'estimated_duration': task.estimated_duration,
                    'created_by': task.created_by.username if task.created_by else None
                })
            
            return {
                'success': True,
                'running_tasks': tasks_list,
                'count': len(tasks_list)
            }
            
        except Exception as e:
            logger.error(f"Error getting running tasks: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def cancel_task(self, task_id: str, reason: str = '') -> Dict[str, Any]:
        """
        Cancela uma tarefa.
        
        Args:
            task_id: ID da tarefa
            reason: Motivo do cancelamento
        
        Returns:
            Dict com resultado da operação
        """
        try:
            task = TaskHistory.objects.get(task_id=task_id)
            
            if task.status in ['completed', 'failed', 'cancelled']:
                return {
                    'success': False,
                    'error': f'Cannot cancel task with status: {task.status}'
                }
            
            # Atualiza status para cancelado
            result = self.update_task_status(
                task_id=task_id,
                status='cancelled',
                error_message=f'Cancelled: {reason}' if reason else 'Cancelled by user',
                metadata_update={
                    'cancelled_at': timezone.now().isoformat(),
                    'cancel_reason': reason
                }
            )
            
            if result['success']:
                logger.info(f"Task {task_id} cancelled: {reason}")
            
            return result
            
        except TaskHistory.DoesNotExist:
            return {
                'success': False,
                'error': 'Task not found'
            }
        except Exception as e:
            logger.error(f"Error cancelling task {task_id}: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_task_statistics(self, 
                           days: int = 30,
                           task_type: str = None,
                           user_id: int = None) -> Dict[str, Any]:
        """
        Obtém estatísticas das tarefas.
        
        Args:
            days: Número de dias para análise
            task_type: Filtrar por tipo de tarefa
            user_id: Filtrar por usuário
        
        Returns:
            Dict com estatísticas
        """
        try:
            # Data de início para análise
            start_date = timezone.now() - timedelta(days=days)
            
            queryset = TaskHistory.objects.filter(created_at__gte=start_date)
            
            if task_type:
                queryset = queryset.filter(task_type=task_type)
            
            if user_id:
                queryset = queryset.filter(created_by_id=user_id)
            
            # Estatísticas por status
            status_stats = {}
            for status in self.VALID_STATUSES:
                count = queryset.filter(status=status).count()
                status_stats[status] = count
            
            # Estatísticas por tipo
            type_stats = {}
            for task_type_stat in self.VALID_TASK_TYPES:
                count = queryset.filter(task_type=task_type_stat).count()
                if count > 0:
                    type_stats[task_type_stat] = count
            
            # Estatísticas de duração
            completed_tasks = queryset.filter(
                status='completed',
                actual_duration__isnull=False
            )
            
            duration_stats = {
                'avg_duration': 0,
                'min_duration': 0,
                'max_duration': 0,
                'total_duration': 0
            }
            
            if completed_tasks.exists():
                durations = [task.actual_duration for task in completed_tasks]
                duration_stats = {
                    'avg_duration': sum(durations) / len(durations),
                    'min_duration': min(durations),
                    'max_duration': max(durations),
                    'total_duration': sum(durations)
                }
            
            # Taxa de sucesso
            total_finished = queryset.filter(
                status__in=['completed', 'failed', 'cancelled']
            ).count()
            
            success_rate = 0
            if total_finished > 0:
                completed_count = queryset.filter(status='completed').count()
                success_rate = (completed_count / total_finished) * 100
            
            return {
                'success': True,
                'period_days': days,
                'total_tasks': queryset.count(),
                'status_distribution': status_stats,
                'type_distribution': type_stats,
                'duration_statistics': duration_stats,
                'success_rate': round(success_rate, 2)
            }
            
        except Exception as e:
            logger.error(f"Error getting task statistics: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def cleanup_old_tasks(self, days: int = 90) -> Dict[str, Any]:
        """
        Remove tarefas antigas do histórico.
        
        Args:
            days: Número de dias para manter no histórico
        
        Returns:
            Dict com resultado da operação
        """
        try:
            cutoff_date = timezone.now() - timedelta(days=days)
            
            # Remove apenas tarefas finalizadas antigas
            old_tasks = TaskHistory.objects.filter(
                created_at__lt=cutoff_date,
                status__in=['completed', 'failed', 'cancelled']
            )
            
            count = old_tasks.count()
            old_tasks.delete()
            
            logger.info(f"Cleaned up {count} old tasks older than {days} days")
            
            return {
                'success': True,
                'deleted_count': count,
                'cutoff_date': cutoff_date
            }
            
        except Exception as e:
            logger.error(f"Error cleaning up old tasks: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def execute_task_with_tracking(self,
                                  task_id: str,
                                  task_function: Callable,
                                  *args,
                                  **kwargs) -> Dict[str, Any]:
        """
        Executa uma função com rastreamento automático de tarefa.
        
        Args:
            task_id: ID da tarefa
            task_function: Função a ser executada
            *args: Argumentos posicionais para a função
            **kwargs: Argumentos nomeados para a função
        
        Returns:
            Dict com resultado da execução
        """
        try:
            # Marca tarefa como em progresso
            self.update_task_status(task_id, 'in_progress')
            
            # Executa a função
            result = task_function(*args, **kwargs)
            
            # Verifica resultado e atualiza status
            if isinstance(result, dict) and result.get('success'):
                self.update_task_status(
                    task_id, 
                    'completed',
                    progress_percentage=100,
                    metadata_update={'result': result}
                )
            else:
                error_msg = result.get('error', 'Unknown error') if isinstance(result, dict) else 'Function returned non-success result'
                self.update_task_status(
                    task_id,
                    'failed',
                    error_message=error_msg,
                    metadata_update={'result': result}
                )
            
            return result
            
        except Exception as e:
            # Marca tarefa como falhada
            self.update_task_status(
                task_id,
                'failed',
                error_message=str(e)
            )
            
            logger.error(f"Error executing task {task_id}: {str(e)}")
            
            return {
                'success': False,
                'error': str(e)
            }