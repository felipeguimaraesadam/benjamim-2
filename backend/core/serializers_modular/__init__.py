# Serializers package
# This package contains all serializer definitions organized by domain

# Import from auth module
from .auth import MyTokenObtainPairSerializer

# Import all other serializers from main serializers.py file
from core.serializers import (
    UsuarioSerializer, ObraNestedSerializer, ObraSerializer, FuncionarioBasicSerializer,
    FuncionarioSerializer, EquipeSerializer, EquipeComMembrosBasicSerializer,
    AnexoLocacaoSerializer, AnexoDespesaSerializer, LocacaoObrasEquipesSerializer,
    MaterialSerializer, CompraSerializer, ItemCompraSerializer, ParcelaCompraSerializer,
    AnexoCompraSerializer, DespesaExtraSerializer, OcorrenciaFuncionarioSerializer,
    FotoObraSerializer, ArquivoObraSerializer, BackupSerializer, BackupSettingsSerializer,
    FuncionarioDetailSerializer, EquipeDetailSerializer, MaterialDetailSerializer,
    CompraReportSerializer
)

__all__ = [
    'MyTokenObtainPairSerializer',
    'UsuarioSerializer', 'ObraNestedSerializer', 'ObraSerializer', 'FuncionarioBasicSerializer',
    'FuncionarioSerializer', 'EquipeSerializer', 'EquipeComMembrosBasicSerializer',
    'AnexoLocacaoSerializer', 'AnexoDespesaSerializer', 'LocacaoObrasEquipesSerializer',
    'MaterialSerializer', 'CompraSerializer', 'ItemCompraSerializer', 'ParcelaCompraSerializer',
    'AnexoCompraSerializer', 'DespesaExtraSerializer', 'OcorrenciaFuncionarioSerializer',
    'FotoObraSerializer', 'ArquivoObraSerializer', 'BackupSerializer', 'BackupSettingsSerializer',
    'FuncionarioDetailSerializer', 'EquipeDetailSerializer', 'MaterialDetailSerializer',
    'CompraReportSerializer'
]