from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Create a superuser if it does not exist yet.'

    def handle(self, *args, **options):
        User = get_user_model()
        if User.objects.filter(login='admin').exists():
            self.stdout.write(self.style.SUCCESS('Superuser "admin" already exists.'))
        else:
            User.objects.create_superuser(login='admin', password='admin123', nome_completo='Admin User', nivel_acesso='admin')
            self.stdout.write(self.style.SUCCESS('Successfully created a new superuser "admin"'))