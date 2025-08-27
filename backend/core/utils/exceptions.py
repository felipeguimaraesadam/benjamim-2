from rest_framework import status
from rest_framework.views import exception_handler
from rest_framework.response import Response
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError
import logging

logger = logging.getLogger(__name__)


class SGOBaseException(Exception):
    """
    Exceção base para o sistema SGO.
    """
    default_message = "Erro interno do sistema"
    default_code = "SGO_ERROR"
    default_status = status.HTTP_500_INTERNAL_SERVER_ERROR
    
    def __init__(self, message=None, code=None, status_code=None, details=None):
        self.message = message or self.default_message
        self.code = code or self.default_code
        self.status_code = status_code or self.default_status
        self.details = details or {}
        super().__init__(self.message)


class ValidationException(SGOBaseException):
    """
    Exceção para erros de validação de dados.
    """
    default_message = "Dados inválidos"
    default_code = "VALIDATION_ERROR"
    default_status = status.HTTP_400_BAD_REQUEST


class BusinessRuleException(SGOBaseException):
    """
    Exceção para violações de regras de negócio.
    """
    default_message = "Regra de negócio violada"
    default_code = "BUSINESS_RULE_ERROR"
    default_status = status.HTTP_422_UNPROCESSABLE_ENTITY


class ResourceNotFoundException(SGOBaseException):
    """
    Exceção para recursos não encontrados.
    """
    default_message = "Recurso não encontrado"
    default_code = "RESOURCE_NOT_FOUND"
    default_status = status.HTTP_404_NOT_FOUND


class PermissionDeniedException(SGOBaseException):
    """
    Exceção para acesso negado.
    """
    default_message = "Acesso negado"
    default_code = "PERMISSION_DENIED"
    default_status = status.HTTP_403_FORBIDDEN


class ConflictException(SGOBaseException):
    """
    Exceção para conflitos de dados.
    """
    default_message = "Conflito de dados"
    default_code = "CONFLICT_ERROR"
    default_status = status.HTTP_409_CONFLICT


class ExternalServiceException(SGOBaseException):
    """
    Exceção para erros em serviços externos.
    """
    default_message = "Erro em serviço externo"
    default_code = "EXTERNAL_SERVICE_ERROR"
    default_status = status.HTTP_502_BAD_GATEWAY


# Exceções específicas do domínio SGO

class ObraException(SGOBaseException):
    """
    Exceções relacionadas a obras.
    """
    default_message = "Erro relacionado à obra"
    default_code = "OBRA_ERROR"


class LocacaoException(SGOBaseException):
    """
    Exceções relacionadas a locações.
    """
    default_message = "Erro relacionado à locação"
    default_code = "LOCACAO_ERROR"


class FuncionarioException(SGOBaseException):
    """
    Exceções relacionadas a funcionários.
    """
    default_message = "Erro relacionado ao funcionário"
    default_code = "FUNCIONARIO_ERROR"


class CompraException(SGOBaseException):
    """
    Exceções relacionadas a compras.
    """
    default_message = "Erro relacionado à compra"
    default_code = "COMPRA_ERROR"


class EquipeException(SGOBaseException):
    """
    Exceções relacionadas a equipes.
    """
    default_message = "Erro relacionado à equipe"
    default_code = "EQUIPE_ERROR"


# Exceções específicas de regras de negócio

class LocacaoConflictException(LocacaoException):
    """
    Exceção para conflitos de locação (funcionário já alocado, etc.).
    """
    default_message = "Conflito na locação"
    default_code = "LOCACAO_CONFLICT"
    default_status = status.HTTP_409_CONFLICT


class ObraStatusException(ObraException):
    """
    Exceção para operações inválidas baseadas no status da obra.
    """
    default_message = "Operação inválida para o status atual da obra"
    default_code = "OBRA_STATUS_ERROR"
    default_status = status.HTTP_422_UNPROCESSABLE_ENTITY


class FuncionarioIndisponivelException(FuncionarioException):
    """
    Exceção para funcionário indisponível para locação.
    """
    default_message = "Funcionário indisponível para locação"
    default_code = "FUNCIONARIO_INDISPONIVEL"
    default_status = status.HTTP_409_CONFLICT


class CompraStatusException(CompraException):
    """
    Exceção para operações inválidas baseadas no status da compra.
    """
    default_message = "Operação inválida para o status atual da compra"
    default_code = "COMPRA_STATUS_ERROR"
    default_status = status.HTTP_422_UNPROCESSABLE_ENTITY


# Handler customizado para exceções

def custom_exception_handler(exc, context):
    """
    Handler customizado para tratar exceções do sistema SGO.
    
    Args:
        exc: Exceção capturada
        context: Contexto da requisição
        
    Returns:
        Response com erro formatado
    """
    # Log da exceção
    logger.error(f"Exceção capturada: {type(exc).__name__}: {str(exc)}")
    
    # Trata exceções customizadas do SGO
    if isinstance(exc, SGOBaseException):
        response_data = {
            'error': {
                'message': exc.message,
                'code': exc.code,
                'details': exc.details
            }
        }
        return Response(response_data, status=exc.status_code)
    
    # Trata exceções de validação do Django
    if isinstance(exc, DjangoValidationError):
        response_data = {
            'error': {
                'message': 'Dados inválidos',
                'code': 'VALIDATION_ERROR',
                'details': exc.message_dict if hasattr(exc, 'message_dict') else {'non_field_errors': exc.messages}
            }
        }
        return Response(response_data, status=status.HTTP_400_BAD_REQUEST)
    
    # Trata erros de integridade do banco
    if isinstance(exc, IntegrityError):
        response_data = {
            'error': {
                'message': 'Erro de integridade dos dados',
                'code': 'INTEGRITY_ERROR',
                'details': {'database_error': str(exc)}
            }
        }
        return Response(response_data, status=status.HTTP_409_CONFLICT)
    
    # Delega para o handler padrão do DRF
    response = exception_handler(exc, context)
    
    if response is not None:
        # Formata a resposta padrão do DRF
        custom_response_data = {
            'error': {
                'message': 'Erro na requisição',
                'code': 'REQUEST_ERROR',
                'details': response.data
            }
        }
        response.data = custom_response_data
    
    return response


# Utilitários para lançar exceções comuns

def raise_validation_error(message, details=None):
    """
    Utilitário para lançar erro de validação.
    """
    raise ValidationException(message=message, details=details)


def raise_business_rule_error(message, details=None):
    """
    Utilitário para lançar erro de regra de negócio.
    """
    raise BusinessRuleException(message=message, details=details)


def raise_not_found_error(resource_name, resource_id=None):
    """
    Utilitário para lançar erro de recurso não encontrado.
    """
    message = f"{resource_name} não encontrado"
    details = {'resource': resource_name}
    if resource_id:
        details['id'] = resource_id
        message += f" (ID: {resource_id})"
    
    raise ResourceNotFoundException(message=message, details=details)


def raise_permission_denied(action=None, resource=None):
    """
    Utilitário para lançar erro de permissão negada.
    """
    message = "Acesso negado"
    details = {}
    
    if action:
        message += f" para {action}"
        details['action'] = action
    
    if resource:
        message += f" em {resource}"
        details['resource'] = resource
    
    raise PermissionDeniedException(message=message, details=details)


def raise_conflict_error(message, details=None):
    """
    Utilitário para lançar erro de conflito.
    """
    raise ConflictException(message=message, details=details)