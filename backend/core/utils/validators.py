from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.utils.translation import gettext_lazy as _
from datetime import datetime, date
import re


class BaseValidator:
    """
    Classe base para validadores customizados.
    """
    message = 'Valor inválido'
    code = 'invalid'
    
    def __init__(self, message=None, code=None):
        if message is not None:
            self.message = message
        if code is not None:
            self.code = code
    
    def __call__(self, value):
        """
        Método principal de validação.
        """
        if not self.is_valid(value):
            raise ValidationError(self.message, code=self.code)
    
    def is_valid(self, value):
        """
        Implementar lógica de validação específica.
        """
        raise NotImplementedError('Subclasses devem implementar is_valid()')


class CPFValidator(BaseValidator):
    """
    Validador para CPF brasileiro.
    """
    message = 'CPF inválido'
    code = 'invalid_cpf'
    
    def is_valid(self, value):
        if not value:
            return True  # Campo opcional
        
        # Remove caracteres não numéricos
        cpf = re.sub(r'\D', '', str(value))
        
        # Verifica se tem 11 dígitos
        if len(cpf) != 11:
            return False
        
        # Verifica se não são todos iguais
        if cpf == cpf[0] * 11:
            return False
        
        # Calcula primeiro dígito verificador
        soma = sum(int(cpf[i]) * (10 - i) for i in range(9))
        resto = soma % 11
        digito1 = 0 if resto < 2 else 11 - resto
        
        # Calcula segundo dígito verificador
        soma = sum(int(cpf[i]) * (11 - i) for i in range(10))
        resto = soma % 11
        digito2 = 0 if resto < 2 else 11 - resto
        
        # Verifica se os dígitos estão corretos
        return cpf[9] == str(digito1) and cpf[10] == str(digito2)


class CNPJValidator(BaseValidator):
    """
    Validador para CNPJ brasileiro.
    """
    message = 'CNPJ inválido'
    code = 'invalid_cnpj'
    
    def is_valid(self, value):
        if not value:
            return True  # Campo opcional
        
        # Remove caracteres não numéricos
        cnpj = re.sub(r'\D', '', str(value))
        
        # Verifica se tem 14 dígitos
        if len(cnpj) != 14:
            return False
        
        # Verifica se não são todos iguais
        if cnpj == cnpj[0] * 14:
            return False
        
        # Calcula primeiro dígito verificador
        pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        soma = sum(int(cnpj[i]) * pesos1[i] for i in range(12))
        resto = soma % 11
        digito1 = 0 if resto < 2 else 11 - resto
        
        # Calcula segundo dígito verificador
        pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        soma = sum(int(cnpj[i]) * pesos2[i] for i in range(13))
        resto = soma % 11
        digito2 = 0 if resto < 2 else 11 - resto
        
        # Verifica se os dígitos estão corretos
        return cnpj[12] == str(digito1) and cnpj[13] == str(digito2)


class PhoneValidator(BaseValidator):
    """
    Validador para telefones brasileiros.
    """
    message = 'Telefone inválido'
    code = 'invalid_phone'
    
    def is_valid(self, value):
        if not value:
            return True  # Campo opcional
        
        # Remove caracteres não numéricos
        phone = re.sub(r'\D', '', str(value))
        
        # Verifica se tem 10 ou 11 dígitos (com DDD)
        if len(phone) not in [10, 11]:
            return False
        
        # Verifica se o DDD é válido (11-99)
        ddd = int(phone[:2])
        if ddd < 11 or ddd > 99:
            return False
        
        # Para celular (11 dígitos), o terceiro dígito deve ser 9
        if len(phone) == 11 and phone[2] != '9':
            return False
        
        return True


class CEPValidator(BaseValidator):
    """
    Validador para CEP brasileiro.
    """
    message = 'CEP inválido'
    code = 'invalid_cep'
    
    def is_valid(self, value):
        if not value:
            return True  # Campo opcional
        
        # Remove caracteres não numéricos
        cep = re.sub(r'\D', '', str(value))
        
        # Verifica se tem 8 dígitos
        return len(cep) == 8 and cep.isdigit()


class DateRangeValidator(BaseValidator):
    """
    Validador para verificar se uma data está dentro de um intervalo.
    """
    message = 'Data fora do intervalo permitido'
    code = 'date_out_of_range'
    
    def __init__(self, min_date=None, max_date=None, **kwargs):
        super().__init__(**kwargs)
        self.min_date = min_date
        self.max_date = max_date
    
    def is_valid(self, value):
        if not value:
            return True
        
        if isinstance(value, str):
            try:
                value = datetime.strptime(value, '%Y-%m-%d').date()
            except ValueError:
                return False
        
        if isinstance(value, datetime):
            value = value.date()
        
        if not isinstance(value, date):
            return False
        
        if self.min_date and value < self.min_date:
            return False
        
        if self.max_date and value > self.max_date:
            return False
        
        return True


class PositiveValueValidator(BaseValidator):
    """
    Validador para valores positivos.
    """
    message = 'Valor deve ser positivo'
    code = 'negative_value'
    
    def __init__(self, allow_zero=False, **kwargs):
        super().__init__(**kwargs)
        self.allow_zero = allow_zero
    
    def is_valid(self, value):
        if value is None:
            return True
        
        try:
            num_value = float(value)
            return num_value > 0 or (self.allow_zero and num_value == 0)
        except (ValueError, TypeError):
            return False


class FileExtensionValidator(BaseValidator):
    """
    Validador para extensões de arquivo.
    """
    message = 'Extensão de arquivo não permitida'
    code = 'invalid_extension'
    
    def __init__(self, allowed_extensions, **kwargs):
        super().__init__(**kwargs)
        self.allowed_extensions = [ext.lower() for ext in allowed_extensions]
    
    def is_valid(self, value):
        if not value:
            return True
        
        if hasattr(value, 'name'):
            filename = value.name
        else:
            filename = str(value)
        
        extension = filename.split('.')[-1].lower() if '.' in filename else ''
        return extension in self.allowed_extensions


class FileSizeValidator(BaseValidator):
    """
    Validador para tamanho de arquivo.
    """
    message = 'Arquivo muito grande'
    code = 'file_too_large'
    
    def __init__(self, max_size_mb, **kwargs):
        super().__init__(**kwargs)
        self.max_size_bytes = max_size_mb * 1024 * 1024
    
    def is_valid(self, value):
        if not value:
            return True
        
        if hasattr(value, 'size'):
            return value.size <= self.max_size_bytes
        
        return True


class PasswordStrengthValidator(BaseValidator):
    """
    Validador para força de senha.
    """
    message = 'Senha não atende aos critérios de segurança'
    code = 'weak_password'
    
    def __init__(self, min_length=8, require_uppercase=True, 
                 require_lowercase=True, require_digits=True, 
                 require_special=True, **kwargs):
        super().__init__(**kwargs)
        self.min_length = min_length
        self.require_uppercase = require_uppercase
        self.require_lowercase = require_lowercase
        self.require_digits = require_digits
        self.require_special = require_special
    
    def is_valid(self, value):
        if not value:
            return True
        
        password = str(value)
        
        # Verifica comprimento mínimo
        if len(password) < self.min_length:
            return False
        
        # Verifica maiúscula
        if self.require_uppercase and not re.search(r'[A-Z]', password):
            return False
        
        # Verifica minúscula
        if self.require_lowercase and not re.search(r'[a-z]', password):
            return False
        
        # Verifica dígitos
        if self.require_digits and not re.search(r'\d', password):
            return False
        
        # Verifica caracteres especiais
        if self.require_special and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            return False
        
        return True


# Validadores específicos do domínio SGO

class ObraStatusValidator(BaseValidator):
    """
    Validador para status de obra.
    """
    message = 'Status de obra inválido'
    code = 'invalid_obra_status'
    
    VALID_STATUSES = ['planejamento', 'em_andamento', 'pausada', 'concluida', 'cancelada']
    
    def is_valid(self, value):
        return value in self.VALID_STATUSES


class TipoPagamentoValidator(BaseValidator):
    """
    Validador para tipo de pagamento.
    """
    message = 'Tipo de pagamento inválido'
    code = 'invalid_tipo_pagamento'
    
    VALID_TYPES = ['diaria', 'mensal', 'por_obra']
    
    def is_valid(self, value):
        return value in self.VALID_TYPES


class StatusCompraValidator(BaseValidator):
    """
    Validador para status de compra.
    """
    message = 'Status de compra inválido'
    code = 'invalid_compra_status'
    
    VALID_STATUSES = ['pendente', 'aprovada', 'em_andamento', 'entregue', 'cancelada']
    
    def is_valid(self, value):
        return value in self.VALID_STATUSES


# Instâncias pré-configuradas dos validadores mais comuns
cpf_validator = CPFValidator()
cnpj_validator = CNPJValidator()
phone_validator = PhoneValidator()
cep_validator = CEPValidator()
positive_validator = PositiveValueValidator()
positive_or_zero_validator = PositiveValueValidator(allow_zero=True)

# Validadores de arquivo comuns
image_validator = FileExtensionValidator(['jpg', 'jpeg', 'png', 'gif', 'bmp'])
document_validator = FileExtensionValidator(['pdf', 'doc', 'docx', 'txt'])
image_size_validator = FileSizeValidator(5)  # 5MB
document_size_validator = FileSizeValidator(10)  # 10MB

# Validadores de domínio
obra_status_validator = ObraStatusValidator()
tipo_pagamento_validator = TipoPagamentoValidator()
status_compra_validator = StatusCompraValidator()

# Validadores regex comuns
alphanumeric_validator = RegexValidator(
    regex=r'^[a-zA-Z0-9]+$',
    message='Apenas letras e números são permitidos',
    code='invalid_alphanumeric'
)

slug_validator = RegexValidator(
    regex=r'^[-a-zA-Z0-9_]+$',
    message='Apenas letras, números, hífens e underscores são permitidos',
    code='invalid_slug'
)