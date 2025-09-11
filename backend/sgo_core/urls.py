"""
URL configuration for sgo_core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include # Added include

from rest_framework_simplejwt.views import TokenRefreshView
from core.serializers import MyTokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView as BaseTokenObtainPairView
from core.views import HealthCheckView, debug_system_info, debug_bypass_login
from core.health_views import health_check, system_status, system_metrics
from core.error_views import test_error, error_report
from django.http import JsonResponse
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import logging

# Configure logging for authentication
logger = logging.getLogger('auth_debug')

class MyTokenObtainPairView(BaseTokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        logger.info(f"🔐 LOGIN ATTEMPT - IP: {request.META.get('REMOTE_ADDR')}")
        logger.info(f"🔐 LOGIN DATA: {request.data}")
        logger.info(f"🔐 HEADERS: {dict(request.headers)}")
        
        try:
            response = super().post(request, *args, **kwargs)
            logger.info(f"✅ LOGIN SUCCESS - Status: {response.status_code}")
            logger.info(f"✅ RESPONSE DATA: {response.data}")
            return response
        except Exception as e:
            logger.error(f"❌ LOGIN ERROR: {str(e)}")
            logger.error(f"❌ ERROR TYPE: {type(e).__name__}")
            raise

urlpatterns = [
    path('admin/', admin.site.urls),
    # Health check endpoints
    path('api/health-check/', HealthCheckView.as_view(), name='health-check'),
    path('api/health/', health_check, name='health'),
    path('api/status/', system_status, name='system_status'),
    path('api/metrics/', system_metrics, name='system_metrics'),
    # Error handling endpoints
    path('api/error-report/', error_report, name='error_report'),
    path('api/test-error/', test_error, name='test_error'),
    # JWT Token Endpoints
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Rotas de DEBUG - REMOVER EM PRODUÇÃO!
    path('api/debug/system-info/', debug_system_info, name='debug_system_info'),
    path('api/debug/bypass-login/', debug_bypass_login, name='debug_bypass_login'),
    path('api/', include('core.urls')), # Added core urls
    # path('api-auth/', include('rest_framework.urls', namespace='rest_framework')), # Optional: DRF login/logout for browsable API
]

from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.urls import re_path
from django.views.static import serve

# Servir arquivos estáticos em desenvolvimento
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    # Servir assets do React build
    urlpatterns += static('/assets/', document_root=settings.BASE_DIR / 'static_react_build' / 'assets')

# Adicionar rota para servir arquivos de mídia em qualquer ambiente (dev/prod simplificado)
# Isso garante que os links de mídia funcionem corretamente.
urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {
        'document_root': settings.MEDIA_ROOT,
    }),
]

# Configurar handlers de erro personalizados
handler404 = 'core.error_views.handler404'
handler500 = 'core.error_views.handler500'
handler403 = 'core.error_views.handler403'
handler400 = 'core.error_views.handler400'

# Servir o frontend React
# A rota catch-all deve ser a última para não interceptar as rotas de API, mídia ou arquivos estáticos.
# Excluir rotas que começam com 'api/', 'admin/', 'media/', 'static/' ou 'assets/'
urlpatterns.append(re_path(r'^(?!api/|admin/|media/|static/|assets/).*$', TemplateView.as_view(template_name='index.html')))
