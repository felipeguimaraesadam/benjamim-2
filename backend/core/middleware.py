from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from django.conf import settings
from datetime import datetime
import logging
import time
import json
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from .logging_config import sgo_logger
from django.core.exceptions import ValidationError
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import AnonymousUser
from rest_framework import status
from rest_framework.response import Response
import traceback

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


class CSRFExemptMiddleware(MiddlewareMixin):
    """
    Middleware que desabilita CSRF para endpoints específicos de teste
    """
    
    def process_view(self, request, view_func, view_args, view_kwargs):
        # Lista de paths que devem ser isentos de CSRF
        csrf_exempt_paths = [
            '/test-data/populate/',
            '/test-data/clear/',
        ]
        
        # Verifica se o path atual está na lista de isenção
        if request.path_info in csrf_exempt_paths:
            # Marca a view como isenta de CSRF
            setattr(view_func, 'csrf_exempt', True)
        
        return None



class APILoggingMiddleware(MiddlewareMixin):
    """
    Middleware específico para logging de APIs com mais detalhes
    """
    
    def process_request(self, request):
        """Log detalhado para requisições de API"""
        if not request.path.startswith('/api/'):
            return None
        
        request._api_start_time = time.time()
        
        # Capturar dados da requisição para APIs
        request_data = {}
        
        # Capturar query parameters
        if request.GET:
            request_data['query_params'] = dict(request.GET)
        
        # Capturar dados do body (apenas para métodos que suportam)
        if request.method in ['POST', 'PUT', 'PATCH'] and request.content_type:
            try:
                if 'application/json' in request.content_type:
                    if hasattr(request, 'body') and request.body:
                        body_data = json.loads(request.body.decode('utf-8'))
                        # Filtrar dados sensíveis
                        filtered_data = self.filter_sensitive_data(body_data)
                        request_data['body'] = filtered_data
            except (json.JSONDecodeError, UnicodeDecodeError):
                request_data['body'] = '[Binary or invalid JSON data]'
        
        logger.info(f"API Request: {request.method} {request.path}", extra={
            'api_request': {
                'method': request.method,
                'path': request.path,
                'user_id': getattr(request.user, 'id', None) if hasattr(request, 'user') and not isinstance(request.user, AnonymousUser) else None,
                'data': request_data,
                'headers': self.get_relevant_headers(request),
            },
            'type': 'api_request'
        })
        
        return None
    
    def process_response(self, request, response):
        """Log detalhado para respostas de API"""
        if not request.path.startswith('/api/') or not hasattr(request, '_api_start_time'):
            return response
        
        duration = time.time() - request._api_start_time
        
        # Capturar dados da resposta
        response_data = {}
        if isinstance(response, JsonResponse) and hasattr(response, 'content'):
            try:
                content = json.loads(response.content.decode('utf-8'))
                # Filtrar dados sensíveis da resposta
                response_data = self.filter_sensitive_data(content)
            except (json.JSONDecodeError, UnicodeDecodeError):
                response_data = '[Binary or invalid JSON data]'
        
        # Determinar nível de log
        if response.status_code >= 500:
            log_level = logging.ERROR
        elif response.status_code >= 400:
            log_level = logging.WARNING
        else:
            log_level = logging.INFO
        
        logger.log(log_level, f"API Response: {request.method} {request.path} - {response.status_code}", extra={
            'api_response': {
                'method': request.method,
                'path': request.path,
                'status_code': response.status_code,
                'duration_ms': round(duration * 1000, 2),
                'user_id': getattr(request.user, 'id', None) if hasattr(request, 'user') and not isinstance(request.user, AnonymousUser) else None,
                'data': response_data,
            },
            'type': 'api_response'
        })
        
        return response
    
    def filter_sensitive_data(self, data):
        """Remove dados sensíveis dos logs"""
        if not isinstance(data, dict):
            return data
        
        sensitive_fields = ['password', 'token', 'secret', 'key', 'authorization']
        filtered = {}
        
        for key, value in data.items():
            if any(field in key.lower() for field in sensitive_fields):
                filtered[key] = '[FILTERED]'
            elif isinstance(value, dict):
                filtered[key] = self.filter_sensitive_data(value)
            else:
                filtered[key] = value
        
        return filtered
    
    def get_relevant_headers(self, request):
        """Obter headers relevantes para log"""
        relevant_headers = [
            'HTTP_USER_AGENT',
            'HTTP_ACCEPT',
            'HTTP_ACCEPT_LANGUAGE',
            'CONTENT_TYPE',
            'CONTENT_LENGTH'
        ]
        
        headers = {}
        for header in relevant_headers:
            if header in request.META:
                headers[header] = request.META[header]
        
        return headers