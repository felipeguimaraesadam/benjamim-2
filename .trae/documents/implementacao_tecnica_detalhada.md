# Implementação Técnica Detalhada - Refatoração Backend SGO

## 1. Classes Base e Estrutura Fundamental

### 1.1 BaseService

```python
# core/services/base.py
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Union
from django.db import transaction
from django.core.exceptions import ValidationError
from core.utils.exceptions import ServiceError, ValidationError as CustomValidationError
from core.utils.validators import BaseValidator
import logging

logger = logging.getLogger(__name__)

class BaseService(ABC):
    """
    Classe base para todos os services do sistema.
    Fornece funcionalidades comuns como validação, logging e transações.
    """
    
    def __init__(self):
        self.validator = self.get_validator()
        self.logger = logger
    
    @abstractmethod
    def get_validator(self) -> Optional[BaseValidator]:
        """Retorna o validador específico do service."""
        pass
    
    def validate_data(self, data: Dict[str, Any], operation: str = 'create') -> Dict[str, Any]:
        """Valida dados usando o validador do service."""
        if self.validator:
            return self.validator.validate(data, operation)
        return data
    
    @transaction.atomic
    def execute_with_transaction(self, func, *args, **kwargs):
        """Executa função dentro de uma transação."""
        try:
            return func(*args, **kwargs)
        except Exception as e:
            self.logger.error(f"Erro na transação: {str(e)}")
            raise ServiceError(f"Erro interno do serviço: {str(e)}")
    
    def log_operation(self, operation: str, data: Dict[str, Any], result: Any = None):
        """Log estruturado de operações."""
        self.logger.info(f"Operação: {operation}", extra={
            'operation': operation,
            'data': data,
            'result_type': type(result).__name__ if result else None,
            'service': self.__class__.__name__
        })
```

### 1.2 BaseManager

```python
# core/managers/base.py
from django.db import models
from django.db.models import QuerySet
from typing import Dict, Any, List, Optional
from core.utils.exceptions import ManagerError

class BaseManager(models.Manager):
    """
    Manager base com funcionalidades comuns para queries complexas.
    """
    
    def get_filtered_queryset(self, filters: Dict[str, Any]) -> QuerySet:
        """Aplica filtros dinâmicos ao queryset."""
        queryset = self.get_queryset()
        
        for field, value in filters.items():
            if value is not None:
                if hasattr(self.model, field):
                    queryset = queryset.filter(**{field: value})
                else:
                    # Suporte para filtros complexos (ex: data__gte)
                    queryset = queryset.filter(**{field: value})
        
        return queryset
    
    def get_with_related(self, pk: int, select_related: List[str] = None, 
                        prefetch_related: List[str] = None):
        """Busca objeto com relacionamentos otimizados."""
        queryset = self.get_queryset()
        
        if select_related:
            queryset = queryset.select_related(*select_related)
        
        if prefetch_related:
            queryset = queryset.prefetch_related(*prefetch_related)
        
        try:
            return queryset.get(pk=pk)
        except self.model.DoesNotExist:
            raise ManagerError(f"{self.model.__name__} com ID {pk} não encontrado")
    
    def bulk_create_optimized(self, objects: List[models.Model], 
                             batch_size: int = 1000) -> List[models.Model]:
        """Criação em lote otimizada."""
        return self.bulk_create(objects, batch_size=batch_size)
    
    def get_aggregated_data(self, aggregations: Dict[str, Any], 
                           filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Executa agregações com filtros opcionais."""
        queryset = self.get_queryset()
        
        if filters:
            queryset = self.get_filtered_queryset(filters)
        
        return queryset.aggregate(**aggregations)
```

### 1.3 BaseViewSet

```python
# core/views/base.py
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from core.utils.exceptions import ServiceError, ValidationError
from core.utils.responses import StandardResponse
import logging

logger = logging.getLogger(__name__)

class BaseViewSet(viewsets.ModelViewSet):
    """
    ViewSet base com funcionalidades comuns e tratamento de erros padronizado.
    """
    
    service_class = None  # Deve ser definido nas subclasses
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.service_class:
            self.service = self.service_class()
    
    def handle_service_operation(self, operation_func, *args, **kwargs):
        """Wrapper para operações de service com tratamento de erro."""
        try:
            result = operation_func(*args, **kwargs)
            return StandardResponse.success(result)
        except ValidationError as e:
            logger.warning(f"Erro de validação: {str(e)}")
            return StandardResponse.validation_error(str(e))
        except ServiceError as e:
            logger.error(f"Erro de serviço: {str(e)}")
            return StandardResponse.service_error(str(e))
        except Exception as e:
            logger.error(f"Erro inesperado: {str(e)}")
            return StandardResponse.internal_error()
    
    def create(self, request, *args, **kwargs):
        """Criação usando service."""
        if not self.service:
            return super().create(request, *args, **kwargs)
        
        def create_operation():
            return self.service.create(request.data, request.FILES)
        
        response = self.handle_service_operation(create_operation)
        return Response(response.data, status=response.status_code)
    
    def update(self, request, *args, **kwargs):
        """Atualização usando service."""
        if not self.service:
            return super().update(request, *args, **kwargs)
        
        def update_operation():
            return self.service.update(kwargs['pk'], request.data, request.FILES)
        
        response = self.handle_service_operation(update_operation)
        return Response(response.data, status=response.status_code)
```

## 2. Implementação Específica dos Services

### 2.1 CompraService

```python
# core/services/compra_service.py
from typing import Dict, List, Any, Optional
from decimal import Decimal
from django.db import transaction
from core.models import Compra, ParcelaCompra, AnexoCompra
from core.services.base import BaseService
from core.services.anexo_service import AnexoService
from core.utils.validators import CompraValidator
from core.utils.exceptions import CompraServiceError
from core.managers.compra_manager import CompraManager
import json

class CompraService(BaseService):
    """
    Service responsável pela lógica de negócio relacionada a compras.
    """
    
    def __init__(self):
        super().__init__()
        self.anexo_service = AnexoService()
        self.compra_manager = CompraManager()
    
    def get_validator(self):
        return CompraValidator()
    
    @transaction.atomic
    def criar_compra(self, dados_compra: Dict[str, Any], 
                    anexos: List = None) -> Compra:
        """
        Cria uma nova compra com validações e processamento de anexos.
        """
        # Validar dados
        dados_validados = self.validate_data(dados_compra, 'create')
        
        # Processar itens se fornecidos como JSON string
        if 'itens' in dados_validados and isinstance(dados_validados['itens'], str):
            try:
                dados_validados['itens'] = json.loads(dados_validados['itens'])
            except json.JSONDecodeError:
                raise CompraServiceError("Formato inválido para itens da compra")
        
        # Criar compra
        compra = Compra.objects.create(**dados_validados)
        
        # Processar anexos se fornecidos
        if anexos:
            self._processar_anexos_compra(compra, anexos)
        
        # Gerar parcelas se necessário
        if compra.forma_pagamento == 'parcelado':
            self._gerar_parcelas(compra)
        
        self.log_operation('criar_compra', dados_validados, compra)
        return compra
    
    @transaction.atomic
    def atualizar_compra(self, compra_id: int, dados: Dict[str, Any], 
                        anexos: List = None) -> Compra:
        """
        Atualiza uma compra existente.
        """
        compra = self.compra_manager.get_with_related(
            compra_id, 
            select_related=['obra', 'fornecedor'],
            prefetch_related=['anexos', 'parcelas']
        )
        
        # Validar dados
        dados_validados = self.validate_data(dados, 'update')
        
        # Atualizar campos
        for campo, valor in dados_validados.items():
            if campo != 'itens':
                setattr(compra, campo, valor)
            else:
                # Processar itens JSON
                if isinstance(valor, str):
                    compra.itens = json.loads(valor)
                else:
                    compra.itens = valor
        
        compra.save()
        
        # Processar novos anexos
        if anexos:
            self._processar_anexos_compra(compra, anexos)
        
        # Recalcular parcelas se forma de pagamento mudou
        if 'forma_pagamento' in dados_validados:
            self._recalcular_parcelas(compra)
        
        self.log_operation('atualizar_compra', dados_validados, compra)
        return compra
    
    def aprovar_orcamento(self, compra_id: int, aprovado_por: int) -> Compra:
        """
        Aprova um orçamento, convertendo-o em compra.
        """
        compra = Compra.objects.get(id=compra_id)
        
        if compra.tipo != 'orcamento':
            raise CompraServiceError("Apenas orçamentos podem ser aprovados")
        
        compra.tipo = 'compra'
        compra.status = 'aprovado'
        compra.aprovado_por_id = aprovado_por
        compra.data_aprovacao = timezone.now()
        compra.save()
        
        self.log_operation('aprovar_orcamento', {'compra_id': compra_id}, compra)
        return compra
    
    def calcular_valor_total(self, itens: List[Dict]) -> Decimal:
        """
        Calcula o valor total baseado nos itens.
        """
        total = Decimal('0.00')
        
        for item in itens:
            quantidade = Decimal(str(item.get('quantidade', 0)))
            valor_unitario = Decimal(str(item.get('valor_unitario', 0)))
            total += quantidade * valor_unitario
        
        return total
    
    def gerar_relatorio_compras(self, filtros: Dict[str, Any]) -> Dict[str, Any]:
        """
        Gera relatório de compras com base nos filtros.
        """
        return self.compra_manager.get_relatorio_compras(filtros)
    
    def _processar_anexos_compra(self, compra: Compra, anexos: List):
        """Processa anexos da compra."""
        for anexo in anexos:
            self.anexo_service.criar_anexo_compra(compra, anexo)
    
    def _gerar_parcelas(self, compra: Compra):
        """Gera parcelas para compra parcelada."""
        if not compra.numero_parcelas or compra.numero_parcelas <= 1:
            return
        
        valor_parcela = compra.valor_total / compra.numero_parcelas
        
        for i in range(compra.numero_parcelas):
            data_vencimento = compra.data_compra + timedelta(days=30 * (i + 1))
            
            ParcelaCompra.objects.create(
                compra=compra,
                numero_parcela=i + 1,
                valor=valor_parcela,
                data_vencimento=data_vencimento,
                status='pendente'
            )
    
    def _recalcular_parcelas(self, compra: Compra):
        """Recalcula parcelas quando necessário."""
        # Remove parcelas existentes
        compra.parcelas.all().delete()
        
        # Gera novas parcelas
        if compra.forma_pagamento == 'parcelado':
            self._gerar_parcelas(compra)
```

### 2.2 LocacaoService

```python
# core/services/locacao_service.py
from typing import Dict, List, Any, Optional
from decimal import Decimal
from datetime import datetime, timedelta
from django.db import transaction
from django.utils import timezone
from core.models import Locacao_Obras_Equipes, Funcionario, Equipe, Obra
from core.services.base import BaseService
from core.services.anexo_service import AnexoService
from core.utils.validators import LocacaoValidator
from core.utils.exceptions import LocacaoServiceError
from core.managers.locacao_manager import LocacaoManager

class LocacaoService(BaseService):
    """
    Service responsável pela lógica de negócio de locações.
    """
    
    def __init__(self):
        super().__init__()
        self.anexo_service = AnexoService()
        self.locacao_manager = LocacaoManager()
    
    def get_validator(self):
        return LocacaoValidator()
    
    @transaction.atomic
    def criar_locacao(self, dados_locacao: Dict[str, Any], 
                     anexos: List = None) -> List[Locacao_Obras_Equipes]:
        """
        Cria locação(ões) - pode ser simples ou multi-dia.
        """
        dados_validados = self.validate_data(dados_locacao, 'create')
        
        # Verificar conflitos
        conflitos = self.validar_conflitos(dados_validados)
        if conflitos:
            raise LocacaoServiceError(f"Conflitos encontrados: {', '.join(conflitos)}")
        
        locacoes_criadas = []
        
        # Criar locações baseado no período
        if dados_validados.get('data_fim'):
            # Locação multi-dia
            locacoes_criadas = self._criar_locacao_multidia(dados_validados)
        else:
            # Locação simples
            locacao = self._criar_locacao_simples(dados_validados)
            locacoes_criadas = [locacao]
        
        # Processar anexos para todas as locações
        if anexos:
            for locacao in locacoes_criadas:
                self._processar_anexos_locacao(locacao, anexos)
        
        self.log_operation('criar_locacao', dados_validados, locacoes_criadas)
        return locacoes

### 2.3 AnexoService

```python
# core/services/anexo_service.py
from typing import List, Dict, Any
from django.core.files.uploadedfile import UploadedFile
from django.conf import settings
from core.models import AnexoCompra, AnexoLocacao, AnexoDespesa
from core.services.base import BaseService
from core.utils.validators import AnexoValidator
from core.utils.exceptions import AnexoServiceError
from core.utils.file_utils import FileUtils
import os

class AnexoService(BaseService):
    """
    Service responsável pelo gerenciamento de anexos.
    """
    
    ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.txt']
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
    
    def get_validator(self):
        return AnexoValidator()
    
    def criar_anexo_compra(self, compra, arquivo: UploadedFile) -> AnexoCompra:
        """Cria anexo para compra."""
        self._validar_arquivo(arquivo)
        
        anexo = AnexoCompra.objects.create(
            compra=compra,
            arquivo=arquivo,
            nome_original=arquivo.name,
            tamanho=arquivo.size
        )
        
        self.log_operation('criar_anexo_compra', {'compra_id': compra.id}, anexo)
        return anexo
    
    def criar_anexo_locacao(self, locacao, arquivo: UploadedFile) -> AnexoLocacao:
        """Cria anexo para locação."""
        self._validar_arquivo(arquivo)
        
        anexo = AnexoLocacao.objects.create(
            locacao=locacao,
            arquivo=arquivo,
            nome_original=arquivo.name,
            tamanho=arquivo.size
        )
        
        self.log_operation('criar_anexo_locacao', {'locacao_id': locacao.id}, anexo)
        return anexo
    
    def remover_anexo(self, anexo_id: int, tipo_anexo: str) -> bool:
        """Remove anexo e arquivo físico."""
        model_map = {
            'compra': AnexoCompra,
            'locacao': AnexoLocacao,
            'despesa': AnexoDespesa
        }
        
        if tipo_anexo not in model_map:
            raise AnexoServiceError(f"Tipo de anexo inválido: {tipo_anexo}")
        
        try:
            anexo = model_map[tipo_anexo].objects.get(id=anexo_id)
            
            # Remover arquivo físico
            if anexo.arquivo and os.path.exists(anexo.arquivo.path):
                os.remove(anexo.arquivo.path)
            
            anexo.delete()
            
            self.log_operation('remover_anexo', {'anexo_id': anexo_id, 'tipo': tipo_anexo})
            return True
            
        except model_map[tipo_anexo].DoesNotExist:
            raise AnexoServiceError(f"Anexo {anexo_id} não encontrado")
    
    def _validar_arquivo(self, arquivo: UploadedFile):
        """Valida arquivo antes do upload."""
        # Validar tamanho
        if arquivo.size > self.MAX_FILE_SIZE:
            raise AnexoServiceError(f"Arquivo muito grande. Máximo: {self.MAX_FILE_SIZE / (1024*1024)}MB")
        
        # Validar extensão
        file_ext = os.path.splitext(arquivo.name)[1].lower()
        if file_ext not in self.ALLOWED_EXTENSIONS:
            raise AnexoServiceError(f"Extensão não permitida: {file_ext}")

### 2.4 RelatorioService

```python
# core/services/relatorio_service.py
from typing import Dict, List, Any
from datetime import datetime, timedelta
from django.db.models import Sum, Count, Avg, Q
from core.models import Compra, Locacao_Obras_Equipes, DespesaExtra, Obra
from core.services.base import BaseService
from core.managers.relatorio_manager import RelatorioManager

class RelatorioService(BaseService):
    """
    Service responsável pela geração de relatórios.
    """
    
    def __init__(self):
        super().__init__()
        self.relatorio_manager = RelatorioManager()
    
    def get_validator(self):
        return None  # Relatórios não precisam de validação específica
    
    def relatorio_financeiro_obra(self, obra_id: int, 
                                 data_inicio: datetime = None,
                                 data_fim: datetime = None) -> Dict[str, Any]:
        """Gera relatório financeiro de uma obra."""
        obra = Obra.objects.get(id=obra_id)
        
        # Filtros de data
        filtros = {'obra_id': obra_id}
        if data_inicio:
            filtros['data_inicio'] = data_inicio
        if data_fim:
            filtros['data_fim'] = data_fim
        
        # Custos por categoria
        custos_compras = self._calcular_custos_compras(filtros)
        custos_locacoes = self._calcular_custos_locacoes(filtros)
        custos_despesas = self._calcular_custos_despesas(filtros)
        
        custo_total = custos_compras + custos_locacoes + custos_despesas
        
        relatorio = {
            'obra': {
                'id': obra.id,
                'nome': obra.nome_obra,
                'orcamento_previsto': obra.orcamento_previsto
            },
            'periodo': {
                'data_inicio': data_inicio,
                'data_fim': data_fim
            },
            'custos': {
                'compras': custos_compras,
                'locacoes': custos_locacoes,
                'despesas_extras': custos_despesas,
                'total': custo_total
            },
            'analise': {
                'percentual_orcamento': (custo_total / obra.orcamento_previsto * 100) if obra.orcamento_previsto else 0,
                'saldo_restante': obra.orcamento_previsto - custo_total if obra.orcamento_previsto else None
            }
        }
        
        self.log_operation('relatorio_financeiro_obra', filtros, relatorio)
        return relatorio
    
    def dashboard_stats(self) -> Dict[str, Any]:
        """Gera estatísticas para dashboard."""
        hoje = datetime.now().date()
        inicio_mes = hoje.replace(day=1)
        
        stats = {
            'obras_ativas': Obra.objects.filter(status='ativa').count(),
            'compras_mes': Compra.objects.filter(
                data_compra__gte=inicio_mes,
                tipo='compra'
            ).count(),
            'valor_compras_mes': Compra.objects.filter(
                data_compra__gte=inicio_mes,
                tipo='compra'
            ).aggregate(total=Sum('valor_total'))['total'] or 0,
            'locacoes_hoje': Locacao_Obras_Equipes.objects.filter(
                data_locacao=hoje
            ).count(),
            'funcionarios_ativos': Locacao_Obras_Equipes.objects.filter(
                data_locacao=hoje
            ).values('funcionario_locado').distinct().count()
        }
        
        return stats
    
    def _calcular_custos_compras(self, filtros: Dict[str, Any]) -> float:
        """Calcula custos de compras."""
        queryset = Compra.objects.filter(obra_id=filtros['obra_id'], tipo='compra')
        
        if filtros.get('data_inicio'):
            queryset = queryset.filter(data_compra__gte=filtros['data_inicio'])
        if filtros.get('data_fim'):
            queryset = queryset.filter(data_compra__lte=filtros['data_fim'])
        
        return queryset.aggregate(total=Sum('valor_total'))['total'] or 0

### 2.5 PDFService

```python
# core/services/pdf_service.py
from typing import Dict, List, Any
from django.template.loader import render_to_string
from django.http import HttpResponse
from weasyprint import HTML, CSS
from core.services.base import BaseService
import io

class PDFService(BaseService):
    """
    Service responsável pela geração de PDFs.
    """
    
    def get_validator(self):
        return None
    
    def gerar_pdf_compras(self, compras: List, template: str = 'relatorios/compras_pdf.html') -> bytes:
        """Gera PDF de relatório de compras."""
        context = {
            'compras': compras,
            'total_geral': sum(c.valor_total for c in compras),
            'data_geracao': datetime.now()
        }
        
        html_string = render_to_string(template, context)
        
        # CSS para estilização
        css_string = """
        @page {
            size: A4;
            margin: 2cm;
        }
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
        """
        
        # Gerar PDF
        html = HTML(string=html_string)
        css = CSS(string=css_string)
        pdf_buffer = io.BytesIO()
        html.write_pdf(pdf_buffer, stylesheets=[css])
        
        pdf_bytes = pdf_buffer.getvalue()
        pdf_buffer.close()
        
        self.log_operation('gerar_pdf_compras', {'num_compras': len(compras)})
         return pdf_bytes
```

## 3. Utilitários e Validadores

### 3.1 Exceções Customizadas

```python
# core/utils/exceptions.py
class BaseServiceError(Exception):
    """Exceção base para erros de service."""
    def __init__(self, message: str, code: str = None):
        self.message = message
        self.code = code
        super().__init__(self.message)

class ServiceError(BaseServiceError):
    """Erro genérico de service."""
    pass

class ValidationError(BaseServiceError):
    """Erro de validação."""
    pass

class CompraServiceError(BaseServiceError):
    """Erro específico do CompraService."""
    pass

class LocacaoServiceError(BaseServiceError):
    """Erro específico do LocacaoService."""
    pass

class AnexoServiceError(BaseServiceError):
    """Erro específico do AnexoService."""
    pass

class ManagerError(BaseServiceError):
    """Erro de manager."""
    pass
```

### 3.2 Validadores Base

```python
# core/utils/validators.py
from abc import ABC, abstractmethod
from typing import Dict, Any, List
from decimal import Decimal
from datetime import datetime
from core.utils.exceptions import ValidationError

class BaseValidator(ABC):
    """Validador base para services."""
    
    @abstractmethod
    def validate(self, data: Dict[str, Any], operation: str = 'create') -> Dict[str, Any]:
        """Valida dados e retorna dados limpos."""
        pass
    
    def _validate_required_fields(self, data: Dict[str, Any], required_fields: List[str]):
        """Valida campos obrigatórios."""
        missing_fields = []
        for field in required_fields:
            if field not in data or data[field] is None or data[field] == '':
                missing_fields.append(field)
        
        if missing_fields:
            raise ValidationError(f"Campos obrigatórios ausentes: {', '.join(missing_fields)}")
    
    def _validate_positive_decimal(self, value: Any, field_name: str) -> Decimal:
        """Valida e converte para decimal positivo."""
        try:
            decimal_value = Decimal(str(value))
            if decimal_value < 0:
                raise ValidationError(f"{field_name} deve ser um valor positivo")
            return decimal_value
        except (ValueError, TypeError):
            raise ValidationError(f"{field_name} deve ser um número válido")
    
    def _validate_date(self, value: Any, field_name: str) -> datetime:
        """Valida data."""
        if isinstance(value, str):
            try:
                return datetime.strptime(value, '%Y-%m-%d').date()
            except ValueError:
                raise ValidationError(f"{field_name} deve estar no formato YYYY-MM-DD")
        elif isinstance(value, datetime):
            return value.date()
        else:
            raise ValidationError(f"{field_name} deve ser uma data válida")

class CompraValidator(BaseValidator):
    """Validador específico para compras."""
    
    def validate(self, data: Dict[str, Any], operation: str = 'create') -> Dict[str, Any]:
        if operation == 'create':
            required_fields = ['obra', 'fornecedor', 'tipo', 'valor_total']
            self._validate_required_fields(data, required_fields)
        
        # Validar valor total
        if 'valor_total' in data:
            data['valor_total'] = self._validate_positive_decimal(data['valor_total'], 'valor_total')
        
        # Validar tipo
        if 'tipo' in data and data['tipo'] not in ['compra', 'orcamento']:
            raise ValidationError("Tipo deve ser 'compra' ou 'orcamento'")
        
        # Validar data
        if 'data_compra' in data:
            data['data_compra'] = self._validate_date(data['data_compra'], 'data_compra')
        
        return data

class LocacaoValidator(BaseValidator):
    """Validador específico para locações."""
    
    def validate(self, data: Dict[str, Any], operation: str = 'create') -> Dict[str, Any]:
        if operation == 'create':
            required_fields = ['obra', 'data_locacao', 'tipo_pagamento']
            self._validate_required_fields(data, required_fields)
            
            # Deve ter funcionário OU equipe
            if not data.get('funcionario_locado') and not data.get('equipe'):
                raise ValidationError("Deve ser informado funcionário ou equipe")
        
        # Validar tipo de pagamento
        if 'tipo_pagamento' in data:
            tipos_validos = ['diaria', 'metro', 'empreitada']
            if data['tipo_pagamento'] not in tipos_validos:
                raise ValidationError(f"Tipo de pagamento deve ser: {', '.join(tipos_validos)}")
        
        # Validar datas
        if 'data_locacao' in data:
            data['data_locacao'] = self._validate_date(data['data_locacao'], 'data_locacao')
        
        if 'data_fim' in data and data['data_fim']:
            data['data_fim'] = self._validate_date(data['data_fim'], 'data_fim')
            
            # Validar que data_fim >= data_locacao
            if data['data_fim'] < data['data_locacao']:
                raise ValidationError("Data fim deve ser maior ou igual à data de locação")
        
        return data

class AnexoValidator(BaseValidator):
    """Validador específico para anexos."""
    
    def validate(self, data: Dict[str, Any], operation: str = 'create') -> Dict[str, Any]:
        # Anexos são validados no service, não precisam de validação complexa aqui
        return data
```

### 3.3 Utilitários de Resposta

```python
# core/utils/responses.py
from rest_framework import status
from typing import Any, Dict

class StandardResponse:
    """Classe para padronizar respostas da API."""
    
    @staticmethod
    def success(data: Any = None, message: str = "Operação realizada com sucesso"):
        return {
            'data': data,
            'message': message,
            'status_code': status.HTTP_200_OK,
            'success': True
        }
    
    @staticmethod
    def created(data: Any = None, message: str = "Recurso criado com sucesso"):
        return {
            'data': data,
            'message': message,
            'status_code': status.HTTP_201_CREATED,
            'success': True
        }
    
    @staticmethod
    def validation_error(message: str, errors: Dict = None):
        return {
            'data': None,
            'message': message,
            'errors': errors,
            'status_code': status.HTTP_400_BAD_REQUEST,
            'success': False
        }
    
    @staticmethod
    def not_found(message: str = "Recurso não encontrado"):
        return {
            'data': None,
            'message': message,
            'status_code': status.HTTP_404_NOT_FOUND,
            'success': False
        }
    
    @staticmethod
    def service_error(message: str = "Erro interno do serviço"):
        return {
            'data': None,
            'message': message,
            'status_code': status.HTTP_500_INTERNAL_SERVER_ERROR,
            'success': False
        }
    
    @staticmethod
    def internal_error(message: str = "Erro interno do servidor"):
        return {
            'data': None,
            'message': message,
            'status_code': status.HTTP_500_INTERNAL_SERVER_ERROR,
            'success': False
        }
```

### 3.4 Utilitários de Arquivo

```python
# core/utils/file_utils.py
import os
import uuid
from django.conf import settings
from typing import List

class FileUtils:
    """Utilitários para manipulação de arquivos."""
    
    @staticmethod
    def generate_unique_filename(original_filename: str) -> str:
        """Gera nome único para arquivo."""
        name, ext = os.path.splitext(original_filename)
        unique_name = f"{uuid.uuid4().hex}{ext}"
        return unique_name
    
    @staticmethod
    def get_file_size_mb(file_path: str) -> float:
        """Retorna tamanho do arquivo em MB."""
        if os.path.exists(file_path):
            size_bytes = os.path.getsize(file_path)
            return size_bytes / (1024 * 1024)
        return 0
    
    @staticmethod
    def is_allowed_extension(filename: str, allowed_extensions: List[str]) -> bool:
        """Verifica se extensão é permitida."""
        _, ext = os.path.splitext(filename)
        return ext.lower() in [e.lower() for e in allowed_extensions]
    
    @staticmethod
    def safe_delete_file(file_path: str) -> bool:
        """Remove arquivo de forma segura."""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
        except OSError:
            pass
        return False
```

## 4. Exemplos de Views Refatoradas

### 4.1 CompraViewSet Refatorada

```python
# core/views/compra.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from core.models import Compra
from core.serializers.compra import CompraSerializer, CompraCreateSerializer
from core.services.compra_service import CompraService
from core.services.pdf_service import PDFService
from core.views.base import BaseViewSet
from core.utils.responses import StandardResponse

class CompraViewSet(BaseViewSet):
    """
    ViewSet para gerenciamento de compras - versão refatorada.
    """
    queryset = Compra.objects.all()
    serializer_class = CompraSerializer
    service_class = CompraService
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.pdf_service = PDFService()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CompraCreateSerializer
        return CompraSerializer
    
    def create(self, request, *args, **kwargs):
        """Cria nova compra usando service."""
        def create_operation():
            return self.service.criar_compra(request.data, request.FILES.getlist('anexos'))
        
        response = self.handle_service_operation(create_operation)
        return Response(response.data, status=response.status_code)
    
    def update(self, request, *args, **kwargs):
        """Atualiza compra usando service."""
        def update_operation():
            return self.service.atualizar_compra(
                kwargs['pk'], 
                request.data, 
                request.FILES.getlist('anexos')
            )
        
        response = self.handle_service_operation(update_operation)
        return Response(response.data, status=response.status_code)
    
    @action(detail=False, methods=['post'])
    def bulk_pdf(self, request):
        """Gera PDF em lote para múltiplas compras."""
        compra_ids = request.data.get('compra_ids', [])
        
        if not compra_ids:
            return Response(
                StandardResponse.validation_error("IDs das compras são obrigatórios").data,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            compras = Compra.objects.filter(id__in=compra_ids)
            pdf_bytes = self.pdf_service.gerar_pdf_compras(compras)
            
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = 'attachment; filename="relatorio_compras.pdf"'
            return response
            
        except Exception as e:
            return Response(
                StandardResponse.service_error(str(e)).data,
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def aprovar_orcamento(self, request, pk=None):
        """Aprova orçamento convertendo em compra."""
        def approve_operation():
            return self.service.aprovar_orcamento(pk, request.user.id)
        
        response = self.handle_service_operation(approve_operation)
        return Response(response.data, status=response.status_code)
```

### 4.2 LocacaoViewSet Refatorada

```python
# core/views/locacao.py
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from core.models import Locacao_Obras_Equipes
from core.serializers.locacao import LocacaoSerializer
from core.services.locacao_service import LocacaoService
from core.views.base import BaseViewSet

class LocacaoObrasEquipesViewSet(BaseViewSet):
    """
    ViewSet para locações - versão refatorada.
    """
    queryset = Locacao_Obras_Equipes.objects.all()
    serializer_class = LocacaoSerializer
    service_class = LocacaoService
    
    def create(self, request, *args, **kwargs):
        """Cria locação(ões) usando service."""
        def create_operation():
            return self.service.criar_locacao(request.data, request.FILES.getlist('anexos'))
        
        response = self.handle_service_operation(create_operation)
        return Response(response.data, status=response.status_code)
    
    @action(detail=True, methods=['post'])
    def transfer_funcionario(self, request, pk=None):
        """Transfere funcionário para outra obra."""
        def transfer_operation():
            return self.service.transferir_funcionario(pk, request.data)
        
        response = self.handle_service_operation(transfer_operation)
        return Response(response.data, status=response.status_code)
    
    @action(detail=False, methods=['get'])
    def custo_diario_chart(self, request):
        """Retorna dados para gráfico de custos diários."""
        obra_id = request.query_params.get('obra_id')
        
        if not obra_id:
            return Response(
                StandardResponse.validation_error("obra_id é obrigatório").data,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            dados_grafico = self.service.gerar_dados_custo_diario(obra_id)
            return Response(StandardResponse.success(dados_grafico).data)
        except Exception as e:
            return Response(
                StandardResponse.service_error(str(e)).data,
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
```

## 5. Guia de Migração Prática

### 5.1 Passo a Passo da Implementação

#### Etapa 1: Preparar Ambiente
```bash
# 1. Criar branch para refatoração
git checkout -b refactor/clean-architecture

# 2. Criar estrutura de diretórios
mkdir -p core/services core/managers core/utils core/views core/serializers

# 3. Criar arquivos __init__.py
touch core/services/__init__.py
touch core/managers/__init__.py
touch core/utils/__init__.py
```

#### Etapa 2: Implementar Classes Base
```python
# 1. Criar core/utils/exceptions.py
# 2. Criar core/utils/validators.py
# 3. Criar core/utils/responses.py
# 4. Criar core/services/base.py
# 5. Criar core/managers/base.py
# 6. Criar core/views/base.py
```

#### Etapa 3: Migrar Primeiro Service (CompraService)
```python
# 1. Criar core/services/compra_service.py
# 2. Implementar métodos básicos
# 3. Criar testes unitários
# 4. Integrar com view existente (paralelo)
```

#### Etapa 4: Refatorar View Gradualmente
```python
# 1. Criar core/views/compra.py
# 2. Implementar nova CompraViewSet
# 3. Configurar rota paralela para testes
# 4. Validar funcionalidades
# 5. Substituir rota original
```

### 5.2 Checklist de Validação

#### Para Cada Service Implementado:
- [ ] Todos os métodos têm testes unitários
- [ ] Validações estão funcionando corretamente
- [ ] Logs estão sendo gerados
- [ ] Transações estão sendo usadas adequadamente
- [ ] Exceções customizadas estão sendo lançadas

#### Para Cada View Refatorada:
- [ ] Todas as rotas originais funcionam
- [ ] Tratamento de erros está padronizado
- [ ] Serializers estão otimizados
- [ ] Performance não degradou
- [ ] Documentação da API está atualizada

### 5.3 Scripts de Migração

#### Script para Backup
```bash
#!/bin/bash
# backup_before_refactor.sh

echo "Criando backup antes da refatoração..."
cp -r core/ core_backup_$(date +%Y%m%d_%H%M%S)/
echo "Backup criado com sucesso!"
```

#### Script para Validação
```python
# validate_refactor.py
import subprocess
import sys

def run_tests():
    """Executa todos os testes."""
    result = subprocess.run(['python', 'manage.py', 'test'], capture_output=True)
    return result.returncode == 0

def check_migrations():
    """Verifica se há migrações pendentes."""
    result = subprocess.run(['python', 'manage.py', 'showmigrations', '--plan'], capture_output=True)
    return 'unapplied' not in result.stdout.decode()

def main():
    print("Validando refatoração...")
    
    if not check_migrations():
        print("❌ Há migrações pendentes")
        sys.exit(1)
    
    if not run_tests():
        print("❌ Testes falharam")
        sys.exit(1)
    
    print("✅ Refatoração validada com sucesso!")

if __name__ == '__main__':
    main()
```

## 6. Considerações de Performance

### 6.1 Otimizações Implementadas

- **Queries Otimizadas**: Uso de `select_related` e `prefetch_related` nos managers
- **Bulk Operations**: Métodos para criação e atualização em lote
- **Cache de Validações**: Validadores reutilizáveis
- **Lazy Loading**: Services instanciados apenas quando necessário

### 6.2 Monitoramento

```python
# core/middleware/performance_middleware.py
import time
import logging
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger('performance')

class PerformanceMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request.start_time = time.time()
    
    def process_response(self, request, response):
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
            logger.info(f"Request {request.path} took {duration:.2f}s")
        return response
```

---

**Conclusão**: Esta implementação técnica detalhada fornece a base sólida para a refatoração do backend, seguindo princípios de Clean Architecture e garantindo manutenibilidade, testabilidade e escalabilidade do sistema.
    
    def transferir_funcionario(self, locacao_id: int, 
                              dados_transferencia: Dict[str, Any]) -> Locacao_Obras_Equipes:
        """
        Transfere funcionário de uma locação para outra.
        """
        locacao_origem = self.locacao_manager.get_with_related(
            locacao_id,
            select_related=['obra', 'funcionario_locado', 'equipe']
        )
        
        # Validar dados da transferência
        dados_validados = self.validate_data(dados_transferencia, 'transfer')
        
        # Criar nova locação com os dados transferidos
        nova_locacao_dados = {
            'obra': dados_validados['nova_obra_id'],
            'funcionario_locado': locacao_origem.funcionario_locado.id,
            'data_locacao': dados_validados['nova_data'],
            'tipo_pagamento': locacao_origem.tipo_pagamento,
            'observacoes': f"Transferido de {locacao_origem.obra.nome_obra}"
        }
        
        nova_locacao = self._criar_locacao_simples(nova_locacao_dados)
        
        # Atualizar locação original
        locacao_origem.observacoes += f" | Transferido para {nova_locacao.obra.nome_obra}"
        locacao_origem.save()
        
        self.log_operation('transferir_funcionario', dados_validados, nova_locacao)
        return nova_locacao
    
    def calcular_pagamento(self, locacao: Locacao_Obras_Equipes) -> Decimal:
        """
        Calcula valor do pagamento baseado no tipo e recursos.
        """
        if locacao.tipo_pagamento == 'diaria':
            if locacao.funcionario_locado:
                return locacao.funcionario_locado.valor_diaria_padrao or Decimal('0.00')
            elif locacao.equipe:
                # Soma das diárias dos membros da equipe
                total = Decimal('0.00')
                for membro in locacao.equipe.membros.all():
                    total += membro.valor_diaria_padrao or Decimal('0.00')
                return total
        
        elif locacao.tipo_pagamento == 'metro':
            valor_metro = Decimal('0.00')
            if locacao.funcionario_locado:
                valor_metro = locacao.funcionario_locado.valor_metro_padrao or Decimal('0.00')
            elif locacao.equipe and locacao.equipe.lider:
                valor_metro = locacao.equipe.lider.valor_metro_padrao or Decimal('0.00')
            
            area = locacao.obra.area_metragem or Decimal('0.00')
            return valor_metro * area
        
        elif locacao.tipo_pagamento == 'empreitada':
            if locacao.funcionario_locado:
                return locacao.funcionario_locado.valor_empreitada_padrao or Decimal('0.00')
            elif locacao.equipe and locacao.equipe.lider:
                return locacao.equipe.lider.valor_empreitada_padrao or Decimal('0.00')
        
        return Decimal('0.00')
    
    def validar_conflitos(self, dados_locacao: Dict[str, Any]) -> List[str]:
        """
        Valida se há conflitos de agendamento.
        """
        conflitos = []
        
        # Verificar disponibilidade do funcionário/equipe na data
        if dados_locacao.get('funcionario_locado'):
            if self._funcionario_ocupado(dados_locacao['funcionario_locado'], 
                                       dados_locacao['data_locacao']):
                conflitos.append("Funcionário já possui locação nesta data")
        
        if dados_locacao.get('equipe'):
            if self._equipe_ocupada(dados_locacao['equipe'], 
                                  dados_locacao['data_locacao']):
                conflitos.append("Equipe já possui locação nesta data")
        
        return conflitos
    
    def _criar_locacao_simples(self, dados: Dict[str, Any]) -> Locacao_Obras_Equipes:
        """Cria uma locação simples."""
        locacao = Locacao_Obras_Equipes.objects.create(**dados)
        
        # Calcular valor do pagamento
        locacao.valor_pagamento = self.calcular_pagamento(locacao)
        locacao.save()
        
        return locacao
    
    def _criar_locacao_multidia(self, dados: Dict[str, Any]) -> List[Locacao_Obras_Equipes]:
        """Cria múltiplas locações para período."""
        locacoes = []
        data_inicio = dados['data_locacao']
        data_fim = dados['data_fim']
        
        current_date = data_inicio
        while current_date <= data_fim:
            dados_dia = dados.copy()
            dados_dia['data_locacao'] = current_date
            dados_dia.pop('data_fim', None)
            
            locacao = self._criar_locacao_simples(dados_dia)
            locacoes.append(locacao)
            
            current_date += timedelta(days=1)
        
        return locacoes
```

