from django.utils.translation import gettext_lazy as _


# Status de Obra
class ObraStatus:
    PLANEJAMENTO = 'planejamento'
    EM_ANDAMENTO = 'em_andamento'
    PAUSADA = 'pausada'
    CONCLUIDA = 'concluida'
    CANCELADA = 'cancelada'
    
    CHOICES = [
        (PLANEJAMENTO, _('Planejamento')),
        (EM_ANDAMENTO, _('Em Andamento')),
        (PAUSADA, _('Pausada')),
        (CONCLUIDA, _('Concluída')),
        (CANCELADA, _('Cancelada')),
    ]
    
    @classmethod
    def get_display_name(cls, status):
        """Retorna o nome de exibição do status."""
        status_dict = dict(cls.CHOICES)
        return status_dict.get(status, status)
    
    @classmethod
    def get_valid_statuses(cls):
        """Retorna lista de status válidos."""
        return [choice[0] for choice in cls.CHOICES]


# Tipos de Pagamento
class TipoPagamento:
    DIARIA = 'diaria'
    MENSAL = 'mensal'
    POR_OBRA = 'por_obra'
    
    CHOICES = [
        (DIARIA, _('Diária')),
        (MENSAL, _('Mensal')),
        (POR_OBRA, _('Por Obra')),
    ]
    
    @classmethod
    def get_display_name(cls, tipo):
        """Retorna o nome de exibição do tipo."""
        tipo_dict = dict(cls.CHOICES)
        return tipo_dict.get(tipo, tipo)
    
    @classmethod
    def get_valid_types(cls):
        """Retorna lista de tipos válidos."""
        return [choice[0] for choice in cls.CHOICES]


# Status de Compra
class CompraStatus:
    PENDENTE = 'pendente'
    APROVADA = 'aprovada'
    EM_ANDAMENTO = 'em_andamento'
    ENTREGUE = 'entregue'
    CANCELADA = 'cancelada'
    
    CHOICES = [
        (PENDENTE, _('Pendente')),
        (APROVADA, _('Aprovada')),
        (EM_ANDAMENTO, _('Em Andamento')),
        (ENTREGUE, _('Entregue')),
        (CANCELADA, _('Cancelada')),
    ]
    
    @classmethod
    def get_display_name(cls, status):
        """Retorna o nome de exibição do status."""
        status_dict = dict(cls.CHOICES)
        return status_dict.get(status, status)
    
    @classmethod
    def get_valid_statuses(cls):
        """Retorna lista de status válidos."""
        return [choice[0] for choice in cls.CHOICES]


# Status de Funcionário
class FuncionarioStatus:
    ATIVO = 'ativo'
    INATIVO = 'inativo'
    AFASTADO = 'afastado'
    DEMITIDO = 'demitido'
    
    CHOICES = [
        (ATIVO, _('Ativo')),
        (INATIVO, _('Inativo')),
        (AFASTADO, _('Afastado')),
        (DEMITIDO, _('Demitido')),
    ]
    
    @classmethod
    def get_display_name(cls, status):
        """Retorna o nome de exibição do status."""
        status_dict = dict(cls.CHOICES)
        return status_dict.get(status, status)
    
    @classmethod
    def get_valid_statuses(cls):
        """Retorna lista de status válidos."""
        return [choice[0] for choice in cls.CHOICES]


# Tipos de Usuário
class TipoUsuario:
    ADMIN = 'admin'
    GERENTE = 'gerente'
    SUPERVISOR = 'supervisor'
    FUNCIONARIO = 'funcionario'
    
    CHOICES = [
        (ADMIN, _('Administrador')),
        (GERENTE, _('Gerente')),
        (SUPERVISOR, _('Supervisor')),
        (FUNCIONARIO, _('Funcionário')),
    ]
    
    @classmethod
    def get_display_name(cls, tipo):
        """Retorna o nome de exibição do tipo."""
        tipo_dict = dict(cls.CHOICES)
        return tipo_dict.get(tipo, tipo)
    
    @classmethod
    def get_valid_types(cls):
        """Retorna lista de tipos válidos."""
        return [choice[0] for choice in cls.CHOICES]


# Prioridades
class Prioridade:
    BAIXA = 'baixa'
    MEDIA = 'media'
    ALTA = 'alta'
    URGENTE = 'urgente'
    
    CHOICES = [
        (BAIXA, _('Baixa')),
        (MEDIA, _('Média')),
        (ALTA, _('Alta')),
        (URGENTE, _('Urgente')),
    ]
    
    @classmethod
    def get_display_name(cls, prioridade):
        """Retorna o nome de exibição da prioridade."""
        prioridade_dict = dict(cls.CHOICES)
        return prioridade_dict.get(prioridade, prioridade)
    
    @classmethod
    def get_valid_priorities(cls):
        """Retorna lista de prioridades válidas."""
        return [choice[0] for choice in cls.CHOICES]


# Unidades de Medida
class UnidadeMedida:
    UNIDADE = 'un'
    METRO = 'm'
    METRO_QUADRADO = 'm2'
    METRO_CUBICO = 'm3'
    QUILOGRAMA = 'kg'
    TONELADA = 't'
    LITRO = 'l'
    SACO = 'saco'
    CAIXA = 'cx'
    PACOTE = 'pct'
    
    CHOICES = [
        (UNIDADE, _('Unidade')),
        (METRO, _('Metro')),
        (METRO_QUADRADO, _('Metro Quadrado')),
        (METRO_CUBICO, _('Metro Cúbico')),
        (QUILOGRAMA, _('Quilograma')),
        (TONELADA, _('Tonelada')),
        (LITRO, _('Litro')),
        (SACO, _('Saco')),
        (CAIXA, _('Caixa')),
        (PACOTE, _('Pacote')),
    ]
    
    @classmethod
    def get_display_name(cls, unidade):
        """Retorna o nome de exibição da unidade."""
        unidade_dict = dict(cls.CHOICES)
        return unidade_dict.get(unidade, unidade)
    
    @classmethod
    def get_valid_units(cls):
        """Retorna lista de unidades válidas."""
        return [choice[0] for choice in cls.CHOICES]


# Configurações do Sistema
class SystemConfig:
    # Tamanhos de arquivo
    MAX_FILE_SIZE_MB = 10
    MAX_IMAGE_SIZE_MB = 5
    
    # Extensões permitidas
    ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'bmp']
    ALLOWED_DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx']
    
    # Paginação
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100
    
    # Cache
    CACHE_TIMEOUT_SHORT = 300  # 5 minutos
    CACHE_TIMEOUT_MEDIUM = 1800  # 30 minutos
    CACHE_TIMEOUT_LONG = 3600  # 1 hora
    
    # Formatos de data
    DATE_FORMAT = '%d/%m/%Y'
    DATETIME_FORMAT = '%d/%m/%Y %H:%M'
    TIME_FORMAT = '%H:%M'
    
    # Configurações de relatório
    REPORT_MAX_RECORDS = 10000
    REPORT_TIMEOUT_SECONDS = 300


# Mensagens do Sistema
class SystemMessages:
    # Sucesso
    CREATED_SUCCESS = _('Registro criado com sucesso')
    UPDATED_SUCCESS = _('Registro atualizado com sucesso')
    DELETED_SUCCESS = _('Registro excluído com sucesso')
    
    # Erros
    NOT_FOUND = _('Registro não encontrado')
    PERMISSION_DENIED = _('Acesso negado')
    VALIDATION_ERROR = _('Dados inválidos')
    INTERNAL_ERROR = _('Erro interno do sistema')
    
    # Avisos
    CONFIRM_DELETE = _('Tem certeza que deseja excluir este registro?')
    UNSAVED_CHANGES = _('Existem alterações não salvas')
    
    # Informações
    NO_RECORDS_FOUND = _('Nenhum registro encontrado')
    LOADING = _('Carregando...')
    PROCESSING = _('Processando...')


# Códigos de Erro
class ErrorCodes:
    # Validação
    VALIDATION_ERROR = 'VALIDATION_ERROR'
    REQUIRED_FIELD = 'REQUIRED_FIELD'
    INVALID_FORMAT = 'INVALID_FORMAT'
    DUPLICATE_VALUE = 'DUPLICATE_VALUE'
    
    # Negócio
    BUSINESS_RULE_ERROR = 'BUSINESS_RULE_ERROR'
    INSUFFICIENT_PERMISSION = 'INSUFFICIENT_PERMISSION'
    RESOURCE_CONFLICT = 'RESOURCE_CONFLICT'
    INVALID_STATE = 'INVALID_STATE'
    
    # Sistema
    INTERNAL_ERROR = 'INTERNAL_ERROR'
    DATABASE_ERROR = 'DATABASE_ERROR'
    EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR'
    TIMEOUT_ERROR = 'TIMEOUT_ERROR'


# Permissões
class Permissions:
    # Obras
    VIEW_OBRA = 'core.view_obra'
    ADD_OBRA = 'core.add_obra'
    CHANGE_OBRA = 'core.change_obra'
    DELETE_OBRA = 'core.delete_obra'
    
    # Funcionários
    VIEW_FUNCIONARIO = 'core.view_funcionario'
    ADD_FUNCIONARIO = 'core.add_funcionario'
    CHANGE_FUNCIONARIO = 'core.change_funcionario'
    DELETE_FUNCIONARIO = 'core.delete_funcionario'
    
    # Locações
    VIEW_LOCACAO = 'core.view_locacao_obras_equipes'
    ADD_LOCACAO = 'core.add_locacao_obras_equipes'
    CHANGE_LOCACAO = 'core.change_locacao_obras_equipes'
    DELETE_LOCACAO = 'core.delete_locacao_obras_equipes'
    
    # Equipes
    VIEW_EQUIPE = 'core.view_equipe'
    ADD_EQUIPE = 'core.add_equipe'
    CHANGE_EQUIPE = 'core.change_equipe'
    DELETE_EQUIPE = 'core.delete_equipe'
    
    # Usuários
    VIEW_USUARIO = 'core.view_usuario'
    ADD_USUARIO = 'core.add_usuario'
    CHANGE_USUARIO = 'core.change_usuario'
    DELETE_USUARIO = 'core.delete_usuario'
    
    # Relatórios
    VIEW_REPORTS = 'core.view_reports'
    EXPORT_REPORTS = 'core.export_reports'
    
    # Administração
    ADMIN_ACCESS = 'core.admin_access'
    SYSTEM_CONFIG = 'core.system_config'


# URLs de API
class APIEndpoints:
    # Base
    API_BASE = '/api/v1/'
    
    # Autenticação
    LOGIN = 'auth/login/'
    LOGOUT = 'auth/logout/'
    REFRESH_TOKEN = 'auth/refresh/'
    
    # Recursos
    OBRAS = 'obras/'
    FUNCIONARIOS = 'funcionarios/'
    EQUIPES = 'equipes/'
    LOCACOES = 'locacoes/'
    USUARIOS = 'usuarios/'
    
    # Relatórios
    REPORTS = 'reports/'
    STATS = 'stats/'


# Configurações de Notificação
class NotificationTypes:
    INFO = 'info'
    SUCCESS = 'success'
    WARNING = 'warning'
    ERROR = 'error'
    
    CHOICES = [
        (INFO, _('Informação')),
        (SUCCESS, _('Sucesso')),
        (WARNING, _('Aviso')),
        (ERROR, _('Erro')),
    ]


# Configurações de Log
class LogLevels:
    DEBUG = 'DEBUG'
    INFO = 'INFO'
    WARNING = 'WARNING'
    ERROR = 'ERROR'
    CRITICAL = 'CRITICAL'


# Regex Patterns
class RegexPatterns:
    CPF = r'^\d{3}\.\d{3}\.\d{3}-\d{2}$'
    CNPJ = r'^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$'
    PHONE = r'^\(\d{2}\)\s\d{4,5}-\d{4}$'
    CEP = r'^\d{5}-\d{3}$'
    EMAIL = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    # Apenas números
    CPF_NUMBERS = r'^\d{11}$'
    CNPJ_NUMBERS = r'^\d{14}$'
    PHONE_NUMBERS = r'^\d{10,11}$'
    CEP_NUMBERS = r'^\d{8}$'