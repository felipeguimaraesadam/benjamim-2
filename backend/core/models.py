from django.db import models

class Usuario(models.Model):
    nome_completo = models.CharField(max_length=255)
    login = models.CharField(max_length=100, unique=True)
    senha_hash = models.CharField(max_length=255) # Placeholder, real auth is more complex
    nivel_acesso = models.CharField(max_length=50, choices=[('admin', 'Admin'), ('gerente', 'Gerente')])

    def __str__(self):
        return self.nome_completo

class Obra(models.Model):
    nome_obra = models.CharField(max_length=255)
    endereco_completo = models.TextField()
    cidade = models.CharField(max_length=100)
    status = models.CharField(max_length=50, choices=[('Planejada', 'Planejada'), ('Em Andamento', 'Em Andamento'), ('Concluída', 'Concluída'), ('Cancelada', 'Cancelada')])
    data_inicio = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.nome_obra
