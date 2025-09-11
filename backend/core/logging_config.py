import os
from pathlib import Path

def get_logging_config(base_dir, debug=False):
    """
    Configuração de logging para o projeto SGO
    """
    
    # Diretório para logs
    log_dir = Path(base_dir) / 'logs'
    log_dir.mkdir(exist_ok=True)
    
    # Configuração base
    config = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'verbose': {
                'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
                'style': '{',
            },
            'simple': {
                'format': '{levelname} {asctime} {message}',
                'style': '{',
            },
            'json': {
                'format': '{"timestamp": "%(asctime)s", "logger": "%(name)s", "level": "%(levelname)s", "message": "%(message)s"}',
                'style': '%'
            }
        },
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'formatter': 'simple' if debug else 'verbose',
                'level': 'DEBUG' if debug else 'INFO',
            },
            'file_error': {
                'class': 'logging.handlers.RotatingFileHandler',
                'filename': log_dir / 'error.log',
                'maxBytes': 10 * 1024 * 1024,  # 10MB
                'backupCount': 5,
                'formatter': 'verbose',
                'level': 'ERROR',
            },
            'file_info': {
                'class': 'logging.handlers.RotatingFileHandler',
                'filename': log_dir / 'info.log',
                'maxBytes': 10 * 1024 * 1024,  # 10MB
                'backupCount': 3,
                'formatter': 'verbose',
                'level': 'INFO',
            },
            'file_security': {
                'class': 'logging.handlers.RotatingFileHandler',
                'filename': log_dir / 'security.log',
                'maxBytes': 10 * 1024 * 1024,  # 10MB
                'backupCount': 10,
                'formatter': 'verbose',
                'level': 'WARNING',
            }
        },
        'loggers': {
            'django': {
                'handlers': ['console', 'file_error'],
                'level': 'INFO',
                'propagate': False,
            },
            'django.request': {
                'handlers': ['file_error', 'console'],
                'level': 'ERROR',
                'propagate': False,
            },
            'django.security': {
                'handlers': ['file_security', 'console'],
                'level': 'WARNING',
                'propagate': False,
            },
            'sgo_errors': {
                'handlers': ['file_error', 'console'],
                'level': 'ERROR',
                'propagate': False,
            },
            'sgo_info': {
                'handlers': ['file_info', 'console'],
                'level': 'INFO',
                'propagate': False,
            },
            'sgo_security': {
                'handlers': ['file_security', 'console'],
                'level': 'WARNING',
                'propagate': False,
            },
            'core': {
                'handlers': ['console', 'file_info', 'file_error'],
                'level': 'DEBUG' if debug else 'INFO',
                'propagate': False,
            }
        },
        'root': {
            'handlers': ['console'],
            'level': 'WARNING',
        }
    }
    
    # Em produção, adicionar handler para Sentry ou serviço similar
    if not debug and os.getenv('SENTRY_DSN'):
        config['handlers']['sentry'] = {
            'class': 'sentry_sdk.integrations.logging.SentryHandler',
            'level': 'ERROR',
        }
        
        # Adicionar sentry aos loggers importantes
        for logger_name in ['sgo_errors', 'django.request', 'django.security']:
            config['loggers'][logger_name]['handlers'].append('sentry')
    
    return config

class SGOLogger:
    """
    Classe utilitária para logging padronizado no SGO
    """
    
    def __init__(self, name):
        import logging
        self.logger = logging.getLogger(name)
    
    def info(self, message, extra=None, user=None):
        """
        Log de informação
        """
        extra_data = extra or {}
        if user:
            extra_data['user'] = str(user)
        
        self.logger.info(message, extra=extra_data)
    
    def error(self, message, exception=None, extra=None, user=None):
        """
        Log de erro
        """
        extra_data = extra or {}
        if user:
            extra_data['user'] = str(user)
        if exception:
            extra_data['exception_type'] = type(exception).__name__
            extra_data['exception_message'] = str(exception)
        
        self.logger.error(message, extra=extra_data, exc_info=exception is not None)
    
    def warning(self, message, extra=None, user=None):
        """
        Log de aviso
        """
        extra_data = extra or {}
        if user:
            extra_data['user'] = str(user)
        
        self.logger.warning(message, extra=extra_data)
    
    def security(self, message, extra=None, user=None, ip=None):
        """
        Log de segurança
        """
        import logging
        security_logger = logging.getLogger('sgo_security')
        
        extra_data = extra or {}
        if user:
            extra_data['user'] = str(user)
        if ip:
            extra_data['ip'] = ip
        
        security_logger.warning(message, extra=extra_data)
    
    def backup_operation(self, operation, status, details=None, user=None):
        """
        Log específico para operações de backup
        """
        message = f"Backup {operation}: {status}"
        extra_data = {
            'operation': operation,
            'status': status,
            'category': 'backup'
        }
        
        if details:
            extra_data['details'] = details
        if user:
            extra_data['user'] = str(user)
        
        if status == 'success':
            self.info(message, extra=extra_data, user=user)
        else:
            self.error(message, extra=extra_data, user=user)
    
    def s3_operation(self, operation, status, file_name=None, details=None, user=None):
        """
        Log específico para operações S3
        """
        message = f"S3 {operation}: {status}"
        extra_data = {
            'operation': operation,
            'status': status,
            'category': 's3'
        }
        
        if file_name:
            extra_data['file_name'] = file_name
        if details:
            extra_data['details'] = details
        if user:
            extra_data['user'] = str(user)
        
        if status == 'success':
            self.info(message, extra=extra_data, user=user)
        else:
            self.error(message, extra=extra_data, user=user)
    
    def task_operation(self, task_name, status, details=None, user=None):
        """
        Log específico para operações de tarefas
        """
        message = f"Task {task_name}: {status}"
        extra_data = {
            'task_name': task_name,
            'status': status,
            'category': 'task'
        }
        
        if details:
            extra_data['details'] = details
        if user:
            extra_data['user'] = str(user)
        
        if status == 'success':
            self.info(message, extra=extra_data, user=user)
        else:
            self.error(message, extra=extra_data, user=user)

# Instâncias globais para uso fácil
sgo_logger = SGOLogger('sgo_info')
error_logger = SGOLogger('sgo_errors')
security_logger = SGOLogger('sgo_security')