from django.core.management.base import BaseCommand
from django.core.management import call_command

class Command(BaseCommand):
    help = 'Loads data from data.json into the database.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Flushing existing data...'))
        call_command('flush', '--noinput')
        self.stdout.write(self.style.SUCCESS('Loading data from data.json...'))
        call_command('loaddata', 'data.json')
        self.stdout.write(self.style.SUCCESS('Data loaded successfully!'))