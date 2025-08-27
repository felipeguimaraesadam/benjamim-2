# Import all models to make them available
from .usuario import Usuario, UsuarioManager
from .obra import Obra, FotoObra, ArquivoObra
from .funcionario import Funcionario, Equipe, Ocorrencia_Funcionario
from .locacao import Locacao_Obras_Equipes, AnexoLocacao
from .material import Material, Compra, ItemCompra, ParcelaCompra, AnexoCompra, CATEGORIA_USO_CHOICES
from .despesa import Despesa_Extra, AnexoDespesa
from .backup import Backup, BackupSettings

# Make all models available when importing from core.models
__all__ = [
    'Usuario', 'UsuarioManager',
    'Obra', 'FotoObra', 'ArquivoObra',
    'Funcionario', 'Equipe', 'Ocorrencia_Funcionario',
    'Locacao_Obras_Equipes', 'AnexoLocacao',
    'Material', 'Compra', 'ItemCompra', 'ParcelaCompra', 'AnexoCompra',
    'Despesa_Extra', 'AnexoDespesa',
    'Backup', 'BackupSettings',
    'CATEGORIA_USO_CHOICES'
]