import os
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.conf import settings

class Command(BaseCommand):
    help = 'Loads data from backup/data.json into the database.'

    def handle(self, *args, **options):
        # Caminho para o arquivo de backup
        backup_path = os.path.join(settings.BASE_DIR, '..', 'backup', 'data.json')
        
        if not os.path.exists(backup_path):
            self.stdout.write(self.style.ERROR(f'Arquivo de dados não encontrado em: {backup_path}'))
            return
            
        self.stdout.write(self.style.SUCCESS('Flushing existing data...'))
        call_command('flush', '--noinput')
        self.stdout.write(self.style.SUCCESS('Loading data from backup/data.json...'))
        call_command('loaddata', backup_path)
        self.stdout.write(self.style.SUCCESS('Data loaded successfully!'))