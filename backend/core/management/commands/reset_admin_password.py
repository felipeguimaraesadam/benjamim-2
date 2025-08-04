from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Resets the password for the admin user.'

    def handle(self, *args, **options):
        User = get_user_model()
        try:
            admin = User.objects.get(login='admin')
            admin.set_password('admin123')
            admin.save()
            self.stdout.write(self.style.SUCCESS('Successfully reset password for "admin"'))
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR('User "admin" not found.'))