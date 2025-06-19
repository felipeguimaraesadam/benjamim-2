from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from decimal import Decimal

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

    def __str__(self):
        return self.nome

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

    def __str__(self):
        return f"Compra para {self.obra.nome_obra} em {self.data_compra}"

    def save(self, *args, **kwargs):
        # Lógica para calcular o valor líquido antes de salvar
        self.valor_total_liquido = self.valor_total_bruto - self.desconto
        if self.data_compra and not self.data_pagamento:
            self.data_pagamento = self.data_compra
        super().save(*args, **kwargs)

class ItemCompra(models.Model):
    compra = models.ForeignKey(Compra, on_delete=models.CASCADE, related_name='itens')
    material = models.ForeignKey(Material, on_delete=models.PROTECT, related_name='itens_comprados')
    quantidade = models.DecimalField(max_digits=10, decimal_places=3) # Suporta 1,5 kg, etc.
    valor_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    valor_total_item = models.DecimalField(max_digits=12, decimal_places=2, editable=False)

    def __str__(self):
        return f"{self.quantidade}x {self.material.nome} na Compra {self.compra.id}"

    def save(self, *args, **kwargs):
        # Calcular o valor total do item antes de salvar
        self.valor_total_item = self.quantidade * self.valor_unitario
        super().save(*args, **kwargs)

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

class UsoMaterial(models.Model):
    item_compra = models.ForeignKey('ItemCompra', on_delete=models.CASCADE, related_name='usos')
    # compra = models.ForeignKey(Compra, on_delete=models.CASCADE, related_name='usos')
    # obra = models.ForeignKey(Obra, on_delete=models.CASCADE, related_name='usos_materiais')
    quantidade_usada = models.DecimalField(max_digits=10, decimal_places=2)
    data_uso = models.DateField(auto_now_add=True)
    andar = models.CharField(max_length=50, choices=[('Terreo', 'Térreo'), ('1 Andar', '1º Andar'), ('2 Andar', '2º Andar'), ('Cobertura', 'Cobertura'), ('Area Externa', 'Área Externa'), ('Outro', 'Outro')])
    categoria_uso = models.CharField(max_length=50, choices=[('Geral', 'Geral'), ('Eletrica', 'Elétrica'), ('Hidraulica', 'Hidráulica'), ('Alvenaria', 'Alvenaria'), ('Acabamento', 'Acabamento'), ('Estrutura', 'Estrutura'), ('Uso da Equipe', 'Uso da Equipe')], default='Geral')
    descricao = models.TextField(blank=True, null=True)

    # def save(self, *args, **kwargs):
    #     self.obra = self.compra.obra
    #     super().save(*args, **kwargs)

    def __str__(self):
        material_nome = self.item_compra.material.nome if self.item_compra and self.item_compra.material else "N/A"
        obra_nome = self.item_compra.compra.obra.nome_obra if self.item_compra and self.item_compra.compra and self.item_compra.compra.obra else "N/A"
        return f"Uso de {self.quantidade_usada} de '{material_nome}' na obra '{obra_nome}' em {self.data_uso.strftime('%d/%m/%Y') if self.data_uso else 'data não definida'}"


class FotoObra(models.Model):
    obra = models.ForeignKey(Obra, related_name='fotos', on_delete=models.CASCADE)
    imagem = models.ImageField(upload_to='fotos_obras/')
    descricao = models.CharField(max_length=255, blank=True, null=True) # Optional description
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Foto de {self.obra.nome_obra} ({self.id})"
