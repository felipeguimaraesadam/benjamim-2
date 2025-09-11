from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from datetime import datetime
import json

from .logging_config import sgo_logger

def handler404(request, exception=None):
    """
    Handler personalizado para erro 404
    """
    # Log do erro 404
    sgo_logger.error(
        f"Página não encontrada: {request.path}",
        extra={
            'status_code': 404,
            'path': request.path,
            'method': request.method,
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            'ip_address': get_client_ip(request)
        }
    )
    
    # Verificar se é uma requisição da API
    if request.path.startswith('/api/') or request.content_type == 'application/json':
        return JsonResponse({
            'error': 'Não encontrado',
            'message': 'O recurso solicitado não foi encontrado',
            'status_code': 404,
            'path': request.path,
            'timestamp': datetime.now().isoformat()
        }, status=404)
    
    # Para requisições web normais, renderizar template
    return render(request, 'errors/404.html', {
        'error_code': 404,
        'error_message': 'Página não encontrada',
        'path': request.path
    }, status=404)

def handler500(request):
    """
    Handler personalizado para erro 500
    """
    # Log do erro 500
    sgo_logger.error(
        f"Erro interno do servidor: {request.path}",
        extra={
            'status_code': 500,
            'path': request.path,
            'method': request.method,
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            'ip_address': get_client_ip(request)
        }
    )
    
    # Verificar se é uma requisição da API
    if request.path.startswith('/api/') or request.content_type == 'application/json':
        return JsonResponse({
            'error': 'Erro interno do servidor',
            'message': 'Ocorreu um erro interno. Tente novamente mais tarde.',
            'status_code': 500,
            'timestamp': datetime.now().isoformat()
        }, status=500)
    
    # Para requisições web normais, renderizar template
    return render(request, 'errors/500.html', {
        'error_code': 500,
        'error_message': 'Erro interno do servidor'
    }, status=500)

def handler403(request, exception=None):
    """
    Handler personalizado para erro 403
    """
    # Log do erro 403
    sgo_logger.security(
        f"Acesso negado: {request.path}",
        extra={
            'status_code': 403,
            'path': request.path,
            'method': request.method,
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            'ip_address': get_client_ip(request)
        },
        user=getattr(request, 'user', None)
    )
    
    # Verificar se é uma requisição da API
    if request.path.startswith('/api/') or request.content_type == 'application/json':
        return JsonResponse({
            'error': 'Acesso negado',
            'message': 'Você não tem permissão para acessar este recurso',
            'status_code': 403,
            'timestamp': datetime.now().isoformat()
        }, status=403)
    
    # Para requisições web normais, renderizar template
    return render(request, 'errors/403.html', {
        'error_code': 403,
        'error_message': 'Acesso negado'
    }, status=403)

def handler400(request, exception=None):
    """
    Handler personalizado para erro 400
    """
    # Log do erro 400
    sgo_logger.warning(
        f"Requisição inválida: {request.path}",
        extra={
            'status_code': 400,
            'path': request.path,
            'method': request.method,
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            'ip_address': get_client_ip(request)
        }
    )
    
    # Verificar se é uma requisição da API
    if request.path.startswith('/api/') or request.content_type == 'application/json':
        return JsonResponse({
            'error': 'Requisição inválida',
            'message': 'A requisição contém dados inválidos',
            'status_code': 400,
            'timestamp': datetime.now().isoformat()
        }, status=400)
    
    # Para requisições web normais, renderizar template
    return render(request, 'errors/400.html', {
        'error_code': 400,
        'error_message': 'Requisição inválida'
    }, status=400)

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def test_error(request):
    """
    Endpoint para testar o sistema de tratamento de erros
    Apenas para desenvolvimento/teste
    """
    from django.conf import settings
    
    # Só permitir em modo DEBUG
    if not settings.DEBUG:
        return Response({
            'error': 'Endpoint não disponível em produção'
        }, status=status.HTTP_404_NOT_FOUND)
    
    error_type = request.GET.get('type', '500')
    
    if error_type == '404':
        return Response({
            'error': 'Não encontrado',
            'message': 'Teste de erro 404'
        }, status=status.HTTP_404_NOT_FOUND)
    
    elif error_type == '403':
        return Response({
            'error': 'Acesso negado',
            'message': 'Teste de erro 403'
        }, status=status.HTTP_403_FORBIDDEN)
    
    elif error_type == '400':
        return Response({
            'error': 'Requisição inválida',
            'message': 'Teste de erro 400'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    elif error_type == 'exception':
        # Forçar uma exceção para testar o handler 500
        raise Exception("Teste de exceção para verificar logging")
    
    else:
        # Erro 500 padrão
        return Response({
            'error': 'Erro interno',
            'message': 'Teste de erro 500'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def get_client_ip(request):
    """
    Obtém o IP real do cliente, considerando proxies
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

@csrf_exempt
@require_http_methods(["GET", "POST"])
def error_report(request):
    """
    Endpoint para receber relatórios de erro do frontend
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            error_info = {
                'message': data.get('message', 'Erro não especificado'),
                'stack': data.get('stack', ''),
                'url': data.get('url', ''),
                'line': data.get('line', ''),
                'column': data.get('column', ''),
                'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                'ip_address': get_client_ip(request),
                'timestamp': datetime.now().isoformat()
            }
            
            # Log do erro do frontend
            sgo_logger.error(
                f"Erro no frontend: {error_info['message']}",
                extra={
                    'source': 'frontend',
                    'error_details': error_info
                }
            )
            
            return JsonResponse({
                'status': 'success',
                'message': 'Erro reportado com sucesso'
            })
            
        except json.JSONDecodeError:
            return JsonResponse({
                'error': 'JSON inválido'
            }, status=400)
        
        except Exception as e:
            sgo_logger.error(
                "Erro ao processar relatório de erro do frontend",
                exception=e
            )
            
            return JsonResponse({
                'error': 'Erro interno'
            }, status=500)
    
    else:
        # GET - retornar informações sobre o endpoint
        return JsonResponse({
            'endpoint': 'error_report',
            'method': 'POST',
            'description': 'Endpoint para receber relatórios de erro do frontend',
            'required_fields': ['message'],
            'optional_fields': ['stack', 'url', 'line', 'column']
        })

class APIErrorResponse:
    """
    Classe utilitária para padronizar respostas de erro da API
    """
    
    @staticmethod
    def validation_error(message, errors=None):
        return Response({
            'error': 'Erro de validação',
            'message': message,
            'errors': errors or {},
            'timestamp': datetime.now().isoformat()
        }, status=status.HTTP_400_BAD_REQUEST)
    
    @staticmethod
    def permission_denied(message="Você não tem permissão para realizar esta ação"):
        return Response({
            'error': 'Acesso negado',
            'message': message,
            'timestamp': datetime.now().isoformat()
        }, status=status.HTTP_403_FORBIDDEN)
    
    @staticmethod
    def not_found(message="Recurso não encontrado"):
        return Response({
            'error': 'Não encontrado',
            'message': message,
            'timestamp': datetime.now().isoformat()
        }, status=status.HTTP_404_NOT_FOUND)
    
    @staticmethod
    def internal_error(message="Erro interno do servidor"):
        return Response({
            'error': 'Erro interno',
            'message': message,
            'timestamp': datetime.now().isoformat()
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @staticmethod
    def conflict(message="Conflito de dados"):
        return Response({
            'error': 'Conflito',
            'message': message,
            'timestamp': datetime.now().isoformat()
        }, status=status.HTTP_409_CONFLICT)
    
    @staticmethod
    def rate_limit_exceeded(message="Muitas requisições. Tente novamente mais tarde."):
        return Response({
            'error': 'Limite excedido',
            'message': message,
            'timestamp': datetime.now().isoformat()
        }, status=status.HTTP_429_TOO_MANY_REQUESTS)