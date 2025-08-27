from django.db import models
from decimal import Decimal
import os
from uuid import uuid4


def obra_foto_path(instance, filename):
    """Generates a unique path for uploaded obra photos, ensuring the filename is not too long."""
    ext = filename.split('.')[-1]
    # Generate a unique name using UUID and truncate if necessary
    filename_base = f"{uuid4().hex}"
    filename = f"{filename_base}.{ext}"
    return os.path.join('fotos_obras', str(instance.obra.id), filename)


def obra_arquivo_path(instance, filename):
    return f'obras/{instance.obra.id}/arquivos/{filename}'


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


class FotoObra(models.Model):
    obra = models.ForeignKey(Obra, related_name='fotos', on_delete=models.CASCADE)
    imagem = models.ImageField(upload_to=obra_foto_path)
    descricao = models.CharField(max_length=255, blank=True, null=True)  # Optional description
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Foto de {self.obra.nome_obra} ({self.id})"


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