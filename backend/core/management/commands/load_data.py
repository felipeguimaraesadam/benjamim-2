from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = 'Comando de compatibilidade que redireciona para loaddata'
    
    def add_arguments(self, parser):
        parser.add_argument('fixture', nargs='*', help='Fixture files to load')
        parser.add_argument(
            '--database',
            default='default',
            help='Database to load fixtures into'
        )
        parser.add_argument(
            '--app',
            help='Only look for fixtures in the specified app'
        )
        parser.add_argument(
            '--ignorenonexistent',
            action='store_true',
            help='Ignore entries in the serialized data for fields that do not currently exist on the model'
        )
        parser.add_argument(
            '--exclude',
            action='append',
            help='An app_label or app_label.ModelName to exclude'
        )
        parser.add_argument(
            '--format',
            help='Format of serialized data when reading from stdin'
        )
    
    def handle(self, *args, **options):
        self.stdout.write(
            self.style.WARNING(
                'AVISO: O comando "load_data" foi descontinuado. '
                'Redirecionando para "loaddata"...'
            )
        )
        
        # Redirecionar para o comando loaddata do Django
        call_command('loaddata', *options['fixture'], **{
            k: v for k, v in options.items() 
            if k != 'fixture' and v is not None
        })
        
        self.stdout.write(
            self.style.SUCCESS(
                'Comando executado com sucesso via loaddata.'
            )
        )