from django.db import models
from decimal import Decimal
import os
from uuid import uuid4


def anexo_locacao_path(instance, filename):
    """Generates a unique path for uploaded locacao attachments."""
    ext = filename.split('.')[-1]
    filename_base = f"{uuid4().hex}"
    filename = f"{filename_base}.{ext}"
    return os.path.join('anexos_locacao', str(instance.locacao.id), filename)


class Locacao_Obras_Equipes(models.Model):
    obra = models.ForeignKey('Obra', on_delete=models.CASCADE, related_name='locacoes')
    equipe = models.ForeignKey('Equipe', on_delete=models.CASCADE, related_name='locacoes')
    data_inicio = models.DateField()
    data_fim = models.DateField(null=True, blank=True)
    tipo_pagamento = models.CharField(max_length=50, choices=[('Diária', 'Diária'), ('Por Metro', 'Por Metro'), ('Empreitada', 'Empreitada')])
    valor_acordado = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
    metragem_acordada = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Metragem acordada para pagamento por metro")
    observacoes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=50, choices=[('Ativa', 'Ativa'), ('Finalizada', 'Finalizada'), ('Cancelada', 'Cancelada')], default='Ativa')

    def __str__(self):
        return f"{self.equipe.nome_equipe} - {self.obra.nome_obra}"

    class Meta:
        verbose_name = 'Locação de Obra e Equipe'
        verbose_name_plural = 'Locações de Obras e Equipes'
        unique_together = ['obra', 'equipe', 'data_inicio']  # Prevent duplicate active assignments


class AnexoLocacao(models.Model):
    locacao = models.ForeignKey(Locacao_Obras_Equipes, related_name='anexos', on_delete=models.CASCADE)
    arquivo = models.FileField(upload_to=anexo_locacao_path)
    descricao = models.CharField(max_length=255, blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Anexo de {self.locacao} - {self.arquivo.name}"