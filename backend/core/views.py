from rest_framework import viewsets, permissions
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
    # Add permissions if necessary, for example:
    # permission_classes = [permissions.IsAuthenticated]


class FuncionarioViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows funcionarios to be viewed or edited.
    """
    queryset = Funcionario.objects.all()
    serializer_class = FuncionarioSerializer
    # Add permissions if necessary, for example:
    # permission_classes = [permissions.IsAuthenticated]


class EquipeViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows equipes to be viewed or edited.
    """
    queryset = Equipe.objects.all()
    serializer_class = EquipeSerializer
    # Add permissions if necessary, for example:
    # permission_classes = [permissions.IsAuthenticated]


class AlocacaoObrasEquipesViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows alocacoes to be viewed or edited.
    """
    queryset = Alocacao_Obras_Equipes.objects.all()
    serializer_class = AlocacaoObrasEquipesSerializer
    # Add permissions if necessary, for example:
    # permission_classes = [permissions.IsAuthenticated]


class MaterialViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows materiais to be viewed or edited.
    """
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer
    # Add permissions if necessary, for example:
    # permission_classes = [permissions.IsAuthenticated]


class CompraViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows compras to be viewed or edited.
    """
    queryset = Compra.objects.all()
    serializer_class = CompraSerializer
    # Add permissions if necessary, for example:
    # permission_classes = [permissions.IsAuthenticated]


class DespesaExtraViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows despesas extras to be viewed or edited.
    """
    queryset = Despesa_Extra.objects.all()
    serializer_class = DespesaExtraSerializer
    # Add permissions if necessary, for example:
    # permission_classes = [permissions.IsAuthenticated]


class OcorrenciaFuncionarioViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows ocorrencias de funcionarios to be viewed or edited.
    """
    queryset = Ocorrencia_Funcionario.objects.all()
    serializer_class = OcorrenciaFuncionarioSerializer
    # Add permissions if necessary, for example:
    # permission_classes = [permissions.IsAuthenticated]

# Placeholder for other views if any
# from django.shortcuts import render
# Create your views here.
