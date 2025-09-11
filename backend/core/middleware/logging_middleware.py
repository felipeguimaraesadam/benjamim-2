import logging
import time
import json
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from django.conf import settings
from django.contrib.auth.models import AnonymousUser

logger = logging.getLogger('django.request')

class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Middleware para logging detalhado de requisições HTTP
    """
    
    def process_request(self, request):
        """Processa a requisição antes de chegar à view"""
        request._start_time = time.time()
        
        # Informações básicas da requisição
        request_info = {
            'method': request.method,
            'path': request.path,
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            'remote_addr': self.get_client_ip(request),
            'content_type': request.META.get('CONTENT_TYPE', ''),
            'content_length': request.META.get('CONTENT_LENGTH', 0),
        }
        
        # Adicionar informações do usuário se autenticado
        if hasattr(request, 'user') and not isinstance(request.user, AnonymousUser):
            request_info['user_id'] = request.user.id
            request_info['username'] = getattr(request.user, 'login', str(request.user))
        
        # Log da requisição (apenas em DEBUG ou para APIs importantes)
        if settings.DEBUG or request.path.startswith('/api/'):
            logger.info(f"Request started: {request.method} {request.path}", extra={
                'request_info': request_info,
                'type': 'request_start'
            })
        
        return None
    
    def process_response(self, request, response):
        """Processa a resposta antes de enviá-la ao cliente"""
        if hasattr(request, '_start_time'):
            duration = time.time() - request._start_time
            
            # Informações da resposta
            response_info = {
                'status_code': response.status_code,
                'duration_ms': round(duration * 1000, 2),
                'content_type': response.get('Content-Type', ''),
            }
            
            # Adicionar tamanho da resposta se disponível
            if hasattr(response, 'content'):
                response_info['content_length'] = len(response.content)
            
            # Determinar nível de log baseado no status
            if response.status_code >= 500:
                log_level = logging.ERROR
                log_type = 'request_error'
            elif response.status_code >= 400:
                log_level = logging.WARNING
                log_type = 'request_warning'
            else:
                log_level = logging.INFO
                log_type = 'request_success'
            
            # Log da resposta
            message = f"Request completed: {request.method} {request.path} - {response.status_code} ({duration:.3f}s)"
            
            logger.log(log_level, message, extra={
                'request_info': {
                    'method': request.method,
                    'path': request.path,
                    'user_id': getattr(request.user, 'id', None) if hasattr(request, 'user') and not isinstance(request.user, AnonymousUser) else None,
                    'remote_addr': self.get_client_ip(request),
                },
                'response_info': response_info,
                'type': log_type
            })
            
            # Log adicional para requisições lentas
            if duration > 2.0:  # Mais de 2 segundos
                logger.warning(f"Slow request detected: {request.method} {request.path} took {duration:.3f}s", extra={
                    'request_info': {
                        'method': request.method,
                        'path': request.path,
                        'duration': duration,
                    },
                    'type': 'slow_request'
                })
        
        return response
    
    def process_exception(self, request, exception):
        """Processa exceções não tratadas"""
        duration = time.time() - getattr(request, '_start_time', time.time())
        
        # Log da exceção
        logger.error(f"Request exception: {request.method} {request.path} - {exception.__class__.__name__}: {str(exception)}", extra={
            'request_info': {
                'method': request.method,
                'path': request.path,
                'user_id': getattr(request.user, 'id', None) if hasattr(request, 'user') and not isinstance(request.user, AnonymousUser) else None,
                'remote_addr': self.get_client_ip(request),
                'duration_ms': round(duration * 1000, 2),
            },
            'exception_info': {
                'type': exception.__class__.__name__,
                'message': str(exception),
            },
            'type': 'request_exception'
        }, exc_info=True)
        
        return None
    
    def get_client_ip(self, request):
        """Obtém o IP real do cliente considerando proxies"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


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
                'data': response_data if response.status_code < 500 else None,  # Não logar dados em erros 5xx
            },
            'type': 'api_response'
        })
        
        return response
    
    def filter_sensitive_data(self, data):
        """Remove dados sensíveis dos logs"""
        if not isinstance(data, dict):
            return data
        
        sensitive_fields = {
            'password', 'senha', 'token', 'secret', 'key', 'authorization',
            'credit_card', 'ssn', 'cpf', 'cnpj', 'api_key', 'private_key'
        }
        
        filtered = {}
        for key, value in data.items():
            key_lower = key.lower()
            if any(sensitive in key_lower for sensitive in sensitive_fields):
                filtered[key] = '[FILTERED]'
            elif isinstance(value, dict):
                filtered[key] = self.filter_sensitive_data(value)
            elif isinstance(value, list):
                filtered[key] = [self.filter_sensitive_data(item) if isinstance(item, dict) else item for item in value]
            else:
                filtered[key] = value
        
        return filtered
    
    def get_relevant_headers(self, request):
        """Obtém headers relevantes para logging"""
        relevant_headers = {
            'content-type', 'accept', 'user-agent', 'x-requested-with',
            'x-forwarded-for', 'x-real-ip', 'authorization'
        }
        
        headers = {}
        for key, value in request.META.items():
            if key.startswith('HTTP_'):
                header_name = key[5:].lower().replace('_', '-')
                if header_name in relevant_headers:
                    # Filtrar authorization header
                    if header_name == 'authorization':
                        headers[header_name] = '[FILTERED]'
                    else:
                        headers[header_name] = value
        
        return headers