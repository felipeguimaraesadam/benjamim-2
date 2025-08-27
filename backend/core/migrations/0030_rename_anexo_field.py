# Generated manually to rename anexo field to arquivo in AnexoDespesa

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0029_compra_forma_pagamento_compra_numero_parcelas_and_more'),
    ]

    operations = [
        migrations.RenameField(
            model_name='anexodespesa',
            old_name='anexo',
            new_name='arquivo',
        ),
    ]