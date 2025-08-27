import os
import django
from django.conf import settings
from django.db import connection

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

def inspect_database():
    with connection.cursor() as cursor:
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print("=== TODAS AS TABELAS ===")
        for table in tables:
            print(f"- {table[0]}")
        
        # Focus on tables related to our dashboard
        relevant_tables = ['core_despesa_extra', 'core_compra', 'core_obra', 'core_funcionario']
        
        for table_name in relevant_tables:
            print(f"\n=== ESTRUTURA DA TABELA: {table_name} ===")
            try:
                cursor.execute(f"PRAGMA table_info({table_name});")
                columns = cursor.fetchall()
                
                if columns:
                    print("Colunas encontradas:")
                    for col in columns:
                        print(f"  - {col[1]} ({col[2]}) - NOT NULL: {col[3]} - DEFAULT: {col[4]}")
                else:
                    print(f"Tabela {table_name} não encontrada ou sem colunas")
                    
            except Exception as e:
                print(f"Erro ao inspecionar {table_name}: {e}")
        
        # Check specific data in despesa_extra to understand the date field
        print("\n=== DADOS DE EXEMPLO DA TABELA core_despesa_extra ===")
        try:
            cursor.execute("SELECT * FROM core_despesa_extra LIMIT 3;")
            rows = cursor.fetchall()
            
            # Get column names
            cursor.execute("PRAGMA table_info(core_despesa_extra);")
            columns = [col[1] for col in cursor.fetchall()]
            
            print(f"Colunas: {columns}")
            print("Dados de exemplo:")
            for row in rows:
                print(f"  {dict(zip(columns, row))}")
                
        except Exception as e:
            print(f"Erro ao buscar dados de exemplo: {e}")

if __name__ == '__main__':
    inspect_database()