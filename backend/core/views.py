from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q, Sum
from decimal import Decimal
from datetime import datetime

from .models import Usuario, Obra, Funcionario, Equipe, Alocacao_Obras_Equipes, Material, Compra, Despesa_Extra, Ocorrencia_Funcionario
from .serializers import UsuarioSerializer, ObraSerializer, FuncionarioSerializer, EquipeSerializer, AlocacaoObrasEquipesSerializer, MaterialSerializer, CompraSerializer, DespesaExtraSerializer, OcorrenciaFuncionarioSerializer
from .permissions import IsNivelAdmin

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
    permission_classes = [permissions.IsAuthenticated]


class FuncionarioViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows funcionarios to be viewed or edited.
    """
    queryset = Funcionario.objects.all()
    serializer_class = FuncionarioSerializer
    permission_classes = [permissions.IsAuthenticated]


class EquipeViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows equipes to be viewed or edited.
    """
    queryset = Equipe.objects.all()
    serializer_class = EquipeSerializer
    permission_classes = [permissions.IsAuthenticated]


class AlocacaoObrasEquipesViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows alocacoes to be viewed or edited.
    """
    queryset = Alocacao_Obras_Equipes.objects.all()
    serializer_class = AlocacaoObrasEquipesSerializer
    permission_classes = [permissions.IsAuthenticated]


class MaterialViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows materiais to be viewed or edited.
    """
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer
    permission_classes = [permissions.IsAuthenticated]


class CompraViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows compras to be viewed or edited.
    """
    queryset = Compra.objects.all()
    serializer_class = CompraSerializer
    permission_classes = [permissions.IsAuthenticated]


class DespesaExtraViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows despesas extras to be viewed or edited.
    """
    queryset = Despesa_Extra.objects.all()
    serializer_class = DespesaExtraSerializer
    permission_classes = [permissions.IsAuthenticated]


class OcorrenciaFuncionarioViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows ocorrencias de funcionarios to be viewed or edited.
    """
    queryset = Ocorrencia_Funcionario.objects.all()
    serializer_class = OcorrenciaFuncionarioSerializer
    permission_classes = [permissions.IsAuthenticated]


# Reports Views

class RelatorioFinanceiroObraView(APIView):
    permission_classes = [permissions.IsAuthenticated]

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

        total_compras = compras.aggregate(total=Sum('custo_total'))['total'] or Decimal('0.00')
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
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        data_inicio_str = request.query_params.get('data_inicio')
        data_fim_str = request.query_params.get('data_fim')
        obra_id_str = request.query_params.get('obra_id')
        material_id_str = request.query_params.get('material_id')

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
            except Obra.DoesNotExist: # Check if obra exists
                return Response({"error": f"Obra com id {obra_id_str} não encontrada."}, status=status.HTTP_404_NOT_FOUND)


        if material_id_str:
            try:
                material_id = int(material_id_str)
                filters &= Q(material_id=material_id)
                applied_filters_echo["material_id"] = material_id
            except ValueError:
                return Response({"error": "material_id deve ser um número inteiro."}, status=status.HTTP_400_BAD_REQUEST)
            except Material.DoesNotExist: # Check if material exists
                 return Response({"error": f"Material com id {material_id_str} não encontrado."}, status=status.HTTP_404_NOT_FOUND)


        compras_qs = Compra.objects.filter(filters)
        soma_total_compras = compras_qs.aggregate(total=Sum('custo_total'))['total'] or Decimal('0.00')

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
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # 1. Obras em andamento
        obras_em_andamento = Obra.objects.filter(status='Em Andamento').count()

        # 2. Custo total do mês corrente
        current_month = timezone.now().month
        current_year = timezone.now().year

        custo_compras_mes = Compra.objects.filter(
            data_compra__year=current_year,
            data_compra__month=current_month
        ).aggregate(total=Sum('custo_total'))['total'] or Decimal('0.00')

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
    permission_classes = [permissions.IsAuthenticated]

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
                filters &= Q(data_alocacao_inicio__gte=data_inicio)
                applied_filters_echo["data_inicio"] = data_inicio_str
            except ValueError:
                return Response({"error": "Formato inválido para data_inicio (esperado YYYY-MM-DD)."}, status=status.HTTP_400_BAD_REQUEST)

        if data_fim_str:
            try:
                data_fim = datetime.strptime(data_fim_str, '%Y-%m-%d').date()
                filters &= Q(Q(data_alocacao_fim__lte=data_fim) | Q(data_alocacao_fim__isnull=True)) # include ongoing if fim is null
                applied_filters_echo["data_fim"] = data_fim_str
            except ValueError:
                return Response({"error": "Formato inválido para data_fim (esperado YYYY-MM-DD)."}, status=status.HTTP_400_BAD_REQUEST)

        if data_inicio_str and data_fim_str and data_inicio > data_fim:
            return Response(
                {"error": "A data_inicio não pode ser posterior à data_fim."},
                status=status.HTTP_400_BAD_REQUEST
            )

        alocacoes = Alocacao_Obras_Equipes.objects.filter(filters).select_related('obra').order_by('data_alocacao_inicio')

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
                "data_alocacao_inicio": alocacao.data_alocacao_inicio,
                "data_alocacao_fim": alocacao.data_alocacao_fim,
            })

        return Response({
            "filtros": applied_filters_echo,
            "alocacoes": data # Using custom serialized data
            # "alocacoes": AlocacaoObrasEquipesSerializer(alocacoes, many=True).data # If serializer is good
        })


class RelatorioCustoGeralView(APIView):
    permission_classes = [permissions.IsAuthenticated]

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
        ).aggregate(total=Sum('custo_total', output_field=DecimalField()))['total'] or Decimal('0.00')

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
