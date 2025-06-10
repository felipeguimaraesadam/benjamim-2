from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

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

    def __str__(self):
        return self.nome_obra

class Funcionario(models.Model):
    nome_completo = models.CharField(max_length=255)
    cargo = models.CharField(max_length=100)
    salario = models.DecimalField(max_digits=10, decimal_places=2)
    data_contratacao = models.DateField()

    def __str__(self):
        return self.nome_completo

class Equipe(models.Model):
    nome_equipe = models.CharField(max_length=100, unique=True)
    lider = models.ForeignKey(Funcionario, on_delete=models.SET_NULL, null=True, related_name='equipes_lideradas')
    membros = models.ManyToManyField(Funcionario, related_name='equipes_membro')

    def __str__(self):
        return self.nome_equipe

class Alocacao_Obras_Equipes(models.Model):
    obra = models.ForeignKey(Obra, on_delete=models.CASCADE)
    equipe = models.ForeignKey(Equipe, on_delete=models.CASCADE)
    data_alocacao_inicio = models.DateField()
    data_alocacao_fim = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.obra.nome_obra} - {self.equipe.nome_equipe}"

class Material(models.Model):
    nome = models.CharField(max_length=100, unique=True)
    unidade_medida = models.CharField(max_length=20, choices=[('un', 'Unidade'), ('m²', 'Metro Quadrado'), ('kg', 'Quilograma'), ('saco', 'Saco')])

    def __str__(self):
        return self.nome

class Compra(models.Model):
    obra = models.ForeignKey(Obra, on_delete=models.CASCADE, related_name='compras')
    material = models.ForeignKey(Material, on_delete=models.PROTECT, related_name='compras')
    quantidade = models.DecimalField(max_digits=10, decimal_places=2)
    custo_total = models.DecimalField(max_digits=10, decimal_places=2)
    fornecedor = models.CharField(max_length=255, null=True, blank=True)
    data_compra = models.DateField()
    nota_fiscal = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return f"Compra de {self.material.nome} para {self.obra.nome_obra} em {self.data_compra}"

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
