from django.core.management.base import BaseCommand
from waitress import serve
from sgo_core.wsgi import application

class Command(BaseCommand):
    help = 'Starts the Waitress server to serve the Django application.'

    def handle(self, *args, **options):
        self.stdout.write('Starting Waitress server at http://localhost:8000')
        serve(application, host='0.0.0.0', port=8000)