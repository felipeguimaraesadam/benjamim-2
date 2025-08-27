from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Type, Union
from django.db import models, transaction
from django.core.exceptions import ValidationError
from django.db.models import QuerySet
from rest_framework import status
from rest_framework.response import Response
import logging

logger = logging.getLogger(__name__)


class BaseService(ABC):
    """
    Classe base para todos os serviços do sistema.
    Implementa funcionalidades comuns como validação, logging e tratamento de erros.
    """
    
    def __init__(self, model: Type[models.Model]):
        self.model = model
        self.logger = logging.getLogger(f"{self.__class__.__module__}.{self.__class__.__name__}")
    
    def get_queryset(self) -> QuerySet:
        """
        Retorna o queryset base para o modelo.
        Pode ser sobrescrito para aplicar filtros específicos.
        """
        return self.model.objects.all()
    
    def get_by_id(self, obj_id: int) -> Optional[models.Model]:
        """
        Busca um objeto pelo ID.
        
        Args:
            obj_id: ID do objeto
            
        Returns:
            Objeto encontrado ou None
        """
        try:
            return self.get_queryset().get(id=obj_id)
        except self.model.DoesNotExist:
            self.logger.warning(f"{self.model.__name__} com ID {obj_id} não encontrado")
            return None
        except Exception as e:
            self.logger.error(f"Erro ao buscar {self.model.__name__} por ID {obj_id}: {str(e)}")
            raise
    
    def get_all(self, **filters) -> QuerySet:
        """
        Retorna todos os objetos com filtros opcionais.
        
        Args:
            **filters: Filtros a serem aplicados
            
        Returns:
            QuerySet filtrado
        """
        try:
            queryset = self.get_queryset()
            if filters:
                queryset = queryset.filter(**filters)
            return queryset
        except Exception as e:
            self.logger.error(f"Erro ao buscar {self.model.__name__} com filtros {filters}: {str(e)}")
            raise
    
    @transaction.atomic
    def create(self, validated_data: Dict[str, Any]) -> models.Model:
        """
        Cria um novo objeto.
        
        Args:
            validated_data: Dados validados para criação
            
        Returns:
            Objeto criado
            
        Raises:
            ValidationError: Se os dados não forem válidos
        """
        try:
            # Validação customizada antes da criação
            self.validate_create_data(validated_data)
            
            # Processamento pré-criação
            validated_data = self.pre_create(validated_data)
            
            # Criação do objeto
            instance = self.model.objects.create(**validated_data)
            
            # Processamento pós-criação
            instance = self.post_create(instance, validated_data)
            
            self.logger.info(f"{self.model.__name__} criado com ID {instance.id}")
            return instance
            
        except ValidationError:
            raise
        except Exception as e:
            self.logger.error(f"Erro ao criar {self.model.__name__}: {str(e)}")
            raise
    
    @transaction.atomic
    def update(self, instance: models.Model, validated_data: Dict[str, Any]) -> models.Model:
        """
        Atualiza um objeto existente.
        
        Args:
            instance: Instância a ser atualizada
            validated_data: Dados validados para atualização
            
        Returns:
            Objeto atualizado
            
        Raises:
            ValidationError: Se os dados não forem válidos
        """
        try:
            # Validação customizada antes da atualização
            self.validate_update_data(instance, validated_data)
            
            # Processamento pré-atualização
            validated_data = self.pre_update(instance, validated_data)
            
            # Atualização dos campos
            for field, value in validated_data.items():
                setattr(instance, field, value)
            
            instance.save()
            
            # Processamento pós-atualização
            instance = self.post_update(instance, validated_data)
            
            self.logger.info(f"{self.model.__name__} com ID {instance.id} atualizado")
            return instance
            
        except ValidationError:
            raise
        except Exception as e:
            self.logger.error(f"Erro ao atualizar {self.model.__name__} ID {instance.id}: {str(e)}")
            raise
    
    @transaction.atomic
    def delete(self, instance: models.Model) -> bool:
        """
        Deleta um objeto.
        
        Args:
            instance: Instância a ser deletada
            
        Returns:
            True se deletado com sucesso
        """
        try:
            # Validação antes da deleção
            self.validate_delete(instance)
            
            # Processamento pré-deleção
            self.pre_delete(instance)
            
            instance_id = instance.id
            instance.delete()
            
            # Processamento pós-deleção
            self.post_delete(instance_id)
            
            self.logger.info(f"{self.model.__name__} com ID {instance_id} deletado")
            return True
            
        except Exception as e:
            self.logger.error(f"Erro ao deletar {self.model.__name__} ID {instance.id}: {str(e)}")
            raise
    
    # Métodos de validação (podem ser sobrescritos)
    def validate_create_data(self, validated_data: Dict[str, Any]) -> None:
        """
        Validação customizada para criação.
        Pode ser sobrescrito nas classes filhas.
        """
        pass
    
    def validate_update_data(self, instance: models.Model, validated_data: Dict[str, Any]) -> None:
        """
        Validação customizada para atualização.
        Pode ser sobrescrito nas classes filhas.
        """
        pass
    
    def validate_delete(self, instance: models.Model) -> None:
        """
        Validação customizada para deleção.
        Pode ser sobrescrito nas classes filhas.
        """
        pass
    
    # Métodos de hook (podem ser sobrescritos)
    def pre_create(self, validated_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Processamento antes da criação.
        Pode ser sobrescrito nas classes filhas.
        """
        return validated_data
    
    def post_create(self, instance: models.Model, validated_data: Dict[str, Any]) -> models.Model:
        """
        Processamento após a criação.
        Pode ser sobrescrito nas classes filhas.
        """
        return instance
    
    def pre_update(self, instance: models.Model, validated_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Processamento antes da atualização.
        Pode ser sobrescrito nas classes filhas.
        """
        return validated_data
    
    def post_update(self, instance: models.Model, validated_data: Dict[str, Any]) -> models.Model:
        """
        Processamento após a atualização.
        Pode ser sobrescrito nas classes filhas.
        """
        return instance
    
    def pre_delete(self, instance: models.Model) -> None:
        """
        Processamento antes da deleção.
        Pode ser sobrescrito nas classes filhas.
        """
        pass
    
    def post_delete(self, instance_id: int) -> None:
        """
        Processamento após a deleção.
        Pode ser sobrescrito nas classes filhas.
        """
        pass
    
    # Métodos utilitários
    def build_response(self, data: Any = None, message: str = None, 
                      status_code: int = status.HTTP_200_OK) -> Response:
        """
        Constrói uma resposta padronizada.
        
        Args:
            data: Dados da resposta
            message: Mensagem da resposta
            status_code: Código de status HTTP
            
        Returns:
            Response object
        """
        response_data = {}
        
        if data is not None:
            response_data['data'] = data
            
        if message:
            response_data['message'] = message
            
        return Response(response_data, status=status_code)
    
    def handle_exception(self, exception: Exception, context: str = None) -> Response:
        """
        Trata exceções de forma padronizada.
        
        Args:
            exception: Exceção capturada
            context: Contexto adicional para logging
            
        Returns:
            Response com erro padronizado
        """
        error_message = str(exception)
        
        if context:
            self.logger.error(f"Erro em {context}: {error_message}")
        else:
            self.logger.error(f"Erro: {error_message}")
        
        if isinstance(exception, ValidationError):
            return self.build_response(
                message="Dados inválidos",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        return self.build_response(
            message="Erro interno do servidor",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )