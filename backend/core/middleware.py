import logging
import json
import traceback
from datetime import datetime
from django.http import JsonResponse
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.response import Response

# Configurar logger
logger = logging.getLogger('sgo_errors')

class ErrorHandlingMiddleware(MiddlewareMixin):
    """
    Middleware para capturar e tratar erros de forma consistente
    """
    
    def process_exception(self, request, exception):
        """
        Processa exceções não tratadas
        """
        # Obter informações do erro
        error_info = {
            'timestamp': datetime.now().isoformat(),
            'path': request.path,
            'method': request.method,
            'user': str(request.user) if hasattr(request, 'user') and request.user.is_authenticated else 'Anonymous',
            'error_type': type(exception).__name__,
            'error_message': str(exception),
            'traceback': traceback.format_exc() if settings.DEBUG else None
        }
        
        # Log do erro
        logger.error(f"Erro não tratado: {error_info['error_type']} - {error_info['error_message']}", 
                    extra=error_info)
        
        # Resposta baseada no tipo de erro
        if isinstance(exception, ValidationError):
            return JsonResponse({
                'error': 'Erro de validação',
                'message': str(exception),
                'timestamp': error_info['timestamp']
            }, status=400)
        
        elif isinstance(exception, PermissionError):
            return JsonResponse({
                'error': 'Acesso negado',
                'message': 'Você não tem permissão para realizar esta ação',
                'timestamp': error_info['timestamp']
            }, status=403)
        
        elif isinstance(exception, FileNotFoundError):
            return JsonResponse({
                'error': 'Arquivo não encontrado',
                'message': 'O arquivo solicitado não foi encontrado',
                'timestamp': error_info['timestamp']
            }, status=404)
        
        # Para outros erros, retornar erro genérico em produção
        if not settings.DEBUG:
            return JsonResponse({
                'error': 'Erro interno do servidor',
                'message': 'Ocorreu um erro inesperado. Tente novamente mais tarde.',
                'timestamp': error_info['timestamp']
            }, status=500)
        
        # Em desenvolvimento, deixar o Django tratar o erro normalmente
        return None

class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Middleware para log de requisições importantes
    """
    
    def process_request(self, request):
        """
        Log de requisições importantes
        """
        # Paths que devem ser logados
        important_paths = [
            '/api/backup/',
            '/api/anexos/',
            '/api/tasks/',
            '/api/branches/',
            '/api/usuarios/',
            '/api/obras/'
        ]
        
        # Verificar se é uma requisição importante
        if any(request.path.startswith(path) for path in important_paths):
            request_info = {
                'timestamp': datetime.now().isoformat(),
                'path': request.path,
                'method': request.method,
                'user': str(request.user) if hasattr(request, 'user') and request.user.is_authenticated else 'Anonymous',
                'ip': self.get_client_ip(request)
            }
            
            logger.info(f"Requisição: {request.method} {request.path}", extra=request_info)
    
    def get_client_ip(self, request):
        """
        Obter IP do cliente
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Middleware para adicionar headers de segurança
    """
    
    def process_response(self, request, response):
        """
        Adicionar headers de segurança
        """
        # Headers de segurança
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # CSP apenas em produção
        if not settings.DEBUG:
            response['Content-Security-Policy'] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self'; "
                "connect-src 'self' https:;"
            )
        
        return response

class APIErrorHandler:
    """
    Classe utilitária para tratamento de erros em views da API
    """
    
    @staticmethod
    def handle_error(exception, context=None):
        """
        Trata erros de forma consistente nas views da API
        """
        error_info = {
            'timestamp': datetime.now().isoformat(),
            'error_type': type(exception).__name__,
            'error_message': str(exception),
            'context': context or {}
        }
        
        # Log do erro
        logger.error(f"Erro na API: {error_info['error_type']} - {error_info['error_message']}", 
                    extra=error_info)
        
        # Mapear tipos de erro para códigos HTTP
        error_mapping = {
            'ValidationError': (400, 'Dados inválidos'),
            'PermissionDenied': (403, 'Acesso negado'),
            'NotFound': (404, 'Recurso não encontrado'),
            'FileNotFoundError': (404, 'Arquivo não encontrado'),
            'ConnectionError': (503, 'Serviço temporariamente indisponível'),
            'TimeoutError': (504, 'Tempo limite excedido')
        }
        
        error_type = type(exception).__name__
        status_code, message = error_mapping.get(error_type, (500, 'Erro interno do servidor'))
        
        return Response({
            'error': True,
            'message': message,
            'details': str(exception) if settings.DEBUG else None,
            'timestamp': error_info['timestamp']
        }, status=status_code)
    
    @staticmethod
    def success_response(data=None, message="Operação realizada com sucesso"):
        """
        Resposta de sucesso padronizada
        """
        return Response({
            'error': False,
            'message': message,
            'data': data,
            'timestamp': datetime.now().isoformat()
        }, status=status.HTTP_200_OK)

class SystemHealthChecker:
    """
    Classe para verificar a saúde do sistema
    """
    
    @staticmethod
    def check_database():
        """
        Verificar conexão com banco de dados
        """
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            return True, "Banco de dados OK"
        except Exception as e:
            return False, f"Erro no banco de dados: {str(e)}"
    
    @staticmethod
    def check_s3_connection():
        """
        Verificar conexão com S3
        """
        try:
            import boto3
            from django.conf import settings
            
            if hasattr(settings, 'AWS_ACCESS_KEY_ID'):
                s3 = boto3.client(
                    's3',
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=getattr(settings, 'AWS_S3_REGION_NAME', 'us-east-1')
                )
                s3.head_bucket(Bucket=settings.AWS_STORAGE_BUCKET_NAME)
                return True, "S3 OK"
            else:
                return False, "Configuração S3 não encontrada"
        except Exception as e:
            return False, f"Erro no S3: {str(e)}"
    
    @staticmethod
    def get_system_status():
        """
        Obter status geral do sistema
        """
        checks = {
            'database': SystemHealthChecker.check_database(),
            's3': SystemHealthChecker.check_s3_connection(),
            'timestamp': datetime.now().isoformat()
        }
        
        all_ok = all(check[0] for check in checks.values() if isinstance(check, tuple))
        
        return {
            'status': 'healthy' if all_ok else 'unhealthy',
            'checks': checks
        }