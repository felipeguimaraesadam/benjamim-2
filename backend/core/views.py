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
