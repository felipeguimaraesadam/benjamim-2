from django.db import models
from django.db.models import QuerySet, Q, Count, Sum, Avg, Max, Min
from django.db.models.functions import TruncDate, TruncMonth, TruncYear
from typing import Any, Dict, List, Optional, Union
from datetime import datetime, date
import logging

logger = logging.getLogger(__name__)


class BaseManager(models.Manager):
    """
    Manager base com funcionalidades comuns para queries complexas.
    Estende o Manager padrão do Django com métodos utilitários.
    """
    
    def get_active(self) -> QuerySet:
        """
        Retorna apenas objetos ativos.
        Assume que o modelo tem um campo 'is_active' ou similar.
        """
        if hasattr(self.model, 'is_active'):
            return self.filter(is_active=True)
        elif hasattr(self.model, 'ativo'):
            return self.filter(ativo=True)
        else:
            return self.all()
    
    def get_inactive(self) -> QuerySet:
        """
        Retorna apenas objetos inativos.
        """
        if hasattr(self.model, 'is_active'):
            return self.filter(is_active=False)
        elif hasattr(self.model, 'ativo'):
            return self.filter(ativo=False)
        else:
            return self.none()
    
    def get_by_date_range(self, start_date: date, end_date: date, 
                         date_field: str = 'created_at') -> QuerySet:
        """
        Filtra objetos por intervalo de datas.
        
        Args:
            start_date: Data inicial
            end_date: Data final
            date_field: Nome do campo de data (padrão: 'created_at')
            
        Returns:
            QuerySet filtrado por data
        """
        filter_kwargs = {
            f'{date_field}__date__gte': start_date,
            f'{date_field}__date__lte': end_date
        }
        return self.filter(**filter_kwargs)
    
    def get_by_month(self, year: int, month: int, 
                    date_field: str = 'created_at') -> QuerySet:
        """
        Filtra objetos por mês específico.
        
        Args:
            year: Ano
            month: Mês (1-12)
            date_field: Nome do campo de data
            
        Returns:
            QuerySet filtrado por mês
        """
        filter_kwargs = {
            f'{date_field}__year': year,
            f'{date_field}__month': month
        }
        return self.filter(**filter_kwargs)
    
    def get_by_year(self, year: int, date_field: str = 'created_at') -> QuerySet:
        """
        Filtra objetos por ano específico.
        
        Args:
            year: Ano
            date_field: Nome do campo de data
            
        Returns:
            QuerySet filtrado por ano
        """
        filter_kwargs = {f'{date_field}__year': year}
        return self.filter(**filter_kwargs)
    
    def search(self, query: str, fields: List[str]) -> QuerySet:
        """
        Realiza busca textual em múltiplos campos.
        
        Args:
            query: Termo de busca
            fields: Lista de campos para buscar
            
        Returns:
            QuerySet com resultados da busca
        """
        if not query or not fields:
            return self.none()
        
        q_objects = Q()
        for field in fields:
            q_objects |= Q(**{f'{field}__icontains': query})
        
        return self.filter(q_objects)
    
    def get_with_annotations(self, annotations: Dict[str, Any]) -> QuerySet:
        """
        Adiciona anotações ao queryset.
        
        Args:
            annotations: Dicionário com anotações
            
        Returns:
            QuerySet anotado
        """
        return self.annotate(**annotations)
    
    def get_aggregated_data(self, aggregations: Dict[str, Any]) -> Dict[str, Any]:
        """
        Retorna dados agregados.
        
        Args:
            aggregations: Dicionário com agregações
            
        Returns:
            Dicionário com resultados das agregações
        """
        return self.aggregate(**aggregations)
    
    def get_count_by_field(self, field: str) -> QuerySet:
        """
        Conta registros agrupados por campo.
        
        Args:
            field: Campo para agrupar
            
        Returns:
            QuerySet com contagens
        """
        return self.values(field).annotate(count=Count('id')).order_by('-count')
    
    def get_sum_by_field(self, group_field: str, sum_field: str) -> QuerySet:
        """
        Soma valores agrupados por campo.
        
        Args:
            group_field: Campo para agrupar
            sum_field: Campo para somar
            
        Returns:
            QuerySet com somas
        """
        return self.values(group_field).annotate(
            total=Sum(sum_field)
        ).order_by('-total')
    
    def get_stats_by_date(self, date_field: str = 'created_at', 
                         value_field: str = None) -> Dict[str, Any]:
        """
        Retorna estatísticas por data.
        
        Args:
            date_field: Campo de data
            value_field: Campo de valor (opcional)
            
        Returns:
            Dicionário com estatísticas
        """
        stats = {
            'total_count': self.count(),
            'date_range': self.aggregate(
                min_date=Min(date_field),
                max_date=Max(date_field)
            )
        }
        
        if value_field and hasattr(self.model, value_field):
            stats['value_stats'] = self.aggregate(
                total_value=Sum(value_field),
                avg_value=Avg(value_field),
                min_value=Min(value_field),
                max_value=Max(value_field)
            )
        
        return stats
    
    def get_monthly_stats(self, year: int, date_field: str = 'created_at',
                         value_field: str = None) -> QuerySet:
        """
        Retorna estatísticas mensais para um ano.
        
        Args:
            year: Ano para análise
            date_field: Campo de data
            value_field: Campo de valor (opcional)
            
        Returns:
            QuerySet com estatísticas mensais
        """
        queryset = self.filter(**{f'{date_field}__year': year})
        
        annotations = {
            'month': TruncMonth(date_field),
            'count': Count('id')
        }
        
        if value_field and hasattr(self.model, value_field):
            annotations.update({
                'total_value': Sum(value_field),
                'avg_value': Avg(value_field)
            })
        
        return queryset.annotate(**annotations).values(
            'month', 'count', *([k for k in annotations.keys() if k not in ['month', 'count']])
        ).order_by('month')
    
    def get_top_records(self, field: str, limit: int = 10, 
                       order: str = 'desc') -> QuerySet:
        """
        Retorna os top registros baseado em um campo.
        
        Args:
            field: Campo para ordenação
            limit: Limite de registros
            order: Ordem ('desc' ou 'asc')
            
        Returns:
            QuerySet com top registros
        """
        order_field = f'-{field}' if order == 'desc' else field
        return self.order_by(order_field)[:limit]
    
    def bulk_create_safe(self, objs: List[models.Model], 
                        batch_size: int = 1000) -> List[models.Model]:
        """
        Criação em lote com tratamento de erros.
        
        Args:
            objs: Lista de objetos para criar
            batch_size: Tamanho do lote
            
        Returns:
            Lista de objetos criados
        """
        try:
            return self.bulk_create(objs, batch_size=batch_size)
        except Exception as e:
            logger.error(f"Erro na criação em lote: {str(e)}")
            # Fallback: criar um por vez
            created_objs = []
            for obj in objs:
                try:
                    created_obj = self.create(**obj.__dict__)
                    created_objs.append(created_obj)
                except Exception as individual_error:
                    logger.error(f"Erro ao criar objeto individual: {str(individual_error)}")
            return created_objs
    
    def get_or_create_safe(self, defaults: Dict[str, Any] = None, 
                          **kwargs) -> tuple[models.Model, bool]:
        """
        Get or create com tratamento de erros aprimorado.
        
        Args:
            defaults: Valores padrão para criação
            **kwargs: Filtros para busca
            
        Returns:
            Tupla (objeto, criado)
        """
        try:
            return self.get_or_create(defaults=defaults, **kwargs)
        except Exception as e:
            logger.error(f"Erro em get_or_create: {str(e)}")
            # Tentar apenas buscar
            try:
                obj = self.get(**kwargs)
                return obj, False
            except self.model.DoesNotExist:
                # Se não existe, tentar criar
                create_data = kwargs.copy()
                if defaults:
                    create_data.update(defaults)
                obj = self.create(**create_data)
                return obj, True
    
    def filter_complex(self, filters: Dict[str, Any], 
                      search_query: str = None, 
                      search_fields: List[str] = None) -> QuerySet:
        """
        Filtro complexo combinando filtros diretos e busca textual.
        
        Args:
            filters: Filtros diretos
            search_query: Termo de busca
            search_fields: Campos para busca textual
            
        Returns:
            QuerySet filtrado
        """
        queryset = self.filter(**filters) if filters else self.all()
        
        if search_query and search_fields:
            search_q = Q()
            for field in search_fields:
                search_q |= Q(**{f'{field}__icontains': search_query})
            queryset = queryset.filter(search_q)
        
        return queryset