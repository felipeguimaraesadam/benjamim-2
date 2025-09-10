from django.http import JsonResponse
from django.db import connection
from django.conf import settings
import os
from datetime import datetime

def health_check(request):
    """Endpoint para verificar o status do sistema e conectividade"""
    
    health_data = {
        'timestamp': datetime.now().isoformat(),
        'status': 'healthy',
        'checks': {}
    }
    
    # Verificar conexão com banco de dados
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            health_data['checks']['database'] = {
                'status': 'connected',
                'engine': settings.DATABASES['default']['ENGINE']
            }
    except Exception as e:
        health_data['checks']['database'] = {
            'status': 'error',
            'error': str(e)
        }
        health_data['status'] = 'unhealthy'
    
    # Verificar variáveis de ambiente críticas
    env_vars = {
        'DEBUG': os.getenv('DEBUG', 'True'),
        'SECRET_KEY': '***' if os.getenv('SECRET_KEY') else 'NOT_SET',
        'DATABASE_URL': '***' if os.getenv('DATABASE_URL') else 'NOT_SET',
        'CORS_ALLOWED_ORIGINS': os.getenv('CORS_ALLOWED_ORIGINS', 'NOT_SET'),
        'ALLOWED_HOSTS': getattr(settings, 'ALLOWED_HOSTS', [])
    }
    
    health_data['checks']['environment'] = {
        'status': 'ok',
        'variables': env_vars
    }
    
    # Verificar configurações do Django
    health_data['checks']['django'] = {
        'status': 'ok',
        'debug': settings.DEBUG,
        'allowed_hosts': settings.ALLOWED_HOSTS,
        'cors_origins': getattr(settings, 'CORS_ALLOWED_ORIGINS', []),
        'static_url': settings.STATIC_URL,
        'media_url': getattr(settings, 'MEDIA_URL', 'NOT_SET')
    }
    
    # Status HTTP baseado na saúde geral
    status_code = 200 if health_data['status'] == 'healthy' else 503
    
    return JsonResponse(health_data, status=status_code)