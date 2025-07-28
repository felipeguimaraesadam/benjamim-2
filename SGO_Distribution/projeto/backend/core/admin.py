from django.contrib import admin
from .models import (
    Usuario,
    Obra,
    Funcionario,
    Equipe,
    Locacao_Obras_Equipes,
    Material,
    Compra,
    Despesa_Extra,
    Ocorrencia_Funcionario,
    Backup,
    BackupSettings,
)

admin.site.register(Usuario)
admin.site.register(Obra)
admin.site.register(Funcionario)
admin.site.register(Equipe)
admin.site.register(Locacao_Obras_Equipes)
admin.site.register(Material)
admin.site.register(Compra)
admin.site.register(Despesa_Extra)
admin.site.register(Ocorrencia_Funcionario)
admin.site.register(Backup)
admin.site.register(BackupSettings)
