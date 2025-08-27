from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.request import Request
from django.db import models
from django.core.exceptions import ValidationError
from django.http import Http404
from typing import Any, Dict, List, Optional, Type
import logging

from ..services.base import BaseService

logger = logging.getLogger(__name__)


class BaseViewSet(viewsets.ModelViewSet):
    """
    ViewSet base com funcionalidades comuns e tratamento de erros padronizado.
    Integra com BaseService para separação de responsabilidades.
    """
    
    service_class: Type[BaseService] = None
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.logger = logging.getLogger(f"{self.__class__.__module__}.{self.__class__.__name__}")
        
        # Inicializa o serviço se especificado
        if self.service_class and hasattr(self, 'queryset') and self.queryset is not None:
            self.service = self.service_class(self.queryset.model)
        elif self.service_class and hasattr(self, 'serializer_class'):
            # Tenta obter o modelo do serializer
            serializer = self.serializer_class()
            if hasattr(serializer, 'Meta') and hasattr(serializer.Meta, 'model'):
                self.service = self.service_class(serializer.Meta.model)
    
    def get_service(self) -> BaseService:
        """
        Retorna a instância do serviço.
        Pode ser sobrescrito para lógica customizada.
        """
        if not hasattr(self, 'service') or self.service is None:
            raise NotImplementedError("Service não configurado. Defina service_class ou sobrescreva get_service()")
        return self.service
    
    def handle_exception(self, exc: Exception) -> Response:
        """
        Trata exceções de forma padronizada.
        
        Args:
            exc: Exceção capturada
            
        Returns:
            Response com erro padronizado
        """
        self.logger.error(f"Exceção capturada em {self.__class__.__name__}: {str(exc)}")
        
        if isinstance(exc, ValidationError):
            return Response(
                {'error': 'Dados inválidos', 'details': str(exc)},
                status=status.HTTP_400_BAD_REQUEST
            )
        elif isinstance(exc, Http404):
            return Response(
                {'error': 'Recurso não encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        elif isinstance(exc, PermissionError):
            return Response(
                {'error': 'Permissão negada'},
                status=status.HTTP_403_FORBIDDEN
            )
        else:
            return Response(
                {'error': 'Erro interno do servidor'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def create(self, request: Request, *args, **kwargs) -> Response:
        """
        Cria um novo objeto usando o serviço.
        """
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            # Usa o serviço para criar o objeto
            service = self.get_service()
            instance = service.create(serializer.validated_data)
            
            # Serializa o objeto criado
            output_serializer = self.get_serializer(instance)
            
            self.logger.info(f"Objeto {instance.__class__.__name__} criado com ID {instance.id}")
            
            return Response(
                output_serializer.data,
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            return self.handle_exception(e)
    
    def update(self, request: Request, *args, **kwargs) -> Response:
        """
        Atualiza um objeto usando o serviço.
        """
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            
            # Usa o serviço para atualizar o objeto
            service = self.get_service()
            updated_instance = service.update(instance, serializer.validated_data)
            
            # Serializa o objeto atualizado
            output_serializer = self.get_serializer(updated_instance)
            
            self.logger.info(f"Objeto {instance.__class__.__name__} ID {instance.id} atualizado")
            
            return Response(output_serializer.data)
            
        except Exception as e:
            return self.handle_exception(e)
    
    def destroy(self, request: Request, *args, **kwargs) -> Response:
        """
        Deleta um objeto usando o serviço.
        """
        try:
            instance = self.get_object()
            
            # Usa o serviço para deletar o objeto
            service = self.get_service()
            service.delete(instance)
            
            self.logger.info(f"Objeto {instance.__class__.__name__} ID {instance.id} deletado")
            
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except Exception as e:
            return self.handle_exception(e)
    
    def list(self, request: Request, *args, **kwargs) -> Response:
        """
        Lista objetos com paginação e filtros.
        """
        try:
            queryset = self.filter_queryset(self.get_queryset())
            
            # Aplica paginação se configurada
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            return self.handle_exception(e)
    
    def retrieve(self, request: Request, *args, **kwargs) -> Response:
        """
        Recupera um objeto específico.
        """
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
            
        except Exception as e:
            return self.handle_exception(e)
    
    @action(detail=False, methods=['get'])
    def stats(self, request: Request) -> Response:
        """
        Endpoint para estatísticas básicas.
        Pode ser sobrescrito para estatísticas específicas.
        """
        try:
            queryset = self.get_queryset()
            stats_data = {
                'total_count': queryset.count(),
                'active_count': queryset.filter(is_active=True).count() if hasattr(queryset.model, 'is_active') else None
            }
            
            # Remove valores None
            stats_data = {k: v for k, v in stats_data.items() if v is not None}
            
            return Response(stats_data)
            
        except Exception as e:
            return self.handle_exception(e)
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request: Request) -> Response:
        """
        Criação em lote de objetos.
        """
        try:
            if not isinstance(request.data, list):
                return Response(
                    {'error': 'Dados devem ser uma lista'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            created_objects = []
            errors = []
            
            for i, item_data in enumerate(request.data):
                try:
                    serializer = self.get_serializer(data=item_data)
                    serializer.is_valid(raise_exception=True)
                    
                    service = self.get_service()
                    instance = service.create(serializer.validated_data)
                    
                    output_serializer = self.get_serializer(instance)
                    created_objects.append(output_serializer.data)
                    
                except Exception as e:
                    errors.append({
                        'index': i,
                        'error': str(e),
                        'data': item_data
                    })
            
            response_data = {
                'created': created_objects,
                'created_count': len(created_objects),
                'errors': errors,
                'error_count': len(errors)
            }
            
            status_code = status.HTTP_201_CREATED if created_objects else status.HTTP_400_BAD_REQUEST
            
            return Response(response_data, status=status_code)
            
        except Exception as e:
            return self.handle_exception(e)
    
    @action(detail=False, methods=['delete'])
    def bulk_delete(self, request: Request) -> Response:
        """
        Deleção em lote de objetos.
        """
        try:
            ids = request.data.get('ids', [])
            
            if not ids or not isinstance(ids, list):
                return Response(
                    {'error': 'Lista de IDs é obrigatória'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            deleted_count = 0
            errors = []
            
            for obj_id in ids:
                try:
                    instance = self.get_queryset().get(id=obj_id)
                    service = self.get_service()
                    service.delete(instance)
                    deleted_count += 1
                    
                except self.queryset.model.DoesNotExist:
                    errors.append({
                        'id': obj_id,
                        'error': 'Objeto não encontrado'
                    })
                except Exception as e:
                    errors.append({
                        'id': obj_id,
                        'error': str(e)
                    })
            
            response_data = {
                'deleted_count': deleted_count,
                'errors': errors,
                'error_count': len(errors)
            }
            
            return Response(response_data)
            
        except Exception as e:
            return self.handle_exception(e)
    
    def get_success_response(self, data: Any = None, message: str = None, 
                           status_code: int = status.HTTP_200_OK) -> Response:
        """
        Constrói uma resposta de sucesso padronizada.
        
        Args:
            data: Dados da resposta
            message: Mensagem de sucesso
            status_code: Código de status HTTP
            
        Returns:
            Response padronizada
        """
        response_data = {}
        
        if data is not None:
            response_data['data'] = data
            
        if message:
            response_data['message'] = message
            
        return Response(response_data, status=status_code)
    
    def get_error_response(self, message: str, details: Any = None, 
                          status_code: int = status.HTTP_400_BAD_REQUEST) -> Response:
        """
        Constrói uma resposta de erro padronizada.
        
        Args:
            message: Mensagem de erro
            details: Detalhes do erro
            status_code: Código de status HTTP
            
        Returns:
            Response de erro padronizada
        """
        response_data = {'error': message}
        
        if details:
            response_data['details'] = details
            
        return Response(response_data, status=status_code)
    
    def perform_create(self, serializer):
        """
        Hook para customizar a criação.
        Por padrão, delega para o serviço.
        """
        if hasattr(self, 'service'):
            return self.service.create(serializer.validated_data)
        else:
            return serializer.save()
    
    def perform_update(self, serializer):
        """
        Hook para customizar a atualização.
        Por padrão, delega para o serviço.
        """
        if hasattr(self, 'service'):
            return self.service.update(serializer.instance, serializer.validated_data)
        else:
            return serializer.save()
    
    def perform_destroy(self, instance):
        """
        Hook para customizar a deleção.
        Por padrão, delega para o serviço.
        """
        if hasattr(self, 'service'):
            return self.service.delete(instance)
        else:
            return instance.delete()