import os
import django

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from django.db import connection

def check_table_structure():
    cursor = connection.cursor()
    cursor.execute('PRAGMA table_info(core_despesa_extra)')
    columns = cursor.fetchall()
    
    print("Estrutura da tabela core_despesa_extra:")
    print("ID | Nome da Coluna | Tipo | Not Null | Default | Primary Key")
    print("-" * 70)
    for column in columns:
        print(f"{column[0]} | {column[1]} | {column[2]} | {column[3]} | {column[4]} | {column[5]}")
    
    # Check if 'data' or 'data_despesa' exists
    column_names = [col[1] for col in columns]
    if 'data' in column_names:
        print("\n✓ Coluna 'data' encontrada")
    if 'data_despesa' in column_names:
        print("\n✓ Coluna 'data_despesa' encontrada")
    
    if 'data' not in column_names and 'data_despesa' not in column_names:
        print("\n❌ Nenhuma coluna de data encontrada!")

if __name__ == '__main__':
    check_table_structure()