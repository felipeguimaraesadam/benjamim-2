import random
from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import Obra, Funcionario, Equipe, Locacao_Obras_Equipes

class Command(BaseCommand):
    help = 'Populates the database with test data for obras, funcionarios, equipes, and locacoes'

    def handle(self, *args, **kwargs):
        self.stdout.write('Starting to populate the database...')

        # Clean up existing data
        self.stdout.write('Cleaning old data...')
        Locacao_Obras_Equipes.objects.all().delete()
        Equipe.objects.all().delete()
        Funcionario.objects.all().delete()
        Obra.objects.all().delete()

        # Create Obras
        self.stdout.write('Creating Obras...')
        obra1 = Obra.objects.create(nome_obra='Construção Residencial Alpha', endereco_completo='Rua das Flores, 123', cidade='São Paulo', data_inicio='2025-01-15', data_prevista_fim='2025-12-20', status='Em Andamento')
        obra2 = Obra.objects.create(nome_obra='Reforma Comercial Beta', endereco_completo='Avenida Principal, 456', cidade='Rio de Janeiro', data_inicio='2025-03-01', status='Planejada')
        obras = [obra1, obra2]
        self.stdout.write(self.style.SUCCESS(f'{len(obras)} Obras created.'))

        # Create Funcionarios
        self.stdout.write('Creating Funcionarios...')
        func1 = Funcionario.objects.create(nome_completo='João Silva', cargo='pedreiro', data_contratacao='2023-01-10')
        func2 = Funcionario.objects.create(nome_completo='Maria Oliveira', cargo='eletricista', data_contratacao='2023-02-15')
        func3 = Funcionario.objects.create(nome_completo='Carlos Pereira', cargo='encanador', data_contratacao='2023-03-20')
        func4 = Funcionario.objects.create(nome_completo='Pedro Costa', cargo='gestor', data_contratacao='2022-11-01')
        funcionarios = [func1, func2, func3, func4]
        self.stdout.write(self.style.SUCCESS(f'{len(funcionarios)} Funcionarios created.'))

        # Create Equipes
        self.stdout.write('Creating Equipes...')
        equipe1 = Equipe.objects.create(nome_equipe='Equipe de Alvenaria', lider=func4)
        equipe1.membros.add(func1, func3)

        equipe2 = Equipe.objects.create(nome_equipe='Equipe Elétrica', lider=func4)
        equipe2.membros.add(func2)
        equipes = [equipe1, equipe2]
        self.stdout.write(self.style.SUCCESS(f'{len(equipes)} Equipes created.'))

        # Create Locações for the current week
        self.stdout.write('Creating Locações for the current week...')
        today = date.today()
        start_of_week = today - timedelta(days=today.weekday())

        # Locação de Funcionario
        Locacao_Obras_Equipes.objects.create(
            obra=obra1,
            funcionario_locado=func1,
            data_locacao_inicio=start_of_week,
            data_locacao_fim=start_of_week + timedelta(days=4),
            tipo_pagamento='diaria',
            valor_pagamento=150.00,
            status_locacao='ativa'
        )

        # Locação de Equipe
        Locacao_Obras_Equipes.objects.create(
            obra=obra2,
            equipe=equipe2,
            data_locacao_inicio=start_of_week + timedelta(days=1),
            data_locacao_fim=start_of_week + timedelta(days=3),
            tipo_pagamento='semanal',
            valor_pagamento=1200.00,
            status_locacao='ativa'
        )
        self.stdout.write(self.style.SUCCESS('2 Locações created for the current week.'))

        self.stdout.write(self.style.SUCCESS('Database successfully populated!'))