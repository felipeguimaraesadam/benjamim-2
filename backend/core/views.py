from rest_framework import viewsets, status, filters, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q, Sum, F, Case, When, Value, IntegerField
import json
from decimal import Decimal, InvalidOperation
from datetime import datetime, date, timedelta
from django.db import transaction
from rest_framework.decorators import action
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
# Note: 'from datetime import date, timedelta' was also imported directly.
# django.utils.timezone.now().date() provides date, and timedelta can be imported if needed.
# For this merge, keeping existing imports from backup unless clearly redundant and conflicting.

# PDF Generation Specific Imports
from django.http import HttpResponse, Http404 # Http404 added, HttpResponse was present
from django.template.loader import render_to_string # Was present
from django.conf import settings
import os
from .utils import generate_pdf_response, process_attachments_for_pdf
from weasyprint import HTML
# from weasyprint.fonts import FontConfiguration # Optional

from .models import (
    Usuario, Obra, Funcionario, Equipe, Locacao_Obras_Equipes, Material,
    Compra, Despesa_Extra, Ocorrencia_Funcionario, ItemCompra, FotoObra,
    Backup, BackupSettings, AnexoLocacao, AnexoDespesa, ParcelaCompra,
    AnexoCompra, ArquivoObra
)
from .serializers import (
    UsuarioSerializer, ObraSerializer, FuncionarioSerializer, EquipeSerializer,
    LocacaoObrasEquipesSerializer, MaterialSerializer, CompraSerializer,
    DespesaExtraSerializer, OcorrenciaFuncionarioSerializer,
    ItemCompraSerializer, EquipeComMembrosBasicSerializer,
    FotoObraSerializer, FuncionarioDetailSerializer,
    EquipeDetailSerializer, MaterialDetailSerializer, CompraReportSerializer,
    BackupSerializer, BackupSettingsSerializer, AnexoLocacaoSerializer, AnexoDespesaSerializer,
    ParcelaCompraSerializer, AnexoCompraSerializer, ArquivoObraSerializer
)
from .permissions import IsNivelAdmin, IsNivelGerente

class CreateUsuarioView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UsuarioSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UsuarioViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = Usuario.objects.all().order_by('id')
    serializer_class = UsuarioSerializer
    permission_classes = [IsNivelAdmin] # Using custom permission


class ObraViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows obras to be viewed or edited.
    """
    serializer_class = ObraSerializer
    permission_classes = [IsNivelAdmin | IsNivelGerente]

    def get_queryset(self):
        queryset = Obra.objects.select_related('responsavel').all().order_by('id')
        
        # Filtering based on query parameters
        search_query = self.request.query_params.get('search', None)
        status_query = self.request.query_params.get('status', None)

        if search_query:
            queryset = queryset.filter(nome_obra__icontains=search_query)

        if status_query:
            queryset = queryset.filter(status=status_query)

        return queryset

    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', '')
        if not query:
            return Response({'error': 'Query parameter "q" is required.'}, status=status.HTTP_400_BAD_REQUEST)

        obras = Obra.objects.filter(nome_obra__icontains=query)
        serializer = self.get_serializer(obras, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='materiais-detalhes')
    def materiais_detalhes(self, request, pk=None):
        obra = self.get_object()
        structured_data = {}
        items = ItemCompra.objects.filter(compra__obra=obra, compra__tipo='COMPRA').select_related('material', 'compra')

        for item in items:
            category = item.categoria_uso or 'Geral'
            material_name = item.material.nome

            if category not in structured_data:
                structured_data[category] = {}

            if material_name not in structured_data[category]:
                structured_data[category][material_name] = {
                    'material_nome': material_name,
                    'total_valor': Decimal('0.00'),
                    'unidade_medida': item.material.unidade_medida,
                    'compras': []
                }

            structured_data[category][material_name]['total_valor'] += item.valor_total_item
            structured_data[category][material_name]['compras'].append({
                'compra_id': item.compra.id,
                'data_compra': item.compra.data_compra,
                'quantidade': item.quantidade,
                'valor_unitario': item.valor_unitario,
                'valor_total_item': item.valor_total_item,
                'nota_fiscal': item.compra.nota_fiscal,
                'fornecedor': item.compra.fornecedor
            })

        for category, materials in structured_data.items():
            structured_data[category] = list(materials.values())

        return Response(structured_data)

    @action(detail=True, methods=['get'], url_path='mao-de-obra-detalhes')
    def mao_de_obra_detalhes(self, request, pk=None):
        obra = self.get_object()
        locacoes = Locacao_Obras_Equipes.objects.filter(
            obra=obra
        ).filter(
            Q(equipe__isnull=False) | Q(funcionario_locado__isnull=False)
        ).select_related('funcionario_locado', 'equipe').prefetch_related('equipe__membros')

        if not obra.data_inicio:
            obra_duration_days = 0
        else:
            end_date = obra.data_real_fim if obra.data_real_fim else date.today()
            obra_duration_days = (end_date - obra.data_inicio).days + 1
            if obra_duration_days <= 0:
                obra_duration_days = 1

        funcionarios_data = {}
        for loc in locacoes:
            funcionarios_to_process = []
            if loc.funcionario_locado:
                funcionarios_to_process = [loc.funcionario_locado]
            elif loc.equipe:
                funcionarios_to_process = loc.equipe.membros.all()

            if not funcionarios_to_process:
                continue

            valor_pago_loc_per_member = loc.valor_pagamento
            if loc.equipe and len(funcionarios_to_process) > 0:
                valor_pago_loc_per_member = loc.valor_pagamento / len(funcionarios_to_process)

            dias_trabalhados_loc = (loc.data_locacao_fim - loc.data_locacao_inicio).days + 1

            for func in funcionarios_to_process:
                if func.id not in funcionarios_data:
                    funcionarios_data[func.id] = {
                        'funcionario_id': func.id,
                        'nome_completo': func.nome_completo,
                        'locacoes_count': 0,
                        'total_pago': Decimal('0.00'),
                        'dias_trabalhados': 0,
                        'pagamentos': []
                    }

                funcionarios_data[func.id]['locacoes_count'] += 1
                funcionarios_data[func.id]['total_pago'] += valor_pago_loc_per_member
                funcionarios_data[func.id]['dias_trabalhados'] += dias_trabalhados_loc
                funcionarios_data[func.id]['pagamentos'].append({
                    'locacao_id': loc.id,
                    'data_inicio': loc.data_locacao_inicio,
                    'data_fim': loc.data_locacao_fim,
                    'tipo_pagamento': loc.get_tipo_pagamento_display(),
                    'valor_pago': valor_pago_loc_per_member,
                    'recurso': loc.equipe.nome_equipe if loc.equipe else loc.funcionario_locado.nome_completo
                })

        final_data = list(funcionarios_data.values())
        for data_item in final_data:
            if data_item['dias_trabalhados'] > 0:
                data_item['media_diaria'] = data_item['total_pago'] / data_item['dias_trabalhados']
            else:
                data_item['media_diaria'] = Decimal('0.00')

            if obra_duration_days > 0:
                data_item['participacao_percentual'] = (data_item['dias_trabalhados'] / obra_duration_days) * 100
            else:
                data_item['participacao_percentual'] = 0

        return Response(final_data)

    @action(detail=True, methods=['get'], url_path='servicos-detalhes')
    def servicos_detalhes(self, request, pk=None):
        obra = self.get_object()
        locacoes_servicos = Locacao_Obras_Equipes.objects.filter(
            obra=obra,
            servico_externo__isnull=False
        ).exclude(
            servico_externo__exact=''
        ).order_by('-data_locacao_inicio')

        serializer = LocacaoObrasEquipesSerializer(locacoes_servicos, many=True)
        return Response(serializer.data)


class FuncionarioViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows funcionarios to be viewed or edited.
    """
    queryset = Funcionario.objects.all().order_by('id')
    serializer_class = FuncionarioSerializer
    permission_classes = [IsNivelAdmin | IsNivelGerente]
    
    def get_queryset(self):
        queryset = Funcionario.objects.all()
        search = self.request.query_params.get('search', None)
        
        if search:
            queryset = queryset.filter(
                Q(nome_completo__icontains=search) |
                Q(cargo__icontains=search)
            )
        
        return queryset.order_by('nome_completo')


# New FuncionarioDetailView
class FuncionarioDetailView(APIView):
    permission_classes = [IsNivelAdmin | IsNivelGerente] # Or more specific permissions

    def get(self, request, pk, format=None):
        try:
            funcionario = Funcionario.objects.get(pk=pk)
        except Funcionario.DoesNotExist:
            return Response({"error": "Funcionário não encontrado."}, status=status.HTTP_404_NOT_FOUND)

        serializer = FuncionarioDetailSerializer(funcionario, context={'request': request})
        return Response(serializer.data)


class EquipeViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows equipes to be viewed or edited.
    """
    queryset = Equipe.objects.all().order_by('id')
    permission_classes = [IsNivelAdmin | IsNivelGerente]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return EquipeSerializer
        return EquipeComMembrosBasicSerializer

    def get_queryset(self):
        return Equipe.objects.prefetch_related('membros').select_related('lider').all().order_by('id')


# New EquipeDetailView
class EquipeDetailView(APIView):
    permission_classes = [IsNivelAdmin | IsNivelGerente]

    def get(self, request, pk, format=None):
        try:
            equipe = Equipe.objects.prefetch_related('membros').select_related('lider').get(pk=pk)
        except Equipe.DoesNotExist:
            return Response({"error": "Equipe não encontrada."}, status=status.HTTP_404_NOT_FOUND)

        serializer = EquipeDetailSerializer(equipe, context={'request': request})
        return Response(serializer.data)


class LocacaoObrasEquipesViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows alocacoes to be viewed or edited.
    """
    queryset = Locacao_Obras_Equipes.objects.all()
    serializer_class = LocacaoObrasEquipesSerializer
    permission_classes = [IsNivelAdmin | IsNivelGerente]

    def create(self, request, *args, **kwargs):
        print("LocacaoObrasEquipesViewSet: Create method called")
        print("Request data:", request.data)
        print("Request files:", request.FILES)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        anexos_data = request.FILES.getlist('anexos')
        print("Anexos data:", anexos_data)
        validated_data = serializer.validated_data
        
        # Remove 'anexos' from validated_data if it's there, as it's not a model field
        validated_data.pop('anexos', None)

        data_inicio = validated_data['data_locacao_inicio']
        data_fim = validated_data.get('data_locacao_fim', data_inicio)

        created_locacoes = []
        with transaction.atomic():
            # Create the first locacao
            first_locacao_data = validated_data.copy()
            if data_inicio != data_fim:
                first_locacao_data['data_locacao_fim'] = data_inicio

            locacao = Locacao_Obras_Equipes.objects.create(**first_locacao_data)
            print("Created locacao:", locacao)
            created_locacoes.append(locacao)

            # Save attachments for the first locacao
            for anexo_file in anexos_data:
                anexo = AnexoLocacao.objects.create(locacao=locacao, anexo=anexo_file, descricao=anexo_file.name)
                print("Created anexo:", anexo)

            # Create remaining locacoes for multi-day rentals
            if data_inicio != data_fim:
                current_date = data_inicio + timedelta(days=1)
                while current_date <= data_fim:
                    daily_data = validated_data.copy()
                    daily_data['data_locacao_inicio'] = current_date
                    daily_data['data_locacao_fim'] = current_date
                    locacao = Locacao_Obras_Equipes.objects.create(**daily_data)
                    print("Created multi-day locacao:", locacao)
                    created_locacoes.append(locacao)
                    current_date += timedelta(days=1)
        
        response_serializer = self.get_serializer(created_locacoes, many=True)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='remover-anexo/(?P<anexo_pk>[^/.]+)')
    def remover_anexo(self, request, pk=None, anexo_pk=None):
        try:
            despesa = self.get_object()
            anexo = AnexoDespesa.objects.get(pk=anexo_pk, despesa=despesa)
            
            # Deleta o arquivo físico
            if anexo.anexo:
                anexo.anexo.delete(save=False)
            
            # Deleta a instância do modelo
            anexo.delete()
            
            return Response(status=status.HTTP_204_NO_CONTENT)
        except AnexoDespesa.DoesNotExist:
            return Response({'error': 'Anexo não encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, *args, **kwargs):
        print("LocacaoObrasEquipesViewSet: Update method called")
        print("Request data:", request.data)
        print("Request files:", request.FILES)
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        anexos_data = request.FILES.getlist('anexos')
        print("Anexos data:", anexos_data)

        self.perform_update(serializer)

        for anexo_file in anexos_data:
            anexo = AnexoLocacao.objects.create(locacao=instance, anexo=anexo_file, descricao=anexo_file.name)
            print("Created anexo:", anexo)

        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been used, we need to manually update the prefetch cache.
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)

    def get_queryset(self):
        today = timezone.now().date()
        queryset = Locacao_Obras_Equipes.objects.select_related(
            'obra', 
            'equipe', 
            'funcionario_locado',
            'equipe__lider'
        ).prefetch_related(
            'equipe__membros'
        ).annotate(
            status_order_group=Case(
                When(status_locacao='cancelada', then=Value(3)),
                When(Q(status_locacao='ativa') &
                     Q(data_locacao_inicio__lte=today) &
                     (Q(data_locacao_fim__gte=today) | Q(data_locacao_fim__isnull=True)),
                     then=Value(0)),
                When(Q(status_locacao='ativa') & Q(data_locacao_inicio__gt=today),
                     then=Value(1)),
                When(Q(status_locacao='ativa') & Q(data_locacao_fim__lt=today),
                     then=Value(2)),
                default=Value(2),
                output_field=IntegerField()
            )
        ).order_by('status_order_group', 'data_locacao_inicio')
        obra_id = self.request.query_params.get('obra_id')
        if obra_id is not None:
            queryset = queryset.filter(obra_id=obra_id)
        return queryset

    @action(detail=False, methods=['post'], url_path='transferir-funcionario')
    def transfer_funcionario(self, request):
        conflicting_locacao_id = request.data.get('conflicting_locacao_id')
        new_locacao_data = request.data.get('new_locacao_data')
        if not conflicting_locacao_id or not new_locacao_data:
            return Response(
                {"error": "Dados insuficientes para transferência (conflicting_locacao_id e new_locacao_data são obrigatórios)."},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            with transaction.atomic():
                try:
                    old_loc = Locacao_Obras_Equipes.objects.get(pk=conflicting_locacao_id)
                except Locacao_Obras_Equipes.DoesNotExist:
                    return Response({"error": "Locação conflitante não encontrada."}, status=status.HTTP_404_NOT_FOUND)
                if 'funcionario_locado' in new_locacao_data and isinstance(new_locacao_data['funcionario_locado'], str):
                    try:
                        new_locacao_data['funcionario_locado'] = int(new_locacao_data['funcionario_locado'])
                    except ValueError:
                        return Response({"error": "ID de funcionário inválido."}, status=status.HTTP_400_BAD_REQUEST)
                if 'obra' in new_locacao_data and isinstance(new_locacao_data['obra'], str):
                    try:
                        new_locacao_data['obra'] = int(new_locacao_data['obra'])
                    except ValueError:
                            return Response({"error": "ID de obra inválido."}, status=status.HTTP_400_BAD_REQUEST)
                new_loc_start_date_str = new_locacao_data.get('data_locacao_inicio')
                if not new_loc_start_date_str:
                    return Response({"error": "Data de início da nova locação é obrigatória."}, status=status.HTTP_400_BAD_REQUEST)
                try:
                    new_loc_start_date = date.fromisoformat(new_loc_start_date_str)
                except ValueError:
                    return Response({"error": "Formato de data de início da nova locação inválido. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)
                old_loc_new_end_date = new_loc_start_date - timedelta(days=1)
                if old_loc_new_end_date < old_loc.data_locacao_inicio:
                    old_loc.data_locacao_fim = old_loc_new_end_date
                    old_loc.valor_pagamento = Decimal('0.00')
                else:
                    old_loc.data_locacao_fim = old_loc_new_end_date
                    old_loc.valor_pagamento = Decimal('0.00')
                old_loc.status_locacao = 'cancelada'
                old_loc.save()
                new_loc_serializer = self.get_serializer(data=new_locacao_data)
                if not new_loc_serializer.is_valid():
                        return Response(new_loc_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                new_loc = new_loc_serializer.save()
                return Response(self.get_serializer(new_loc).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": f"Erro interno no servidor: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], url_path='custo_diario_chart')
    def custo_diario_chart(self, request):
        from calendar import monthrange

        year_str = request.query_params.get('year')
        month_str = request.query_params.get('month')
        end_date_str = request.query_params.get('end_date')
        obra_id_str = request.query_params.get('obra_id')
        filtro_tipo = request.query_params.get('filtro_tipo', 'equipe_funcionario')

        if year_str and month_str:
            try:
                year = int(year_str)
                month = int(month_str)
                _, num_days = monthrange(year, month)
                start_date = date(year, month, 1)
                end_date = date(year, month, num_days)
            except (ValueError, TypeError):
                return Response({"error": "Ano e mês inválidos."}, status=status.HTTP_400_BAD_REQUEST)
        elif end_date_str:
            try:
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
                start_date = end_date - timedelta(days=29)
            except ValueError:
                return Response({'error': 'Invalid date format for end_date. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            end_date = timezone.now().date()
            start_date = end_date - timedelta(days=29)

        locacoes_qs = Locacao_Obras_Equipes.objects.filter(
            data_locacao_inicio__gte=start_date,
            data_locacao_inicio__lte=end_date,
            status_locacao='ativa'
        )

        if obra_id_str:
            try:
                obra_id = int(obra_id_str)
                locacoes_qs = locacoes_qs.filter(obra_id=obra_id)
            except ValueError:
                return Response({"error": "ID de obra inválido."}, status=status.HTTP_400_BAD_REQUEST)

        print(f"DEBUG: Custo Diário Chart - Filtro_tipo: {filtro_tipo}")
        print(f"DEBUG: Custo Diário Chart - Queryset antes do filtro: {locacoes_qs.count()}")

        if filtro_tipo == 'equipe_funcionario':
            locacoes_qs = locacoes_qs.filter(Q(equipe__isnull=False) | Q(funcionario_locado__isnull=False))
        elif filtro_tipo == 'servico_externo':
            locacoes_qs = locacoes_qs.filter(servico_externo__isnull=False).exclude(servico_externo__exact='')

        print(f"DEBUG: Custo Diário Chart - Queryset depois do filtro: {locacoes_qs.count()}")
        for loc in locacoes_qs:
            print(f"  - Loc ID: {loc.id}, Servico: {loc.servico_externo}, Valor: {loc.valor_pagamento}")

        daily_costs_db = locacoes_qs.values('data_locacao_inicio').annotate(
            total_cost_for_day=Sum('valor_pagamento')
        ).order_by('data_locacao_inicio')
        costs_by_date_map = {
            item['data_locacao_inicio']: item['total_cost_for_day']
            for item in daily_costs_db
        }
        result_data = []
        current_date = start_date
        while current_date <= end_date:
            cost = costs_by_date_map.get(current_date, Decimal('0.00'))
            result_data.append({
                "date": current_date.isoformat(),
                "total_cost": cost,
                "has_locacoes": cost > 0
            })
            current_date += timedelta(days=1)
        return Response(result_data)

    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        try:
            original_locacao = self.get_object()
            new_date_str = request.data.get('new_date')

            if not new_date_str:
                return Response({'error': 'A nova data é obrigatória.'}, status=status.HTTP_400_BAD_REQUEST)

            new_date = datetime.strptime(new_date_str, '%Y-%m-%d').date()

            # Business logic validation
            is_servico_externo = bool(original_locacao.servico_externo) and not original_locacao.funcionario_locado and not original_locacao.equipe
            if not is_servico_externo:
                resource_qs = Locacao_Obras_Equipes.objects.filter(
                    data_locacao_inicio=new_date,
                    status_locacao='ativa'
                )
                if original_locacao.funcionario_locado:
                    if resource_qs.filter(funcionario_locado=original_locacao.funcionario_locado).exists():
                        return Response({'error': 'Este funcionário já possui uma alocação nesta data.'}, status=status.HTTP_400_BAD_REQUEST)
                elif original_locacao.equipe:
                    if resource_qs.filter(equipe=original_locacao.equipe).exists():
                        return Response({'error': 'Esta equipe já possui uma alocação nesta data.'}, status=status.HTTP_400_BAD_REQUEST)

            with transaction.atomic():
                new_locacao_data = {
                    'obra': original_locacao.obra,
                    'equipe': original_locacao.equipe,
                    'funcionario_locado': original_locacao.funcionario_locado,
                    'servico_externo': original_locacao.servico_externo,
                    'data_locacao_inicio': new_date,
                    'data_locacao_fim': new_date,
                    'tipo_pagamento': original_locacao.tipo_pagamento,
                    'valor_pagamento': original_locacao.valor_pagamento,
                    'data_pagamento': None,
                    'status_locacao': 'ativa',
                    'observacoes': f"Duplicado de locação ID {original_locacao.id}. {original_locacao.observacoes}",
                }
                new_locacao = Locacao_Obras_Equipes.objects.create(**new_locacao_data)

            serializer = self.get_serializer(new_locacao)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erro ao duplicar locação: {e}", exc_info=True)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all().order_by('nome')
    serializer_class = MaterialSerializer
    permission_classes = [IsNivelAdmin | IsNivelGerente]
    filter_backends = [filters.SearchFilter]
    search_fields = ['nome']

    @action(detail=False, methods=['get'], url_path='alertas-estoque-baixo')
    def alertas_estoque_baixo(self, request):
        low_stock_materials = Material.objects.filter(
            nivel_minimo_estoque__gt=0,
            quantidade_em_estoque__lte=F('nivel_minimo_estoque')
        )
        serializer = self.get_serializer(low_stock_materials, many=True)
        return Response(serializer.data)


class MaterialDetailAPIView(APIView):
    permission_classes = [IsNivelAdmin | IsNivelGerente]
    def get(self, request, pk, format=None):
        try:
            material_instance = Material.objects.get(pk=pk)
        except Material.DoesNotExist:
            return Response({"error": "Material não encontrado."}, status=status.HTTP_404_NOT_FOUND)
        serializer = MaterialDetailSerializer(material_instance, context={'request': request})
        return Response(serializer.data)


class CompraViewSet(viewsets.ModelViewSet):
    queryset = Compra.objects.all()
    serializer_class = CompraSerializer
    permission_classes = [IsNivelAdmin | IsNivelGerente]

    def create(self, request, *args, **kwargs):
        print("CompraViewSet: Create method called")
        print("Request data:", request.data)
        print("Request files:", request.FILES)
        
        data = request.data.copy()
        if 'itens' in data and isinstance(data['itens'], str):
            try:
                data['itens'] = json.loads(data['itens'])
            except json.JSONDecodeError:
                return Response(
                    {'error': 'Formato inválido para os itens da compra'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        
        anexos_data = request.FILES.getlist('anexos')
        print("Anexos data:", anexos_data)
        
        # Create the compra instance
        compra = serializer.save()
        print("Created compra:", compra)
        
        # Create anexos
        for anexo_file in anexos_data:
            anexo = AnexoCompra.objects.create(compra=compra, arquivo=anexo_file, descricao=anexo_file.name)
            print("Created anexo:", anexo)
        
        response_serializer = self.get_serializer(compra)
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def get_queryset(self):
        queryset = Compra.objects.all().select_related('obra').order_by('-data_compra')

        if self.action == 'list':
            obra_id = self.request.query_params.get('obra_id')
            if obra_id:
                queryset = queryset.filter(obra_id=obra_id)
            data_inicio_str = self.request.query_params.get('data_inicio')
            if data_inicio_str:
                try:
                    data_inicio = datetime.strptime(data_inicio_str, '%Y-%m-%d').date()
                    queryset = queryset.filter(data_compra__gte=data_inicio)
                except ValueError: pass
            data_fim_str = self.request.query_params.get('data_fim')
            if data_fim_str:
                try:
                    data_fim = datetime.strptime(data_fim_str, '%Y-%m-%d').date()
                    queryset = queryset.filter(data_compra__lte=data_fim)
                except ValueError: pass
            fornecedor = self.request.query_params.get('fornecedor')
            if fornecedor:
                queryset = queryset.filter(fornecedor__icontains=fornecedor)

            tipo = self.request.query_params.get('tipo')
            if tipo:
                queryset = queryset.filter(tipo=tipo)
            elif obra_id:
                # If listing for a specific obra, default to COMPRA only
                queryset = queryset.filter(tipo='COMPRA')
            # If no 'tipo' and no 'obra_id', all types are returned for a general list

        return queryset

    @action(detail=False, methods=['get'], url_path='semanal')
    def semanal(self, request):
        inicio_semana_str = request.query_params.get('inicio')
        obra_id_str = request.query_params.get('obra_id')
        if not inicio_semana_str:
            return Response({"error": "O parâmetro 'inicio' (data de início da semana no formato YYYY-MM-DD) é obrigatório."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            inicio_semana = date.fromisoformat(inicio_semana_str)
        except ValueError:
            return Response({"error": "Formato de data inválido para 'inicio'. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        fim_semana = inicio_semana + timedelta(days=6)

        compras_na_semana = Compra.objects.filter(
            data_compra__gte=inicio_semana,
            data_compra__lte=fim_semana,
        ).select_related('obra').order_by('data_compra')

        if obra_id_str:
            compras_na_semana = compras_na_semana.filter(obra_id=obra_id_str)

        resposta_semanal = {
            (inicio_semana + timedelta(days=i)).isoformat(): [] for i in range(7)
        }

        for compra in compras_na_semana:
            dia_str = compra.data_compra.isoformat()
            if dia_str in resposta_semanal:
                serializer = self.get_serializer(compra)
                resposta_semanal[dia_str].append(serializer.data)

        return Response(resposta_semanal)

    @action(detail=False, methods=['get'], url_path='custo_diario_chart')
    def custo_diario_chart(self, request):
        today = timezone.now().date()
        start_date = today - timedelta(days=29)
        obra_id_str = request.query_params.get('obra_id')

        compras_qs = Compra.objects.filter(
            data_compra__gte=start_date,
            data_compra__lte=today,
            tipo='COMPRA'
        )

        if obra_id_str:
            try:
                obra_id = int(obra_id_str)
                compras_qs = compras_qs.filter(obra_id=obra_id)
            except ValueError:
                return Response({"error": "ID de obra inválido."}, status=status.HTTP_400_BAD_REQUEST)

        daily_costs_db = compras_qs.values('data_compra').annotate(
            total_cost_for_day=Sum('valor_total_liquido')
        ).order_by('data_compra')

        costs_by_date_map = {
            item['data_compra']: item['total_cost_for_day']
            for item in daily_costs_db
        }

        result_data = []
        current_date = start_date
        while current_date <= today:
            cost = costs_by_date_map.get(current_date, Decimal('0.00'))
            result_data.append({
                "date": current_date.isoformat(),
                "total_cost": cost,
                "has_compras": cost > 0
            })
            current_date += timedelta(days=1)

        return Response(result_data)

    def update(self, request, *args, **kwargs):
        print("CompraViewSet: Update method called")
        print("Request data:", request.data)
        print("Request files:", request.FILES)
        
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = request.data.copy()

        # Lógica para converter 'itens' de string JSON para lista, se necessário
        if 'itens' in data and isinstance(data['itens'], str):
            try:
                data['itens'] = json.loads(data['itens'])
            except json.JSONDecodeError:
                return Response(
                    {'error': 'Formato inválido para o campo de itens.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        anexos_data = request.FILES.getlist('anexos')
        print("Anexos data:", anexos_data)
        
        self.perform_update(serializer)
        
        # Create new anexos
        for anexo_file in anexos_data:
            anexo = AnexoCompra.objects.create(compra=instance, arquivo=anexo_file, descricao=anexo_file.name)
            print("Created anexo:", anexo)
        
        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}
        
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        try:
            original_compra = self.get_object()
            new_date_str = request.data.get('new_date')
            if not new_date_str:
                return Response({'error': 'A nova data é obrigatória.'}, status=status.HTTP_400_BAD_REQUEST)

            new_date = datetime.strptime(new_date_str, '%Y-%m-%d').date()

            with transaction.atomic():
                # Create a new Compra instance by copying fields
                new_compra_data = {
                    'obra': original_compra.obra,
                    'fornecedor': original_compra.fornecedor,
                    'data_compra': new_date,
                    'nota_fiscal': original_compra.nota_fiscal,
                    'desconto': original_compra.desconto,
                    'observacoes': original_compra.observacoes,
                    'tipo': original_compra.tipo,
                    'status_orcamento': original_compra.status_orcamento,
                    'forma_pagamento': original_compra.forma_pagamento,
                    'numero_parcelas': original_compra.numero_parcelas,
                    'valor_entrada': original_compra.valor_entrada,
                }

                # Create the new Compra instance
                new_compra = Compra(**new_compra_data)

                # We need to save it first to get an ID for related items
                new_compra.save()

                # Duplicate ItemCompra
                items_to_create = []
                for item in original_compra.itens.all():
                    valor_total_item = item.quantidade * item.valor_unitario
                    items_to_create.append(ItemCompra(
                        compra=new_compra,
                        material=item.material,
                        quantidade=item.quantidade,
                        valor_unitario=item.valor_unitario,
                        valor_total_item=valor_total_item,
                        categoria_uso=item.categoria_uso
                    ))
                ItemCompra.objects.bulk_create(items_to_create)

                # After creating items, manually calculate totals and save again.
                from django.db.models import Sum
                from decimal import Decimal

                total_bruto = new_compra.itens.aggregate(
                    total=Sum('valor_total_item')
                )['total'] or Decimal('0.00')

                new_compra.valor_total_bruto = total_bruto
                new_compra.save()

            serializer = self.get_serializer(new_compra)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        compra = self.get_object()
        if compra.tipo == 'ORCAMENTO':
            compra.tipo = 'COMPRA'
            compra.save()
            return Response({'status': 'orçamento aprovado'})
        return Response({'status': 'compra já aprovada'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='bulk-pdf')
    def bulk_pdf(self, request):
        """
        Gera PDF em lote para múltiplas compras selecionadas.
        """
        compra_ids = request.data.get('compra_ids', [])
        
        if not compra_ids:
            return Response(
                {'error': 'Lista de IDs de compras é obrigatória'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            compras = Compra.objects.filter(id__in=compra_ids).prefetch_related(
                'itens__material', 'parcelas', 'anexos'
            )
            
            if not compras.exists():
                return Response(
                    {'error': 'Nenhuma compra encontrada com os IDs fornecidos'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Preparar dados das compras com anexos processados
            compras_data = []
            for compra in compras:
                anexos_processados = process_anexos_for_pdf(compra.anexos.all())
                compras_data.append({
                    'compra': compra,
                    'anexos_processados': anexos_processados
                })
            
            # Renderizar o template HTML
            html_content = render_to_string('relatorios/relatorio_compras_lote.html', {
                'compras': compras,
                'compras_data': compras_data,
                'data_geracao': timezone.now().strftime('%d/%m/%Y %H:%M:%S')
            })
            
            # Gerar PDF usando WeasyPrint
            pdf_file = HTML(string=html_content, base_url=request.build_absolute_uri()).write_pdf()
            
            # Criar resposta HTTP com o PDF
            response = HttpResponse(pdf_file, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="relatorio_compras_lote_{timezone.now().strftime("%Y%m%d_%H%M%S")}.pdf"'
            
            return response
            
        except Exception as e:
            return Response(
                {'error': f'Erro ao gerar PDF: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class HealthCheckView(APIView):
    """
    Enhanced health check endpoint for Render deployment monitoring.
    Tests database connectivity and system status.
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        from django.db import connection
        from django.conf import settings
        import os
        
        health_data = {
            'status': 'ok',
            'timestamp': timezone.now().isoformat(),
            'environment': {
                'debug': settings.DEBUG,
                'database_engine': settings.DATABASES['default']['ENGINE'],
                'allowed_hosts': settings.ALLOWED_HOSTS,
                'cors_origins': getattr(settings, 'CORS_ALLOWED_ORIGINS', []),
            }
        }
        
        # Test database connection
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                health_data['database'] = {
                    'status': 'connected',
                    'connection_name': connection.settings_dict.get('NAME', 'unknown')
                }
        except Exception as e:
            health_data['database'] = {
                'status': 'error',
                'error': str(e)
            }
            health_data['status'] = 'degraded'
        
        # Check environment variables
        env_vars = {
            'DATABASE_URL': bool(os.getenv('DATABASE_URL')),
            'SECRET_KEY': bool(os.getenv('SECRET_KEY')),
            'RENDER': bool(os.getenv('RENDER')),
        }
        health_data['environment']['env_vars'] = env_vars
        
        return Response(health_data, status=status.HTTP_200_OK)

class RelatorioPagamentoViewSet(viewsets.ViewSet):
    permission_classes = [IsNivelAdmin | IsNivelGerente]

    def _get_locacoes(self, start_date, end_date, filtro_locacao):
        date_filter = Q(data_pagamento__range=[start_date, end_date]) | \
                      (Q(data_pagamento__isnull=True) & Q(data_locacao_inicio__range=[start_date, end_date]))

        locacoes_qs = Locacao_Obras_Equipes.objects.filter(date_filter, status_locacao='ativa').select_related('obra', 'funcionario_locado', 'equipe')

        if filtro_locacao == 'servicos':
            locacoes_qs = locacoes_qs.filter(servico_externo__isnull=False).exclude(servico_externo__exact='')
        elif filtro_locacao == 'funcionarios_e_equipes':
            locacoes_qs = locacoes_qs.filter(Q(funcionario_locado__isnull=False) | Q(equipe__isnull=False))

        return locacoes_qs

    @action(detail=False, methods=['get'], url_path='pre-check')
    def pre_check(self, request):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        tipo = request.query_params.get('tipo')
        filtro_locacao = request.query_params.get('filtro_locacao')

        if not all([start_date_str, end_date_str, tipo]):
            return Response({"error": "Parâmetros start_date, end_date e tipo são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            start_date = date.fromisoformat(start_date_str)
            end_date = date.fromisoformat(end_date_str)
        except ValueError:
            return Response({"error": "Formato de data inválido. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        if start_date > end_date:
            return Response({"error": "start_date não pode ser posterior a end_date."}, status=status.HTTP_400_BAD_REQUEST)

        all_dates_in_range = {start_date + timedelta(days=i) for i in range((end_date - start_date).days + 1)}
        dates_with_entries = set()

        if tipo == 'compras':
            compras = Compra.objects.filter(data_pagamento__range=[start_date, end_date], tipo='COMPRA')
            dates_with_entries = set(compras.values_list('data_pagamento', flat=True))
        elif tipo == 'locacoes':
            locacoes = self._get_locacoes(start_date, end_date, filtro_locacao)
            for loc in locacoes:
                the_date = loc.data_pagamento if loc.data_pagamento else loc.data_locacao_inicio
                if start_date <= the_date <= end_date:
                    dates_with_entries.add(the_date)
        else:
            return Response({"error": "Tipo de relatório inválido. Use 'compras' ou 'locacoes'."}, status=status.HTTP_400_BAD_REQUEST)

        dias_sem_registros = sorted([dt.isoformat() for dt in (all_dates_in_range - dates_with_entries)])

        return Response({'dias_sem_registros': dias_sem_registros})

    def _get_locacoes_report_data(self, locacoes, start_date, end_date):
        pagamentos_por_recurso = defaultdict(lambda: {
            "recurso_nome": "",
            "total_a_pagar_periodo": Decimal('0.00'),
            "detalhes_por_obra": defaultdict(lambda: {
                "obra_id": None, "obra_nome": "",
                "total_a_pagar_obra": Decimal('0.00'),
                "locacoes_na_obra": []
            })
        })
        grand_total_geral = Decimal('0.00')

        for locacao in locacoes:
            recurso_nome = get_recurso_nome_folha(locacao)
            obra_nome = locacao.obra.nome_obra if locacao.obra else "Obra Desconhecida"
            obra_id = locacao.obra.id if locacao.obra else 0
            valor_pagamento = locacao.valor_pagamento or Decimal('0.00')

            recurso_data = pagamentos_por_recurso[recurso_nome]
            recurso_data["recurso_nome"] = recurso_nome
            recurso_data["total_a_pagar_periodo"] += valor_pagamento

            obra_details = recurso_data["detalhes_por_obra"][obra_id]
            obra_details["obra_id"] = obra_id
            obra_details["obra_nome"] = obra_nome
            obra_details["total_a_pagar_obra"] += valor_pagamento

            obra_details["locacoes_na_obra"].append({
                "locacao_id": locacao.id,
                "data_servico": locacao.data_pagamento if locacao.data_pagamento else locacao.data_locacao_inicio,
                "tipo_pagamento": locacao.get_tipo_pagamento_display(),
                "valor_atribuido": str(valor_pagamento),
                "observacoes": locacao.observacoes or ""
            })
            grand_total_geral += valor_pagamento

        final_recursos_list = []
        for rec_nome, rec_data in sorted(pagamentos_por_recurso.items()):
            rec_data["total_a_pagar_periodo"] = str(rec_data["total_a_pagar_periodo"])
            obras_list = []
            for ob_id, ob_data in sorted(rec_data["detalhes_por_obra"].items(), key=lambda item: item[1]['obra_nome']):
                ob_data["total_a_pagar_obra"] = str(ob_data["total_a_pagar_obra"])
                ob_data["locacoes_na_obra"].sort(key=lambda x: x["data_servico"])
                obras_list.append(ob_data)
            rec_data["detalhes_por_obra"] = obras_list
            final_recursos_list.append(rec_data)

        final_recursos_list.sort(key=lambda x: x["recurso_nome"])

        return {
            "periodo": {"inicio": start_date, "fim": end_date},
            "recursos_pagamentos": final_recursos_list,
            "total_geral_periodo": str(grand_total_geral)
        }

    def _get_compras_report_data(self, compras_qs, start_date, end_date):
        pagamentos_por_fornecedor = defaultdict(lambda: {
            "fornecedor_nome": "",
            "total_a_pagar_periodo": Decimal('0.00'),
            "detalhes_por_obra": defaultdict(lambda: {
                "obra_id": None, "obra_nome": "",
                "total_a_pagar_obra": Decimal('0.00'),
                "compras_na_obra": []
            })
        })
        grand_total_geral = Decimal('0.00')

        compras_qs = compras_qs.select_related('obra').prefetch_related('itens__material')

        for compra in compras_qs:
            fornecedor_nome = compra.fornecedor or "Fornecedor não especificado"
            obra_nome = compra.obra.nome_obra if compra.obra else "Obra Desconhecida"
            obra_id = compra.obra.id if compra.obra else 0
            valor_pagamento = compra.valor_total_liquido or Decimal('0.00')

            fornecedor_data = pagamentos_por_fornecedor[fornecedor_nome]
            fornecedor_data["fornecedor_nome"] = fornecedor_nome
            fornecedor_data["total_a_pagar_periodo"] += valor_pagamento

            obra_details = fornecedor_data["detalhes_por_obra"][obra_id]
            obra_details["obra_id"] = obra_id
            obra_details["obra_nome"] = obra_nome
            obra_details["total_a_pagar_obra"] += valor_pagamento

            items_serializer = ItemCompraSerializer(compra.itens.all(), many=True)

            obra_details["compras_na_obra"].append({
                "compra_id": compra.id,
                "data_pagamento": compra.data_pagamento,
                "nota_fiscal": compra.nota_fiscal,
                "valor_total_liquido": str(valor_pagamento),
                "observacoes": compra.observacoes or "",
                "itens": items_serializer.data,
                "forma_pagamento": compra.get_forma_pagamento_display(),
                "numero_parcelas": compra.numero_parcelas,
            })
            grand_total_geral += valor_pagamento

        final_fornecedores_list = []
        for f_nome, f_data in sorted(pagamentos_por_fornecedor.items()):
            f_data["total_a_pagar_periodo"] = str(f_data["total_a_pagar_periodo"])
            obras_list = []
            for o_id, o_data in sorted(f_data["detalhes_por_obra"].items(), key=lambda item: item[1]['obra_nome']):
                o_data["total_a_pagar_obra"] = str(o_data["total_a_pagar_obra"])
                o_data["compras_na_obra"].sort(key=lambda x: x["data_pagamento"] or date.min)
                obras_list.append(o_data)
            f_data["detalhes_por_obra"] = obras_list
            final_fornecedores_list.append(f_data)

        final_fornecedores_list.sort(key=lambda x: x["fornecedor_nome"])

        return {
            "periodo": {"inicio": start_date, "fim": end_date},
            "fornecedores_pagamentos": final_fornecedores_list,
            "total_geral_periodo": str(grand_total_geral)
        }

    @action(detail=False, methods=['get'], url_path='generate')
    def generate_report(self, request):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        tipo = request.query_params.get('tipo')
        filtro_locacao = request.query_params.get('filtro_locacao')

        if not all([start_date_str, end_date_str, tipo]):
            return Response({"error": "Parâmetros start_date, end_date e tipo são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            start_date = date.fromisoformat(start_date_str)
            end_date = date.fromisoformat(end_date_str)
        except ValueError:
            return Response({"error": "Formato de data inválido. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        if start_date > end_date:
            return Response({"error": "start_date não pode ser posterior a end_date."}, status=status.HTTP_400_BAD_REQUEST)

        if tipo == 'compras':
            compras_qs = Compra.objects.filter(
                data_pagamento__range=[start_date, end_date],
                tipo='COMPRA'
            ).order_by('data_pagamento')
            report_data = self._get_compras_report_data(compras_qs, start_date, end_date)
            # Convert date objects to strings for JSON serialization
            report_data['periodo']['inicio'] = report_data['periodo']['inicio'].isoformat()
            report_data['periodo']['fim'] = report_data['periodo']['fim'].isoformat()
            for f in report_data['fornecedores_pagamentos']:
                for o in f['detalhes_por_obra']:
                    for c in o['compras_na_obra']:
                        if c['data_pagamento']:
                            c['data_pagamento'] = c['data_pagamento'].isoformat()
            return Response(report_data)

        elif tipo == 'locacoes':
            locacoes = self._get_locacoes(start_date, end_date, filtro_locacao)
            report_data = self._get_locacoes_report_data(locacoes, start_date, end_date)
            # Convert date objects to strings for JSON serialization
            report_data['periodo']['inicio'] = report_data['periodo']['inicio'].isoformat()
            report_data['periodo']['fim'] = report_data['periodo']['fim'].isoformat()
            for r in report_data['recursos_pagamentos']:
                for o in r['detalhes_por_obra']:
                    for l in o['locacoes_na_obra']:
                        l['data_servico'] = l['data_servico'].isoformat()
            return Response(report_data)

        else:
            return Response({"error": "Tipo de relatório inválido. Use 'compras' ou 'locacoes'."}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='generate-pdf')
    def generate_pdf(self, request):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        tipo = request.query_params.get('tipo')
        filtro_locacao = request.query_params.get('filtro_locacao')
        obra_id_str = request.query_params.get('obra_id')

        if not all([start_date_str, end_date_str, tipo]):
            return Response({"error": "Parâmetros start_date, end_date e tipo são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            start_date = date.fromisoformat(start_date_str)
            end_date = date.fromisoformat(end_date_str)
        except ValueError:
            return Response({"error": "Formato de data inválido. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        if start_date > end_date:
            return Response({"error": "start_date não pode ser posterior a end_date."}, status=status.HTTP_400_BAD_REQUEST)

        if tipo == 'compras':
            compras_qs = Compra.objects.filter(
                data_pagamento__range=[start_date, end_date],
                tipo='COMPRA'
            ).order_by('data_pagamento')
            context = self._get_compras_report_data(compras_qs, start_date, end_date)
            context['data_emissao'] = timezone.now()
            template_path = 'relatorios/relatorio_pagamento_compras.html'
            css_path = os.path.join(settings.BASE_DIR, 'core', 'static', 'css', 'relatorio_compras.css')
            filename = f'relatorio_pagamento_compras_{start_date_str}_a_{end_date_str}.pdf'
            return generate_pdf_response(template_path, context, css_path, filename)

        elif tipo == 'locacoes':
            locacoes = self._get_locacoes(start_date, end_date, filtro_locacao)
            context = self._get_locacoes_report_data(locacoes, start_date, end_date)
            context['data_emissao'] = timezone.now()
            context['obra_filter_nome'] = None
            if obra_id_str:
                try:
                    context['obra_filter_nome'] = Obra.objects.get(pk=int(obra_id_str)).nome_obra
                except (Obra.DoesNotExist, ValueError):
                    pass

            template_path = 'relatorios/relatorio_pagamento_locacoes.html'
            css_path = os.path.join(settings.BASE_DIR, 'core', 'static', 'css', 'relatorio_pagamento_locacoes.css')
            filename = f'relatorio_pagamento_locacoes_{start_date_str}_a_{end_date_str}.pdf'
            return generate_pdf_response(template_path, context, css_path, filename)

        else:
            return Response({"error": "Tipo de relatório inválido. Use 'compras' ou 'locacoes'."}, status=status.HTTP_400_BAD_REQUEST)


class DespesaExtraViewSet(viewsets.ModelViewSet):
    serializer_class = DespesaExtraSerializer
    permission_classes = [IsNivelAdmin | IsNivelGerente]

    def get_queryset(self):
        queryset = Despesa_Extra.objects.all().order_by('-data')
        obra_id = self.request.query_params.get('obra_id', None)
        if obra_id:
            queryset = queryset.filter(obra_id=obra_id)
        return queryset

    def create(self, request, *args, **kwargs):
        print("DespesaExtraViewSet: Create method called")
        print("Request data:", request.data)
        print("Request files:", request.FILES)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        anexos_data = request.FILES.getlist('anexos')
        print("Anexos data:", anexos_data)
        validated_data = serializer.validated_data
        validated_data.pop('anexos', None)

        despesa = Despesa_Extra.objects.create(**validated_data)
        print("Created despesa:", despesa)
        for anexo_file in anexos_data:
            anexo = AnexoDespesa.objects.create(despesa=despesa, anexo=anexo_file, descricao=anexo_file.name)
            print("Created anexo:", anexo)

        response_serializer = self.get_serializer(despesa)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        print("DespesaExtraViewSet: Update method called")
        print("Request data:", request.data)
        print("Request files:", request.FILES)
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        anexos_data = request.FILES.getlist('anexos')
        print("Anexos data:", anexos_data)

        self.perform_update(serializer)

        for anexo_file in anexos_data:
            anexo = AnexoDespesa.objects.create(despesa=instance, anexo=anexo_file, descricao=anexo_file.name)
            print("Created anexo:", anexo)

        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been used, we need to manually update the prefetch cache.
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)


class OcorrenciaFuncionarioViewSet(viewsets.ModelViewSet):
    queryset = Ocorrencia_Funcionario.objects.all()
    serializer_class = OcorrenciaFuncionarioSerializer
    permission_classes = [IsNivelAdmin | IsNivelGerente]
    def get_queryset(self):
        queryset = Ocorrencia_Funcionario.objects.all().select_related('funcionario').order_by('-data')
        data_inicio_str = self.request.query_params.get('data_inicio')
        data_fim_str = self.request.query_params.get('data_fim')
        funcionario_id_str = self.request.query_params.get('funcionario_id')
        tipo_ocorrencia_str = self.request.query_params.get('tipo')
        if data_inicio_str:
            try:
                data_inicio = datetime.strptime(data_inicio_str, '%Y-%m-%d').date()
                queryset = queryset.filter(data__gte=data_inicio)
            except ValueError: pass
        if data_fim_str:
            try:
                data_fim = datetime.strptime(data_fim_str, '%Y-%m-%d').date()
                queryset = queryset.filter(data__lte=data_fim)
            except ValueError: pass
        if funcionario_id_str:
            try:
                funcionario_id = int(funcionario_id_str)
                queryset = queryset.filter(funcionario_id=funcionario_id)
            except ValueError: pass
        if tipo_ocorrencia_str:
            queryset = queryset.filter(tipo=tipo_ocorrencia_str)
        return queryset


# Reports Views
class RelatorioFinanceiroObraView(APIView):
    permission_classes = [IsNivelAdmin | IsNivelGerente]
    def get(self, request, *args, **kwargs):
        obra_id = request.query_params.get('obra_id')
        data_inicio_str = request.query_params.get('data_inicio')
        data_fim_str = request.query_params.get('data_fim')
        if not all([obra_id, data_inicio_str, data_fim_str]):
            return Response({"error": "Parâmetros obra_id, data_inicio e data_fim são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            obra_id = int(obra_id)
            data_inicio = datetime.strptime(data_inicio_str, '%Y-%m-%d').date()
            data_fim = datetime.strptime(data_fim_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({"error": "Formato inválido para obra_id ou datas (esperado YYYY-MM-DD)."}, status=status.HTTP_400_BAD_REQUEST)
        if data_inicio > data_fim:
            return Response({"error": "A data_inicio não pode ser posterior à data_fim."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            obra = Obra.objects.get(pk=obra_id)
        except Obra.DoesNotExist:
            return Response({"error": f"Obra com id {obra_id} não encontrada."}, status=status.HTTP_404_NOT_FOUND)
        compras = Compra.objects.filter(obra_id=obra_id, data_compra__gte=data_inicio, data_compra__lte=data_fim, tipo='COMPRA')
        despesas_extras = Despesa_Extra.objects.filter(obra_id=obra_id, data__gte=data_inicio, data__lte=data_fim)
        total_compras = compras.aggregate(total=Sum('valor_total_liquido'))['total'] or Decimal('0.00')
        total_despesas_extras = despesas_extras.aggregate(total=Sum('valor'))['total'] or Decimal('0.00')
        custo_total_geral = total_compras + total_despesas_extras
        return Response({
            "obra_id": obra_id, "nome_obra": obra.nome_obra,
            "data_inicio": data_inicio_str, "data_fim": data_fim_str,
            "total_compras": total_compras, "total_despesas_extras": total_despesas_extras,
            "custo_total_geral": custo_total_geral
        })

class RelatorioGeralComprasView(APIView):
    permission_classes = [IsNivelAdmin | IsNivelGerente]
    def get(self, request, *args, **kwargs):
        data_inicio_str = request.query_params.get('data_inicio')
        data_fim_str = request.query_params.get('data_fim')
        obra_id_str = request.query_params.get('obra_id')
        if not all([data_inicio_str, data_fim_str]):
            return Response({"error": "Parâmetros data_inicio e data_fim são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            data_inicio = datetime.strptime(data_inicio_str, '%Y-%m-%d').date()
            data_fim = datetime.strptime(data_fim_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({"error": "Formato inválido para datas (esperado YYYY-MM-DD)."}, status=status.HTTP_400_BAD_REQUEST)
        if data_inicio > data_fim:
            return Response({"error": "A data_inicio não pode ser posterior à data_fim."}, status=status.HTTP_400_BAD_REQUEST)
        filters = Q(data_compra__gte=data_inicio) & Q(data_compra__lte=data_fim)
        applied_filters_echo = {"data_inicio": data_inicio_str, "data_fim": data_fim_str}
        if obra_id_str:
            try:
                obra_id = int(obra_id_str)
                filters &= Q(obra_id=obra_id)
                applied_filters_echo["obra_id"] = obra_id
            except ValueError:
                return Response({"error": "obra_id deve ser um número inteiro."}, status=status.HTTP_400_BAD_REQUEST)
        fornecedor_param = request.query_params.get('fornecedor')
        if fornecedor_param:
            filters &= Q(fornecedor__icontains=fornecedor_param)
            applied_filters_echo["fornecedor"] = fornecedor_param
        compras_qs = Compra.objects.filter(filters, tipo='COMPRA').distinct()
        soma_total_compras = compras_qs.aggregate(total=Sum('valor_total_liquido'))['total'] or Decimal('0.00')
        serializer = CompraSerializer(compras_qs, many=True)
        return Response({
            "filtros": applied_filters_echo, "soma_total_compras": soma_total_compras,
            "compras": serializer.data
        })

from django.db.models import Sum, Count, F, DecimalField # django.utils.timezone already imported

class DashboardStatsView(APIView):
    permission_classes = [IsNivelAdmin | IsNivelGerente]
    def get(self, request, *args, **kwargs):
        obras_em_andamento = Obra.objects.filter(status='Em Andamento').count()
        current_month = timezone.now().month
        current_year = timezone.now().year
        custo_compras_mes = Compra.objects.filter(data_compra__year=current_year, data_compra__month=current_month, tipo='COMPRA').aggregate(total=Sum('valor_total_liquido'))['total'] or Decimal('0.00')
        custo_despesas_extras_mes = Despesa_Extra.objects.filter(data__year=current_year, data__month=current_month).aggregate(total=Sum('valor'))['total'] or Decimal('0.00')
        custo_total_mes_corrente = custo_compras_mes + custo_despesas_extras_mes
        total_funcionarios = Funcionario.objects.count()
        stats = {
            "obras_em_andamento": obras_em_andamento,
            "custo_total_mes_corrente": custo_total_mes_corrente,
            "total_funcionarios": total_funcionarios
        }
        return Response(stats)

class RelatorioDesempenhoEquipeView(APIView):
    permission_classes = [IsNivelAdmin | IsNivelGerente]
    def get(self, request, *args, **kwargs):
        equipe_id_str = request.query_params.get('equipe_id')
        data_inicio_str = request.query_params.get('data_inicio')
        data_fim_str = request.query_params.get('data_fim')
        if not equipe_id_str:
            return Response({"error": "Parâmetro equipe_id é obrigatório."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            equipe_id = int(equipe_id_str)
        except ValueError:
            return Response({"error": "Parâmetro equipe_id deve ser um número inteiro."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            equipe = Equipe.objects.get(pk=equipe_id)
        except Equipe.DoesNotExist:
            return Response({"error": f"Equipe com id {equipe_id} não encontrada."}, status=status.HTTP_404_NOT_FOUND)
        filters = Q(equipe_id=equipe_id)
        applied_filters_echo = {"equipe_id": equipe_id, "nome_equipe": equipe.nome_equipe}
        if data_inicio_str:
            try:
                data_inicio = datetime.strptime(data_inicio_str, '%Y-%m-%d').date()
                filters &= Q(data_locacao_inicio__gte=data_inicio)
                applied_filters_echo["data_inicio"] = data_inicio_str
            except ValueError:
                return Response({"error": "Formato inválido para data_inicio (esperado YYYY-MM-DD)."}, status=status.HTTP_400_BAD_REQUEST)
        if data_fim_str:
            try:
                data_fim = datetime.strptime(data_fim_str, '%Y-%m-%d').date()
                filters &= Q(Q(data_locacao_fim__lte=data_fim) | Q(data_locacao_fim__isnull=True))
                applied_filters_echo["data_fim"] = data_fim_str
            except ValueError:
                return Response({"error": "Formato inválido para data_fim (esperado YYYY-MM-DD)."}, status=status.HTTP_400_BAD_REQUEST)
        if data_inicio_str and data_fim_str and data_inicio > data_fim: # type: ignore
            return Response({"error": "A data_inicio não pode ser posterior à data_fim."}, status=status.HTTP_400_BAD_REQUEST)
        alocacoes = Locacao_Obras_Equipes.objects.filter(filters).select_related('obra').order_by('data_locacao_inicio')
        data = []
        for alocacao in alocacoes:
            data.append({
                "id": alocacao.id, "obra_id": alocacao.obra.id, "obra_nome": alocacao.obra.nome_obra,
                "equipe_id": alocacao.equipe.id, "equipe_nome": alocacao.equipe.nome_equipe,
                "data_locacao_inicio": alocacao.data_locacao_inicio, "data_locacao_fim": alocacao.data_locacao_fim,
            })
        return Response({"filtros": applied_filters_echo, "alocacoes": data})

class RelatorioCustoGeralView(APIView):
    permission_classes = [IsNivelAdmin | IsNivelGerente]
    def get(self, request, *args, **kwargs):
        data_inicio_str = request.query_params.get('data_inicio')
        data_fim_str = request.query_params.get('data_fim')
        if not data_inicio_str or not data_fim_str:
            return Response({"error": "Parâmetros data_inicio e data_fim são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            data_inicio = datetime.strptime(data_inicio_str, '%Y-%m-%d').date()
            data_fim = datetime.strptime(data_fim_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({"error": "Formato inválido para datas (esperado YYYY-MM-DD)."}, status=status.HTTP_400_BAD_REQUEST)
        if data_inicio > data_fim:
            return Response({"error": "A data_inicio não pode ser posterior à data_fim."}, status=status.HTTP_400_BAD_REQUEST)
        applied_filters_echo = {"data_inicio": data_inicio_str, "data_fim": data_fim_str}
        total_compras = Compra.objects.filter(data_compra__gte=data_inicio, data_compra__lte=data_fim, tipo='COMPRA').aggregate(total=Sum('valor_total_liquido', output_field=DecimalField()))['total'] or Decimal('0.00')
        total_despesas_extras = Despesa_Extra.objects.filter(data__gte=data_inicio, data__lte=data_fim).aggregate(total=Sum('valor', output_field=DecimalField()))['total'] or Decimal('0.00')
        custo_consolidado_total = total_compras + total_despesas_extras
        return Response({
            "filtros": applied_filters_echo, "total_compras": total_compras,
            "total_despesas_extras": total_despesas_extras, "custo_consolidado_total": custo_consolidado_total
        })

from django.db.models.functions import TruncMonth
class ObraHistoricoCustosView(APIView):
    permission_classes = [IsNivelAdmin | IsNivelGerente]
    def get(self, request, pk, format=None):
        try:
            obra = Obra.objects.get(pk=pk)
        except Obra.DoesNotExist:
            return Response({"error": "Obra não encontrada."}, status=status.HTTP_404_NOT_FOUND)
        custos_compras = Compra.objects.filter(obra=obra, tipo='COMPRA').annotate(mes=TruncMonth('data_compra')).values('mes').annotate(total_compras=Sum('valor_total_liquido')).order_by('mes')
        custos_despesas = Despesa_Extra.objects.filter(obra=obra).annotate(mes=TruncMonth('data')).values('mes').annotate(total_despesas=Sum('valor')).order_by('mes')
        historico = {}
        for compra in custos_compras:
            if compra['mes'] is None: continue
            mes_str = compra['mes'].strftime('%Y-%m')
            if mes_str not in historico: historico[mes_str] = {'compras': Decimal('0.00'), 'despesas_extras': Decimal('0.00')}
            historico[mes_str]['compras'] += compra['total_compras'] or Decimal('0.00')
        for despesa in custos_despesas:
            if despesa['mes'] is None: continue
            mes_str = despesa['mes'].strftime('%Y-%m')
            if mes_str not in historico: historico[mes_str] = {'compras': Decimal('0.00'), 'despesas_extras': Decimal('0.00')}
            historico[mes_str]['despesas_extras'] += despesa['total_despesas'] or Decimal('0.00')
        resultado_final = []
        for mes, totais in sorted(historico.items()):
            resultado_final.append({
                'mes': mes, 'total_custo_compras': totais['compras'],
                'total_custo_despesas': totais['despesas_extras'],
                'total_geral_mes': totais['compras'] + totais['despesas_extras']
            })
        return Response(resultado_final)

class ObraCustosPorCategoriaView(APIView):
    permission_classes = [IsNivelAdmin | IsNivelGerente]
    def get(self, request, pk, format=None):
        try:
            obra = Obra.objects.get(pk=pk)
        except Obra.DoesNotExist:
            return Response({"error": "Obra não encontrada."}, status=status.HTTP_404_NOT_FOUND)
        custos_por_categoria = Despesa_Extra.objects.filter(obra=obra).values('categoria').annotate(total_valor=Sum('valor')).order_by('-total_valor')
        resultado_formatado = [{'name': item['categoria'], 'value': item['total_valor'] or Decimal('0.00')} for item in custos_por_categoria if item['total_valor'] is not None]
        return Response(resultado_formatado)

from collections import defaultdict
from django.utils.dateparse import parse_date


# Helper function to get resource name
def get_recurso_nome_folha(locacao_instance):
    if locacao_instance.funcionario_locado:
        return f"Funcionário: {locacao_instance.funcionario_locado.nome_completo}"
    elif locacao_instance.equipe:
        return f"Equipe: {locacao_instance.equipe.nome_equipe}"
    elif locacao_instance.servico_externo:
        return f"Serviço Externo: {locacao_instance.servico_externo}"
    return "N/A"

class RelatorioFolhaPagamentoViewSet(viewsets.ViewSet):
    permission_classes = [IsNivelAdmin | IsNivelGerente]

    def _get_locacoes_no_periodo(self, start_date, end_date, obra_id_filter=None):
        filters = Q(
            Q(data_locacao_inicio__gte=start_date) & Q(data_locacao_inicio__lte=end_date) &
            (Q(data_pagamento__isnull=True) | Q(data_pagamento__lte=end_date)) & # Considera pagamentos previstos dentro ou após o período, ou não definidos
            (Q(funcionario_locado__isnull=False) | Q(equipe__isnull=False) | (Q(servico_externo__isnull=False) & ~Q(servico_externo=''))) &
            Q(status_locacao='ativa') &
            Q(valor_pagamento__isnull=False) & Q(valor_pagamento__gt=Decimal('0.00'))
        )
        if obra_id_filter:
            filters &= Q(obra_id=obra_id_filter)

        return Locacao_Obras_Equipes.objects.filter(filters).select_related(
            'obra', 'funcionario_locado', 'equipe'
        ).order_by('obra__nome_obra', 'data_locacao_inicio')

    def _calculate_daily_cost(self, locacao, current_day_in_loop, start_date_period, end_date_period):
        """
        Calculates the cost of a locacao for a specific day within the reporting period.
        Only attributes cost if current_day_in_loop is within the locacao's effective range AND the reporting period.
        """
        cost_for_day = Decimal('0.00')

        # Ensure the current day is within the locacao's own start/end dates
        if not (locacao.data_locacao_inicio <= current_day_in_loop <= (locacao.data_locacao_fim or date.max)): # type: ignore
            return cost_for_day

        # Ensure the current day is within the overall report period
        if not (start_date_period <= current_day_in_loop <= end_date_period):
            return cost_for_day

        if locacao.tipo_pagamento == 'diaria':
            cost_for_day = locacao.valor_pagamento or Decimal('0.00')
        elif locacao.tipo_pagamento in ['metro', 'empreitada']:
            # For non-daily, cost is attributed entirely to the start date of the locacao,
            # but only if that start date falls within the report period.
            if locacao.data_locacao_inicio == current_day_in_loop:
                cost_for_day = locacao.valor_pagamento or Decimal('0.00')
        return cost_for_day

    @action(detail=False, methods=['get'], url_path='generate_report_data_for_pdf')
    def generate_report_data_for_pdf(self, request):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        obra_id_filter_str = request.query_params.get('obra_id') # Optional filter

        if not start_date_str or not end_date_str:
            return Response({"error": "Parâmetros start_date e end_date são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            start_date = date.fromisoformat(start_date_str)
            end_date = date.fromisoformat(end_date_str)
        except ValueError:
            return Response({"error": "Formato de data inválido. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        if start_date > end_date:
            return Response({"error": "start_date não pode ser posterior a end_date."}, status=status.HTTP_400_BAD_REQUEST)

        obra_id_filter = None
        if obra_id_filter_str:
            try:
                obra_id_filter = int(obra_id_filter_str)
            except ValueError:
                return Response({"error": "obra_id deve ser um número inteiro."}, status=status.HTTP_400_BAD_REQUEST)


        locacoes_periodo = self._get_locacoes_no_periodo(start_date, end_date, obra_id_filter)

        pagamentos_por_recurso = defaultdict(lambda: {
            "recurso_nome": "",
            "total_a_pagar_periodo": Decimal('0.00'),
            "detalhes_por_obra": defaultdict(lambda: {
                "obra_id": None,
                "obra_nome": "",
                "total_a_pagar_obra": Decimal('0.00'),
                "locacoes_na_obra": [] # Stores {data_servico, tipo_pagamento, valor_atribuido, locacao_id}
            })
        })
        grand_total_geral = Decimal('0.00')

        # Iterate through each day in the period to correctly attribute daily costs
        current_period_day = start_date
        while current_period_day <= end_date:
            for locacao in locacoes_periodo:
                # We only process locacoes that are active on current_period_day
                # and whose start_date is within the overall report period (covered by _get_locacoes_no_periodo)
                # and whose own activity range [locacao.data_locacao_inicio, locacao.data_locacao_fim] includes current_period_day

                locacao_starts_in_period = locacao.data_locacao_inicio >= start_date
                locacao_ends_in_period = (locacao.data_locacao_fim or date.max) <= end_date # type: ignore

                # Check if the current_period_day is within the locacao's active duration
                if not (locacao.data_locacao_inicio <= current_period_day <= (locacao.data_locacao_fim or current_period_day)): # type: ignore
                    continue

                valor_atribuido_ao_dia = self._calculate_daily_cost(locacao, current_period_day, start_date, end_date)

                if valor_atribuido_ao_dia > Decimal('0.00'):
                    recurso_nome = get_recurso_nome_folha(locacao)
                    obra_nome = locacao.obra.nome_obra if locacao.obra else "Obra Desconhecida"
                    obra_id = locacao.obra.id if locacao.obra else 0

                    recurso_data = pagamentos_por_recurso[recurso_nome]
                    recurso_data["recurso_nome"] = recurso_nome
                    recurso_data["total_a_pagar_periodo"] += valor_atribuido_ao_dia

                    obra_details = recurso_data["detalhes_por_obra"][obra_id]
                    obra_details["obra_id"] = obra_id
                    obra_details["obra_nome"] = obra_nome
                    obra_details["total_a_pagar_obra"] += valor_atribuido_ao_dia

                    obra_details["locacoes_na_obra"].append({
                        "locacao_id": locacao.id,
                        "data_servico": current_period_day.isoformat(),
                        "tipo_pagamento": locacao.get_tipo_pagamento_display(),
                        "valor_atribuido": str(valor_atribuido_ao_dia),
                        "observacoes": locacao.observacoes or ""
                    })
                    grand_total_geral += valor_atribuido_ao_dia
            current_period_day += timedelta(days=1)


        # Convert to list and format decimals as strings
        final_recursos_list = []
        for rec_nome, rec_data in sorted(pagamentos_por_recurso.items()):
            rec_data["total_a_pagar_periodo"] = str(rec_data["total_a_pagar_periodo"])
            obras_list = []
            for ob_id, ob_data in sorted(rec_data["detalhes_por_obra"].items(), key=lambda item: item[1]['obra_nome']):
                ob_data["total_a_pagar_obra"] = str(ob_data["total_a_pagar_obra"])
                # Sort locacoes by date
                ob_data["locacoes_na_obra"].sort(key=lambda x: x["data_servico"])
                obras_list.append(ob_data)
            rec_data["detalhes_por_obra"] = obras_list
            final_recursos_list.append(rec_data)

        final_recursos_list.sort(key=lambda x: x["recurso_nome"])


        return Response({
            "periodo": {"inicio": start_date_str, "fim": end_date_str},
            "recursos_pagamentos": final_recursos_list,
            "total_geral_periodo": str(grand_total_geral)
        })

    @action(detail=False, methods=['get'], url_path='pre_check_dias_sem_locacoes')
    def pre_check_dias_sem_locacoes(self, request):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        if not start_date_str or not end_date_str:
            return Response({"error": "Parâmetros start_date e end_date são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            start_date = date.fromisoformat(start_date_str)
            end_date = date.fromisoformat(end_date_str)
        except ValueError:
            return Response({"error": "Formato de data inválido. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)
        if start_date > end_date:
            return Response({"error": "start_date não pode ser posterior a end_date."}, status=status.HTTP_400_BAD_REQUEST)

        all_dates_in_range = {start_date + timedelta(days=i) for i in range((end_date - start_date).days + 1)}

        # Correctly filter for multi-day rentals that overlap with the selected period
        locacoes_no_periodo = Locacao_Obras_Equipes.objects.filter(
            data_locacao_inicio__lte=end_date,
            data_locacao_fim__gte=start_date,
            status_locacao='ativa'
        )

        locacoes_dates_set = set()
        for locacao in locacoes_no_periodo:
            # Iterate from the rental's start date to its end date
            current_loc_date = locacao.data_locacao_inicio
            while current_loc_date <= locacao.data_locacao_fim:
                # Add the date to the set if it's within the report's range
                if start_date <= current_loc_date <= end_date:
                    locacoes_dates_set.add(current_loc_date)
                current_loc_date += timedelta(days=1)

        dias_sem_locacoes = sorted([dt.isoformat() for dt in (all_dates_in_range - locacoes_dates_set)])

        # The logic for medicoes_pendentes should also consider overlapping rentals
        medicoes_pendentes_qs = Locacao_Obras_Equipes.objects.filter(
            Q(data_locacao_inicio__lte=end_date) & Q(data_locacao_fim__gte=start_date) &
            Q(status_locacao='ativa') &
            (Q(valor_pagamento__isnull=True) | Q(valor_pagamento=Decimal('0.00')))
        ).select_related('obra', 'funcionario_locado', 'equipe').distinct()

        medicoes_pendentes_list = []
        for loc in medicoes_pendentes_qs:
            recurso_locado_str = get_recurso_nome_folha(loc)
            medicoes_pendentes_list.append({
                'locacao_id': loc.id,
                'obra_nome': loc.obra.nome_obra if loc.obra else "Obra não especificada",
                'recurso_locado': recurso_locado_str,
                'data_inicio': loc.data_locacao_inicio.isoformat(),
                'tipo_pagamento': loc.get_tipo_pagamento_display(),
                'valor_pagamento': loc.valor_pagamento
            })

        return Response({'dias_sem_locacoes': dias_sem_locacoes, 'medicoes_pendentes': medicoes_pendentes_list})

    @action(detail=False, methods=['get'], url_path='generate_report')
    def generate_report(self, request): # This is for CSV / original structure
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date') # type: ignore
        obra_id_filter_str = request.query_params.get('obra_id') # Optional filter

        if not start_date_str or not end_date_str:
            return Response({"error": "Parâmetros start_date e end_date são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            start_date = date.fromisoformat(start_date_str) # type: ignore
            end_date = date.fromisoformat(end_date_str) # type: ignore
        except ValueError:
            return Response({"error": "Formato de data inválido. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)
        if start_date > end_date: # type: ignore
            return Response({"error": "start_date não pode ser posterior a end_date."}, status=status.HTTP_400_BAD_REQUEST)

        obra_id_filter = None
        if obra_id_filter_str:
            try:
                obra_id_filter = int(obra_id_filter_str)
            except ValueError:
                return Response({"error": "obra_id deve ser um número inteiro."}, status=status.HTTP_400_BAD_REQUEST)


        locacoes_periodo = self._get_locacoes_no_periodo(start_date, end_date, obra_id_filter) # type: ignore

        # Data structure: Obra -> Dia -> Locações
        report_data_by_obra = defaultdict(lambda: {
            "obra_id": None, "obra_nome": "",
            "dias": defaultdict(lambda: {
                "data": None, "locacoes_no_dia": [], "total_dia_obra": Decimal('0.00')
            }),
            "total_obra_periodo": Decimal('0.00')
        })

        current_period_day = start_date
        while current_period_day <= end_date: # type: ignore
            for locacao in locacoes_periodo: # type: ignore
                # Check if the current_period_day is within the locacao's active duration
                if not (locacao.data_locacao_inicio <= current_period_day <= (locacao.data_locacao_fim or current_period_day)): # type: ignore
                    continue

                daily_cost_for_locacao = self._calculate_daily_cost(locacao, current_period_day, start_date, end_date) # type: ignore

                if daily_cost_for_locacao > Decimal('0.00'):
                    obra = locacao.obra # type: ignore
                    if not obra: continue

                    obra_entry = report_data_by_obra[obra.id] # type: ignore
                    if obra_entry["obra_id"] is None: # type: ignore
                        obra_entry["obra_id"] = obra.id # type: ignore
                        obra_entry["obra_nome"] = obra.nome_obra # type: ignore

                    day_iso = current_period_day.isoformat() # type: ignore
                    day_data_dict = obra_entry["dias"][day_iso] # type: ignore
                    if day_data_dict["data"] is None: # type: ignore
                        day_data_dict["data"] = day_iso # type: ignore

                    day_data_dict["locacoes_no_dia"].append({ # type: ignore
                        "locacao_id": locacao.id, # type: ignore
                        "recurso_nome": get_recurso_nome_folha(locacao), # type: ignore
                        "tipo_pagamento_display": locacao.get_tipo_pagamento_display(), # type: ignore
                        "valor_diario_atribuido": str(daily_cost_for_locacao),
                        "valor_pagamento_total_locacao": str(locacao.valor_pagamento), # type: ignore
                        "data_locacao_original_inicio": locacao.data_locacao_inicio.isoformat(), # type: ignore
                        "data_locacao_original_fim": locacao.data_locacao_fim.isoformat() if locacao.data_locacao_fim else None, # type: ignore
                        "data_pagamento_prevista": locacao.data_pagamento.isoformat() if locacao.data_pagamento else None, # type: ignore
                        "observacoes": locacao.observacoes or "" # type: ignore
                    })
                    day_data_dict["total_dia_obra"] += daily_cost_for_locacao # type: ignore
                    obra_entry["total_obra_periodo"] += daily_cost_for_locacao # type: ignore
            current_period_day += timedelta(days=1) # type: ignore

        final_report_list = []
        sorted_obra_ids = sorted(report_data_by_obra.keys(), key=lambda obra_id_key: report_data_by_obra[obra_id_key]["obra_nome"]) # type: ignore
        for obra_id_key in sorted_obra_ids: # type: ignore
            obra_data = report_data_by_obra[obra_id_key] # type: ignore
            sorted_dias_keys = sorted(obra_data["dias"].keys()) # type: ignore
            dias_list = []
            for day_key in sorted_dias_keys: # type: ignore
                dia_info = obra_data["dias"][day_key] # type: ignore
                dia_info["total_dia_obra"] = str(dia_info["total_dia_obra"]) # type: ignore
                dia_info["locacoes_no_dia"].sort(key=lambda x: x["recurso_nome"]) # type: ignore
                dias_list.append(dia_info) # type: ignore
            final_report_list.append({ # type: ignore
                "obra_id": obra_data["obra_id"], # type: ignore
                "obra_nome": obra_data["obra_nome"], # type: ignore
                "dias": dias_list,  # type: ignore
                "total_obra_periodo": str(obra_data["total_obra_periodo"]) # type: ignore
            })
        return Response(final_report_list)


class RelatorioPagamentoMateriaisViewSet(viewsets.ViewSet): # type: ignore
    permission_classes = [IsNivelAdmin | IsNivelGerente] # type: ignore
    @action(detail=False, methods=['get'], url_path='pre-check')
    def pre_check_pagamentos_materiais(self, request):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date') # type: ignore
        obra_id_str = request.query_params.get('obra_id') # type: ignore
        fornecedor_str = request.query_params.get('fornecedor') # type: ignore
        if not start_date_str or not end_date_str: return Response({"error": "Parâmetros start_date e end_date são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            start_date_parsed = parse_date(start_date_str) # type: ignore
            end_date_parsed = parse_date(end_date_str) # type: ignore
            if not start_date_parsed or not end_date_parsed: raise ValueError("Invalid date format")
        except ValueError: return Response({"error": "Formato de data inválido. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        filters_q = Q(data_compra__gte=start_date_parsed) & Q(data_compra__lte=end_date_parsed) # type: ignore
        if obra_id_str: filters_q &= Q(obra_id=obra_id_str) # type: ignore
        if fornecedor_str: filters_q &= Q(fornecedor__icontains=fornecedor_str) # type: ignore

        filters_q &= Q(tipo='COMPRA')

        compras_no_periodo = Compra.objects.filter(filters_q).select_related('obra') # type: ignore
        compras_pagamento_pendente = []
        for compra_instance in compras_no_periodo: # type: ignore
            if compra_instance.data_pagamento is None or compra_instance.data_pagamento > end_date_parsed: # type: ignore
                compras_pagamento_pendente.append(CompraReportSerializer(compra_instance).data) # type: ignore
        return Response({
            'compras_com_pagamento_pendente_ou_futuro': compras_pagamento_pendente,
            'message': "Listagem de compras no período com pagamento ainda não registrado ou agendado para após o período do relatório."
        })

    @action(detail=False, methods=['get'], url_path='generate')
    def gerar_relatorio_pagamentos_materiais(self, request):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date') # type: ignore
        obra_id_str = request.query_params.get('obra_id') # type: ignore
        fornecedor_str = request.query_params.get('fornecedor') # type: ignore
        if not start_date_str or not end_date_str: return Response({"error": "Parâmetros start_date e end_date são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            start_date_parsed = parse_date(start_date_str) # type: ignore
            end_date_parsed = parse_date(end_date_str) # type: ignore
            if not start_date_parsed or not end_date_parsed: raise ValueError("Invalid date format")
        except ValueError: return Response({"error": "Formato de data inválido. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        filters_q = Q(data_compra__gte=start_date_parsed) & Q(data_compra__lte=end_date_parsed) # type: ignore
        if obra_id_str: filters_q &= Q(obra_id=obra_id_str) # type: ignore
        if fornecedor_str: filters_q &= Q(fornecedor__icontains=fornecedor_str) # type: ignore

        filters_q &= Q(tipo='COMPRA')

        compras_do_periodo = Compra.objects.filter(filters_q).select_related('obra').order_by('obra__nome_obra', 'fornecedor', 'data_compra', 'data_pagamento') # type: ignore
        report = defaultdict(lambda: {"obra_id": None, "obra_nome": "", "fornecedores": defaultdict(lambda: {"fornecedor_nome": "", "compras_a_pagar": [], "total_fornecedor_na_obra": Decimal('0.00')}), "total_obra": Decimal('0.00')})
        grand_total = Decimal('0.00')
        for compra_item in compras_do_periodo: # Renamed 'compra' to 'compra_item' to avoid conflict
            obra_instance = compra_item.obra # type: ignore
            obra_data = report[obra_instance.id] # type: ignore
            if obra_data["obra_id"] is None: # type: ignore
                obra_data["obra_id"] = obra_instance.id # type: ignore
                obra_data["obra_nome"] = obra_instance.nome_obra # type: ignore

            fornecedor_nome_key = compra_item.fornecedor or "N/A" # type: ignore
            fornecedor_data = obra_data["fornecedores"][fornecedor_nome_key] # type: ignore
            if not fornecedor_data["fornecedor_nome"]: # type: ignore
                fornecedor_data["fornecedor_nome"] = fornecedor_nome_key # type: ignore

            compra_detail = CompraReportSerializer(compra_item).data # type: ignore
            fornecedor_data["compras_a_pagar"].append(compra_detail) # type: ignore
            valor_liquido = compra_item.valor_total_liquido or Decimal('0.00') # type: ignore
            fornecedor_data["total_fornecedor_na_obra"] += valor_liquido
            obra_data["total_obra"] += valor_liquido
            grand_total += valor_liquido
        final_report_list = []
        for obra_id_key in sorted(report.keys(), key=lambda ok: report[ok]["obra_nome"]): # type: ignore
            obra_item = report[obra_id_key] # type: ignore
            sorted_fornecedor_keys = sorted(obra_item["fornecedores"].keys()) # type: ignore
            fornecedores_list = []
            for forn_key in sorted_fornecedor_keys: # type: ignore
                forn_data = obra_item["fornecedores"][forn_key] # type: ignore
                forn_data["total_fornecedor_na_obra"] = str(forn_data["total_fornecedor_na_obra"])
                fornecedores_list.append(forn_data)
            obra_item["fornecedores"] = fornecedores_list
            obra_item["total_obra"] = str(obra_item["total_obra"])
            final_report_list.append(obra_item)
        return Response({"report_data": final_report_list, "total_geral_relatorio": str(grand_total)})

class FotoObraViewSet(viewsets.ModelViewSet):
    queryset = FotoObra.objects.all().order_by('-uploaded_at') # type: ignore
    serializer_class = FotoObraSerializer # type: ignore
    permission_classes = [permissions.IsAuthenticated] # type: ignore
    parser_classes = (MultiPartParser, FormParser)
    def get_queryset(self):
        obra_id = self.request.query_params.get('obra_id')
        if obra_id: return self.queryset.filter(obra__id=obra_id) # type: ignore
        return self.queryset # type: ignore
    def create(self, request, *args, **kwargs):
        # Corrigido para lidar com 'obra' como um ID, que é o que o serializer espera.
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    def perform_create(self, serializer):
        serializer.save()

class ObraCustosPorMaterialView(APIView):
    permission_classes = [IsNivelAdmin | IsNivelGerente]
    def get(self, request, pk, format=None):
        try:
            obra_instance = Obra.objects.get(pk=pk) # type: ignore
        except Obra.DoesNotExist: # type: ignore
            return Response({"error": "Obra não encontrada."}, status=status.HTTP_404_NOT_FOUND)
        custos_por_material = ItemCompra.objects.filter(compra__obra=obra_instance, compra__tipo='COMPRA').values('material__nome').annotate(total_custo=Sum('valor_total_item')).order_by('-total_custo') # type: ignore
        resultado_formatado = [
            {'name': item['material__nome'], 'value': item['total_custo'] or Decimal('0.00')}
            for item in custos_por_material
            if item['material__nome'] is not None and item['total_custo'] is not None
        ]
        return Response(resultado_formatado)


class ObraCustosPorCategoriaMaterialView(APIView):
    permission_classes = [IsNivelAdmin | IsNivelGerente]
    def get(self, request, pk, format=None):
        try:
            obra = Obra.objects.get(pk=pk)
        except Obra.DoesNotExist:
            return Response({"error": "Obra não encontrada."}, status=status.HTTP_404_NOT_FOUND)

        # Agrupar por 'categoria_uso' e somar 'valor_total_item'
        custos = ItemCompra.objects.filter(compra__obra=obra, compra__tipo='COMPRA')\
                                   .values('categoria_uso')\
                                   .annotate(total_custo=Sum('valor_total_item'))\
                                   .order_by('-total_custo')

        # Formatar o resultado para o gráfico
        resultado_formatado = [
            {'name': item['categoria_uso'] or 'Não categorizado', 'value': item['total_custo'] or Decimal('0.00')}
            for item in custos if item['total_custo'] is not None
        ]
        return Response(resultado_formatado)

# print("DEBUG: CompraViewSet logic updated.") # This line was the end of the original backup file before placeholder.

# --- New PDF Generation View ---
# (The placeholder GerarRelatorioPDFObraView and its specific imports from django.http.HttpResponse
#  and django.template.loader.render_to_string that were at the end of the backup file are now effectively replaced by this)

class LocacaoSemanalView(APIView):
    permission_classes = [IsNivelAdmin | IsNivelGerente]

    def get(self, request, *args, **kwargs):
        inicio_semana_str = request.query_params.get('inicio')
        obra_id_str = request.query_params.get('obra_id')
        filtro_tipo = request.query_params.get('filtro_tipo', 'equipe_funcionario')

        if not inicio_semana_str:
            return Response({"error": "O parâmetro 'inicio' é obrigatório."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            inicio_semana = date.fromisoformat(inicio_semana_str)
        except ValueError:
            return Response({"error": "Formato de data inválido para 'inicio'. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        fim_semana = inicio_semana + timedelta(days=6)

        # Correctly query for single-day locacao objects within the week range
        locacoes_qs = Locacao_Obras_Equipes.objects.filter(
            status_locacao='ativa',
            data_locacao_inicio__range=[inicio_semana, fim_semana]
        ).select_related('obra', 'equipe', 'funcionario_locado').order_by('data_locacao_inicio')

        if obra_id_str:
            locacoes_qs = locacoes_qs.filter(obra_id=obra_id_str)

        # Apply the type filter
        if filtro_tipo == 'equipe_funcionario':
            locacoes_qs = locacoes_qs.filter(Q(equipe__isnull=False) | Q(funcionario_locado__isnull=False))
        elif filtro_tipo == 'servico_externo':
            locacoes_qs = locacoes_qs.filter(Q(servico_externo__isnull=False) & ~Q(servico_externo=''))

        # Structure the response
        resposta_semanal = { (inicio_semana + timedelta(days=i)).isoformat(): [] for i in range(7) }
        for locacao in locacoes_qs:
            dia_str = locacao.data_locacao_inicio.isoformat()
            if dia_str in resposta_semanal:
                serializer = LocacaoObrasEquipesSerializer(locacao, context={'request': request})
                resposta_semanal[dia_str].append(serializer.data)

        return Response(resposta_semanal)


class GerarRelatorioPDFObraView(APIView):
    permission_classes = [IsNivelAdmin | IsNivelGerente]

    def get(self, request, pk, format=None):
        is_simple_report = request.query_params.get('is_simple', 'false').lower() == 'true'

        try:
            obra_instance = Obra.objects.select_related('responsavel').get(pk=pk)
        except Obra.DoesNotExist:
            raise Http404("Obra não encontrada")

        compras = Compra.objects.filter(obra=obra_instance, tipo='COMPRA').prefetch_related('itens__material').order_by('data_compra', 'nota_fiscal')
        despesas_extras = Despesa_Extra.objects.filter(obra=obra_instance).order_by('data')
        locacoes = Locacao_Obras_Equipes.objects.filter(obra=obra_instance).select_related(
            'equipe__lider',
            'funcionario_locado'
        ).prefetch_related(
            'equipe__membros'
        ).order_by('data_locacao_inicio')

        # Fetch all attachments
        fotos_qs = FotoObra.objects.filter(obra=obra_instance).order_by('uploaded_at')
        arquivos_qs = ArquivoObra.objects.filter(obra=obra_instance).order_by('uploaded_at')

        # Combine all attachments into a single list
        all_attachments = list(fotos_qs) + list(arquivos_qs)

        # Process attachments for embedding in the PDF
        anexos_processados = process_attachments_for_pdf(all_attachments)

        custo_total_materiais = sum(c.valor_total_liquido for c in compras if c.valor_total_liquido) or Decimal('0.00')
        custo_total_despesas_extras = sum(de.valor for de in despesas_extras if de.valor) or Decimal('0.00')
        custo_total_locacoes = sum(loc.valor_pagamento for loc in locacoes if loc.valor_pagamento) or Decimal('0.00')

        custo_total_realizado = custo_total_materiais + custo_total_despesas_extras + custo_total_locacoes
        balanco_financeiro = (obra_instance.orcamento_previsto or Decimal('0.00')) - custo_total_realizado

        custo_por_m2 = Decimal('0.00')
        if obra_instance.area_metragem and obra_instance.area_metragem > Decimal('0.01'):  # Mínimo de 0.01 m²
            try:
                custo_por_m2 = custo_total_realizado / obra_instance.area_metragem
                if not custo_por_m2.is_finite() or custo_por_m2 > Decimal('999999.99'):
                    custo_por_m2 = Decimal('0.00')
            except (ZeroDivisionError, InvalidOperation, OverflowError):
                custo_por_m2 = Decimal('0.00')

        # Categorize locacoes
        locacoes_equipe = []
        locacoes_funcionario = []
        locacoes_servico = []
        for loc in locacoes:
            if loc.equipe:
                locacoes_equipe.append(loc)
            elif loc.funcionario_locado:
                locacoes_funcionario.append(loc)
            elif loc.servico_externo:
                locacoes_servico.append(loc)

        context = {
            'obra': obra_instance,
            'compras': compras,
            'despesas_extras': despesas_extras,
            'locacoes_equipe': locacoes_equipe,
            'locacoes_funcionario': locacoes_funcionario,
            'locacoes_servico': locacoes_servico,
            'anexos_processados': anexos_processados,
            'data_emissao': timezone.now(),
            'custo_total_materiais': custo_total_materiais,
            'custo_total_despesas_extras': custo_total_despesas_extras,
            'custo_total_locacoes': custo_total_locacoes,
            'custo_total_realizado': custo_total_realizado,
            'balanco_financeiro': balanco_financeiro,
            'custo_por_m2': custo_por_m2,
            'MEDIA_ROOT': settings.MEDIA_ROOT,
            'is_simple_report': is_simple_report,
        }

        # O template pode usar a flag 'is_simple_report' para mostrar/ocultar seções
        template_path = 'relatorios/relatorio_obra.html'
        css_path = os.path.join(settings.BASE_DIR, 'core', 'static', 'css', 'relatorio_obra.css')
        clean_obra_nome = "".join([c if c.isalnum() else "_" for c in obra_instance.nome_obra])
        filename = f'Relatorio_Obra_{clean_obra_nome}_{obra_instance.id}.pdf'

        return generate_pdf_response(template_path, context, css_path, filename)


# View para gerar PDF do Relatório de Pagamento de Locações
# EMPTY Class definition removed, logic will be uncommented below.
# class GerarRelatorioPagamentoLocacoesPDFView(APIView):
#     permission_classes = [IsNivelAdmin | IsNivelGerente]


class RecursosMaisUtilizadosSemanaView(APIView):
    permission_classes = [IsNivelAdmin | IsNivelGerente]

    def get(self, request, *args, **kwargs):
        inicio_semana_str = request.query_params.get('inicio')
        obra_id_str = request.query_params.get('obra_id')
        if not inicio_semana_str:
            return Response({"error": "O parâmetro 'inicio' (data de início da semana no formato YYYY-MM-DD) é obrigatório."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            inicio_semana = date.fromisoformat(inicio_semana_str)
        except ValueError:
            return Response({"error": "Formato de data inválido para 'inicio'. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        fim_semana = inicio_semana + timedelta(days=6)

        # Filtra locações que estão ativas e se sobrepõem com a semana.
        # Uma locação se sobrepõe se: loc.inicio <= semana.fim E loc.fim >= semana.inicio
        locacoes_na_semana = Locacao_Obras_Equipes.objects.filter(
            status_locacao='ativa',
            data_locacao_inicio__lte=fim_semana,  # Começa antes ou durante o fim da semana
            data_locacao_fim__gte=inicio_semana   # Termina depois ou durante o início da semana
        ).select_related('funcionario_locado', 'equipe')

        if obra_id_str:
            locacoes_na_semana = locacoes_na_semana.filter(obra_id=obra_id_str)

        contagem_recursos = defaultdict(int)

        # Itera sobre cada dia da semana para contar cada "instância" de locação diária
        # Isso garante que uma locação que dura vários dias seja contada para cada dia em que está ativa.
        current_day = inicio_semana
        while current_day <= fim_semana:
            for locacao in locacoes_na_semana:
                # Verifica se a locação específica está ativa no dia_corrente
                if locacao.data_locacao_inicio <= current_day <= locacao.data_locacao_fim:
                    if locacao.funcionario_locado:
                        nome_recurso = f"Funcionário: {locacao.funcionario_locado.nome_completo}"
                        contagem_recursos[nome_recurso] += 1
                    elif locacao.equipe:
                        nome_recurso = f"Equipe: {locacao.equipe.nome_equipe}"
                        contagem_recursos[nome_recurso] += 1
                    elif locacao.servico_externo and locacao.servico_externo.strip():
                        nome_recurso = f"Serviço Externo: {locacao.servico_externo.strip()}"
                        contagem_recursos[nome_recurso] += 1
            current_day += timedelta(days=1)

        recursos_ordenados = sorted(contagem_recursos.items(), key=lambda item: item[1], reverse=True)

        resposta_formatada = [{"recurso_nome": nome, "ocorrencias": ocorrencias} for nome, ocorrencias in recursos_ordenados]

        return Response(resposta_formatada)

# Comentário original da view GerarRelatorioPagamentoLocacoesPDFView removido para evitar confusão com a correção acima.
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

@method_decorator(csrf_exempt, name='dispatch')
class AnexoLocacaoViewSet(viewsets.ModelViewSet):
    queryset = AnexoLocacao.objects.all()
    serializer_class = AnexoLocacaoSerializer
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsNivelAdmin | IsNivelGerente]

    def get_queryset(self):
        """
        This view should return a list of anexos for a specific locacao,
        or all anexos for detail views (retrieve, update, destroy).
        """
        if self.action == 'list':
            locacao_id = self.request.query_params.get('locacao_id')
            if locacao_id:
                return self.queryset.filter(locacao_id=locacao_id)
            return self.queryset.none()  # Return none if no locacao_id for list
        return self.queryset.all()  # For detail views, return all

@method_decorator(csrf_exempt, name='dispatch')
class AnexoDespesaViewSet(viewsets.ModelViewSet):
    queryset = AnexoDespesa.objects.all()
    serializer_class = AnexoDespesaSerializer
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsNivelAdmin | IsNivelGerente]

    def get_queryset(self):
        despesa_id = self.request.query_params.get('despesa_id')
        if despesa_id:
            return self.queryset.filter(despesa_id=despesa_id)
        # Para operações de delete/retrieve, permitir acesso a todos os anexos
        return self.queryset.all()
    
    def destroy(self, request, *args, **kwargs):
        """
        Remove um anexo de despesa e seu arquivo físico.
        """
        try:
            anexo = self.get_object()
            
            # Tentar remover o arquivo físico
            if anexo.anexo:
                try:
                    import os
                    # Usar o método delete() do FileField que é mais seguro
                    anexo.anexo.delete(save=False)
                except Exception as e:
                    # Log do erro, mas não falha a operação
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f'Erro ao remover arquivo físico do anexo de despesa: {e}')
            
            # Remover o registro do banco
            anexo.delete()
            
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Erro completo ao remover anexo de despesa: {str(e)}')
            return Response(
                {'error': f'Erro ao remover anexo: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class GerarRelatorioPagamentoLocacoesPDFView(APIView):
    permission_classes = [IsNivelAdmin | IsNivelGerente]

    def get(self, request, *args, **kwargs):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        obra_id_str = request.query_params.get('obra_id')

        if not start_date_str or not end_date_str:
            return Response({"error": "Parâmetros start_date e end_date são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            start_date_obj = date.fromisoformat(start_date_str)
            end_date_obj = date.fromisoformat(end_date_str)
        except ValueError:
            return Response({"error": "Formato de data inválido. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        if start_date_obj > end_date_obj:
            return Response({"error": "start_date não pode ser posterior a end_date."}, status=status.HTTP_400_BAD_REQUEST)

        folha_pagamento_viewset = RelatorioFolhaPagamentoViewSet()
        response_data = folha_pagamento_viewset.generate_report_data_for_pdf(request)

        if response_data.status_code != 200:
             return Response(response_data.data, status=response_data.status_code)

        context = response_data.data
        context['data_emissao'] = timezone.now()
        context['start_date_filter'] = start_date_obj
        context['end_date_filter'] = end_date_obj
        if obra_id_str:
            try:
                obra_filter_instance = Obra.objects.get(pk=int(obra_id_str))
                context['obra_filter_nome'] = obra_filter_instance.nome_obra
            except (Obra.DoesNotExist, ValueError):
                context['obra_filter_nome'] = None

        template_path = 'relatorios/relatorio_pagamento_locacoes.html'
        css_path = os.path.join(settings.BASE_DIR, 'core', 'static', 'css', 'relatorio_pagamento_locacoes.css')
        filename = f'Relatorio_Pagamento_Locacoes_{start_date_str}_a_{end_date_str}.pdf'

        return generate_pdf_response(template_path, context, css_path, filename)

        response = HttpResponse(pdf_file, content_type='application/pdf')
        filename = f"Relatorio_Pagamento_Locacoes_{start_date_str}_a_{end_date_str}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        return response


class BackupViewSet(viewsets.ModelViewSet):
    """
    API endpoint para gerenciar backups do banco de dados.
    """
    queryset = Backup.objects.all()
    serializer_class = BackupSerializer
    permission_classes = [IsNivelAdmin]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({'backups': serializer.data})
    
    def create(self, request, *args, **kwargs):
        """
        Cria um novo backup manual do banco de dados.
        """
        import subprocess
        import os
        from django.conf import settings
        from django.utils import timezone
        
        try:
            # Gerar nome do arquivo de backup
            timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
            filename = f'backup_manual_{timestamp}.sql'
            backup_dir = os.path.join(settings.BASE_DIR, 'backups')
            
            # Criar diretório de backups se não existir
            os.makedirs(backup_dir, exist_ok=True)
            
            backup_path = os.path.join(backup_dir, filename)
            
            # Comando para criar backup (SQLite)
            db_path = settings.DATABASES['default']['NAME']
            
            # Para SQLite, fazemos uma cópia do arquivo
            import shutil
            shutil.copy2(db_path, backup_path)
            
            # Obter tamanho do arquivo
            file_size = os.path.getsize(backup_path)
            
            # Criar registro no banco
            backup = Backup.objects.create(
                filename=filename,
                tipo='manual',
                size_bytes=file_size,
                description=request.data.get('description', '')
            )
            
            serializer = self.get_serializer(backup)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Erro ao criar backup: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """
        Restaura o banco de dados a partir de um backup.
        """
        try:
            backup = self.get_object()
            backup_dir = os.path.join(settings.BASE_DIR, 'backups')
            backup_path = os.path.join(backup_dir, backup.filename)
            
            if not os.path.exists(backup_path):
                return Response(
                    {'error': 'Arquivo de backup não encontrado'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Para SQLite, substituímos o arquivo atual
            db_path = settings.DATABASES['default']['NAME']
            
            # Fazer backup do estado atual antes de restaurar
            current_timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
            current_backup_filename = f'backup_pre_restore_{current_timestamp}.sql'
            current_backup_path = os.path.join(backup_dir, current_backup_filename)
            
            import shutil
            shutil.copy2(db_path, current_backup_path)
            
            # Criar registro do backup automático
            current_backup_size = os.path.getsize(current_backup_path)
            Backup.objects.create(
                filename=current_backup_filename,
                tipo='automatico',
                size_bytes=current_backup_size,
                description=f'Backup automático antes da restauração de {backup.filename}'
            )
            
            # Restaurar o backup
            shutil.copy2(backup_path, db_path)
            
            return Response(
                {'message': 'Backup restaurado com sucesso'}, 
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {'error': f'Erro ao restaurar backup: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def destroy(self, request, *args, **kwargs):
        """
        Remove um backup (arquivo e registro).
        """
        try:
            backup = self.get_object()
            backup_dir = os.path.join(settings.BASE_DIR, 'backups')
            backup_path = os.path.join(backup_dir, backup.filename)
            
            # Remover arquivo físico se existir
            if os.path.exists(backup_path):
                os.remove(backup_path)
            
            # Remover registro do banco
            backup.delete()
            
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except Exception as e:
            return Response(
                {'error': f'Erro ao remover backup: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


from django.utils.decorators import method_decorator

from django.http import HttpResponse

def media_test_view(request):
    return HttpResponse('<a href="/media/anexos_locacoes/59/e8a4f56e286e438ebf8f4e30ce972a87.jpg">Test Link</a>')

class BackupSettingsViewSet(viewsets.ModelViewSet):
    """
    API endpoint para gerenciar configurações de backup.
    """
    queryset = BackupSettings.objects.all()
    serializer_class = BackupSettingsSerializer
    permission_classes = [IsNivelAdmin]
    
    def get_object(self):
        """
        Retorna ou cria a única instância de configurações.
        """
        settings_obj, created = BackupSettings.objects.get_or_create(
            id=1,
            defaults={
                'auto_backup_enabled': True,
                'backup_time': '02:00:00',
                'retention_days': 30,
                'max_backups': 10
            }
        )
        return settings_obj
    
    def list(self, request, *args, **kwargs):
        """
        Retorna as configurações de backup.
        """
        settings_obj = self.get_object()
        serializer = self.get_serializer(settings_obj)
        return Response(serializer.data)
    
    def update(self, request, *args, **kwargs):
        """
        Atualiza as configurações de backup.
        """
        settings_obj = self.get_object()
        serializer = self.get_serializer(settings_obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ParcelaCompraViewSet(viewsets.ModelViewSet):
    """
    API endpoint para gerenciar parcelas de compras.
    """
    queryset = ParcelaCompra.objects.all()
    serializer_class = ParcelaCompraSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        try:
            queryset = super().get_queryset()
            compra_id = self.request.query_params.get('compra', None)
            if compra_id:
                try:
                    compra_id = int(compra_id)
                    queryset = queryset.filter(compra_id=compra_id)
                except ValueError:
                    return ParcelaCompra.objects.none()
            return queryset.order_by('numero_parcela')
        except Exception as e:
            return ParcelaCompra.objects.none()
    
    @action(detail=True, methods=['post'])
    def marcar_paga(self, request, pk=None):
        """
        Marca uma parcela como paga.
        """
        try:
            parcela = self.get_object()
            
            # Validar se a parcela pode ser marcada como paga
            if parcela.status == 'pago':
                return Response(
                    {'error': 'Parcela já está marcada como paga'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            parcela.status = 'pago'
            parcela.data_pagamento = timezone.now().date()
            parcela.save()
            
            serializer = self.get_serializer(parcela)
            return Response(serializer.data)
            
        except ParcelaCompra.DoesNotExist:
            return Response(
                {'error': 'Parcela não encontrada'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Erro ao marcar parcela como paga: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def marcar_pendente(self, request, pk=None):
        """
        Marca uma parcela como pendente.
        """
        try:
            parcela = self.get_object()
            
            # Validar se a parcela pode ser marcada como pendente
            if parcela.status == 'pendente':
                return Response(
                    {'error': 'Parcela já está marcada como pendente'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            parcela.status = 'pendente'
            parcela.data_pagamento = None
            parcela.save()
            
            serializer = self.get_serializer(parcela)
            return Response(serializer.data)
            
        except ParcelaCompra.DoesNotExist:
            return Response(
                {'error': 'Parcela não encontrada'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Erro ao marcar parcela como pendente: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AnexoCompraViewSet(viewsets.ModelViewSet):
    """
    API endpoint para gerenciar anexos de compras.
    """
    queryset = AnexoCompra.objects.all()
    serializer_class = AnexoCompraSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        try:
            queryset = super().get_queryset()
            compra_id = self.request.query_params.get('compra', None)
            if compra_id:
                try:
                    compra_id = int(compra_id)
                    queryset = queryset.filter(compra_id=compra_id)
                except ValueError:
                    return AnexoCompra.objects.none()
            return queryset.order_by('-uploaded_at')
        except Exception as e:
            return AnexoCompra.objects.none()
    
    def create(self, request, *args, **kwargs):
        """
        Cria um novo anexo para uma compra.
        """
        try:
            # Validar se arquivo foi enviado
            if 'arquivo' not in request.FILES:
                return Response(
                    {'error': 'Nenhum arquivo foi enviado'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            # Validar tamanho do arquivo (máximo 10MB)
            arquivo = serializer.validated_data.get('arquivo')
            if arquivo and arquivo.size > 10 * 1024 * 1024:  # 10MB
                return Response(
                    {'error': 'Arquivo muito grande. Tamanho máximo: 10MB'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validar tipo de arquivo
            if arquivo:
                allowed_types = [
                    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
                    'application/pdf', 'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'text/plain'
                ]

                if arquivo.content_type not in allowed_types:
                    return Response(
                        {'error': 'Tipo de arquivo não permitido'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # Validar se a compra existe
            compra_id = request.data.get('compra')
            if compra_id:
                try:
                    from .models import Compra
                    Compra.objects.get(id=compra_id)
                except Compra.DoesNotExist:
                    return Response(
                        {'error': 'Compra não encontrada'},
                        status=status.HTTP_404_NOT_FOUND
                    )

            # Popular campos automaticamente baseado no arquivo
            arquivo = request.FILES.get('arquivo')
            serializer.save(
                uploaded_by=request.user,
                nome_original=arquivo.name if arquivo else '',
                tipo_arquivo=arquivo.content_type if arquivo else '',
                tamanho_arquivo=arquivo.size if arquivo else 0
            )
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            
        except Exception as e:
            return Response(
                {'error': f'Erro ao fazer upload do arquivo: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def destroy(self, request, *args, **kwargs):
        """
        Remove um anexo e seu arquivo físico.
        """
        try:
            anexo = self.get_object()
            
            # Tentar remover o arquivo físico
            if anexo.arquivo:
                try:
                    import os
                    if os.path.exists(anexo.arquivo.path):
                        os.remove(anexo.arquivo.path)
                except Exception as e:
                    # Log do erro, mas não falha a operação
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f'Erro ao remover arquivo físico: {e}')
            
            return super().destroy(request, *args, **kwargs)
            
        except AnexoCompra.DoesNotExist:
            return Response(
                {'error': 'Anexo não encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Erro ao remover anexo: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """
        Faz download de um anexo de compra.
        """
        try:
            anexo = self.get_object()
            
            if not anexo.arquivo:
                return Response(
                    {'error': 'Arquivo não encontrado'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            import os
            from django.http import FileResponse
            from django.utils.encoding import smart_str
            
            if not os.path.exists(anexo.arquivo.path):
                return Response(
                    {'error': 'Arquivo físico não encontrado'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            response = FileResponse(
                open(anexo.arquivo.path, 'rb'),
                content_type='application/octet-stream'
            )
            response['Content-Disposition'] = f'attachment; filename="{smart_str(anexo.nome_original)}"'
            return response
            
        except AnexoCompra.DoesNotExist:
            return Response(
                {'error': 'Anexo não encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Erro ao fazer download do anexo: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class ArquivoObraViewSet(viewsets.ModelViewSet):
    """
    API endpoint para gerenciar arquivos de obras.
    """
    queryset = ArquivoObra.objects.all()
    serializer_class = ArquivoObraSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        try:
            queryset = super().get_queryset()
            obra_id = self.request.query_params.get('obra', None)
            if obra_id:
                try:
                    obra_id = int(obra_id)
                    queryset = queryset.filter(obra_id=obra_id)
                except ValueError:
                    return ArquivoObra.objects.none()
            
            categoria = self.request.query_params.get('categoria', None)
            if categoria:
                # Validar se a categoria é válida
                valid_categories = ['documento', 'imagem', 'planilha', 'outro']
                if categoria in valid_categories:
                    queryset = queryset.filter(categoria=categoria)
                else:
                    return ArquivoObra.objects.none()
                
            return queryset.order_by('-uploaded_at')
        except Exception as e:
            return ArquivoObra.objects.none()
    
    def create(self, request, *args, **kwargs):
        """
        Cria um novo arquivo para uma obra.
        """
        try:
            # Validar se arquivo foi enviado
            if 'arquivo' not in request.FILES:
                return Response(
                    {'error': 'Nenhum arquivo foi enviado'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            # Validações específicas do arquivo
            arquivo = serializer.validated_data.get('arquivo')
            if arquivo and arquivo.size > 50 * 1024 * 1024:  # 50MB
                return Response(
                    {'error': 'Arquivo muito grande. Tamanho máximo: 50MB'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt']
            if arquivo:
                import os
                _, ext = os.path.splitext(arquivo.name.lower())
                if ext not in allowed_extensions:
                    return Response(
                        {'error': f'Tipo de arquivo não permitido. Tipos permitidos: {", ".join(allowed_extensions)}'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # A validação da obra é feita pelo serializer, que espera um ID.
            # O 'uploaded_by' é associado ao usuário da requisição.
            serializer.save(uploaded_by=request.user)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            
        except Exception as e:
            return Response(
                {'error': f'Erro ao fazer upload do arquivo: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def destroy(self, request, *args, **kwargs):
        """
        Remove um arquivo de obra e deleta o arquivo físico.
        """
        try:
            instance = self.get_object()
            
            # Deletar arquivo físico se existir
            if instance.arquivo:
                try:
                    import os
                    if os.path.exists(instance.arquivo.path):
                        os.remove(instance.arquivo.path)
                except Exception as e:
                    # Log do erro, mas não falha a operação
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f'Erro ao deletar arquivo físico: {e}')
            
            # Deletar registro do banco
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except ArquivoObra.DoesNotExist:
            return Response(
                {'error': 'Arquivo não encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Erro ao remover arquivo: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """
        Deleta múltiplos arquivos em lote.
        """
        try:
            arquivo_ids = request.data.get('arquivo_ids', [])
            
            if not arquivo_ids:
                return Response(
                    {'error': 'Lista de IDs de arquivos é obrigatória'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validar que todos os IDs são números
            try:
                arquivo_ids = [int(id_) for id_ in arquivo_ids]
            except (ValueError, TypeError):
                return Response(
                    {'error': 'IDs devem ser números válidos'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            arquivos = ArquivoObra.objects.filter(id__in=arquivo_ids)
            deleted_count = 0
            errors = []
            
            for arquivo in arquivos:
                try:
                    # Deletar arquivo físico se existir
                    if arquivo.arquivo:
                        try:
                            import os
                            if os.path.exists(arquivo.arquivo.path):
                                os.remove(arquivo.arquivo.path)
                        except Exception as e:
                            # Log do erro, mas não falha a operação
                            import logging
                            logger = logging.getLogger(__name__)
                            logger.error(f'Erro ao deletar arquivo físico {arquivo.id}: {e}')
                    
                    arquivo.delete()
                    deleted_count += 1
                except Exception as e:
                    errors.append(f'Erro ao deletar arquivo {arquivo.id}: {str(e)}')
            
            response_data = {
                'message': f'{deleted_count} arquivo(s) deletado(s) com sucesso'
            }
            
            if errors:
                response_data['warnings'] = errors
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Erro na operação de exclusão em lote: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )




class GerarPDFComprasLoteView(APIView):
    """
    Endpoint para gerar PDFs de múltiplas compras em lote.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Test endpoint to verify URL routing works"""
        return Response({'message': 'Endpoint is working', 'method': 'GET'}, status=status.HTTP_200_OK)
    
    def post(self, request):
        compra_ids = request.data.get('compra_ids', [])
        
        if not compra_ids:
            return Response(
                {'error': 'Lista de IDs de compras é obrigatória'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            compras = Compra.objects.filter(id__in=compra_ids).prefetch_related(
                'itens__material', 'parcelas', 'anexos'
            )
            
            if not compras.exists():
                return Response(
                    {'error': 'Nenhuma compra encontrada com os IDs fornecidos'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Preparar dados das compras com anexos processados
            compras_data = []
            for compra in compras:
                anexos_processados = process_anexos_for_pdf(compra.anexos.all())
                compras_data.append({
                    'compra': compra,
                    'anexos_processados': anexos_processados
                })
            
            # Preparar contexto para o template
            context = {
                'compras': compras,
                'compras_data': compras_data,
                'data_geracao': timezone.now(),
                'usuario': request.user,
            }
            
            # Gerar PDF
            template_path = 'relatorios/relatorio_compras_lote.html'
            css_path = os.path.join(settings.BASE_DIR, 'core', 'static', 'css', 'relatorio_compras.css')
            filename = f'Relatorio_Compras_Lote_{timezone.now().strftime("%Y%m%d_%H%M%S")}.pdf'
            
            return generate_pdf_response(template_path, context, css_path, filename)
            
        except Exception as e:
            return Response(
                {'error': f'Erro ao gerar PDF: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ===== VIEWS DE DEBUG =====

@api_view(['GET', 'POST'])
@permission_classes([permissions.AllowAny])  # ATENÇÃO: SEM AUTENTICAÇÃO!
def debug_system_info(request):
    """
    View de debug que mostra informações do sistema
    ATENÇÃO: Esta view não requer autenticação - usar apenas para debug!
    """
    import logging
    from django.db import connection
    
    debug_logger = logging.getLogger('api_debug')
    debug_logger.info(f"🔧 DEBUG SYSTEM INFO - {request.method} - IP: {request.META.get('REMOTE_ADDR')}")
    
    try:
        # Informações básicas do sistema
        system_info = {
            'timestamp': timezone.now().isoformat(),
            'method': request.method,
            'path': request.path,
            'user_authenticated': request.user.is_authenticated,
            'user_id': request.user.id if request.user.is_authenticated else None,
            'user_username': request.user.username if request.user.is_authenticated else None,
        }
        
        # Informações de CORS
        cors_info = {
            'CORS_ALLOWED_ORIGINS': getattr(settings, 'CORS_ALLOWED_ORIGINS', []),
            'CORS_ALLOW_CREDENTIALS': getattr(settings, 'CORS_ALLOW_CREDENTIALS', False),
            'CORS_ALLOW_ALL_ORIGINS': getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', False),
        }
        
        # Headers da requisição
        request_headers = {
            'Origin': request.META.get('HTTP_ORIGIN'),
            'Referer': request.META.get('HTTP_REFERER'),
            'User-Agent': request.META.get('HTTP_USER_AGENT', '')[:100],
            'Authorization': 'Present' if request.META.get('HTTP_AUTHORIZATION') else 'Not present',
            'Content-Type': request.META.get('CONTENT_TYPE'),
        }
        
        # Teste de conectividade com banco
        db_status = 'Unknown'
        try:
            with connection.cursor() as cursor:
                cursor.execute('SELECT 1')
                db_status = 'Connected'
        except Exception as e:
            db_status = f'Error: {str(e)}'
        
        # Variáveis de ambiente importantes (mascaradas)
        env_vars = {
            'DEBUG': getattr(settings, 'DEBUG', False),
            'DATABASE_URL': 'Present' if os.getenv('DATABASE_URL') else 'Not set',
            'CORS_ALLOWED_ORIGINS_ENV': 'Present' if os.getenv('CORS_ALLOWED_ORIGINS') else 'Not set',
        }
        
        response_data = {
            'status': 'success',
            'message': 'Debug info retrieved successfully',
            'system_info': system_info,
            'cors_info': cors_info,
            'request_headers': request_headers,
            'database_status': db_status,
            'environment_vars': env_vars,
        }
        
        debug_logger.info(f"🔧 DEBUG INFO RESPONSE: {response_data}")
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        debug_logger.error(f"❌ DEBUG SYSTEM INFO ERROR: {str(e)}")
        return Response(
            {'error': f'Debug error: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.AllowAny])  # ATENÇÃO: SEM AUTENTICAÇÃO!
def debug_bypass_login(request):
    """
    View de debug que bypassa o login e retorna um token fake
    ATENÇÃO: Esta view não requer autenticação - usar apenas para debug!
    """
    import logging
    from rest_framework_simplejwt.tokens import RefreshToken
    
    debug_logger = logging.getLogger('api_debug')
    debug_logger.warning(f"🚨 DEBUG BYPASS LOGIN ATTEMPT - IP: {request.META.get('REMOTE_ADDR')}")
    
    # Verificar se o debug está habilitado
    if not getattr(settings, 'DEBUG', False):
        return Response(
            {'error': 'Debug bypass only available in DEBUG mode'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        # Criar ou pegar o primeiro usuário admin usando o modelo customizado
        admin_user = Usuario.objects.filter(is_superuser=True).first()
        
        if not admin_user:
            # Criar usuário de debug se não existir
            admin_user = Usuario.objects.create_superuser(
                login='debug_admin',
                password='debug123',
                nome_completo='Debug Admin',
                nivel_acesso='admin'
            )
            debug_logger.info("🔧 Created debug admin user")
        
        # Gerar tokens JWT
        refresh = RefreshToken.for_user(admin_user)
        access_token = refresh.access_token
        
        response_data = {
            'status': 'success',
            'message': 'DEBUG: Login bypassed successfully',
            'access': str(access_token),
            'refresh': str(refresh),
            'user': {
                'id': admin_user.id,
                'login': admin_user.login,
                'nome_completo': admin_user.nome_completo,
                'nivel_acesso': admin_user.nivel_acesso,
                'is_superuser': admin_user.is_superuser,
            },
            'warning': 'THIS IS A DEBUG BYPASS - NOT FOR PRODUCTION!'
        }
        
        debug_logger.warning(f"🚨 DEBUG BYPASS SUCCESS for user {admin_user.login}")
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        debug_logger.error(f"❌ DEBUG BYPASS ERROR: {str(e)}")
        return Response(
            {'error': f'Debug bypass error: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
