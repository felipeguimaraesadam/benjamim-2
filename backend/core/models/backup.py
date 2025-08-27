from django.db import models
from django.utils import timezone


class BackupSettings(models.Model):
    """Settings for automatic backup configuration"""
    backup_enabled = models.BooleanField(default=True)
    backup_frequency = models.CharField(
        max_length=20,
        choices=[
            ('daily', 'Diário'),
            ('weekly', 'Semanal'),
            ('monthly', 'Mensal')
        ],
        default='weekly'
    )
    backup_time = models.TimeField(default='02:00')  # Default backup at 2 AM
    max_backups_to_keep = models.IntegerField(default=10)
    backup_location = models.CharField(max_length=500, default='/backups/')
    email_notifications = models.BooleanField(default=True)
    notification_email = models.EmailField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Configuração de Backup'
        verbose_name_plural = 'Configurações de Backup'
    
    def __str__(self):
        return f"Backup Settings - {self.backup_frequency}"


class Backup(models.Model):
    """Record of backup operations"""
    STATUS_CHOICES = [
        ('pending', 'Pendente'),
        ('running', 'Executando'),
        ('completed', 'Concluído'),
        ('failed', 'Falhou'),
        ('cancelled', 'Cancelado')
    ]
    
    TYPE_CHOICES = [
        ('full', 'Backup Completo'),
        ('incremental', 'Backup Incremental'),
        ('manual', 'Backup Manual')
    ]
    
    backup_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='full')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    file_path = models.CharField(max_length=500, blank=True, null=True)
    file_size = models.BigIntegerField(default=0)  # Size in bytes
    
    started_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(blank=True, null=True)
    
    # Backup statistics
    tables_backed_up = models.IntegerField(default=0)
    records_backed_up = models.IntegerField(default=0)
    
    # Error information
    error_message = models.TextField(blank=True, null=True)
    
    # Metadata
    created_by = models.ForeignKey('Usuario', on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-started_at']
        verbose_name = 'Backup'
        verbose_name_plural = 'Backups'
    
    def __str__(self):
        return f"Backup {self.backup_type} - {self.started_at.strftime('%Y-%m-%d %H:%M')} - {self.status}"
    
    @property
    def duration(self):
        """Calculate backup duration"""
        if self.completed_at and self.started_at:
            return self.completed_at - self.started_at
        return None
    
    @property
    def file_size_mb(self):
        """Return file size in MB"""
        return round(self.file_size / (1024 * 1024), 2) if self.file_size else 0
    
    def mark_completed(self):
        """Mark backup as completed"""
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save()
    
    def mark_failed(self, error_message=None):
        """Mark backup as failed"""
        self.status = 'failed'
        self.completed_at = timezone.now()
        if error_message:
            self.error_message = error_message
        self.save()