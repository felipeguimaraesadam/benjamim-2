from django.db import models
from decimal import Decimal
import os
from uuid import uuid4


def anexo_despesa_path(instance, filename):
    """Generates a unique path for uploaded despesa attachments."""
    ext = filename.split('.')[-1]
    filename_base = f"{uuid4().hex}"
    filename = f"{filename_base}.{ext}"
    return os.path.join('anexos_despesa', str(instance.despesa.id), filename)


class Despesa_Extra(models.Model):
    obra = models.ForeignKey('Obra', on_delete=models.CASCADE, related_name='despesas_extras')
    descricao = models.CharField(max_length=255)
    valor = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
    data_despesa = models.DateField(db_column='data')
    categoria = models.CharField(max_length=100, choices=[
        ('Transporte', 'Transporte'),
        ('Alimentação', 'Alimentação'),
        ('Hospedagem', 'Hospedagem'),
        ('Combustível', 'Combustível'),
        ('Manutenção', 'Manutenção'),
        ('Licenças', 'Licenças'),
        ('Multas', 'Multas'),
        ('Outros', 'Outros')
    ])
    responsavel = models.ForeignKey('Funcionario', on_delete=models.SET_NULL, null=True, blank=True, related_name='despesas_responsaveis')
    observacoes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=50, choices=[('Pendente', 'Pendente'), ('Aprovada', 'Aprovada'), ('Rejeitada', 'Rejeitada')], default='Pendente')

    def __str__(self):
        return f"{self.descricao} - {self.obra.nome_obra} - R$ {self.valor}"

    class Meta:
        verbose_name = 'Despesa Extra'
        verbose_name_plural = 'Despesas Extras'
        ordering = ['-data_despesa']


class AnexoDespesa(models.Model):
    despesa = models.ForeignKey(Despesa_Extra, related_name='anexos', on_delete=models.CASCADE)
    arquivo = models.FileField(upload_to=anexo_despesa_path)
    descricao = models.CharField(max_length=255, blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Anexo de {self.despesa} - {self.arquivo.name}"