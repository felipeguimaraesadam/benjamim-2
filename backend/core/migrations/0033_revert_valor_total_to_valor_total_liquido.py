# Generated manually to fix column name issue

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0032_auto_20250827_1318'),
    ]

    operations = [
        migrations.RunSQL(
            "ALTER TABLE core_compra RENAME COLUMN valor_total TO valor_total_liquido;",
            reverse_sql="ALTER TABLE core_compra RENAME COLUMN valor_total_liquido TO valor_total;"
        ),
    ]