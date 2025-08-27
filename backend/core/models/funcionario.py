from django.db import models


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


class Ocorrencia_Funcionario(models.Model):
    funcionario = models.ForeignKey(Funcionario, on_delete=models.CASCADE, related_name='ocorrencias')
    data = models.DateField()
    tipo = models.CharField(max_length=50, choices=[('Atraso', 'Atraso'), ('Falta Justificada', 'Falta Justificada'), ('Falta não Justificada', 'Falta não Justificada')])
    observacao = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.tipo} - {self.funcionario.nome_completo} em {self.data}"