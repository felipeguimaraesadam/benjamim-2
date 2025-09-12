import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from core.models import ArquivoObra
from django.db.models import Q

def run():
    """
    Finds and fixes ArquivoObra entries that are linked to S3
    but are missing the 'tipo_arquivo' field.
    """
    print("Starting script to fix missing attachment types...")

    # Query for objects with an s3_anexo_id but with a null or empty tipo_arquivo
    arquivos_to_fix = ArquivoObra.objects.filter(
        Q(tipo_arquivo__isnull=True) | Q(tipo_arquivo=''),
        s3_anexo_id__isnull=False
    ).exclude(nome_original__exact='')

    if not arquivos_to_fix.exists():
        print("No attachments found to fix. Everything looks good.")
        return

    print(f"Found {arquivos_to_fix.count()} attachments to fix.")
    fixed_count = 0

    for arquivo in arquivos_to_fix:
        if arquivo.nome_original:
            try:
                _, ext = os.path.splitext(arquivo.nome_original)
                file_type = ext.upper().lstrip('.')

                if file_type:
                    arquivo.tipo_arquivo = file_type
                    arquivo.save()
                    fixed_count += 1
                    print(f"  [FIXED] ID {arquivo.id}: set tipo_arquivo to '{file_type}' for '{arquivo.nome_original}'")
                else:
                    print(f"  [SKIPPED] ID {arquivo.id}: Could not determine file type from name '{arquivo.nome_original}'")
            except Exception as e:
                print(f"  [ERROR] ID {arquivo.id}: Failed to fix '{arquivo.nome_original}'. Error: {e}")
        else:
            print(f"  [SKIPPED] ID {arquivo.id}: 'nome_original' is empty.")

    print(f"\nScript finished. Successfully fixed {fixed_count} attachments.")

# To run this script, use the Django shell:
# python manage.py shell < backend/fix_missing_attachment_types.py
run()
