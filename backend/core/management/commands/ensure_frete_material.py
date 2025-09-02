from django.core.management.base import BaseCommand
from django.db import transaction
from core.models import Material

class Command(BaseCommand):
    help = 'Ensures that the FRETE material exists in the database.'

    @transaction.atomic
    def handle(self, *args, **options):
        frete_material, created = Material.objects.get_or_create(
            nome='FRETE',
            defaults={
                'unidade_medida': 'un',  # 'un' for 'Unidade'
                'categoria_uso_padrao': 'FRETE',
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS("Successfully created 'FRETE' material."))
        else:
            # Ensure the existing material has the correct defaults
            updated = False
            if frete_material.unidade_medida != 'un':
                frete_material.unidade_medida = 'un'
                updated = True

            if frete_material.categoria_uso_padrao != 'FRETE':
                frete_material.categoria_uso_padrao = 'FRETE'
                updated = True

            if updated:
                frete_material.save()
                self.stdout.write(self.style.SUCCESS("Successfully updated existing 'FRETE' material to match defaults."))
            else:
                self.stdout.write(self.style.WARNING("'FRETE' material already exists and is correctly configured."))
