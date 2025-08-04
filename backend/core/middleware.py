import logging
import traceback
import re
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt

logger = logging.getLogger('core')
security_logger = logging.getLogger('django.security')


class ErrorLoggingMiddleware(MiddlewareMixin):
    """
    Middleware para capturar e registrar erros não tratados.
    """
    
    def process_exception(self, request, exception):
        """
        Registra exceções não tratadas.
        """
        error_message = f"Unhandled exception: {str(exception)}"
        error_details = {
            'user': getattr(request.user, 'username', 'Anonymous') if hasattr(request, 'user') else 'Unknown',
            'path': request.path,
            'method': request.method,
            'GET': dict(request.GET),
            'POST': dict(request.POST) if request.method == 'POST' else {},
            'META': {
                'REMOTE_ADDR': request.META.get('REMOTE_ADDR'),
                'HTTP_USER_AGENT': request.META.get('HTTP_USER_AGENT'),
                'HTTP_REFERER': request.META.get('HTTP_REFERER'),
            },
            'traceback': traceback.format_exc()
        }
        
        logger.error(error_message, extra=error_details)
        
        # Em produção, retorna uma resposta JSON genérica
        if not settings.DEBUG:
            return JsonResponse({
                'error': 'Internal server error',
                'message': 'An unexpected error occurred. Please try again later.'
            }, status=500)
        
        # Em desenvolvimento, deixa o Django lidar com a exceção
        return None


class SecurityLoggingMiddleware(MiddlewareMixin):
    """
    Middleware para registrar eventos de segurança.
    """
    
    def process_request(self, request):
        """
        Registra tentativas de acesso suspeitas.
        """
        # Log de tentativas de acesso a endpoints administrativos
        if request.path.startswith('/admin/') and not request.user.is_authenticated:
            security_logger.warning(
                f"Unauthenticated access attempt to admin: {request.path}",
                extra={
                    'ip': request.META.get('REMOTE_ADDR'),
                    'user_agent': request.META.get('HTTP_USER_AGENT'),
                    'path': request.path
                }
            )
        
        # Log de tentativas de SQL injection básicas
        suspicious_patterns = ['union', 'select', 'drop', 'insert', 'update', 'delete', '--', ';']
        query_string = request.META.get('QUERY_STRING', '').lower()
        
        if any(pattern in query_string for pattern in suspicious_patterns):
            security_logger.warning(
                f"Suspicious query string detected: {request.META.get('QUERY_STRING')}",
                extra={
                    'ip': request.META.get('REMOTE_ADDR'),
                    'user_agent': request.META.get('HTTP_USER_AGENT'),
                    'path': request.path,
                    'query_string': request.META.get('QUERY_STRING')
                }
            )
        
        return None
    
    def process_response(self, request, response):
        """
        Registra respostas de erro importantes.
        """
        # Log de erros 4xx e 5xx
        if response.status_code >= 400:
            level = logging.ERROR if response.status_code >= 500 else logging.WARNING
            security_logger.log(
                level,
                f"HTTP {response.status_code} response for {request.path}",
                extra={
                    'status_code': response.status_code,
                    'ip': request.META.get('REMOTE_ADDR'),
                    'user_agent': request.META.get('HTTP_USER_AGENT'),
                    'path': request.path,
                    'user': getattr(request.user, 'username', 'Anonymous') if hasattr(request, 'user') else 'Unknown'
                }
            )
        
        return response


class CSRFExemptMiddleware(MiddlewareMixin):
    """
    Middleware para isentar URLs específicas do CSRF.
    """
    
    def process_request(self, request):
        """
        Verifica se a URL atual deve ser isenta de CSRF.
        """
        if hasattr(settings, 'CSRF_EXEMPT_URLS'):
            for pattern in settings.CSRF_EXEMPT_URLS:
                if re.match(pattern, request.path):
                    setattr(request, '_dont_enforce_csrf_checks', True)
                    break
        return None


class PerformanceLoggingMiddleware(MiddlewareMixin):
    """
    Middleware para registrar métricas de performance.
    """
    
    def process_request(self, request):
        """
        Marca o início da requisição.
        """
        import time
        request._start_time = time.time()
        return None
    
    def process_response(self, request, response):
        """
        Registra o tempo de resposta.
        """
        if hasattr(request, '_start_time'):
            import time
            duration = time.time() - request._start_time
            
            # Log de requisições lentas (> 2 segundos)
            if duration > 2.0:
                logger.warning(
                    f"Slow request detected: {request.path} took {duration:.2f}s",
                    extra={
                        'duration': duration,
                        'path': request.path,
                        'method': request.method,
                        'status_code': response.status_code,
                        'user': getattr(request.user, 'username', 'Anonymous') if hasattr(request, 'user') else 'Unknown'
                    }
                )
            
            # Log geral de performance (apenas em DEBUG)
            if settings.DEBUG:
                logger.debug(
                    f"Request {request.method} {request.path} completed in {duration:.3f}s",
                    extra={
                        'duration': duration,
                        'path': request.path,
                        'method': request.method,
                        'status_code': response.status_code
                    }
                )
        
        return response