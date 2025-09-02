from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from decimal import Decimal, InvalidOperation
from django.core.exceptions import ValidationError
import os
from uuid import uuid4

def obra_foto_path(instance, filename):
    """Generates a unique path for uploaded obra photos, ensuring the filename is not too long."""
    ext = filename.split('.')[-1]
    # Generate a unique name using UUID and truncate if necessary
    filename_base = f"{uuid4().hex}"
    filename = f"{filename_base}.{ext}"
    return os.path.join('fotos_obras', str(instance.obra.id), filename)

def anexo_locacao_path(instance, filename):
    """
    Generates a unique path for uploaded location attachments.
    """
    ext = filename.split('.')[-1]
    filename_base = f"{uuid4().hex}"
    filename = f"{filename_base}.{ext}"
    return os.path.join('anexos_locacoes', str(instance.locacao.id), filename)

def anexo_despesa_path(instance, filename):
    """
    Generates a unique path for uploaded expense attachments.
    """
    ext = filename.split('.')[-1]
    filename_base = f"{uuid4().hex}"
    filename = f"{filename_base}.{ext}"
    return os.path.join('anexos_despesas', str(instance.despesa.id), filename)

def anexo_compra_path(instance, filename):
    return f'anexos/compras/{instance.compra.id}/{filename}'

def obra_arquivo_path(instance, filename):
    return f'obras/{instance.obra.id}/arquivos/{filename}'

CATEGORIA_USO_CHOICES = [
    ('Geral', 'Geral'), ('Eletrica', 'Elétrica'), ('Hidraulica', 'Hidráulica'),
    ('Alvenaria', 'Alvenaria'), ('Acabamento', 'Acabamento'), ('Fundacao', 'Fundação'),
    ('FRETE', 'Frete')
]

class UsuarioManager(BaseUserManager):
    def create_user(self, login, password=None, **extra_fields):
        if not login:
            raise ValueError('The Login field must be set')
        # Ensure 'senha_hash' is not in extra_fields as AbstractBaseUser uses 'password'
        extra_fields.pop('senha_hash', None)
        user = self.model(login=login, **extra_fields)
        user.set_password(password) # Hashes password
        user.save(using=self._db)
        return user

    def create_superuser(self, login, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('nivel_acesso', 'admin') # Default for superuser

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        # Ensure 'senha_hash' is not passed directly in extra_fields
        extra_fields.pop('senha_hash', None)

        return self.create_user(login, password, **extra_fields)

class Usuario(AbstractBaseUser, PermissionsMixin):
    nome_completo = models.CharField(max_length=255)
    login = models.CharField(max_length=100, unique=True)
    # senha_hash is replaced by 'password' field from AbstractBaseUser
    nivel_acesso = models.CharField(max_length=50, choices=[('admin', 'Admin'), ('gerente', 'Gerente')])

    is_staff = models.BooleanField(default=False) # Required for Django admin
    is_active = models.BooleanField(default=True) # Django best practice

    objects = UsuarioManager()

    USERNAME_FIELD = 'login'
    REQUIRED_FIELDS = ['nome_completo', 'nivel_acesso']

    def __str__(self):
        return self.login

class Obra(models.Model):
    nome_obra = models.CharField(max_length=255)
    endereco_completo = models.TextField()
    cidade = models.CharField(max_length=100)
    status = models.CharField(max_length=50, choices=[('Planejada', 'Planejada'), ('Em Andamento', 'Em Andamento'), ('Concluída', 'Concluída'), ('Cancelada', 'Cancelada')])
    data_inicio = models.DateField(null=True, blank=True)
    data_prevista_fim = models.DateField(null=True, blank=True)
    data_real_fim = models.DateField(null=True, blank=True)
    responsavel = models.ForeignKey('Funcionario', on_delete=models.SET_NULL, null=True, blank=True, related_name='obras_responsaveis')
    cliente_nome = models.CharField(max_length=255, blank=True, null=True)
    orcamento_previsto = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True, default=Decimal('0.00'))
    area_metragem = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Área em metros quadrados (m²)")

    def __str__(self):
        return self.nome_obra

    def save(self, *args, **kwargs):
        print(f"[DEBUG Obra Save] ID: {self.id}, Area Metragem: {self.area_metragem}")
        super().save(*args, **kwargs)

class Funcionario(models.Model):
    nome_completo = models.CharField(max_length=255)
    cargo = models.CharField(max_length=100)
    data_contratacao = models.DateField()
    valor_diaria_padrao = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    valor_metro_padrao = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    valor_empreitada_padrao = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return self.nome_completo

class Equipe(models.Model):
    nome_equipe = models.CharField(max_length=100, unique=True)
    lider = models.ForeignKey(Funcionario, on_delete=models.SET_NULL, null=True, related_name='equipes_lideradas')
    membros = models.ManyToManyField(Funcionario, related_name='equipes_membro')
    descricao = models.TextField(
        blank=True, 
        null=True, 
        verbose_name='Descrição da Equipe',
        help_text='Descrição detalhada sobre a finalidade e características da equipe'
    )

    def __str__(self):
        return self.nome_equipe

class Locacao_Obras_Equipes(models.Model):
    obra = models.ForeignKey(Obra, on_delete=models.CASCADE)
    equipe = models.ForeignKey(Equipe, on_delete=models.CASCADE, null=True, blank=True) # Made nullable
    funcionario_locado = models.ForeignKey('Funcionario', on_delete=models.CASCADE, null=True, blank=True, related_name='locacoes_individuais')
    servico_externo = models.CharField(max_length=255, blank=True, null=True) # New field
    data_locacao_inicio = models.DateField()
    data_locacao_fim = models.DateField(null=False, blank=True) # Removed temporary default

    TIPO_PAGAMENTO_CHOICES = [
        ('diaria', 'Diária'),
        ('metro', 'Por Metro'),
        ('empreitada', 'Empreitada'),
    ]
    tipo_pagamento = models.CharField(max_length=20, choices=TIPO_PAGAMENTO_CHOICES, default='diaria')
    valor_pagamento = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    data_pagamento = models.DateField(null=True, blank=True)

    STATUS_LOCACAO_CHOICES = [
        ('ativa', 'Ativa'),
        ('cancelada', 'Cancelada'),
    ]
    status_locacao = models.CharField(
        max_length=20,
        choices=STATUS_LOCACAO_CHOICES,
        default='ativa',
        verbose_name='Status da Locação'
    )
    observacoes = models.TextField(blank=True, null=True, verbose_name="Observações")

    def save(self, *args, **kwargs):
        if self.data_locacao_inicio:  # data_locacao_inicio is non-nullable
            if self.data_locacao_fim is None or self.data_locacao_fim < self.data_locacao_inicio:
                self.data_locacao_fim = self.data_locacao_inicio
        
        # Cálculo automático de pagamento
        if self.valor_pagamento == Decimal('0.00') or self.valor_pagamento is None:
            dias_trabalhados = (self.data_locacao_fim - self.data_locacao_inicio).days + 1
            
            if self.funcionario_locado:
                # Cálculo para funcionário individual
                if self.tipo_pagamento == 'diaria' and self.funcionario_locado.valor_diaria_padrao:
                    self.valor_pagamento = self.funcionario_locado.valor_diaria_padrao * dias_trabalhados
                elif self.tipo_pagamento == 'metro' and self.funcionario_locado.valor_metro_padrao and self.obra.area_metragem:
                    self.valor_pagamento = self.funcionario_locado.valor_metro_padrao * self.obra.area_metragem
                elif self.tipo_pagamento == 'empreitada' and self.funcionario_locado.valor_empreitada_padrao:
                    self.valor_pagamento = self.funcionario_locado.valor_empreitada_padrao
            
            elif self.equipe:
                # Cálculo para equipe (soma dos valores de todos os membros)
                valor_total_equipe = Decimal('0.00')
                membros = self.equipe.membros.all()
                
                for membro in membros:
                    if self.tipo_pagamento == 'diaria' and membro.valor_diaria_padrao:
                        valor_total_equipe += membro.valor_diaria_padrao * dias_trabalhados
                    elif self.tipo_pagamento == 'metro' and membro.valor_metro_padrao and self.obra.area_metragem:
                        valor_total_equipe += membro.valor_metro_padrao * self.obra.area_metragem
                    elif self.tipo_pagamento == 'empreitada' and membro.valor_empreitada_padrao:
                        valor_total_equipe += membro.valor_empreitada_padrao
                
                self.valor_pagamento = valor_total_equipe
            
            # Se foi calculado um valor, considera como pago automaticamente
            if self.valor_pagamento > Decimal('0.00') and not self.data_pagamento:
                self.data_pagamento = self.data_locacao_inicio
        
        super().save(*args, **kwargs)

    def __str__(self):
        if self.equipe:
            return f"{self.obra.nome_obra} - Equipe: {self.equipe.nome_equipe}"
        elif self.funcionario_locado:
            return f"{self.obra.nome_obra} - Funcionário: {self.funcionario_locado.nome_completo}"
        elif self.servico_externo:
            return f"{self.obra.nome_obra} - Externo: {self.servico_externo}"
        return f"Locação ID {self.id} para {self.obra.nome_obra} (detalhes pendentes)"

class Material(models.Model):
    nome = models.CharField(max_length=100, unique=True)
    unidade_medida = models.CharField(max_length=20, choices=[('un', 'Unidade'), ('m²', 'Metro Quadrado'), ('kg', 'Quilograma'), ('saco', 'Saco')])
    # NOTE: As per subtask assumption, adding quantidade_em_estoque. In a real scenario, its management would be crucial.
    quantidade_em_estoque = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    nivel_minimo_estoque = models.PositiveIntegerField(default=0, help_text="Nível mínimo de estoque para alerta. 0 para não alertar.")
    # TODO: Run makemigrations and migrate
    categoria_uso_padrao = models.CharField(max_length=50, choices=CATEGORIA_USO_CHOICES, null=True, blank=True)

    def __str__(self):
        return self.nome

print("DEBUG: Material model has been extended with categoria_uso_padrao.")

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
        # Calculation of totals is now handled explicitly in the serializer
        # to ensure it happens after items are saved. This method ensures
        # that valor_total_liquido is always consistent with valor_total_bruto.

        if self.valor_total_bruto is None:
            self.valor_total_bruto = Decimal('0.00')

        self.valor_total_liquido = self.valor_total_bruto - self.desconto
        
        # For cash payments, set payment date automatically
        if self.forma_pagamento == 'AVISTA' and self.data_compra and not self.data_pagamento:
            self.data_pagamento = self.data_compra
        
        # For installment payments, clear single payment date
        if self.forma_pagamento == 'PARCELADO':
            self.data_pagamento = None
        
        # Call the original save method
        super().save(*args, **kwargs)

        # The creation of installments is handled in the serializer after the save
        # to ensure all data is consistent. We can remove the automatic call from here
        # to centralize control in the serializer.
        # if self.forma_pagamento == 'PARCELADO' and not self.parcelas.exists():
        #     self.create_installments()
    
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
    quantidade = models.DecimalField(max_digits=10, decimal_places=3) # Suporta 1,5 kg, etc.
    valor_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    valor_total_item = models.DecimalField(max_digits=12, decimal_places=2, editable=False)
    categoria_uso = models.CharField(max_length=50, choices=CATEGORIA_USO_CHOICES, null=True, blank=True)

    def __str__(self):
        return f"{self.quantidade}x {self.material.nome} na Compra {self.compra.id}"

    def save(self, *args, **kwargs):
        # Enforce FRETE category constraint
        if self.material.nome == 'FRETE' and self.categoria_uso != 'FRETE':
            raise ValidationError("O material 'FRETE' só pode ser usado com a categoria 'FRETE'.")

        # Auto-assign category if not set and material has a default
        if not self.categoria_uso and self.material.categoria_uso_padrao:
            self.categoria_uso = self.material.categoria_uso_padrao

        # Calculate total item value before saving
        self.valor_total_item = self.quantidade * self.valor_unitario
        super().save(*args, **kwargs)

print("DEBUG: ItemCompra model has been extended with categoria_uso.")

class Despesa_Extra(models.Model):
    obra = models.ForeignKey(Obra, on_delete=models.CASCADE, related_name='despesas_extras')
    descricao = models.TextField()
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    data = models.DateField()
    categoria = models.CharField(max_length=50, choices=[('Alimentação', 'Alimentação'), ('Transporte', 'Transporte'), ('Ferramentas', 'Ferramentas'), ('Outros', 'Outros')])

    def __str__(self):
        return f"{self.categoria} - {self.descricao[:50]} ({self.obra.nome_obra})"

class Ocorrencia_Funcionario(models.Model):
    funcionario = models.ForeignKey(Funcionario, on_delete=models.CASCADE, related_name='ocorrencias')
    data = models.DateField()
    tipo = models.CharField(max_length=50, choices=[('Atraso', 'Atraso'), ('Falta Justificada', 'Falta Justificada'), ('Falta não Justificada', 'Falta não Justificada')])
    observacao = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.tipo} - {self.funcionario.nome_completo} em {self.data}"


class FotoObra(models.Model):
    obra = models.ForeignKey(Obra, related_name='fotos', on_delete=models.CASCADE)
    imagem = models.ImageField(upload_to=obra_foto_path)
    descricao = models.CharField(max_length=255, blank=True, null=True) # Optional description
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Foto de {self.obra.nome_obra} ({self.id})"


class Backup(models.Model):
    TIPO_BACKUP_CHOICES = [
        ('manual', 'Manual'),
        ('automatico', 'Automático'),
    ]
    
    filename = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    tipo = models.CharField(max_length=20, choices=TIPO_BACKUP_CHOICES, default='manual')
    size_bytes = models.BigIntegerField(default=0)
    description = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Backup {self.filename} - {self.created_at.strftime('%d/%m/%Y %H:%M')}"


class BackupSettings(models.Model):
    auto_backup_enabled = models.BooleanField(default=True)
    backup_time = models.TimeField(default='02:00:00')  # 2:00 AM
    retention_days = models.PositiveIntegerField(default=30)
    max_backups = models.PositiveIntegerField(default=10)
    
    class Meta:
        verbose_name = 'Configuração de Backup'
        verbose_name_plural = 'Configurações de Backup'
    
    def __str__(self):
        return f"Configurações de Backup - Auto: {self.auto_backup_enabled}"


class AnexoLocacao(models.Model):
    locacao = models.ForeignKey(Locacao_Obras_Equipes, related_name='anexos', on_delete=models.CASCADE)
    anexo = models.FileField(upload_to=anexo_locacao_path)
    descricao = models.CharField(max_length=255, blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Anexo de {self.locacao.id} ({self.id})"


class AnexoDespesa(models.Model):
    despesa = models.ForeignKey(Despesa_Extra, related_name='anexos', on_delete=models.CASCADE)
    anexo = models.FileField(upload_to=anexo_despesa_path)
    descricao = models.CharField(max_length=255, blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Anexo de {self.despesa.id} ({self.id})"


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
    uploaded_by = models.ForeignKey('Usuario', on_delete=models.SET_NULL, null=True, blank=True)
    
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


class ArquivoObra(models.Model):
    TIPO_ARQUIVO_CHOICES = [
        ('FOTO', 'Foto'),
        ('DOCUMENTO', 'Documento'),
        ('PLANTA', 'Planta/Projeto'),
        ('CONTRATO', 'Contrato'),
        ('LICENCA', 'Licença'),
        ('OUTROS', 'Outros'),
    ]
    
    obra = models.ForeignKey(Obra, related_name='arquivos', on_delete=models.CASCADE)
    arquivo = models.FileField(upload_to=obra_arquivo_path)
    nome_original = models.CharField(max_length=255)
    descricao = models.CharField(max_length=255, blank=True, null=True)
    tipo_arquivo = models.CharField(max_length=50, blank=True, null=True)  # File extension
    categoria = models.CharField(max_length=20, choices=TIPO_ARQUIVO_CHOICES, default='OUTROS')
    tamanho_arquivo = models.PositiveIntegerField(default=0)  # Size in bytes
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey('Usuario', on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['-uploaded_at']
        verbose_name = 'Arquivo de Obra'
        verbose_name_plural = 'Arquivos de Obras'
    
    def __str__(self):
        return f"{self.categoria}: {self.nome_original} - {self.obra.nome_obra}"
    
    def save(self, *args, **kwargs):
        if self.arquivo:
            self.nome_original = self.arquivo.name
            self.tamanho_arquivo = self.arquivo.size
            # Extract file extension for tipo_arquivo
            import os
            _, ext = os.path.splitext(self.arquivo.name)
            self.tipo_arquivo = ext.upper().lstrip('.')
        super().save(*args, **kwargs)
    
    @property
    def is_image(self):
        """Check if the file is an image"""
        image_extensions = ['JPG', 'JPEG', 'PNG', 'GIF', 'BMP', 'WEBP']
        return self.tipo_arquivo in image_extensions
    
    @property
    def is_pdf(self):
        """Check if the file is a PDF"""
        return self.tipo_arquivo == 'PDF'
