import os
import django
import sqlite3
from django.conf import settings

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from django.db import connection

def inspect_despesa_extra_table():
    """Inspeciona a estrutura da tabela core_despesa_extra"""
    
    with connection.cursor() as cursor:
        # Verificar se a tabela existe
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name LIKE '%despesa%';
        """)
        tables = cursor.fetchall()
        print("Tabelas relacionadas a despesa:")
        for table in tables:
            print(f"  - {table[0]}")
        
        print("\n" + "="*50)
        
        # Inspecionar estrutura da tabela core_despesa_extra
        try:
            cursor.execute("PRAGMA table_info(core_despesa_extra);")
            columns = cursor.fetchall()
            
            print("\nEstrutura da tabela 'core_despesa_extra':")
            print("Colunas encontradas:")
            for col in columns:
                cid, name, type_name, notnull, default_value, pk = col
                print(f"  - {name} ({type_name}) {'NOT NULL' if notnull else 'NULL'} {'PK' if pk else ''}")
                
            # Verificar especificamente colunas de data
            date_columns = [col[1] for col in columns if 'data' in col[1].lower()]
            print(f"\nColunas relacionadas a data: {date_columns}")
            
            # Mostrar alguns registros para confirmar
            cursor.execute("SELECT COUNT(*) FROM core_despesa_extra;")
            count = cursor.fetchone()[0]
            print(f"\nTotal de registros na tabela: {count}")
            
            if count > 0:
                # Mostrar estrutura dos primeiros registros
                cursor.execute("SELECT * FROM core_despesa_extra LIMIT 3;")
                rows = cursor.fetchall()
                
                column_names = [col[1] for col in columns]
                print("\nPrimeiros 3 registros:")
                for i, row in enumerate(rows, 1):
                    print(f"\nRegistro {i}:")
                    for col_name, value in zip(column_names, row):
                        print(f"  {col_name}: {value}")
                        
        except Exception as e:
            print(f"Erro ao inspecionar tabela core_despesa_extra: {e}")
            
        # Verificar também outras tabelas de despesa
        for table_name in [t[0] for t in tables if 'despesa' in t[0]]:
            if table_name != 'core_despesa_extra':
                try:
                    print(f"\n" + "="*50)
                    print(f"\nEstrutura da tabela '{table_name}':")
                    cursor.execute(f"PRAGMA table_info({table_name});")
                    columns = cursor.fetchall()
                    
                    for col in columns:
                        cid, name, type_name, notnull, default_value, pk = col
                        print(f"  - {name} ({type_name})")
                        
                except Exception as e:
                    print(f"Erro ao inspecionar tabela {table_name}: {e}")

if __name__ == "__main__":
    inspect_despesa_extra_table()