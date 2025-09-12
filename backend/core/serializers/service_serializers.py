from rest_framework import serializers
from django.contrib.auth.models import User
from ..models import BackupLog, TaskHistory, AnexoS3, BranchManagement


class BackupLogSerializer(serializers.ModelSerializer):
    """
    Serializer para o modelo BackupLog.
    """
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    file_size_mb = serializers.SerializerMethodField()
    
    class Meta:
        model = BackupLog
        fields = [
            'id', 'backup_id', 'backup_type', 'file_path', 'file_size', 'file_size_mb',
            'file_hash', 'status', 'error_message', 'description', 's3_key', 's3_uploaded',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'backup_id', 'file_size', 'file_hash', 'created_by', 'created_at', 'updated_at'
        ]
    
    def get_file_size_mb(self, obj):
        """Retorna o tamanho do arquivo em MB."""
        if obj.file_size:
            return round(obj.file_size / (1024 * 1024), 2)
        return None
    
    def validate_backup_type(self, value):
        """Valida o tipo de backup."""
        valid_types = ['manual', 'automatic', 'scheduled', 'migration']
        if value not in valid_types:
            raise serializers.ValidationError(
                f"Tipo de backup inválido. Opções válidas: {', '.join(valid_types)}"
            )
        return value
    
    def validate_status(self, value):
        """Valida o status do backup."""
        valid_statuses = ['pending', 'in_progress', 'completed', 'failed', 'cancelled']
        if value not in valid_statuses:
            raise serializers.ValidationError(
                f"Status inválido. Opções válidas: {', '.join(valid_statuses)}"
            )
        return value


class TaskHistorySerializer(serializers.ModelSerializer):
    """
    Serializer para o modelo TaskHistory.
    """
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    duration_seconds = serializers.SerializerMethodField()
    duration_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = TaskHistory
        fields = [
            'id', 'task_id', 'task_type', 'title', 'description', 'status', 'priority',
            'progress_percentage', 'error_message', 'metadata', 'estimated_duration',
            'actual_duration', 'duration_seconds', 'duration_formatted', 'started_at',
            'completed_at', 'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'task_id', 'actual_duration', 'duration_seconds', 'duration_formatted',
            'started_at', 'completed_at', 'created_by', 'created_at', 'updated_at'
        ]
    
    def get_duration_seconds(self, obj):
        """Retorna a duração em segundos."""
        if obj.actual_duration:
            return obj.actual_duration.total_seconds()
        return None
    
    def get_duration_formatted(self, obj):
        """Retorna a duração formatada."""
        if obj.actual_duration:
            total_seconds = int(obj.actual_duration.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            seconds = total_seconds % 60
            
            if hours > 0:
                return f"{hours}h {minutes}m {seconds}s"
            elif minutes > 0:
                return f"{minutes}m {seconds}s"
            else:
                return f"{seconds}s"
        return None
    
    def validate_task_type(self, value):
        """Valida o tipo de tarefa."""
        valid_types = [
            'backup', 'migration', 'cleanup', 'sync', 'import', 'export',
            'calculation', 'notification', 'maintenance', 'other'
        ]
        if value not in valid_types:
            raise serializers.ValidationError(
                f"Tipo de tarefa inválido. Opções válidas: {', '.join(valid_types)}"
            )
        return value
    
    def validate_status(self, value):
        """Valida o status da tarefa."""
        valid_statuses = ['pending', 'running', 'completed', 'failed', 'cancelled']
        if value not in valid_statuses:
            raise serializers.ValidationError(
                f"Status inválido. Opções válidas: {', '.join(valid_statuses)}"
            )
        return value
    
    def validate_priority(self, value):
        """Valida a prioridade da tarefa."""
        valid_priorities = ['low', 'medium', 'high', 'urgent']
        if value not in valid_priorities:
            raise serializers.ValidationError(
                f"Prioridade inválida. Opções válidas: {', '.join(valid_priorities)}"
            )
        return value
    
    def validate_progress_percentage(self, value):
        """Valida a porcentagem de progresso."""
        if value is not None and (value < 0 or value > 100):
            raise serializers.ValidationError(
                "A porcentagem de progresso deve estar entre 0 e 100."
            )
        return value


class AnexoS3Serializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    file_size_mb = serializers.SerializerMethodField()
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = AnexoS3
        fields = [
            'id', 'anexo_id', 'nome_original', 'nome_s3', 'bucket_name', 's3_key', 's3_url',
            'content_type', 'file_size', 'file_size_mb', 'file_hash',
            'anexo_type', 'object_id', 'uploaded_at', 'uploaded_by',
            'uploaded_by_name', 'download_url', 'is_migrated', 'migration_date', 'metadata'
        ]
        read_only_fields = ['anexo_id', 'nome_s3', 'bucket_name', 's3_key', 's3_url', 'file_hash', 'uploaded_at', 'uploaded_by', 'is_migrated', 'migration_date']
    
    def get_file_size_mb(self, obj):
        """Retorna o tamanho do arquivo em MB."""
        if obj.file_size:
            return round(obj.file_size / (1024 * 1024), 2)
        return None
    
    def get_download_url(self, obj):
        """Retorna URL de download temporária (se disponível)."""
        s3_service = self.context.get('s3_service')
        if s3_service:
            try:
                result = s3_service.generate_signed_url(anexo_id=str(obj.anexo_id))
                if result.get('success'):
                    return result.get('signed_url')
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to generate signed URL for anexo {obj.anexo_id}: {e}")

        # Fallback para a URL estática se o serviço falhar ou não estiver disponível
        return obj.s3_url
    
    def validate_anexo_type(self, value):
        """Valida o tipo de anexo."""
        valid_types = [
            'obra_foto', 'obra_documento', 'locacao_contrato', 'locacao_documento',
            'despesa_comprovante', 'compra_nota', 'funcionario_documento',
            'backup_file', 'general'
        ]
        if value not in valid_types:
            raise serializers.ValidationError(
                f"Tipo de anexo inválido. Opções válidas: {', '.join(valid_types)}"
            )
        return value
    
    def validate_object_id(self, value):
        """Valida o ID do objeto relacionado."""
        if value is not None and value <= 0:
            raise serializers.ValidationError(
                "O ID do objeto deve ser um número positivo."
            )
        return value


class BranchManagementSerializer(serializers.ModelSerializer):
    """
    Serializer para o modelo BranchManagement.
    """
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    merged_by_name = serializers.CharField(source='merged_by.username', read_only=True)
    
    class Meta:
        model = BranchManagement
        fields = [
            'id', 'branch_name', 'branch_type', 'source_branch', 'target_branch',
            'status', 'description', 'commit_hash', 'merge_commit_hash',
            'conflicts_resolved', 'metadata', 'created_by', 'created_by_name',
            'merged_by', 'merged_by_name', 'created_at', 'merged_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'commit_hash', 'merge_commit_hash', 'conflicts_resolved',
            'created_by', 'merged_by', 'created_at', 'merged_at', 'updated_at'
        ]
    
    def validate_branch_type(self, value):
        """Valida o tipo de branch."""
        valid_types = ['feature', 'bugfix', 'hotfix', 'release', 'experimental']
        if value not in valid_types:
            raise serializers.ValidationError(
                f"Tipo de branch inválido. Opções válidas: {', '.join(valid_types)}"
            )
        return value
    
    def validate_status(self, value):
        """Valida o status do branch."""
        valid_statuses = ['active', 'merged', 'abandoned', 'conflict', 'review']
        if value not in valid_statuses:
            raise serializers.ValidationError(
                f"Status inválido. Opções válidas: {', '.join(valid_statuses)}"
            )
        return value
    
    def validate_branch_name(self, value):
        """Valida o nome do branch."""
        if not value or len(value.strip()) < 3:
            raise serializers.ValidationError(
                "O nome do branch deve ter pelo menos 3 caracteres."
            )
        
        # Validação básica de formato de nome de branch
        import re
        if not re.match(r'^[a-zA-Z0-9/_-]+$', value):
            raise serializers.ValidationError(
                "O nome do branch deve conter apenas letras, números, hífens, underscores e barras."
            )
        
        return value.strip()
    
    def validate(self, data):
        """Validação geral do modelo."""
        # Validar que source_branch e target_branch são diferentes
        source = data.get('source_branch')
        target = data.get('target_branch')
        
        if source and target and source == target:
            raise serializers.ValidationError({
                'target_branch': 'O branch de destino deve ser diferente do branch de origem.'
            })
        
        return data


class TaskStatisticsSerializer(serializers.Serializer):
    """
    Serializer para estatísticas de tarefas.
    """
    total_tasks = serializers.IntegerField()
    completed_tasks = serializers.IntegerField()
    failed_tasks = serializers.IntegerField()
    running_tasks = serializers.IntegerField()
    pending_tasks = serializers.IntegerField()
    cancelled_tasks = serializers.IntegerField()
    
    completion_rate = serializers.FloatField()
    failure_rate = serializers.FloatField()
    average_duration = serializers.FloatField()
    
    tasks_by_type = serializers.DictField()
    tasks_by_priority = serializers.DictField()
    tasks_by_day = serializers.ListField()
    
    class Meta:
        fields = [
            'total_tasks', 'completed_tasks', 'failed_tasks', 'running_tasks',
            'pending_tasks', 'cancelled_tasks', 'completion_rate', 'failure_rate',
            'average_duration', 'tasks_by_type', 'tasks_by_priority', 'tasks_by_day'
        ]


class BackupStatisticsSerializer(serializers.Serializer):
    """
    Serializer para estatísticas de backup.
    """
    total_backups = serializers.IntegerField()
    successful_backups = serializers.IntegerField()
    failed_backups = serializers.IntegerField()
    pending_backups = serializers.IntegerField()
    
    total_size_bytes = serializers.IntegerField()
    total_size_mb = serializers.FloatField()
    total_size_gb = serializers.FloatField()
    
    s3_uploaded_count = serializers.IntegerField()
    local_only_count = serializers.IntegerField()
    duplicate_count = serializers.IntegerField()
    
    backups_by_type = serializers.DictField()
    backups_by_day = serializers.ListField()
    
    class Meta:
        fields = [
            'total_backups', 'successful_backups', 'failed_backups', 'pending_backups',
            'total_size_bytes', 'total_size_mb', 'total_size_gb', 's3_uploaded_count',
            'local_only_count', 'duplicate_count', 'backups_by_type', 'backups_by_day'
        ]


class S3StorageInfoSerializer(serializers.Serializer):
    """
    Serializer para informações de armazenamento S3.
    """
    total_files = serializers.IntegerField()
    total_size_bytes = serializers.IntegerField()
    total_size_mb = serializers.FloatField()
    total_size_gb = serializers.FloatField()
    
    files_by_type = serializers.DictField()
    files_by_extension = serializers.DictField()
    recent_uploads = serializers.ListField()
    
    bucket_name = serializers.CharField()
    region = serializers.CharField()
    
    class Meta:
        fields = [
            'total_files', 'total_size_bytes', 'total_size_mb', 'total_size_gb',
            'files_by_type', 'files_by_extension', 'recent_uploads',
            'bucket_name', 'region'
        ]