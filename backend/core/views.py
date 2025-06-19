from rest_framework import viewsets, status, filters, permissions # Added filters and permissions
from rest_framework.parsers import MultiPartParser, FormParser # Added parsers
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q, Sum, F, Case, When, Value, IntegerField # Added Case, When, Value, IntegerField
from decimal import Decimal
from datetime import datetime, date, timedelta
from django.db import transaction
from rest_framework.decorators import action
from django.utils import timezone
from datetime import date, timedelta

from .models import Usuario, Obra, Funcionario, Equipe, Locacao_Obras_Equipes, Material, Compra, Despesa_Extra, Ocorrencia_Funcionario, ItemCompra, FotoObra
from .serializers import (
    UsuarioSerializer, ObraSerializer, FuncionarioSerializer, EquipeSerializer,
    LocacaoObrasEquipesSerializer, MaterialSerializer, CompraSerializer,
    DespesaExtraSerializer, OcorrenciaFuncionarioSerializer,
    ItemCompraSerializer,
    FotoObraSerializer, FuncionarioDetailSerializer,
    EquipeDetailSerializer, MaterialDetailSerializer, CompraReportSerializer
)
from .permissions import IsNivelAdmin, IsNivelGerente
from django.db.models import Sum, Count, F # Added F
from decimal import Decimal # Added Decimal
# Coalesce and Value imports removed as they were specific to ObrasDashboardSummaryView or already imported


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
    queryset = Obra.objects.all()
    serializer_class = ObraSerializer
    permission_classes = [IsNivelAdmin | IsNivelGerente]


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
    queryset = Equipe.objects.all()
    serializer_class = EquipeSerializer
    permission_classes = [IsNivelAdmin | IsNivelGerente]


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
    queryset = Locacao_Obras_Equipes.objects.all() # <<< ADD THIS LINE BACK
    serializer_class = LocacaoObrasEquipesSerializer
    permission_classes = [IsNivelAdmin | IsNivelGerente] # Or your specific permissions

    def get_queryset(self):
        today = timezone.now().date()

        queryset = Locacao_Obras_Equipes.objects.annotate(
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
                # 1. Retrieve and validate old locação
                try:
                    old_loc = Locacao_Obras_Equipes.objects.get(pk=conflicting_locacao_id)
                except Locacao_Obras_Equipes.DoesNotExist:
                    return Response({"error": "Locação conflitante não encontrada."}, status=status.HTTP_404_NOT_FOUND)

                # 2. Prepare new locação data
                # Ensure 'funcionario_locado' ID is an integer
                if 'funcionario_locado' in new_locacao_data and isinstance(new_locacao_data['funcionario_locado'], str):
                    try:
                        new_locacao_data['funcionario_locado'] = int(new_locacao_data['funcionario_locado'])
                    except ValueError:
                        return Response({"error": "ID de funcionário inválido."}, status=status.HTTP_400_BAD_REQUEST)

                # Ensure 'obra' ID is an integer
                if 'obra' in new_locacao_data and isinstance(new_locacao_data['obra'], str):
                    try:
                        new_locacao_data['obra'] = int(new_locacao_data['obra'])
                    except ValueError:
                            return Response({"error": "ID de obra inválido."}, status=status.HTTP_400_BAD_REQUEST)

                # 3. Determine new end date for old locação
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
                    # Simplified: remove cost from old loc as per "removendo o custo da obra anterior"
                    old_loc.valor_pagamento = Decimal('0.00')

                old_loc.status_locacao = 'cancelada' # <<< ADD THIS LINE
                old_loc.save()

                # 4. Now, validate and save the new locação.
                # The conflict with old_loc should now be resolved.
                new_loc_serializer = self.get_serializer(data=new_locacao_data)
                if not new_loc_serializer.is_valid():
                        return Response(new_loc_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

                new_loc = new_loc_serializer.save()
                return Response(self.get_serializer(new_loc).data, status=status.HTTP_201_CREATED)

        except Exception as e:
            # Log the exception e here for debugging
            # logger.error(f"Erro na transferência de funcionário: {str(e)}")
            return Response({"error": f"Erro interno no servidor: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Note: The get_queryset method for LocacaoObrasEquipesViewSet is below the custom action.
    # This is fine, but for consistency, custom actions are often placed after standard methods.
    # No change needed for this subtask, just an observation.

    @action(detail=False, methods=['get'], url_path='custo_diario_chart')
    def custo_diario_chart(self, request):
        today = timezone.now().date()
        start_date = today - timedelta(days=29) # 30 days including today

        obra_id_str = request.query_params.get('obra_id')

        locacoes_qs = Locacao_Obras_Equipes.objects.filter(
            data_locacao_inicio__gte=start_date,
            data_locacao_inicio__lte=today,
            status_locacao='ativa' # Consider only active locações for cost
        )

        if obra_id_str:
            try:
                obra_id = int(obra_id_str)
                locacoes_qs = locacoes_qs.filter(obra_id=obra_id)
            except ValueError:
                return Response({"error": "ID de obra inválido."}, status=status.HTTP_400_BAD_REQUEST)

        # Group by date and sum 'valor_pagamento'
        # We are interested in the cost *initiated* on a certain day.
        # If a locacao spans multiple days, its full 'valor_pagamento' is attributed to 'data_locacao_inicio'.
        # This matches the requirement "Group the filtered locações by data_locacao_inicio ... and sum the valor_total_locacao"
        daily_costs_db = locacoes_qs.values('data_locacao_inicio').annotate(
            total_cost_for_day=Sum('valor_pagamento')
        ).order_by('data_locacao_inicio')

        # Prepare a dictionary for quick lookup
        costs_by_date_map = {
            item['data_locacao_inicio']: item['total_cost_for_day']
            for item in daily_costs_db
        }

        # Generate the full list of dates for the 30-day period
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
    """
    API endpoint that allows materiais to be viewed or edited.
    """
    queryset = Material.objects.all().order_by('nome') # Added default ordering
    serializer_class = MaterialSerializer
    permission_classes = [IsNivelAdmin | IsNivelGerente]
    filter_backends = [filters.SearchFilter]
    search_fields = ['nome'] # Search by material name

    @action(detail=False, methods=['get'], url_path='alertas-estoque-baixo')
    def alertas_estoque_baixo(self, request):
        # Assuming 'quantidade_em_estoque' is a field on the Material model
        # And 'nivel_minimo_estoque' is the new field
        low_stock_materials = Material.objects.filter(
            nivel_minimo_estoque__gt=0,  # Only consider materials where a minimum is set
            quantidade_em_estoque__lte=F('nivel_minimo_estoque') # Compare field with another field
        )
        # Use the viewset's default serializer, which is MaterialSerializer
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
    """
    API endpoint that allows compras to be viewed or edited.
    """
    # queryset = Compra.objects.all() # Replaced by get_queryset
    serializer_class = CompraSerializer
    permission_classes = [IsNivelAdmin | IsNivelGerente]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Manually handle the creation process to intercept itens_data
        validated_data = serializer.validated_data
        itens_data = validated_data.pop('itens')

        compra = Compra.objects.create(**validated_data)

        for item_data in itens_data:
            # Create the ItemCompra instance
            item = ItemCompra.objects.create(compra=compra, **item_data)

            # Logic to update Material.categoria_uso_padrao
            material_obj = item_data.get('material') # This should be a Material instance
            categoria_uso = item_data.get('categoria_uso') # This is the string value

            if categoria_uso and material_obj and isinstance(material_obj, Material): # Added type check
                print(f"DEBUG: Attempting to update Material ID {material_obj.id} with categoria_uso: {categoria_uso}")
                material_obj.categoria_uso_padrao = categoria_uso
                material_obj.save(update_fields=['categoria_uso_padrao'])
                print(f"DEBUG: Successfully updated categoria_uso_padrao for Material ID {material_obj.id} to {categoria_uso}")
            elif material_obj and not isinstance(material_obj, Material):
                print(f"DEBUG: material_obj for item was not a Material instance. Type: {type(material_obj)}. Value: {material_obj}")

        # Recalculate valor_total_bruto based on saved items
        total_bruto_calculado = sum(item.valor_total_item for item in compra.itens.all())
        compra.valor_total_bruto = total_bruto_calculado if total_bruto_calculado is not None else Decimal('0.00')
        compra.save() # This will also trigger valor_total_liquido calculation

        # Re-serialize the Compra instance with the updated data
        # Use the same serializer instance that was used for validation to return the response
        # Or create a new one if that's cleaner, but ensure it's the correct serializer for output
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
            except ValueError:
                pass # Silently ignore invalid date format for data_inicio

        data_fim_str = self.request.query_params.get('data_fim')
        if data_fim_str:
            try:
                data_fim = datetime.strptime(data_fim_str, '%Y-%m-%d').date()
                queryset = queryset.filter(data_compra__lte=data_fim)
            except ValueError:
                pass # Silently ignore invalid date format for data_fim

        fornecedor = self.request.query_params.get('fornecedor')
        if fornecedor:
            queryset = queryset.filter(fornecedor__icontains=fornecedor)

        return queryset

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object() # Get Compra instance
        print(f"DEBUG: Updating Compra ID: {instance.id} with data: {request.data}")

        # Basic data for Compra model itself
        instance.obra_id = request.data.get('obra', instance.obra_id)
        instance.fornecedor = request.data.get('fornecedor', instance.fornecedor)
        instance.data_compra = request.data.get('data_compra', instance.data_compra)
        instance.nota_fiscal = request.data.get('nota_fiscal', instance.nota_fiscal)
        # Ensure Decimal conversion for DecimalFields
        desconto_str = request.data.get('desconto', str(instance.desconto))
        try:
            instance.desconto = Decimal(desconto_str)
        except ValueError: # Catch potential InvalidOperation if string is not a valid decimal
            instance.desconto = instance.desconto # Keep original if conversion fails
            # Optionally, return a 400 error here if strict validation is needed
            # return Response({"error": "Invalid format for desconto."}, status=status.HTTP_400_BAD_REQUEST)
            print(f"WARNING: Invalid format for desconto '{desconto_str}'. Keeping original value.")


        instance.observacoes = request.data.get('observacoes', instance.observacoes)

        # Handling 'itens'
        itens_data = request.data.get('itens', None)

        if itens_data is not None: # If 'itens' is part of the request
            existing_items_ids = set(instance.itens.values_list('id', flat=True))
            request_items_ids = set()

            for item_data in itens_data:
                print(f"DEBUG: Processing item_data: {item_data} for Compra ID: {instance.id}")
                item_id = item_data.get('id', None)
                material_id = item_data.get('material') # This is expected to be an ID
                categoria_uso = item_data.get('categoria_uso') # New field

                try:
                    quantidade_str = item_data.get('quantidade', '0')
                    quantidade = Decimal(quantidade_str)
                    valor_unitario_str = item_data.get('valor_unitario', '0')
                    valor_unitario = Decimal(valor_unitario_str)
                except ValueError as e:
                    print(f"ERROR: Invalid decimal format for item {item_data}. Error: {e}. Skipping.")
                    # Optionally, return Response({"error": f"Invalid decimal format for item {item_data}."}, status=status.HTTP_400_BAD_REQUEST)
                    continue # Skip this item if data is invalid

                material_obj = None
                if material_id:
                    try:
                        material_obj = Material.objects.get(id=material_id)
                    except Material.DoesNotExist:
                        print(f"ERROR: Material ID {material_id} not found for item_data: {item_data}. Skipping item.")
                        # Optionally, return Response({"error": f"Material ID {material_id} not found."}, status=status.HTTP_400_BAD_REQUEST)
                        continue # Skip this item if material not found
                else:
                    print(f"ERROR: material_id not provided for item_data: {item_data}. Skipping item.")
                    # Optionally, return Response({"error": "material_id is required for each item."}, status=status.HTTP_400_BAD_REQUEST)
                    continue # Skip if no material_id

                if item_id: # Existing item
                    if item_id in existing_items_ids:
                        try:
                            item_instance = ItemCompra.objects.get(id=item_id, compra=instance)
                            item_instance.material = material_obj # Assign Material instance
                            item_instance.quantidade = quantidade
                            item_instance.valor_unitario = valor_unitario
                            if categoria_uso is not None: # Only update if provided
                                item_instance.categoria_uso = categoria_uso
                            item_instance.save()
                            request_items_ids.add(item_id) # Add to set only if successfully processed
                            print(f"DEBUG: Updated ItemCompra ID {item_instance.id}")
                        except ItemCompra.DoesNotExist:
                             # This case should ideally not happen if item_id is in existing_items_ids from the same compra
                            print(f"ERROR: ItemCompra ID {item_id} not found for Compra ID {instance.id} despite being in existing_items_ids. Skipping.")
                            continue
                    else:
                        # item_id provided but not found for this Compra - this is an anomaly.
                        # Could log an error or decide if this implies creating a new one,
                        # but the current logic implies item_id is for an *existing* item of *this* Compra.
                        print(f"WARNING: item_id {item_id} provided but not found in existing items for Compra ID {instance.id}. Skipping update for this item_data.")
                        continue # Skip this item data, as it's ambiguous
                else: # New item
                    if not material_obj: # Should have been caught earlier, but as a safeguard
                        print(f"ERROR: Cannot create new item without valid material. Skipping item_data: {item_data}")
                        continue

                    item_instance_data = {
                        'compra': instance,
                        'material': material_obj, # Assign Material instance
                        'quantidade': quantidade,
                        'valor_unitario': valor_unitario
                    }
                    if categoria_uso is not None:
                        item_instance_data['categoria_uso'] = categoria_uso

                    item_instance = ItemCompra.objects.create(**item_instance_data)
                    request_items_ids.add(item_instance.id) # Add new item's ID
                    print(f"DEBUG: Created new ItemCompra with ID {item_instance.id}")

                # Update Material.categoria_uso_padrao
                if categoria_uso and material_obj:
                    print(f"DEBUG: Attempting to update Material ID {material_obj.id} with categoria_uso: {categoria_uso} during Compra update.")
                    material_obj.categoria_uso_padrao = categoria_uso
                    material_obj.save(update_fields=['categoria_uso_padrao'])
                    print(f"DEBUG: Successfully updated categoria_uso_padrao for Material ID {material_obj.id} to {categoria_uso} during Compra update.")

            ids_to_delete = existing_items_ids - request_items_ids
            if ids_to_delete:
                ItemCompra.objects.filter(id__in=ids_to_delete, compra=instance).delete()
                print(f"DEBUG: Deleted ItemCompra IDs: {ids_to_delete} for Compra ID: {instance.id}")

        # Recalculate valor_total_bruto based on current items
        # Fetch fresh list of items after all operations
        all_current_items = instance.itens.all()
        total_bruto_calculado = sum(item.valor_total_item for item in all_current_items if item.valor_total_item is not None)
        instance.valor_total_bruto = total_bruto_calculado if total_bruto_calculado is not None else Decimal('0.00')

        # Save Compra instance to update valor_total_liquido (via Compra.save() method)
        # and other direct Compra fields modified at the beginning.
        instance.save()
        print(f"DEBUG: Saved Compra ID: {instance.id} after item processing and recalculations.")

        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class DespesaExtraViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows despesas extras to be viewed or edited.
    """
    # queryset = Despesa_Extra.objects.all() # Replaced by get_queryset
    serializer_class = DespesaExtraSerializer
    permission_classes = [IsNivelAdmin | IsNivelGerente]

    def get_queryset(self):
        queryset = Despesa_Extra.objects.all().order_by('-data') # Default ordering by most recent

        obra_id = self.request.query_params.get('obra_id')
        if obra_id:
            queryset = queryset.filter(obra_id=obra_id)

        # Can add other filters like date range, category, etc. in the future
        # data_inicio = self.request.query_params.get('data_inicio')
        # if data_inicio:
        #     queryset = queryset.filter(data__gte=data_inicio)
        # data_fim = self.request.query_params.get('data_fim')
        # if data_fim:
        #     queryset = queryset.filter(data__lte=data_fim)
        # categoria = self.request.query_params.get('categoria')
        # if categoria:
        #     queryset = queryset.filter(categoria=categoria)

        return queryset


class OcorrenciaFuncionarioViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows ocorrencias de funcionarios to be viewed or edited.
    """
    queryset = Ocorrencia_Funcionario.objects.all() # Base queryset
    serializer_class = OcorrenciaFuncionarioSerializer
    permission_classes = [IsNivelAdmin | IsNivelGerente]

    def get_queryset(self):
        queryset = Ocorrencia_Funcionario.objects.all().select_related('funcionario').order_by('-data')

        data_inicio_str = self.request.query_params.get('data_inicio')
        data_fim_str = self.request.query_params.get('data_fim')
        funcionario_id_str = self.request.query_params.get('funcionario_id')
        tipo_ocorrencia_str = self.request.query_params.get('tipo') # Matches model field 'tipo'

        if data_inicio_str:
            try:
                data_inicio = datetime.strptime(data_inicio_str, '%Y-%m-%d').date()
                queryset = queryset.filter(data__gte=data_inicio)
            except ValueError:
                # Silently ignore invalid date format for now, or raise ParseError
                pass

        if data_fim_str:
            try:
                data_fim = datetime.strptime(data_fim_str, '%Y-%m-%d').date()
                queryset = queryset.filter(data__lte=data_fim)
            except ValueError:
                pass

        if funcionario_id_str:
            try:
                funcionario_id = int(funcionario_id_str)
                queryset = queryset.filter(funcionario_id=funcionario_id)
            except ValueError:
                pass # Silently ignore invalid funcionario_id

        if tipo_ocorrencia_str:
            # Assumes frontend sends the exact string value as stored in the model's 'tipo' field
            # e.g., "Atraso", "Falta Justificada", "Falta não Justificada"
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
            return Response(
                {"error": "Parâmetros obra_id, data_inicio e data_fim são obrigatórios."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            obra_id = int(obra_id)
            data_inicio = datetime.strptime(data_inicio_str, '%Y-%m-%d').date()
            data_fim = datetime.strptime(data_fim_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {"error": "Formato inválido para obra_id ou datas (esperado YYYY-MM-DD)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if data_inicio > data_fim:
            return Response(
                {"error": "A data_inicio não pode ser posterior à data_fim."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            obra = Obra.objects.get(pk=obra_id)
        except Obra.DoesNotExist:
            return Response(
                {"error": f"Obra com id {obra_id} não encontrada."},
                status=status.HTTP_404_NOT_FOUND
            )

        compras = Compra.objects.filter(
            obra_id=obra_id,
            data_compra__gte=data_inicio,
            data_compra__lte=data_fim
        )
        despesas_extras = Despesa_Extra.objects.filter(
            obra_id=obra_id,
            data__gte=data_inicio,
            data__lte=data_fim
        )

        total_compras = compras.aggregate(total=Sum('valor_total_liquido'))['total'] or Decimal('0.00')
        total_despesas_extras = despesas_extras.aggregate(total=Sum('valor'))['total'] or Decimal('0.00')
        custo_total_geral = total_compras + total_despesas_extras

        return Response({
            "obra_id": obra_id,
            "nome_obra": obra.nome_obra, # Added for better context
            "data_inicio": data_inicio_str,
            "data_fim": data_fim_str,
            "total_compras": total_compras,
            "total_despesas_extras": total_despesas_extras,
            "custo_total_geral": custo_total_geral
        })


class RelatorioGeralComprasView(APIView):
    permission_classes = [IsNivelAdmin | IsNivelGerente]

    def get(self, request, *args, **kwargs):
        data_inicio_str = request.query_params.get('data_inicio')
        data_fim_str = request.query_params.get('data_fim')
        obra_id_str = request.query_params.get('obra_id')
        # material_id_str = request.query_params.get('material_id') # Material filter removed for now

        if not all([data_inicio_str, data_fim_str]):
            return Response(
                {"error": "Parâmetros data_inicio e data_fim são obrigatórios."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            data_inicio = datetime.strptime(data_inicio_str, '%Y-%m-%d').date()
            data_fim = datetime.strptime(data_fim_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {"error": "Formato inválido para datas (esperado YYYY-MM-DD)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if data_inicio > data_fim:
            return Response(
                {"error": "A data_inicio não pode ser posterior à data_fim."},
                status=status.HTTP_400_BAD_REQUEST
            )

        filters = Q(data_compra__gte=data_inicio) & Q(data_compra__lte=data_fim)
        applied_filters_echo = {
            "data_inicio": data_inicio_str,
            "data_fim": data_fim_str
        }

        if obra_id_str:
            try:
                obra_id = int(obra_id_str)
                filters &= Q(obra_id=obra_id)
                applied_filters_echo["obra_id"] = obra_id
            except ValueError:
                return Response({"error": "obra_id deve ser um número inteiro."}, status=status.HTTP_400_BAD_REQUEST)
            # Not using Obra.objects.get(pk=obra_id) here, so DoesNotExist is less direct.
            # If obra_id is an int but doesn't exist, filter will just not match.

        fornecedor_param = request.query_params.get('fornecedor')
        if fornecedor_param:
            filters &= Q(fornecedor__icontains=fornecedor_param)
            applied_filters_echo["fornecedor"] = fornecedor_param

        # Filtering by material_id directly on Compra is no longer straightforward
        # as Compra does not have a direct material field.
        # This would require joining through ItemCompra.
        # For now, the material_id filter is removed from this specific report.
        # if material_id_str:
        #     try:
        #         material_id = int(material_id_str)
        #         # This filter would need to be more complex:
        #         # filters &= Q(itens__material_id=material_id)
        #         # And would likely require .distinct() on compras_qs if a compra has multiple items of the same material.
        #         applied_filters_echo["material_id"] = material_id
        #     except ValueError:
        #         return Response({"error": "material_id deve ser um número inteiro."}, status=status.HTTP_400_BAD_REQUEST)
        #     # except Material.DoesNotExist: # Check if material exists
        #     #      return Response({"error": f"Material com id {material_id_str} não encontrado."}, status=status.HTTP_404_NOT_FOUND)


        compras_qs = Compra.objects.filter(filters).distinct() # Added distinct in case of future joins that might duplicate Compras
        soma_total_compras = compras_qs.aggregate(total=Sum('valor_total_liquido'))['total'] or Decimal('0.00')

        serializer = CompraSerializer(compras_qs, many=True)

        return Response({
            "filtros": applied_filters_echo,
            "soma_total_compras": soma_total_compras,
            "compras": serializer.data
        })

# Placeholder for other views if any
# from django.shortcuts import render
# Create your views here.

from django.utils import timezone
from django.db.models import Sum, Count, F, DecimalField
# Ensure other necessary imports like APIView, Response, permissions, Obra, Funcionario, Compra, Despesa_Extra are present

class DashboardStatsView(APIView):
    permission_classes = [IsNivelAdmin | IsNivelGerente]

    def get(self, request, *args, **kwargs):
        # 1. Obras em andamento
        obras_em_andamento = Obra.objects.filter(status='Em Andamento').count()

        # 2. Custo total do mês corrente
        current_month = timezone.now().month
        current_year = timezone.now().year

        custo_compras_mes = Compra.objects.filter(
            data_compra__year=current_year,
            data_compra__month=current_month
        ).aggregate(total=Sum('valor_total_liquido'))['total'] or Decimal('0.00')

        custo_despesas_extras_mes = Despesa_Extra.objects.filter(
            data__year=current_year,
            data__month=current_month
        ).aggregate(total=Sum('valor'))['total'] or Decimal('0.00')

        custo_total_mes_corrente = custo_compras_mes + custo_despesas_extras_mes

        # 3. Total de funcionários
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
            return Response(
                {"error": "Parâmetro equipe_id é obrigatório."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            equipe_id = int(equipe_id_str)
        except ValueError:
            return Response(
                {"error": "Parâmetro equipe_id deve ser um número inteiro."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            equipe = Equipe.objects.get(pk=equipe_id)
        except Equipe.DoesNotExist:
            return Response(
                {"error": f"Equipe com id {equipe_id} não encontrada."},
                status=status.HTTP_404_NOT_FOUND
            )

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
                filters &= Q(Q(data_locacao_fim__lte=data_fim) | Q(data_locacao_fim__isnull=True)) # include ongoing if fim is null
                applied_filters_echo["data_fim"] = data_fim_str
            except ValueError:
                return Response({"error": "Formato inválido para data_fim (esperado YYYY-MM-DD)."}, status=status.HTTP_400_BAD_REQUEST)

        if data_inicio_str and data_fim_str and data_inicio > data_fim:
            return Response(
                {"error": "A data_inicio não pode ser posterior à data_fim."},
                status=status.HTTP_400_BAD_REQUEST
            )

        alocacoes = Locacao_Obras_Equipes.objects.filter(filters).select_related('obra').order_by('data_locacao_inicio')

        # We need more details in the serializer for this report,
        # specifically obra details. Let's augment the AlocacaoObrasEquipesSerializer
        # or create a specific one if necessary. For now, let's assume
        # AlocacaoObrasEquipesSerializer can be expanded or is sufficient.
        # If not, the serializer would need to be modified.
        # A better approach might be a dedicated serializer for reports.

        # To include obra name directly without modifying serializer for now:
        # This is less ideal than a proper serializer but works for a quick solution.
        data = []
        for alocacao in alocacoes:
            data.append({
                "id": alocacao.id,
                "obra_id": alocacao.obra.id,
                "obra_nome": alocacao.obra.nome_obra,
                "equipe_id": alocacao.equipe.id,
                "equipe_nome": alocacao.equipe.nome_equipe,
                "data_locacao_inicio": alocacao.data_locacao_inicio,
                "data_locacao_fim": alocacao.data_locacao_fim,
            })

        return Response({
            "filtros": applied_filters_echo,
            "alocacoes": data # Using custom serialized data
            # "alocacoes": AlocacaoObrasEquipesSerializer(alocacoes, many=True).data # If serializer is good
        })


class RelatorioCustoGeralView(APIView):
    permission_classes = [IsNivelAdmin | IsNivelGerente]

    def get(self, request, *args, **kwargs):
        data_inicio_str = request.query_params.get('data_inicio')
        data_fim_str = request.query_params.get('data_fim')

        # Date filtering is mandatory for this report to make sense
        if not data_inicio_str or not data_fim_str:
            return Response(
                {"error": "Parâmetros data_inicio e data_fim são obrigatórios."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            data_inicio = datetime.strptime(data_inicio_str, '%Y-%m-%d').date()
            data_fim = datetime.strptime(data_fim_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {"error": "Formato inválido para datas (esperado YYYY-MM-DD)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if data_inicio > data_fim:
            return Response(
                {"error": "A data_inicio não pode ser posterior à data_fim."},
                status=status.HTTP_400_BAD_REQUEST
            )

        applied_filters_echo = {
            "data_inicio": data_inicio_str,
            "data_fim": data_fim_str
        }

        # Calculate total cost from Compras
        total_compras = Compra.objects.filter(
            data_compra__gte=data_inicio,
            data_compra__lte=data_fim
        ).aggregate(total=Sum('valor_total_liquido', output_field=DecimalField()))['total'] or Decimal('0.00')

        # Calculate total cost from Despesas Extras
        total_despesas_extras = Despesa_Extra.objects.filter(
            data__gte=data_inicio,
            data__lte=data_fim
        ).aggregate(total=Sum('valor', output_field=DecimalField()))['total'] or Decimal('0.00')

        custo_consolidado_total = total_compras + total_despesas_extras

        # Optionally, you can break down costs by obra if needed for a more detailed report
        # For now, the request is for the consolidated cost.

        return Response({
            "filtros": applied_filters_echo,
            "total_compras": total_compras,
            "total_despesas_extras": total_despesas_extras,
            "custo_consolidado_total": custo_consolidado_total
        })


from django.db.models.functions import TruncMonth

class ObraHistoricoCustosView(APIView):
    permission_classes = [IsNivelAdmin | IsNivelGerente]

    def get(self, request, pk, format=None): # pk será o ID da obra
        try:
            obra = Obra.objects.get(pk=pk)
        except Obra.DoesNotExist:
            return Response({"error": "Obra não encontrada."}, status=status.HTTP_404_NOT_FOUND)

        # Custos de Compras agrupados por mês
        custos_compras = Compra.objects.filter(obra=obra) \
                    .annotate(mes=TruncMonth('data_compra')) \
                    .values('mes') \
                    .annotate(total_compras=Sum('valor_total_liquido')) \
                    .order_by('mes')

        # Custos de Despesas Extras agrupados por mês
        custos_despesas = Despesa_Extra.objects.filter(obra=obra) \
                    .annotate(mes=TruncMonth('data')) \
                    .values('mes') \
                    .annotate(total_despesas=Sum('valor')) \
                    .order_by('mes')

        # Combinar os resultados
        historico = {}
        for compra in custos_compras:
            # Ensure 'mes' is not None; skip if it is (though TruncMonth should always return a date)
            if compra['mes'] is None:
                continue
            mes_str = compra['mes'].strftime('%Y-%m')
            if mes_str not in historico:
                historico[mes_str] = {'compras': Decimal('0.00'), 'despesas_extras': Decimal('0.00')}
            historico[mes_str]['compras'] += compra['total_compras'] or Decimal('0.00')

        for despesa in custos_despesas:
            # Ensure 'mes' is not None
            if despesa['mes'] is None:
                continue
            mes_str = despesa['mes'].strftime('%Y-%m')
            if mes_str not in historico:
                historico[mes_str] = {'compras': Decimal('0.00'), 'despesas_extras': Decimal('0.00')}
            historico[mes_str]['despesas_extras'] += despesa['total_despesas'] or Decimal('0.00')

        # Formatar para a saída desejada (array de objetos)
        resultado_final = []
        for mes, totais in sorted(historico.items()):
            resultado_final.append({
                'mes': mes,
                'total_custo_compras': totais['compras'],
                'total_custo_despesas': totais['despesas_extras'],
                'total_geral_mes': totais['compras'] + totais['despesas_extras']
            })

        return Response(resultado_final)


class ObraCustosPorCategoriaView(APIView):
    permission_classes = [IsNivelAdmin | IsNivelGerente]

    def get(self, request, pk, format=None): # pk é o ID da obra
        try:
            obra = Obra.objects.get(pk=pk)
        except Obra.DoesNotExist:
            return Response({"error": "Obra não encontrada."}, status=status.HTTP_404_NOT_FOUND)

        custos_por_categoria = Despesa_Extra.objects.filter(obra=obra) \
            .values('categoria') \
            .annotate(total_valor=Sum('valor')) \
            .order_by('-total_valor') # Opcional: ordenar por valor

        # Formatar para [{ name: 'Categoria', value: X }, ...] para Recharts PieChart
        resultado_formatado = [{'name': item['categoria'], 'value': item['total_valor'] or Decimal('0.00')} for item in custos_por_categoria if item['total_valor'] is not None]

        return Response(resultado_formatado)


from collections import defaultdict
from django.utils.dateparse import parse_date # For robust date parsing

class RelatorioFolhaPagamentoViewSet(viewsets.ViewSet):
    permission_classes = [IsNivelAdmin | IsNivelGerente] # Or your specific permissions

    @action(detail=False, methods=['get'], url_path='pre_check_dias_sem_locacoes')
    def pre_check_dias_sem_locacoes(self, request):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        if not start_date_str or not end_date_str:
            return Response({"error": "Parâmetros start_date e end_date são obrigatórios."},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            start_date = date.fromisoformat(start_date_str)
            end_date = date.fromisoformat(end_date_str)
        except ValueError:
            return Response({"error": "Formato de data inválido. Use YYYY-MM-DD."},
                            status=status.HTTP_400_BAD_REQUEST)

        if start_date > end_date:
            return Response({"error": "start_date não pode ser posterior a end_date."},
                            status=status.HTTP_400_BAD_REQUEST)

        all_dates_in_range = set()
        current_date = start_date
        while current_date <= end_date:
            all_dates_in_range.add(current_date)
            current_date += timedelta(days=1)

        locacoes_dates_qs = Locacao_Obras_Equipes.objects.filter(
            data_locacao_inicio__gte=start_date,
            data_locacao_inicio__lte=end_date,
            status_locacao='ativa' # Consider active locações
        ).values_list('data_locacao_inicio', flat=True).distinct()

        locacoes_dates_set = set(locacoes_dates_qs)
        dias_sem_locacoes = sorted([dt.isoformat() for dt in (all_dates_in_range - locacoes_dates_set)])

        # New: Identify "medições pendentes"
        medicoes_pendentes_qs = Locacao_Obras_Equipes.objects.filter(
            Q(data_locacao_inicio__gte=start_date) &
            Q(data_locacao_inicio__lte=end_date) &
            Q(status_locacao='ativa') &
            (Q(valor_pagamento__isnull=True) | Q(valor_pagamento=Decimal('0.00')))
        ).select_related('obra', 'funcionario_locado', 'equipe')

        medicoes_pendentes_list = []
        for loc in medicoes_pendentes_qs:
            recurso_locado_str = "Serviço Externo"
            if loc.funcionario_locado:
                recurso_locado_str = f"Funcionário: {loc.funcionario_locado.nome_completo}"
            elif loc.equipe:
                recurso_locado_str = f"Equipe: {loc.equipe.nome_equipe}"
            elif loc.servico_externo: # Ensure servico_externo is captured if it's the case
                 recurso_locado_str = f"Serviço Externo: {loc.servico_externo}"


            medicoes_pendentes_list.append({
                'locacao_id': loc.id,
                'obra_nome': loc.obra.nome_obra if loc.obra else "Obra não especificada",
                'recurso_locado': recurso_locado_str,
                'data_inicio': loc.data_locacao_inicio.isoformat(),
                'tipo_pagamento': loc.get_tipo_pagamento_display(),
                'valor_pagamento': loc.valor_pagamento # Will be null or 0.00
            })

        return Response({
            'dias_sem_locacoes': dias_sem_locacoes,
            'medicoes_pendentes': medicoes_pendentes_list
        })

    @action(detail=False, methods=['get'], url_path='generate_report')
    def generate_report(self, request):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        if not start_date_str or not end_date_str:
            return Response({"error": "Parâmetros start_date e end_date são obrigatórios."},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            start_date = date.fromisoformat(start_date_str)
            end_date = date.fromisoformat(end_date_str)
        except ValueError:
            return Response({"error": "Formato de data inválido. Use YYYY-MM-DD."},
                            status=status.HTTP_400_BAD_REQUEST)

        if start_date > end_date:
            return Response({"error": "start_date não pode ser posterior a end_date."},
                            status=status.HTTP_400_BAD_REQUEST)

        locacoes_periodo = Locacao_Obras_Equipes.objects.filter(
            Q(data_locacao_inicio__gte=start_date) &
            Q(data_locacao_inicio__lte=end_date) &
            (Q(data_pagamento__isnull=True) | Q(data_pagamento__lte=end_date)) &
            # Expanded filter to include all locacao types with a payment value
            (
                Q(funcionario_locado__isnull=False) |
                Q(equipe__isnull=False) |
                (Q(servico_externo__isnull=False) & ~Q(servico_externo=''))
            ) &
            Q(status_locacao='ativa') &
            Q(valor_pagamento__isnull=False) &
            Q(valor_pagamento__gt=Decimal('0.00'))
        ).select_related('obra', 'funcionario_locado', 'equipe')

        report_data_by_obra = defaultdict(lambda: {
            "obra_id": None,
            "obra_nome": "",
            "dias": defaultdict(lambda: {
                "data": None,
                "locacoes_no_dia": [],
                "total_dia_obra": Decimal('0.00')
            }),
            "total_obra_periodo": Decimal('0.00')
        })

        def get_recurso_nome(locacao_instance):
            if locacao_instance.funcionario_locado:
                return f"Funcionário: {locacao_instance.funcionario_locado.nome_completo}"
            elif locacao_instance.equipe:
                return f"Equipe: {locacao_instance.equipe.nome_equipe}"
            elif locacao_instance.servico_externo:
                return f"Serviço Externo: {locacao_instance.servico_externo}"
            return "N/A"

        for locacao in locacoes_periodo:
            obra = locacao.obra
            if not obra: # Should ideally not happen if obra is mandatory for locacao
                continue

            # Determine effective start and end dates for the locacao within the report period
            effective_start_date = max(locacao.data_locacao_inicio, start_date)
            effective_end_date = min(locacao.data_locacao_fim, end_date)

            current_day_in_loop = effective_start_date
            while current_day_in_loop <= effective_end_date:
                daily_cost_for_locacao = Decimal('0.00')

                if locacao.tipo_pagamento == 'diaria':
                    daily_cost_for_locacao = locacao.valor_pagamento # Assumed to be per-diem rate
                elif locacao.tipo_pagamento in ['metro', 'empreitada']:
                    # Lump sum attributed to the locacao's actual start date if it falls on the current_day_in_loop
                    if locacao.data_locacao_inicio == current_day_in_loop:
                        daily_cost_for_locacao = locacao.valor_pagamento

                if daily_cost_for_locacao > Decimal('0.00'):
                    if report_data_by_obra[obra.id]["obra_id"] is None:
                        report_data_by_obra[obra.id]["obra_id"] = obra.id
                        report_data_by_obra[obra.id]["obra_nome"] = obra.nome_obra

                    day_iso = current_day_in_loop.isoformat()
                    day_data_dict = report_data_by_obra[obra.id]["dias"][day_iso]

                    if day_data_dict["data"] is None:
                        day_data_dict["data"] = day_iso

                    day_data_dict["locacoes_no_dia"].append({
                        "locacao_id": locacao.id,
                        "recurso_nome": get_recurso_nome(locacao),
                        "tipo_pagamento_display": locacao.get_tipo_pagamento_display(),
                        "valor_diario_atribuido": str(daily_cost_for_locacao),
                        "valor_pagamento_total_locacao": str(locacao.valor_pagamento),
                        "data_locacao_original_inicio": locacao.data_locacao_inicio.isoformat(),
                        "data_locacao_original_fim": locacao.data_locacao_fim.isoformat(),
                        "data_pagamento_prevista": locacao.data_pagamento.isoformat() if locacao.data_pagamento else None,
                    })
                    day_data_dict["total_dia_obra"] += daily_cost_for_locacao
                    report_data_by_obra[obra.id]["total_obra_periodo"] += daily_cost_for_locacao

                current_day_in_loop += timedelta(days=1)

        # Convert to list and format for response
        final_report_list = []
        sorted_obra_ids = sorted(report_data_by_obra.keys(), key=lambda obra_id_key: report_data_by_obra[obra_id_key]["obra_nome"])

        for obra_id_key in sorted_obra_ids:
            obra_data = report_data_by_obra[obra_id_key]
            sorted_dias_keys = sorted(obra_data["dias"].keys())

            dias_list = []
            for day_key in sorted_dias_keys:
                dia_info = obra_data["dias"][day_key]
                dia_info["total_dia_obra"] = str(dia_info["total_dia_obra"])
                # Sort locacoes within each day by recurso_nome for consistent ordering
                dia_info["locacoes_no_dia"].sort(key=lambda x: x["recurso_nome"])
                dias_list.append(dia_info)

            final_report_list.append({
                "obra_id": obra_data["obra_id"],
                "obra_nome": obra_data["obra_nome"],
                "dias": dias_list,
                "total_obra_periodo": str(obra_data["total_obra_periodo"])
            })

        return Response(final_report_list)


class RelatorioPagamentoMateriaisViewSet(viewsets.ViewSet):
    permission_classes = [IsNivelAdmin | IsNivelGerente]

    @action(detail=False, methods=['get'], url_path='pre-check')
    def pre_check_pagamentos_materiais(self, request):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        obra_id_str = request.query_params.get('obra_id')
        fornecedor_str = request.query_params.get('fornecedor')

        if not start_date_str or not end_date_str:
            return Response({"error": "Parâmetros start_date e end_date são obrigatórios."},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            start_date = parse_date(start_date_str)
            end_date = parse_date(end_date_str)
            if not start_date or not end_date: raise ValueError("Invalid date format")
        except ValueError:
            return Response({"error": "Formato de data inválido. Use YYYY-MM-DD."},
                            status=status.HTTP_400_BAD_REQUEST)

        filters = Q(data_compra__gte=start_date) & Q(data_compra__lte=end_date)
        if obra_id_str:
            filters &= Q(obra_id=obra_id_str)
        if fornecedor_str:
            filters &= Q(fornecedor__icontains=fornecedor_str)

        compras_no_periodo = Compra.objects.filter(filters).select_related('obra')

        compras_pagamento_pendente = []
        # Identifica compras com data_pagamento nula ou futura à data_fim do relatório
        # mas cuja data_compra está no período.
        for compra in compras_no_periodo:
            if compra.data_pagamento is None or compra.data_pagamento > end_date:
                compras_pagamento_pendente.append(CompraReportSerializer(compra).data)

        return Response({
            'compras_com_pagamento_pendente_ou_futuro': compras_pagamento_pendente,
            'message': "Listagem de compras no período com pagamento ainda não registrado ou agendado para após o período do relatório."
        })

    @action(detail=False, methods=['get'], url_path='generate')
    def gerar_relatorio_pagamentos_materiais(self, request):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        obra_id_str = request.query_params.get('obra_id')
        fornecedor_str = request.query_params.get('fornecedor')

        if not start_date_str or not end_date_str:
            return Response({"error": "Parâmetros start_date e end_date são obrigatórios."},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            start_date = parse_date(start_date_str)
            end_date = parse_date(end_date_str)
            if not start_date or not end_date: raise ValueError("Invalid date format")
        except ValueError:
            return Response({"error": "Formato de data inválido. Use YYYY-MM-DD."},
                            status=status.HTTP_400_BAD_REQUEST)

        # Define the primary filter based on data_compra within the period
        filters = Q(data_compra__gte=start_date) & Q(data_compra__lte=end_date)

        # Apply optional additional filters for obra_id and fornecedor
        if obra_id_str:
            filters &= Q(obra_id=obra_id_str)
        if fornecedor_str:
            filters &= Q(fornecedor__icontains=fornecedor_str)

        compras_do_periodo = Compra.objects.filter(filters).select_related('obra').order_by('obra__nome_obra', 'fornecedor', 'data_compra', 'data_pagamento')

        report = defaultdict(lambda: {"obra_id": None, "obra_nome": "", "fornecedores": defaultdict(lambda: {"fornecedor_nome": "", "compras_a_pagar": [], "total_fornecedor_na_obra": Decimal('0.00')}), "total_obra": Decimal('0.00')})
        grand_total = Decimal('0.00')

        for compra in compras_do_periodo: # Changed variable name here
            obra_data = report[compra.obra.id]
            if obra_data["obra_id"] is None:
                obra_data["obra_id"] = compra.obra.id
                obra_data["obra_nome"] = compra.obra.nome_obra

            fornecedor_data = obra_data["fornecedores"][compra.fornecedor or "N/A"]
            if not fornecedor_data["fornecedor_nome"]:
                fornecedor_data["fornecedor_nome"] = compra.fornecedor or "N/A"

            compra_detail = CompraReportSerializer(compra).data
            fornecedor_data["compras_a_pagar"].append(compra_detail)

            valor_liquido = compra.valor_total_liquido or Decimal('0.00')
            fornecedor_data["total_fornecedor_na_obra"] += valor_liquido
            obra_data["total_obra"] += valor_liquido
            grand_total += valor_liquido

        final_report_list = []
        for obra_id_key in sorted(report.keys(), key=lambda ok: report[ok]["obra_nome"]):
            obra_item = report[obra_id_key]

            sorted_fornecedor_keys = sorted(obra_item["fornecedores"].keys())
            fornecedores_list = []
            for forn_key in sorted_fornecedor_keys:
                forn_data = obra_item["fornecedores"][forn_key]
                forn_data["total_fornecedor_na_obra"] = str(forn_data["total_fornecedor_na_obra"])
                fornecedores_list.append(forn_data)

            obra_item["fornecedores"] = fornecedores_list
            obra_item["total_obra"] = str(obra_item["total_obra"])
            final_report_list.append(obra_item)

        return Response({
            "report_data": final_report_list,
            "total_geral_relatorio": str(grand_total)
        })


class FotoObraViewSet(viewsets.ModelViewSet):
    queryset = FotoObra.objects.all().order_by('-uploaded_at')
    serializer_class = FotoObraSerializer
    permission_classes = [permissions.IsAuthenticated] # Or your project's default
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        # Filter photos by obra_id if provided in query_params
        obra_id = self.request.query_params.get('obra_id')
        if obra_id:
            return self.queryset.filter(obra__id=obra_id)
        # Potentially, you might not want to return all photos if no obra_id is specified.
        # Depending on requirements, you could return an empty queryset or raise an error.
        # For now, returning photos for the specified obra, or all if no obra_id.
        return self.queryset


    def create(self, request, *args, **kwargs):
        # Data for the serializer, mutable if needed
        # request.data will contain regular form fields.
        # request.FILES will contain file fields.
        # The serializer handles both when passed request.data.

        # Create a mutable dictionary from request.data if you need to modify it.
        # For simple cases like renaming 'obra_id', it's often cleaner to handle
        # this by ensuring the frontend sends the correct field name ('obra')
        # or by handling it within the serializer's validation or to_internal_value.

        # However, to keep the existing logic of handling 'obra_id' or 'obra':
        # We can create a new dict for the serializer.

        # The original problem was `request.data.copy()` when request.data includes file objects.
        # `request.POST.copy()` would copy non-file data. `request.FILES` contains files.

        final_data = request.POST.copy() # Copies querydict of POST data, not files
        if 'obra_id' in final_data and 'obra' not in final_data:
            final_data['obra'] = final_data.pop('obra_id')

        # Add files to this dictionary for the serializer.
        # The serializer expects the file objects to be part of the data dictionary it receives.
        for key, file_obj in request.FILES.items():
            final_data[key] = file_obj

        serializer = self.get_serializer(data=final_data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        # The serializer's 'obra' field should handle associating with the Obra instance.
        # If 'obra' is a PK, ModelSerializer handles fetching the instance.
        serializer.save()

class ObraCustosPorMaterialView(APIView):
    permission_classes = [IsNivelAdmin | IsNivelGerente]

    def get(self, request, pk, format=None): # pk é o ID da obra
        try:
            obra = Obra.objects.get(pk=pk)
        except Obra.DoesNotExist:
            return Response({"error": "Obra não encontrada."}, status=status.HTTP_404_NOT_FOUND)

        # Sum valor_total_item from ItemCompra related to the Compra instances of the Obra
        custos_por_material = ItemCompra.objects.filter(compra__obra=obra) \
            .values('material__nome') \
            .annotate(total_custo=Sum('valor_total_item')) \
            .order_by('-total_custo')

        # Formatar para [{ name: 'Material Nome', value: X }, ...]
        # Filtrar itens onde material__nome é None ou total_custo é None para evitar problemas no frontend
        resultado_formatado = [
            {'name': item['material__nome'], 'value': item['total_custo'] or Decimal('0.00')}
            for item in custos_por_material
            if item['material__nome'] is not None and item['total_custo'] is not None # Ensure value is not None
        ]

        return Response(resultado_formatado)

print("DEBUG: CompraViewSet logic updated.")
