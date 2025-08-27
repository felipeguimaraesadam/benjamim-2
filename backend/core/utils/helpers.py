from django.http import JsonResponse
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from datetime import datetime, date
import json
import logging

logger = logging.getLogger(__name__)


def build_success_response(data=None, message=None, status_code=status.HTTP_200_OK, 
                          meta=None, pagination=None):
    """
    Constrói uma resposta de sucesso padronizada.
    
    Args:
        data: Dados da resposta
        message: Mensagem de sucesso
        status_code: Código de status HTTP
        meta: Metadados adicionais
        pagination: Informações de paginação
        
    Returns:
        Response: Resposta padronizada
    """
    response_data = {
        'success': True,
        'data': data,
    }
    
    if message:
        response_data['message'] = message
    
    if meta:
        response_data['meta'] = meta
    
    if pagination:
        response_data['pagination'] = pagination
    
    return Response(response_data, status=status_code)


def build_error_response(message, code=None, details=None, 
                        status_code=status.HTTP_400_BAD_REQUEST):
    """
    Constrói uma resposta de erro padronizada.
    
    Args:
        message: Mensagem de erro
        code: Código do erro
        details: Detalhes adicionais do erro
        status_code: Código de status HTTP
        
    Returns:
        Response: Resposta de erro padronizada
    """
    response_data = {
        'success': False,
        'error': {
            'message': message,
        }
    }
    
    if code:
        response_data['error']['code'] = code
    
    if details:
        response_data['error']['details'] = details
    
    return Response(response_data, status=status_code)


def paginate_queryset(queryset, page, page_size=20, max_page_size=100):
    """
    Pagina um queryset e retorna os dados paginados.
    
    Args:
        queryset: QuerySet a ser paginado
        page: Número da página
        page_size: Tamanho da página
        max_page_size: Tamanho máximo da página
        
    Returns:
        dict: Dados paginados com metadados
    """
    # Limita o tamanho da página
    if page_size > max_page_size:
        page_size = max_page_size
    
    paginator = Paginator(queryset, page_size)
    
    try:
        page_obj = paginator.page(page)
    except PageNotAnInteger:
        page_obj = paginator.page(1)
    except EmptyPage:
        page_obj = paginator.page(paginator.num_pages)
    
    return {
        'results': page_obj.object_list,
        'pagination': {
            'current_page': page_obj.number,
            'total_pages': paginator.num_pages,
            'total_items': paginator.count,
            'page_size': page_size,
            'has_next': page_obj.has_next(),
            'has_previous': page_obj.has_previous(),
            'next_page': page_obj.next_page_number() if page_obj.has_next() else None,
            'previous_page': page_obj.previous_page_number() if page_obj.has_previous() else None,
        }
    }


def build_search_query(search_term, search_fields):
    """
    Constrói uma query de busca para múltiplos campos.
    
    Args:
        search_term: Termo de busca
        search_fields: Lista de campos para buscar
        
    Returns:
        Q: Objeto Q para filtro
    """
    if not search_term or not search_fields:
        return Q()
    
    query = Q()
    for field in search_fields:
        query |= Q(**{f"{field}__icontains": search_term})
    
    return query


def parse_date_range(date_from, date_to):
    """
    Converte strings de data para objetos datetime.
    
    Args:
        date_from: Data inicial (string ou datetime)
        date_to: Data final (string ou datetime)
        
    Returns:
        tuple: (datetime_from, datetime_to)
    """
    def parse_date(date_value):
        if not date_value:
            return None
        
        if isinstance(date_value, (datetime, date)):
            return date_value
        
        # Tenta diferentes formatos de data
        formats = ['%Y-%m-%d', '%d/%m/%Y', '%Y-%m-%d %H:%M:%S']
        
        for fmt in formats:
            try:
                return datetime.strptime(str(date_value), fmt)
            except ValueError:
                continue
        
        raise ValueError(f"Formato de data inválido: {date_value}")
    
    return parse_date(date_from), parse_date(date_to)


def format_currency(value, currency='R$'):
    """
    Formata um valor monetário.
    
    Args:
        value: Valor numérico
        currency: Símbolo da moeda
        
    Returns:
        str: Valor formatado
    """
    if value is None:
        return f"{currency} 0,00"
    
    try:
        # Converte para float se necessário
        if isinstance(value, str):
            value = float(value.replace(',', '.'))
        
        # Formata com separadores brasileiros
        formatted = f"{value:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
        return f"{currency} {formatted}"
    
    except (ValueError, TypeError):
        return f"{currency} 0,00"


def format_phone(phone):
    """
    Formata um número de telefone brasileiro.
    
    Args:
        phone: Número de telefone
        
    Returns:
        str: Telefone formatado
    """
    if not phone:
        return ''
    
    # Remove caracteres não numéricos
    numbers = ''.join(filter(str.isdigit, str(phone)))
    
    if len(numbers) == 11:  # Celular com DDD
        return f"({numbers[:2]}) {numbers[2:7]}-{numbers[7:]}"
    elif len(numbers) == 10:  # Fixo com DDD
        return f"({numbers[:2]}) {numbers[2:6]}-{numbers[6:]}"
    else:
        return phone


def format_cpf(cpf):
    """
    Formata um CPF.
    
    Args:
        cpf: Número do CPF
        
    Returns:
        str: CPF formatado
    """
    if not cpf:
        return ''
    
    # Remove caracteres não numéricos
    numbers = ''.join(filter(str.isdigit, str(cpf)))
    
    if len(numbers) == 11:
        return f"{numbers[:3]}.{numbers[3:6]}.{numbers[6:9]}-{numbers[9:]}"
    else:
        return cpf


def format_cnpj(cnpj):
    """
    Formata um CNPJ.
    
    Args:
        cnpj: Número do CNPJ
        
    Returns:
        str: CNPJ formatado
    """
    if not cnpj:
        return ''
    
    # Remove caracteres não numéricos
    numbers = ''.join(filter(str.isdigit, str(cnpj)))
    
    if len(numbers) == 14:
        return f"{numbers[:2]}.{numbers[2:5]}.{numbers[5:8]}/{numbers[8:12]}-{numbers[12:]}"
    else:
        return cnpj


def format_cep(cep):
    """
    Formata um CEP.
    
    Args:
        cep: Número do CEP
        
    Returns:
        str: CEP formatado
    """
    if not cep:
        return ''
    
    # Remove caracteres não numéricos
    numbers = ''.join(filter(str.isdigit, str(cep)))
    
    if len(numbers) == 8:
        return f"{numbers[:5]}-{numbers[5:]}"
    else:
        return cep


def clean_numeric_string(value):
    """
    Remove caracteres não numéricos de uma string.
    
    Args:
        value: Valor a ser limpo
        
    Returns:
        str: String apenas com números
    """
    if not value:
        return ''
    
    return ''.join(filter(str.isdigit, str(value)))


def safe_int(value, default=0):
    """
    Converte um valor para inteiro de forma segura.
    
    Args:
        value: Valor a ser convertido
        default: Valor padrão se conversão falhar
        
    Returns:
        int: Valor convertido ou padrão
    """
    try:
        return int(value)
    except (ValueError, TypeError):
        return default


def safe_float(value, default=0.0):
    """
    Converte um valor para float de forma segura.
    
    Args:
        value: Valor a ser convertido
        default: Valor padrão se conversão falhar
        
    Returns:
        float: Valor convertido ou padrão
    """
    try:
        if isinstance(value, str):
            # Trata formato brasileiro (vírgula como decimal)
            value = value.replace(',', '.')
        return float(value)
    except (ValueError, TypeError):
        return default


def get_client_ip(request):
    """
    Obtém o IP do cliente da requisição.
    
    Args:
        request: Objeto de requisição Django
        
    Returns:
        str: Endereço IP do cliente
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def log_user_action(user, action, resource=None, details=None):
    """
    Registra uma ação do usuário no log.
    
    Args:
        user: Usuário que executou a ação
        action: Ação executada
        resource: Recurso afetado (opcional)
        details: Detalhes adicionais (opcional)
    """
    log_data = {
        'user': str(user),
        'action': action,
        'timestamp': timezone.now().isoformat(),
    }
    
    if resource:
        log_data['resource'] = resource
    
    if details:
        log_data['details'] = details
    
    logger.info(f"User action: {json.dumps(log_data)}")


def calculate_age(birth_date):
    """
    Calcula a idade baseada na data de nascimento.
    
    Args:
        birth_date: Data de nascimento
        
    Returns:
        int: Idade em anos
    """
    if not birth_date:
        return None
    
    today = date.today()
    
    if isinstance(birth_date, datetime):
        birth_date = birth_date.date()
    
    age = today.year - birth_date.year
    
    # Ajusta se ainda não fez aniversário este ano
    if today.month < birth_date.month or \
       (today.month == birth_date.month and today.day < birth_date.day):
        age -= 1
    
    return age


def generate_unique_filename(filename, prefix='', suffix=''):
    """
    Gera um nome de arquivo único.
    
    Args:
        filename: Nome original do arquivo
        prefix: Prefixo a ser adicionado
        suffix: Sufixo a ser adicionado
        
    Returns:
        str: Nome único do arquivo
    """
    import uuid
    import os
    
    name, ext = os.path.splitext(filename)
    timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
    unique_id = str(uuid.uuid4())[:8]
    
    parts = []
    if prefix:
        parts.append(prefix)
    
    parts.extend([name, timestamp, unique_id])
    
    if suffix:
        parts.append(suffix)
    
    return '_'.join(parts) + ext


def truncate_string(text, max_length=50, suffix='...'):
    """
    Trunca uma string se ela exceder o tamanho máximo.
    
    Args:
        text: Texto a ser truncado
        max_length: Tamanho máximo
        suffix: Sufixo para indicar truncamento
        
    Returns:
        str: Texto truncado
    """
    if not text:
        return ''
    
    text = str(text)
    
    if len(text) <= max_length:
        return text
    
    return text[:max_length - len(suffix)] + suffix


def is_valid_email(email):
    """
    Valida se um email tem formato válido.
    
    Args:
        email: Email a ser validado
        
    Returns:
        bool: True se válido, False caso contrário
    """
    import re
    
    if not email:
        return False
    
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def mask_sensitive_data(data, fields_to_mask=None):
    """
    Mascara dados sensíveis para logs.
    
    Args:
        data: Dados a serem mascarados
        fields_to_mask: Lista de campos a mascarar
        
    Returns:
        dict: Dados com campos sensíveis mascarados
    """
    if fields_to_mask is None:
        fields_to_mask = ['password', 'cpf', 'cnpj', 'email', 'phone']
    
    if not isinstance(data, dict):
        return data
    
    masked_data = data.copy()
    
    for field in fields_to_mask:
        if field in masked_data:
            value = str(masked_data[field])
            if len(value) > 4:
                masked_data[field] = value[:2] + '*' * (len(value) - 4) + value[-2:]
            else:
                masked_data[field] = '*' * len(value)
    
    return masked_data


def convert_to_timezone(dt, target_timezone='America/Sao_Paulo'):
    """
    Converte datetime para timezone específico.
    
    Args:
        dt: Datetime a ser convertido
        target_timezone: Timezone de destino
        
    Returns:
        datetime: Datetime convertido
    """
    import pytz
    
    if not dt:
        return None
    
    if timezone.is_naive(dt):
        dt = timezone.make_aware(dt)
    
    target_tz = pytz.timezone(target_timezone)
    return dt.astimezone(target_tz)