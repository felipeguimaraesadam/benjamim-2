from rest_framework import viewsets, status, filters, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q, Sum, F, Case, When, Value, IntegerField
from decimal import Decimal
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
from .utils import generate_pdf_response
# from weasyprint.fonts import FontConfiguration # Optional

from .models import (
    Usuario, Obra, Funcionario, Equipe, Locacao_Obras_Equipes, Material,
    Compra, Despesa_Extra, Ocorrencia_Funcionario, ItemCompra, FotoObra,
    Backup, BackupSettings, AnexoLocacao, AnexoDespesa
)
from .serializers import (
    UsuarioSerializer, ObraSerializer, FuncionarioSerializer, EquipeSerializer,
    LocacaoObrasEquipesSerializer, MaterialSerializer, CompraSerializer,
    DespesaExtraSerializer, OcorrenciaFuncionarioSerializer,
    ItemCompraSerializer, EquipeComMembrosBasicSerializer,
    FotoObraSerializer, FuncionarioDetailSerializer,
    EquipeDetailSerializer, MaterialDetailSerializer, CompraReportSerializer,
    BackupSerializer, BackupSettingsSerializer, AnexoLocacaoSerializer, AnexoDespesaSerializer
)
from .permissions import IsNivelAdmin, IsNivelGerente

class LocacaoSemanalView(APIView):
    permission_classes = [IsNivelAdmin | IsNivelGerente]

    def get(self, request, *args, **kwargs):
        inicio_str = request.query_params.get('inicio')
        if not inicio_str:
            return Response({"error": "O parâmetro 'inicio' é obrigatório."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            data_inicio = datetime.strptime(inicio_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({"error": "Formato de data inválido. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        data_fim = data_inicio + timedelta(days=6)

        locacoes = Locacao_Obras_Equipes.objects.filter(
            data_locacao_inicio__lte=data_fim,
            data_locacao_fim__gte=data_inicio
        ).select_related('obra', 'equipe', 'funcionario_locado')

        serializer = LocacaoObrasEquipesSerializer(locacoes, many=True)
        return Response(serializer.data)
# django.db.models.Sum, Count, F, Decimal are already imported in the backup content

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
        return Obra.objects.select_related('responsavel').all().order_by('id')


class FuncionarioViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows funcionarios to be viewed or edited.
    """
    queryset = Funcionario.objects.all()
    serializer_class = FuncionarioSerializer
    permission_classes = [IsNivelAdmin | IsNivelGerente]


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
    serializer_class = EquipeComMembrosBasicSerializer
    permission_classes = [IsNivelAdmin | IsNivelGerente]

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
        today = timezone.now().date()
        start_date = today - timedelta(days=29)
        obra_id_str = request.query_params.get('obra_id')
        locacoes_qs = Locacao_Obras_Equipes.objects.filter(
            data_locacao_inicio__gte=start_date,
            data_locacao_inicio__lte=today,
            status_locacao='ativa'
        )
        if obra_id_str:
            try:
                obra_id = int(obra_id_str)
                locacoes_qs = locacoes_qs.filter(obra_id=obra_id)
            except ValueError:
                return Response({"error": "ID de obra inválido."}, status=status.HTTP_400_BAD_REQUEST)
        daily_costs_db = locacoes_qs.values('data_locacao_inicio').annotate(
            total_cost_for_day=Sum('valor_pagamento')
        ).order_by('data_locacao_inicio')
        costs_by_date_map = {
            item['data_locacao_inicio']: item['total_cost_for_day']
            for item in daily_costs_db
        }
        result_data = []
        current_date = start_date
        while current_date <= today:
            cost = costs_by_date_map.get(current_date, Decimal('0.00'))
            result_data.append({
                "date": current_date.isoformat(),
                "total_cost": cost,
                "has_locacoes": cost > 0
            })
            current_date += timedelta(days=1)
        return Response(result_data)


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
    serializer_class = CompraSerializer
    permission_classes = [IsNivelAdmin | IsNivelGerente]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data
        itens_data = validated_data.pop('itens')
        compra = Compra.objects.create(**validated_data)
        for item_data in itens_data:
            item = ItemCompra.objects.create(compra=compra, **item_data)
            material_obj = item_data.get('material')
            categoria_uso = item_data.get('categoria_uso')
            if categoria_uso and material_obj and isinstance(material_obj, Material):
                material_obj.categoria_uso_padrao = categoria_uso
                material_obj.save(update_fields=['categoria_uso_padrao'])
        total_bruto_calculado = sum(item.valor_total_item for item in compra.itens.all())
        compra.valor_total_bruto = total_bruto_calculado if total_bruto_calculado is not None else Decimal('0.00')
        compra.save()
        final_serializer = CompraSerializer(compra, context=self.get_serializer_context())
        headers = self.get_success_headers(final_serializer.data)
        return Response(final_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def get_queryset(self):
        queryset = Compra.objects.all().select_related('obra').order_by('-data_compra')
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

        return queryset

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        instance.tipo = request.data.get('tipo', instance.tipo)
        instance.obra_id = request.data.get('obra', instance.obra_id)
        instance.fornecedor = request.data.get('fornecedor', instance.fornecedor)
        instance.data_compra = request.data.get('data_compra', instance.data_compra)
        instance.nota_fiscal = request.data.get('nota_fiscal', instance.nota_fiscal)
        desconto_str = request.data.get('desconto', str(instance.desconto))
        try:
            instance.desconto = Decimal(desconto_str)
        except ValueError:
            instance.desconto = instance.desconto
        instance.observacoes = request.data.get('observacoes', instance.observacoes)
        itens_data = request.data.get('itens', None)
        if itens_data is not None:
            existing_items_ids = set(instance.itens.values_list('id', flat=True))
            request_items_ids = set()
            for item_data in itens_data:
                item_id = item_data.get('id', None)
                material_id = item_data.get('material')
                categoria_uso = item_data.get('categoria_uso')
                try:
                    quantidade_str = item_data.get('quantidade', '0')
                    quantidade = Decimal(quantidade_str)
                    valor_unitario_str = item_data.get('valor_unitario', '0')
                    valor_unitario = Decimal(valor_unitario_str)
                except ValueError as e: continue
                material_obj = None
                if material_id:
                    try:
                        material_obj = Material.objects.get(id=material_id)
                    except Material.DoesNotExist: continue
                else: continue
                if item_id:
                    if item_id in existing_items_ids:
                        try:
                            item_instance = ItemCompra.objects.get(id=item_id, compra=instance)
                            item_instance.material = material_obj
                            item_instance.quantidade = quantidade
                            item_instance.valor_unitario = valor_unitario
                            if categoria_uso is not None:
                                item_instance.categoria_uso = categoria_uso
                            item_instance.save()
                            request_items_ids.add(item_id)
                        except ItemCompra.DoesNotExist: continue
                    else: continue
                else:
                    if not material_obj: continue
                    item_instance_data = {
                        'compra': instance, 'material': material_obj,
                        'quantidade': quantidade, 'valor_unitario': valor_unitario
                    }
                    if categoria_uso is not None:
                        item_instance_data['categoria_uso'] = categoria_uso
                    item_instance = ItemCompra.objects.create(**item_instance_data)
                    request_items_ids.add(item_instance.id)
                if categoria_uso and material_obj:
                    material_obj.categoria_uso_padrao = categoria_uso
                    material_obj.save(update_fields=['categoria_uso_padrao'])
            ids_to_delete = existing_items_ids - request_items_ids
            if ids_to_delete:
                ItemCompra.objects.filter(id__in=ids_to_delete, compra=instance).delete()
        all_current_items = instance.itens.all()
        total_bruto_calculado = sum(item.valor_total_item for item in all_current_items if item.valor_total_item is not None)
        instance.valor_total_bruto = total_bruto_calculado if total_bruto_calculado is not None else Decimal('0.00')
        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        compra = self.get_object()
        if compra.tipo == 'ORCAMENTO':
            compra.tipo = 'COMPRA'
            compra.save()
            return Response({'status': 'orçamento aprovado'})
        return Response({'status': 'compra já aprovada'}, status=status.HTTP_400_BAD_REQUEST)


class DespesaExtraViewSet(viewsets.ModelViewSet):
    serializer_class = DespesaExtraSerializer
    permission_classes = [IsNivelAdmin | IsNivelGerente]

    def get_queryset(self):
        return Despesa_Extra.objects.all().order_by('-data')

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
        compras = Compra.objects.filter(obra_id=obra_id, data_compra__gte=data_inicio, data_compra__lte=data_fim)
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
        compras_qs = Compra.objects.filter(filters).distinct()
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
        custo_compras_mes = Compra.objects.filter(data_compra__year=current_year, data_compra__month=current_month).aggregate(total=Sum('valor_total_liquido'))['total'] or Decimal('0.00')
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
        total_compras = Compra.objects.filter(data_compra__gte=data_inicio, data_compra__lte=data_fim).aggregate(total=Sum('valor_total_liquido', output_field=DecimalField()))['total'] or Decimal('0.00')
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
        custos_compras = Compra.objects.filter(obra=obra).annotate(mes=TruncMonth('data_compra')).values('mes').annotate(total_compras=Sum('valor_total_liquido')).order_by('mes')
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
        end_date_str = request.query_params.get('end_date') # type: ignore
        if not start_date_str or not end_date_str: return Response({"error": "Parâmetros start_date e end_date são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            start_date = date.fromisoformat(start_date_str) # type: ignore
            end_date = date.fromisoformat(end_date_str) # type: ignore
        except ValueError: return Response({"error": "Formato de data inválido. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)
        if start_date > end_date: return Response({"error": "start_date não pode ser posterior a end_date."}, status=status.HTTP_400_BAD_REQUEST) # type: ignore
        all_dates_in_range = set()
        current_date = start_date
        while current_date <= end_date:
            all_dates_in_range.add(current_date)
            current_date += timedelta(days=1)
        locacoes_dates_qs = Locacao_Obras_Equipes.objects.filter(data_locacao_inicio__gte=start_date, data_locacao_inicio__lte=end_date, status_locacao='ativa').values_list('data_locacao_inicio', flat=True).distinct() # type: ignore
        locacoes_dates_set = set(locacoes_dates_qs) # type: ignore
        dias_sem_locacoes = sorted([dt.isoformat() for dt in (all_dates_in_range - locacoes_dates_set)]) # type: ignore
        medicoes_pendentes_qs = Locacao_Obras_Equipes.objects.filter( # type: ignore
            Q(data_locacao_inicio__gte=start_date) & Q(data_locacao_inicio__lte=end_date) & # type: ignore
            Q(status_locacao='ativa') & (Q(valor_pagamento__isnull=True) | Q(valor_pagamento=Decimal('0.00'))) # type: ignore
        ).select_related('obra', 'funcionario_locado', 'equipe') # type: ignore
        medicoes_pendentes_list = []
        for loc in medicoes_pendentes_qs: # type: ignore
            recurso_locado_str = get_recurso_nome_folha(loc) # type: ignore
            medicoes_pendentes_list.append({ # type: ignore
                'locacao_id': loc.id, # type: ignore
                'obra_nome': loc.obra.nome_obra if loc.obra else "Obra não especificada", # type: ignore
                'recurso_locado': recurso_locado_str,
                'data_inicio': loc.data_locacao_inicio.isoformat(), # type: ignore
                'tipo_pagamento': loc.get_tipo_pagamento_display(), # type: ignore
                'valor_pagamento': loc.valor_pagamento # type: ignore
            })
        return Response({'dias_sem_locacoes': dias_sem_locacoes, 'medicoes_pendentes': medicoes_pendentes_list}) # type: ignore

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
        custos_por_material = ItemCompra.objects.filter(compra__obra=obra_instance).values('material__nome').annotate(total_custo=Sum('valor_total_item')).order_by('-total_custo') # type: ignore
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
        custos = ItemCompra.objects.filter(compra__obra=obra)\
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
        if not inicio_semana_str:
            return Response({"error": "O parâmetro 'inicio' (data de início da semana no formato YYYY-MM-DD) é obrigatório."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            inicio_semana = date.fromisoformat(inicio_semana_str)
        except ValueError:
            return Response({"error": "Formato de data inválido para 'inicio'. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        fim_semana = inicio_semana + timedelta(days=6)
        print(f"[LocacaoSemanalView] Periodo: {inicio_semana_str} a {fim_semana.isoformat()}") # LOG BACKEND 1

        locacoes_na_semana = Locacao_Obras_Equipes.objects.filter(
            status_locacao='ativa'
        ).filter(
            # Locação começa antes ou durante o fim da semana E Locação termina depois ou durante o início da semana
            Q(data_locacao_inicio__lte=fim_semana) & Q(data_locacao_fim__gte=inicio_semana)
        ).select_related('obra', 'equipe', 'funcionario_locado').order_by('data_locacao_inicio')

        if obra_id_str:
            locacoes_na_semana = locacoes_na_semana.filter(obra_id=obra_id_str)

        print(f"[LocacaoSemanalView] Locações encontradas no período geral: {locacoes_na_semana.count()}") # LOG BACKEND 2

        resposta_semanal = {}
        for i in range(7):
            dia_corrente = inicio_semana + timedelta(days=i)
            dia_str = dia_corrente.isoformat()
            resposta_semanal[dia_str] = []

            for locacao in locacoes_na_semana:
                # Verifica se a locação está ativa no dia_corrente
                if locacao.data_locacao_inicio <= dia_corrente <= locacao.data_locacao_fim:
                    serializer = LocacaoObrasEquipesSerializer(locacao, context={'request': request})
                    resposta_semanal[dia_str].append(serializer.data)

        print(f"[LocacaoSemanalView] Resposta semanal final: {resposta_semanal}") # LOG BACKEND 3
        return Response(resposta_semanal)


class GerarRelatorioPDFObraView(APIView):
    permission_classes = [IsNivelAdmin | IsNivelGerente]

    def get(self, request, pk, format=None):
        is_simple_report = request.query_params.get('is_simple', 'false').lower() == 'true'

        try:
            obra_instance = Obra.objects.select_related('responsavel').get(pk=pk)
        except Obra.DoesNotExist:
            raise Http404("Obra não encontrada")

        compras = Compra.objects.filter(obra=obra_instance).prefetch_related('itens__material').order_by('data_compra', 'nota_fiscal')
        despesas_extras = Despesa_Extra.objects.filter(obra=obra_instance).order_by('data')
        locacoes = Locacao_Obras_Equipes.objects.filter(obra=obra_instance).select_related(
            'equipe__lider',
            'funcionario_locado'
        ).prefetch_related(
            'equipe__membros'
        ).order_by('data_locacao_inicio')
        fotos_qs = FotoObra.objects.filter(obra=obra_instance).order_by('uploaded_at')

        fotos_for_context = []
        if fotos_qs:
            for foto_obj in fotos_qs:
                try:
                    abs_path = foto_obj.imagem.path
                    path_with_fwd_slashes = abs_path.replace('\\', '/')
                    file_uri = f"file:///{path_with_fwd_slashes}"
                    fotos_for_context.append({
                        'uri': file_uri,
                        'description': foto_obj.descricao,
                        'original_path': abs_path
                    })
                except Exception:
                    pass

        custo_total_materiais = sum(c.valor_total_liquido for c in compras if c.valor_total_liquido) or Decimal('0.00')
        custo_total_despesas_extras = sum(de.valor for de in despesas_extras if de.valor) or Decimal('0.00')
        custo_total_locacoes = sum(loc.valor_pagamento for loc in locacoes if loc.valor_pagamento) or Decimal('0.00')

        custo_total_realizado = custo_total_materiais + custo_total_despesas_extras + custo_total_locacoes
        balanco_financeiro = (obra_instance.orcamento_previsto or Decimal('0.00')) - custo_total_realizado

        custo_por_m2 = Decimal('0.00')
        if obra_instance.area_metragem and obra_instance.area_metragem > 0:
            custo_por_m2 = custo_total_realizado / obra_instance.area_metragem

        context = {
            'obra': obra_instance,
            'compras': compras,
            'despesas_extras': despesas_extras,
            'locacoes': locacoes,
            'fotos': fotos_for_context,
            'data_emissao': timezone.now(),
            'custo_total_materiais': custo_total_materiais,
            'custo_total_despesas_extras': custo_total_despesas_extras,
            'custo_total_locacoes': custo_total_locacoes,
            'custo_total_realizado': custo_total_realizado,
            'balanco_financeiro': balanco_financeiro,
            'custo_por_m2': custo_por_m2,
            'MEDIA_ROOT': settings.MEDIA_ROOT,
            'is_simple_report': is_simple_report, # Passa a flag para o template
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
    print("--- AnexoLocacaoViewSet INITIALIZED ---")
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
        return self.queryset.none()

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
