from django.db import models
from decimal import Decimal
import os
from uuid import uuid4


# Choices for categoria_uso
CATEGORIA_USO_CHOICES = [
    ('Estrutural', 'Estrutural'),
    ('Acabamento', 'Acabamento'),
    ('Elétrico', 'Elétrico'),
    ('Hidráulico', 'Hidráulico'),
    ('Pintura', 'Pintura'),
    ('Ferramentas', 'Ferramentas'),
    ('Outros', 'Outros'),
]


def anexo_compra_path(instance, filename):
    """Generates a unique path for uploaded compra attachments."""
    ext = filename.split('.')[-1]
    filename_base = f"{uuid4().hex}"
    filename = f"{filename_base}.{ext}"
    return os.path.join('anexos_compra', str(instance.compra.id), filename)


class Material(models.Model):
    nome = models.CharField(max_length=255)
    unidade_medida = models.CharField(max_length=50, choices=[('Unidade', 'Unidade'), ('Metro', 'Metro'), ('Kg', 'Kg'), ('Litro', 'Litro'), ('Saco', 'Saco'), ('Caixa', 'Caixa')])
    categoria_uso = models.CharField(max_length=50, choices=CATEGORIA_USO_CHOICES)
    preco_unitario_padrao = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    quantidade_estoque = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    estoque_minimo = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    fornecedor_padrao = models.CharField(max_length=255, blank=True, null=True)
    observacoes = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nome

    @property
    def quantidade_em_estoque(self):
        """Returns the current stock quantity"""
        return self.quantidade_estoque

    @property
    def categoria_uso_padrao(self):
        """Returns the default usage category"""
        return self.categoria_uso


class Compra(models.Model):
    data_compra = models.DateField()
    fornecedor = models.CharField(max_length=255)
    valor_total = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
    forma_pagamento = models.CharField(max_length=50, choices=[('À Vista', 'À Vista'), ('Parcelado', 'Parcelado'), ('Boleto', 'Boleto'), ('Cartão', 'Cartão')])
    numero_parcelas = models.IntegerField(default=1)
    valor_entrada = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
    observacoes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=50, choices=[('Pendente', 'Pendente'), ('Paga', 'Paga'), ('Cancelada', 'Cancelada')], default='Pendente')

    def __str__(self):
        return f"Compra {self.id} - {self.fornecedor} - {self.data_compra}"

    def save(self, *args, **kwargs):
        # Calculate total value from items if not set
        if not self.valor_total:
            total = sum(item.valor_total for item in self.itens.all())
            self.valor_total = total
        super().save(*args, **kwargs)
        
        # Create installments if parcelado
        if self.forma_pagamento == 'Parcelado' and self.numero_parcelas > 1:
            self._create_installments()

    def _create_installments(self):
        """Create installment records for parcelado payments"""
        from datetime import timedelta
        from dateutil.relativedelta import relativedelta
        
        # Clear existing installments
        self.parcelas.all().delete()
        
        valor_restante = self.valor_total - self.valor_entrada
        valor_parcela = valor_restante / self.numero_parcelas
        
        for i in range(self.numero_parcelas):
            data_vencimento = self.data_compra + relativedelta(months=i+1)
            ParcelaCompra.objects.create(
                compra=self,
                numero_parcela=i + 1,
                valor_parcela=valor_parcela,
                data_vencimento=data_vencimento,
                status='Pendente'
            )


class ItemCompra(models.Model):
    compra = models.ForeignKey(Compra, related_name='itens', on_delete=models.CASCADE)
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='compras')
    quantidade = models.DecimalField(max_digits=10, decimal_places=2)
    preco_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    valor_total = models.DecimalField(max_digits=15, decimal_places=2, editable=False)
    obra_destino = models.ForeignKey('Obra', on_delete=models.SET_NULL, null=True, blank=True, related_name='materiais_comprados')

    def save(self, *args, **kwargs):
        self.valor_total = self.quantidade * self.preco_unitario
        super().save(*args, **kwargs)
        
        # Update material stock
        self.material.quantidade_estoque += self.quantidade
        self.material.save()

    def __str__(self):
        return f"{self.material.nome} - {self.quantidade} {self.material.unidade_medida}"


class ParcelaCompra(models.Model):
    compra = models.ForeignKey(Compra, related_name='parcelas', on_delete=models.CASCADE)
    numero_parcela = models.IntegerField()
    valor_parcela = models.DecimalField(max_digits=15, decimal_places=2)
    data_vencimento = models.DateField()
    data_pagamento = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=50, choices=[('Pendente', 'Pendente'), ('Paga', 'Paga'), ('Atrasada', 'Atrasada')], default='Pendente')
    observacoes = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['numero_parcela']
        unique_together = ['compra', 'numero_parcela']
    
    def __str__(self):
        return f"Parcela {self.numero_parcela}/{self.compra.numero_parcelas} - {self.compra.fornecedor}"


class AnexoCompra(models.Model):
    compra = models.ForeignKey(Compra, related_name='anexos', on_delete=models.CASCADE)
    arquivo = models.FileField(upload_to=anexo_compra_path)
    descricao = models.CharField(max_length=255, blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Anexo de {self.compra} - {self.arquivo.name}"