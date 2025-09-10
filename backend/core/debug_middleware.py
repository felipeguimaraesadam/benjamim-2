import logging
from django.utils.deprecation import MiddlewareMixin
import json

cors_logger = logging.getLogger('cors_debug')
api_logger = logging.getLogger('api_debug')

class DebugMiddleware(MiddlewareMixin):
    """
    Middleware para debug detalhado de requisições e CORS
    """
    
    def process_request(self, request):
        # Log detalhado da requisição
        api_logger.info(f"🌐 REQUEST - {request.method} {request.path}")
        api_logger.info(f"🌐 IP: {self.get_client_ip(request)}")
        api_logger.info(f"🌐 USER-AGENT: {request.META.get('HTTP_USER_AGENT', 'N/A')}")
        api_logger.info(f"🌐 ORIGIN: {request.META.get('HTTP_ORIGIN', 'N/A')}")
        api_logger.info(f"🌐 REFERER: {request.META.get('HTTP_REFERER', 'N/A')}")
        
        # Headers importantes para CORS
        cors_headers = {
            'Origin': request.META.get('HTTP_ORIGIN'),
            'Access-Control-Request-Method': request.META.get('HTTP_ACCESS_CONTROL_REQUEST_METHOD'),
            'Access-Control-Request-Headers': request.META.get('HTTP_ACCESS_CONTROL_REQUEST_HEADERS'),
            'Authorization': request.META.get('HTTP_AUTHORIZATION', 'N/A')[:50] + '...' if request.META.get('HTTP_AUTHORIZATION') else 'N/A',
        }
        cors_logger.info(f"🔄 CORS HEADERS: {cors_headers}")
        
        # Log do body para POST/PUT/PATCH
        if request.method in ['POST', 'PUT', 'PATCH'] and hasattr(request, 'body'):
            try:
                if request.content_type == 'application/json':
                    body_data = json.loads(request.body.decode('utf-8'))
                    # Mascarar senhas
                    if 'password' in body_data:
                        body_data['password'] = '***masked***'
                    api_logger.info(f"📝 REQUEST BODY: {body_data}")
                else:
                    api_logger.info(f"📝 REQUEST BODY TYPE: {request.content_type}")
            except Exception as e:
                api_logger.warning(f"⚠️ Could not parse request body: {e}")
        
        return None
    
    def process_response(self, request, response):
        # Log da resposta
        api_logger.info(f"📤 RESPONSE - {request.method} {request.path} - Status: {response.status_code}")
        
        # Headers de CORS na resposta
        cors_response_headers = {
            'Access-Control-Allow-Origin': response.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.get('Access-Control-Allow-Headers'),
            'Access-Control-Allow-Credentials': response.get('Access-Control-Allow-Credentials'),
        }
        cors_logger.info(f"📤 CORS RESPONSE HEADERS: {cors_response_headers}")
        
        # Log do conteúdo da resposta para erros
        if response.status_code >= 400:
            try:
                if hasattr(response, 'content') and response.content:
                    content = response.content.decode('utf-8')[:500]  # Primeiros 500 chars
                    api_logger.error(f"❌ ERROR RESPONSE CONTENT: {content}")
            except Exception as e:
                api_logger.warning(f"⚠️ Could not parse response content: {e}")
        
        return response
    
    def get_client_ip(self, request):
        """Obtém o IP real do cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip