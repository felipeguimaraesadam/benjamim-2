from django.db import models
from decimal import Decimal, InvalidOperation
from .obra import Obra
from .material import Material, CATEGORIA_USO_CHOICES, anexo_compra_path
from .usuario import Usuario


class Compra(models.Model):
    obra = models.ForeignKey(Obra, on_delete=models.CASCADE, related_name='compras')
    fornecedor = models.CharField(max_length=255, null=True, blank=True)
    data_compra = models.DateField()
    nota_fiscal = models.CharField(max_length=255, null=True, blank=True)
    valor_total_bruto = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    desconto = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    valor_total_liquido = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    observacoes = models.TextField(blank=True, null=True)
    data_pagamento = models.DateField(null=True, blank=True, verbose_name="Data de Pagamento")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data de Criação")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Data de Atualização")
    
    # Installment payment fields
    forma_pagamento = models.CharField(
        max_length=20,
        choices=[
            ('AVISTA', 'À Vista'),
            ('PARCELADO', 'Parcelado'),
        ],
        default='AVISTA',
        verbose_name="Forma de Pagamento"
    )
    numero_parcelas = models.PositiveIntegerField(default=1, verbose_name="Número de Parcelas")
    valor_entrada = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=Decimal('0.00'),
        verbose_name="Valor de Entrada"
    )
    
    TIPO_CHOICES = [
        ('COMPRA', 'Compra'),
        ('ORCAMENTO', 'Orçamento'),
    ]
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES, default='COMPRA', verbose_name="Tipo")
    STATUS_ORCAMENTO_CHOICES = [
        ('PENDENTE', 'Pendente'),
        ('APROVADO', 'Aprovado'),
        ('REJEITADO', 'Rejeitado'),
    ]
    status_orcamento = models.CharField(max_length=10, choices=STATUS_ORCAMENTO_CHOICES, default='PENDENTE', null=True, blank=True, verbose_name="Status do Orçamento")

    def __str__(self):
        return f"Compra para {self.obra.nome_obra} em {self.data_compra}"

    def save(self, *args, **kwargs):
        from django.db.models import Sum

        # This logic is designed to be called *after* items have been associated
        # with the purchase. The serializer's create/update methods handle this flow.
        # We check for self.pk to ensure the Compra instance exists in the DB,
        # which is a prerequisite for having related 'itens'.
        if self.pk:
            # Calculate the gross total from the sum of its items' totals.
            # The .all() is technically not needed but makes it explicit.
            total_bruto = self.itens.all().aggregate(
                total=Sum('valor_total_item')
            )['total'] or Decimal('0.00')
            self.valor_total_bruto = total_bruto

        # Now, calculate the net value based on the (potentially updated) gross value.
        self.valor_total_liquido = self.valor_total_bruto - self.desconto
        
        # For cash payments, set payment date automatically
        if self.forma_pagamento == 'AVISTA' and self.data_compra and not self.data_pagamento:
            self.data_pagamento = self.data_compra
        
        # For installment payments, clear single payment date
        if self.forma_pagamento == 'PARCELADO':
            self.data_pagamento = None
        
        # Call the original save method
        super().save(*args, **kwargs)
    
    def create_installments(self, parcelas_customizadas=None):
        if self.numero_parcelas <= 1:
            return
        
        # Deletar parcelas existentes
        self.parcelas.all().delete()
        
        if parcelas_customizadas:
            for i, parcela_data in enumerate(parcelas_customizadas, 1):
                ParcelaCompra.objects.create(
                    compra=self,
                    numero_parcela=i,
                    valor_parcela=parcela_data.get('valor', 0),
                    data_vencimento=parcela_data.get('dataVencimento') or parcela_data.get('data_vencimento'),
                    status='PENDENTE'
                )
        else:
            from dateutil.relativedelta import relativedelta
            
            # Validações robustas para evitar problemas
            if self.numero_parcelas <= 0:
                raise ValueError("Número de parcelas deve ser maior que zero")
            
            # Limite máximo de parcelas para evitar loops infinitos
            if self.numero_parcelas > 360:  # Máximo 30 anos (360 meses)
                raise ValueError("Número de parcelas não pode exceder 360 (30 anos)")
            
            valor_a_parcelar = self.valor_total_liquido - self.valor_entrada
            
            # Verificar se o valor a parcelar é válido
            if valor_a_parcelar < 0:
                valor_a_parcelar = Decimal('0.00')
            
            # Verificar se o valor a parcelar é muito pequeno
            if valor_a_parcelar > 0 and valor_a_parcelar < Decimal('0.01'):
                raise ValueError("Valor a parcelar é muito pequeno (menor que R$ 0,01)")
            
            try:
                valor_parcela = Decimal(str(valor_a_parcelar / self.numero_parcelas))
                
                # Verificar se o resultado é finito e válido
                if not valor_parcela.is_finite():
                    raise ValueError("Valor da parcela resultou em número infinito")
                
                # Verificar se o valor da parcela é muito pequeno
                if valor_parcela < Decimal('0.01'):
                    raise ValueError("Valor da parcela é muito pequeno (menor que R$ 0,01)")
                
                # Verificar se o valor da parcela é muito grande
                if valor_parcela > Decimal('999999999.99'):
                    raise ValueError("Valor da parcela é muito grande")
                    
            except (ZeroDivisionError, InvalidOperation, OverflowError) as e:
                raise ValueError(f"Erro no cálculo da parcela: {str(e)}")
            
            # Criar parcelas com validação adicional
            for i in range(1, self.numero_parcelas + 1):
                try:
                    data_vencimento = self.data_compra + relativedelta(months=i)
                    
                    # Verificar se a data de vencimento não é muito distante no futuro
                    from datetime import date
                    max_date = date(2099, 12, 31)
                    if data_vencimento > max_date:
                        raise ValueError(f"Data de vencimento muito distante no futuro: {data_vencimento}")
                    
                    ParcelaCompra.objects.create(
                        compra=self,
                        numero_parcela=i,
                        valor_parcela=valor_parcela,
                        data_vencimento=data_vencimento,
                        status='PENDENTE'
                    )
                except Exception as e:
                    # Se houver erro na criação de uma parcela, deletar todas as criadas
                    self.parcelas.all().delete()
                    raise ValueError(f"Erro ao criar parcela {i}: {str(e)}")
    
    @property
    def valor_pago(self):
        """Calculate total amount paid including installments"""
        if self.forma_pagamento == 'AVISTA':
            return self.valor_total_liquido if self.data_pagamento else Decimal('0.00')
        else:
            valor_parcelas_pagas = sum(
                parcela.valor_parcela for parcela in self.parcelas.filter(status='PAGO')
            )
            return self.valor_entrada + valor_parcelas_pagas
    
    @property
    def valor_pendente(self):
        """Calculate remaining amount to be paid"""
        return self.valor_total_liquido - self.valor_pago


class ItemCompra(models.Model):
    compra = models.ForeignKey(Compra, on_delete=models.CASCADE, related_name='itens')
    material = models.ForeignKey(Material, on_delete=models.PROTECT, related_name='itens_comprados')
    quantidade = models.DecimalField(max_digits=10, decimal_places=3)  # Suporta 1,5 kg, etc.
    valor_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    valor_total_item = models.DecimalField(max_digits=12, decimal_places=2, editable=False)
    categoria_uso = models.CharField(max_length=50, choices=CATEGORIA_USO_CHOICES, null=True, blank=True)

    def __str__(self):
        return f"{self.quantidade}x {self.material.nome} na Compra {self.compra.id}"

    def save(self, *args, **kwargs):
        # Calcular o valor total do item antes de salvar
        self.valor_total_item = self.quantidade * self.valor_unitario
        super().save(*args, **kwargs)


class ParcelaCompra(models.Model):
    STATUS_CHOICES = [
        ('PENDENTE', 'Pendente'),
        ('PAGO', 'Pago'),
        ('VENCIDO', 'Vencido'),
        ('CANCELADO', 'Cancelado'),
    ]
    
    compra = models.ForeignKey(Compra, on_delete=models.CASCADE, related_name='parcelas')
    numero_parcela = models.PositiveIntegerField()
    valor_parcela = models.DecimalField(max_digits=12, decimal_places=2)
    data_vencimento = models.DateField()
    data_pagamento = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDENTE')
    observacoes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['compra', 'numero_parcela']
        ordering = ['compra', 'numero_parcela']
        verbose_name = 'Parcela de Compra'
        verbose_name_plural = 'Parcelas de Compras'
    
    def __str__(self):
        return f"Parcela {self.numero_parcela}/{self.compra.parcelas.count()} - {self.compra}"
    
    def save(self, *args, **kwargs):
        # Auto-update status based on payment date
        if self.data_pagamento and self.status == 'PENDENTE':
            self.status = 'PAGO'
        elif not self.data_pagamento and self.status == 'PAGO':
            self.status = 'PENDENTE'
        
        # Check if overdue
        from django.utils import timezone
        if self.status == 'PENDENTE' and self.data_vencimento and self.data_vencimento < timezone.now().date():
            self.status = 'VENCIDO'
        
        super().save(*args, **kwargs)


class AnexoCompra(models.Model):
    compra = models.ForeignKey(Compra, related_name='anexos', on_delete=models.CASCADE)
    arquivo = models.FileField(upload_to=anexo_compra_path)
    nome_original = models.CharField(max_length=255)
    descricao = models.CharField(max_length=255, blank=True, null=True)
    tipo_arquivo = models.CharField(max_length=50, blank=True, null=True)  # PDF, JPG, PNG, etc.
    tamanho_arquivo = models.PositiveIntegerField(default=0)  # Size in bytes
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['-uploaded_at']
        verbose_name = 'Anexo de Compra'
        verbose_name_plural = 'Anexos de Compras'
    
    def __str__(self):
        return f"Anexo: {self.nome_original} - Compra {self.compra.id}"
    
    def save(self, *args, **kwargs):
        if self.arquivo:
            self.nome_original = self.arquivo.name
            self.tamanho_arquivo = self.arquivo.size
            # Extract file extension for tipo_arquivo
            import os
            _, ext = os.path.splitext(self.arquivo.name)
            self.tipo_arquivo = ext.upper().lstrip('.')
        super().save(*args, **kwargs)