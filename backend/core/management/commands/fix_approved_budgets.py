from django.core.management.base import BaseCommand
from core.models import Compra

class Command(BaseCommand):
    help = 'Corrects approved budgets that are not marked as purchases.'

    def handle(self, *args, **options):
        # Find all approved budgets that are still marked as 'ORCAMENTO'
        incorrect_purchases = Compra.objects.filter(
            status_orcamento='APROVADO',
            tipo='ORCAMENTO'
        )

        if not incorrect_purchases.exists():
            self.stdout.write(self.style.SUCCESS('No incorrect approved budgets found.'))
            return

        count = incorrect_purchases.count()
        self.stdout.write(f'Found {count} incorrect approved budgets. Correcting them now...')

        for purchase in incorrect_purchases:
            purchase.tipo = 'COMPRA'
            purchase.save()

        self.stdout.write(self.style.SUCCESS(f'Successfully corrected {count} approved budgets.'))