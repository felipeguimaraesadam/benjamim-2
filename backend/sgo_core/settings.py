import os
from pathlib import Path
from decouple import config
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
# Use a função config que você já tem do python-decouple
# Configuração para dev_main - URLs corretas conforme CONTRIBUTING.md
ALLOWED_HOSTS_CONFIG = config('ALLOWED_HOSTS', default='127.0.0.1,localhost,django-backend-e7od-4cjk.onrender.com,django-backend-e7od.onrender.com,*.onrender.com')

# Separa a string por vírgulas e remove espaços extras
ALLOWED_HOSTS = [host.strip() for host in ALLOWED_HOSTS_CONFIG.split(',') if host.strip()]

# Adiciona variações com porta para desenvolvimento local (sempre)
ALLOWED_HOSTS.extend(['127.0.0.1:8000', 'localhost:8000'])

INSTALLED_APPS = [
    'corsheaders',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework.authtoken',
    'core.apps.CoreConfig',
]
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # <-- MOVIDO PARA CÁ (segunda posição)
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'core.middleware.SecurityHeadersMiddleware',  # Headers de segurança
    'core.middleware.RequestLoggingMiddleware',  # Log de requisições
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'core.middleware.CSRFExemptMiddleware',  # CSRF exempt para endpoints de teste
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'core.middleware.ErrorHandlingMiddleware',  # Tratamento de erros (último)
]
ROOT_URLCONF = 'sgo_core.urls'
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'static_react_build', BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]
WSGI_APPLICATION = 'sgo_core.wsgi.application'
DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL', default='sqlite:///db.sqlite3')
    )
}
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',},
]
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'America/Sao_Paulo'
USE_I18N = True
USE_TZ = True

# Configuração de logging melhorada
from core.logging_config import get_logging_config
LOGGING = get_logging_config(BASE_DIR, DEBUG)
STATIC_URL = '/static/'
STATICFILES_DIRS = [
    BASE_DIR / 'static_react_build' / 'assets',
]
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
# ==============================================================================
# CONFIGURAÇÃO DE ARMAZENAMENTO DE MÍDIA (AWS S3)
# ==============================================================================
# Estas configurações só serão ativadas se a variável de ambiente
# 'USE_S3' estiver definida como 'TRUE'.
if os.environ.get('USE_S3') == 'TRUE':
    AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_STORAGE_BUCKET_NAME')
    AWS_S3_REGION_NAME = os.environ.get('AWS_S3_REGION_NAME')
    AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_S3_REGION_NAME}.amazonaws.com'
    
    # Configurações de cache (sem ACL)
    AWS_S3_OBJECT_PARAMETERS = {
        'CacheControl': 'max-age=86400',
    }
    
    # Configurações de segurança e CORS
    AWS_S3_FILE_OVERWRITE = False
    AWS_QUERYSTRING_AUTH = False
    
    # Configurações de CORS para S3
    AWS_S3_CORS = [
        {
            'AllowedHeaders': ['*'],
            'AllowedMethods': ['GET', 'HEAD'],
            'AllowedOrigins': ['*'],
            'ExposeHeaders': ['ETag'],
            'MaxAgeSeconds': 3000
        }
    ]
    
    AWS_LOCATION = 'media'
    MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/{AWS_LOCATION}/'
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
else:
    # Configuração padrão para desenvolvimento local
    MEDIA_URL = '/media/'
    MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
# ============================================================================== 
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'core.Usuario'
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
}
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': False,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'JTI_CLAIM': 'jti',
    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=5),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
}
AUTHENTICATION_BACKENDS = [
    'core.auth_backends.CustomAuthBackend',
    'django.contrib.auth.backends.ModelBackend',
]
# Configuração dinâmica de CORS baseada em variáveis de ambiente
# dev_main: frontend-s7jt-4cjk.onrender.com | master: frontend-s7jt.onrender.com
CORS_ALLOWED_ORIGINS_CONFIG = config('CORS_ALLOWED_ORIGINS', default='http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,https://frontend-s7jt-4cjk.onrender.com,https://frontend-s7jt.onrender.com')
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in CORS_ALLOWED_ORIGINS_CONFIG.split(',') if origin.strip()]

# Adicionar CSRF_TRUSTED_ORIGINS baseado em variável de ambiente
# dev_main: frontend-s7jt-4cjk.onrender.com | master: frontend-s7jt.onrender.com
CSRF_TRUSTED_ORIGINS_CONFIG = config('CSRF_TRUSTED_ORIGINS', default='http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,https://frontend-s7jt-4cjk.onrender.com,https://frontend-s7jt.onrender.com')
CSRF_TRUSTED_ORIGINS = [origin.strip() for origin in CSRF_TRUSTED_ORIGINS_CONFIG.split(',') if origin.strip()]
CORS_ALLOW_CREDENTIALS = True
CORS_URLS_REGEX = r'^/api/.*$'
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

USE_S3 = os.environ.get('USE_S3') == 'TRUE'

# ==============================================================================
# CONFIGURAÇÕES DE UPLOAD DE ARQUIVOS
# ==============================================================================
# Tamanho máximo de arquivo: 100MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 100 * 1024 * 1024  # 100MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 100 * 1024 * 1024  # 100MB
DATA_UPLOAD_MAX_NUMBER_FIELDS = 1000

# Timeout para uploads (em segundos)
FILE_UPLOAD_TIMEOUT = 300  # 5 minutos

# Configurações específicas para S3
if USE_S3:
    # Timeout para operações S3 (em segundos)
    AWS_S3_CONNECT_TIMEOUT = 60
    AWS_S3_READ_TIMEOUT = 300  # 5 minutos para uploads grandes
    
    # Configurações de retry para S3
    AWS_S3_MAX_POOL_CONNECTIONS = 50
    AWS_S3_RETRIES = {
        'max_attempts': 3,
        'mode': 'adaptive'
    }

STORAGES = {
    "default": {
        "BACKEND": "storages.backends.s3boto3.S3Boto3Storage" if USE_S3 else "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}
