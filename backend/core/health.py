from django.http import JsonResponse
from django.db import connection
from django.conf import settings
import os
from datetime import datetime

def health_check(request):
    """Endpoint de diagnóstico para verificar status do sistema"""
    
    health_data = {
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'environment': {
            'debug': settings.DEBUG,
            'allowed_hosts': settings.ALLOWED_HOSTS,
            'cors_allowed_origins': getattr(settings, 'CORS_ALLOWED_ORIGINS', []),
            'database_engine': settings.DATABASES['default']['ENGINE'],
            'use_s3': os.environ.get('USE_S3', 'FALSE'),
        },
        'checks': {}
    }
    
    # Teste de conexão com banco de dados
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            health_data['checks']['database'] = {
                'status': 'ok',
                'message': 'Database connection successful'
            }
    except Exception as e:
        health_data['status'] = 'error'
        health_data['checks']['database'] = {
            'status': 'error',
            'message': f'Database connection failed: {str(e)}'
        }
    
    # Verificar variáveis de ambiente críticas
    env_vars = {
        'SECRET_KEY': bool(os.environ.get('SECRET_KEY')),
        'DATABASE_URL': bool(os.environ.get('DATABASE_URL')),
        'CORS_ALLOWED_ORIGINS': bool(os.environ.get('CORS_ALLOWED_ORIGINS')),
        'ALLOWED_HOSTS': bool(os.environ.get('ALLOWED_HOSTS')),
    }
    
    missing_vars = [var for var, exists in env_vars.items() if not exists]
    
    if missing_vars:
        health_data['checks']['environment_variables'] = {
            'status': 'warning',
            'message': f'Missing environment variables: {", ".join(missing_vars)}',
            'missing': missing_vars
        }
    else:
        health_data['checks']['environment_variables'] = {
            'status': 'ok',
            'message': 'All critical environment variables are set'
        }
    
    # Verificar configurações de CORS
    cors_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
    health_data['checks']['cors'] = {
        'status': 'ok' if cors_origins else 'warning',
        'message': f'CORS configured for {len(cors_origins)} origins',
        'origins': cors_origins
    }
    
    # Status HTTP baseado nos checks
    status_code = 200
    if health_data['status'] == 'error':
        status_code = 500
    elif any(check.get('status') == 'warning' for check in health_data['checks'].values()):
        status_code = 200  # Warnings não devem retornar erro HTTP
    
    return JsonResponse(health_data, status=status_code)

def database_status(request):
    """Endpoint específico para verificar status detalhado do banco"""
    
    try:
        from django.db import connections
        from django.core.management.color import no_style
        
        db_info = {}
        
        for alias in connections:
            conn = connections[alias]
            try:
                with conn.cursor() as cursor:
                    # Informações básicas da conexão
                    cursor.execute("SELECT version()")
                    version = cursor.fetchone()[0]
                    
                    # Contar tabelas
                    cursor.execute("""
                        SELECT COUNT(*) 
                        FROM information_schema.tables 
                        WHERE table_schema = 'public'
                    """)
                    table_count = cursor.fetchone()[0]
                    
                    db_info[alias] = {
                        'status': 'connected',
                        'version': version,
                        'table_count': table_count,
                        'settings': {
                            'ENGINE': conn.settings_dict['ENGINE'],
                            'NAME': conn.settings_dict['NAME'],
                            'HOST': conn.settings_dict.get('HOST', 'localhost'),
                            'PORT': conn.settings_dict.get('PORT', '5432'),
                        }
                    }
                    
            except Exception as e:
                db_info[alias] = {
                    'status': 'error',
                    'error': str(e)
                }
        
        return JsonResponse({
            'databases': db_info,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return JsonResponse({
            'error': f'Failed to check database status: {str(e)}',
            'timestamp': datetime.now().isoformat()
        }, status=500)