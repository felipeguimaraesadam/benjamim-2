from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os

User = get_user_model()

class Command(BaseCommand):
    help = 'Cria um superusuário se não existir, usando variáveis de ambiente'
    
    def handle(self, *args, **options):
        # Obter credenciais das variáveis de ambiente
        admin_login = os.environ.get('DJANGO_SUPERUSER_LOGIN', 'admin')
        admin_password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'admin123')
        admin_nome = os.environ.get('DJANGO_SUPERUSER_NOME', 'Administrador')
        
        # Verificar se já existe um superusuário
        if User.objects.filter(is_superuser=True).exists():
            self.stdout.write(
                self.style.SUCCESS('Superusuário já existe. Pulando criação.')
            )
            return
        
        # Verificar se o usuário específico já existe
        if User.objects.filter(login=admin_login).exists():
            user = User.objects.get(login=admin_login)
            if not user.is_superuser:
                user.is_superuser = True
                user.is_staff = True
                user.nivel_acesso = 'admin'
                user.save()
                self.stdout.write(
                    self.style.SUCCESS(f'Usuário {admin_login} promovido a superusuário.')
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(f'Usuário {admin_login} já é superusuário.')
                )
            return
        
        # Criar novo superusuário
        try:
            User.objects.create_superuser(
                login=admin_login,
                password=admin_password,
                nome_completo=admin_nome
            )
            self.stdout.write(
                self.style.SUCCESS(f'Superusuário {admin_login} criado com sucesso!')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Erro ao criar superusuário: {e}')
            )