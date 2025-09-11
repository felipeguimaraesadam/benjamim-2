from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime
import json

from .middleware import SystemHealthChecker
from .logging_config import sgo_logger

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Endpoint básico de health check para load balancers
    """
    return Response({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'SGO API'
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([AllowAny])
def system_status(request):
    """
    Endpoint detalhado de status do sistema
    """
    try:
        system_status = SystemHealthChecker.get_system_status()
        
        # Log da verificação de status
        sgo_logger.info(
            "Verificação de status do sistema",
            extra={
                'status': system_status['status'],
                'checks': system_status['checks']
            }
        )
        
        # Determinar código de status HTTP
        http_status = status.HTTP_200_OK if system_status['status'] == 'healthy' else status.HTTP_503_SERVICE_UNAVAILABLE
        
        return Response(system_status, status=http_status)
        
    except Exception as e:
        sgo_logger.error(
            "Erro ao verificar status do sistema",
            exception=e,
            extra={'endpoint': 'system_status'}
        )
        
        return Response({
            'status': 'error',
            'message': 'Erro ao verificar status do sistema',
            'timestamp': datetime.now().isoformat()
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@method_decorator(csrf_exempt, name='dispatch')
class LogsView(View):
    """
    View para visualizar logs do sistema (apenas para admins)
    """
    
    def get(self, request):
        """
        Retorna logs recentes do sistema
        """
        # Verificar se o usuário é admin
        if not request.user.is_authenticated or request.user.nivel_acesso != 'admin':
            return JsonResponse({
                'error': 'Acesso negado',
                'message': 'Apenas administradores podem visualizar logs'
            }, status=403)
        
        try:
            from pathlib import Path
            from django.conf import settings
            
            log_type = request.GET.get('type', 'info')  # info, error, security
            lines = int(request.GET.get('lines', 100))
            
            # Validar tipo de log
            valid_types = ['info', 'error', 'security']
            if log_type not in valid_types:
                return JsonResponse({
                    'error': 'Tipo de log inválido',
                    'valid_types': valid_types
                }, status=400)
            
            # Caminho do arquivo de log
            log_dir = Path(settings.BASE_DIR) / 'logs'
            log_file = log_dir / f'{log_type}.log'
            
            if not log_file.exists():
                return JsonResponse({
                    'logs': [],
                    'message': f'Arquivo de log {log_type}.log não encontrado',
                    'timestamp': datetime.now().isoformat()
                })
            
            # Ler últimas linhas do arquivo
            with open(log_file, 'r', encoding='utf-8') as f:
                all_lines = f.readlines()
                recent_lines = all_lines[-lines:] if len(all_lines) > lines else all_lines
            
            # Log da visualização
            sgo_logger.security(
                f"Visualização de logs: {log_type}",
                extra={
                    'log_type': log_type,
                    'lines_requested': lines,
                    'lines_returned': len(recent_lines)
                },
                user=request.user
            )
            
            return JsonResponse({
                'logs': [line.strip() for line in recent_lines],
                'log_type': log_type,
                'lines_count': len(recent_lines),
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            sgo_logger.error(
                "Erro ao visualizar logs",
                exception=e,
                extra={'log_type': log_type},
                user=request.user
            )
            
            return JsonResponse({
                'error': 'Erro interno',
                'message': 'Erro ao carregar logs'
            }, status=500)

@api_view(['POST'])
def clear_logs(request):
    """
    Limpa logs do sistema (apenas para admins)
    """
    # Verificar se o usuário é admin
    if not request.user.is_authenticated or request.user.nivel_acesso != 'admin':
        return Response({
            'error': 'Acesso negado',
            'message': 'Apenas administradores podem limpar logs'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        from pathlib import Path
        from django.conf import settings
        
        log_type = request.data.get('type', 'all')
        
        log_dir = Path(settings.BASE_DIR) / 'logs'
        
        if log_type == 'all':
            log_files = ['info.log', 'error.log', 'security.log']
        else:
            log_files = [f'{log_type}.log']
        
        cleared_files = []
        for log_file_name in log_files:
            log_file = log_dir / log_file_name
            if log_file.exists():
                # Limpar arquivo (manter arquivo, mas remover conteúdo)
                with open(log_file, 'w') as f:
                    f.write('')
                cleared_files.append(log_file_name)
        
        # Log da operação de limpeza
        sgo_logger.security(
            f"Logs limpos: {', '.join(cleared_files)}",
            extra={
                'cleared_files': cleared_files,
                'operation': 'clear_logs'
            },
            user=request.user
        )
        
        return Response({
            'message': 'Logs limpos com sucesso',
            'cleared_files': cleared_files,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        sgo_logger.error(
            "Erro ao limpar logs",
            exception=e,
            user=request.user
        )
        
        return Response({
            'error': 'Erro interno',
            'message': 'Erro ao limpar logs'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def system_metrics(request):
    """
    Retorna métricas básicas do sistema
    """
    # Verificar se o usuário é admin
    if not request.user.is_authenticated or request.user.nivel_acesso != 'admin':
        return Response({
            'error': 'Acesso negado',
            'message': 'Apenas administradores podem visualizar métricas'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        import psutil
        import os
        from django.db import connection
        
        # Métricas do sistema
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Métricas do banco de dados
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM core_usuario")
            user_count = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM core_obra")
            obra_count = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM core_backuplog")
            backup_count = cursor.fetchone()[0]
        
        metrics = {
            'system': {
                'cpu_percent': cpu_percent,
                'memory_percent': memory.percent,
                'memory_used_gb': round(memory.used / (1024**3), 2),
                'memory_total_gb': round(memory.total / (1024**3), 2),
                'disk_percent': round((disk.used / disk.total) * 100, 2),
                'disk_used_gb': round(disk.used / (1024**3), 2),
                'disk_total_gb': round(disk.total / (1024**3), 2)
            },
            'database': {
                'users': user_count,
                'obras': obra_count,
                'backups': backup_count
            },
            'timestamp': datetime.now().isoformat()
        }
        
        return Response(metrics)
        
    except ImportError:
        return Response({
            'error': 'Biblioteca psutil não instalada',
            'message': 'Instale psutil para visualizar métricas do sistema'
        }, status=status.HTTP_501_NOT_IMPLEMENTED)
        
    except Exception as e:
        sgo_logger.error(
            "Erro ao obter métricas do sistema",
            exception=e,
            user=request.user
        )
        
        return Response({
            'error': 'Erro interno',
            'message': 'Erro ao obter métricas'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)