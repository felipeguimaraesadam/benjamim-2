from django.core.management.base import BaseCommand
from core.models import Compra, Obra, ItemCompra, Material
from decimal import Decimal
import random
from datetime import date, timedelta

class Command(BaseCommand):
    help = 'Clears all purchases and creates new ones for testing purposes.'

    def handle(self, *args, **options):
        self.stdout.write('Clearing all existing Compra objects...')
        Compra.objects.all().delete()
        self.stdout.write(self.style.SUCCESS('Successfully cleared all purchases.'))

        self.stdout.write('Creating new purchases...')

        obras = list(Obra.objects.all())
        fornecedores = ['Fornecedor A', 'Fornecedor B', 'Fornecedor C']

        if not obras:
            self.stdout.write(self.style.ERROR('No Obras found. Please create some first.'))
            return

        # Create some materials for testing
        Material.objects.all().delete()
        material1, _ = Material.objects.get_or_create(nome='Cimento', defaults={'unidade_medida': 'saco'})
        material2, _ = Material.objects.get_or_create(nome='Areia', defaults={'unidade_medida': 'm³'})
        material3, _ = Material.objects.get_or_create(nome='Tijolo', defaults={'unidade_medida': 'un'})
        materiais = [material1, material2, material3]

        # Create a purchase with PENDENTE status
        compra_pendente = Compra.objects.create(
            obra=random.choice(obras),
            fornecedor=random.choice(fornecedores),
            data_compra=date.today() - timedelta(days=5),
            tipo='ORCAMENTO',
            status_orcamento='PENDENTE',
            valor_total_bruto=Decimal('1500.00')
        )
        ItemCompra.objects.create(
            compra=compra_pendente,
            material=random.choice(materiais),
            quantidade=10,
            valor_unitario=Decimal('150.00')
        )

        # Create a purchase with APROVADO status
        compra_aprovada = Compra.objects.create(
            obra=random.choice(obras),
            fornecedor=random.choice(fornecedores),
            data_compra=date.today() - timedelta(days=10),
            tipo='ORCAMENTO',
            status_orcamento='APROVADO',
            valor_total_bruto=Decimal('2500.00')
        )
        ItemCompra.objects.create(
            compra=compra_aprovada,
            material=random.choice(materiais),
            quantidade=5,
            valor_unitario=Decimal('500.00')
        )

        # Create a regular purchase
        compra_normal = Compra.objects.create(
            obra=random.choice(obras),
            fornecedor=random.choice(fornecedores),
            data_compra=date.today() - timedelta(days=2),
            tipo='COMPRA',
            status_orcamento=None,
            valor_total_bruto=Decimal('800.00')
        )
        ItemCompra.objects.create(
            compra=compra_normal,
            material=random.choice(materiais),
            quantidade=20,
            valor_unitario=Decimal('40.00')
        )

        self.stdout.write(self.style.SUCCESS('Successfully created new purchases.'))