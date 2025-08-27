import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from django.db import connection

# Get the database cursor
cursor = connection.cursor()

# Get the schema for the core_despesa_extra table
cursor.execute("PRAGMA table_info(core_despesa_extra);")
columns = cursor.fetchall()

print("Columns in core_despesa_extra table:")
for column in columns:
    print(f"  {column[1]} ({column[2]})")

# Also check if the table exists
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%despesa%';")
tables = cursor.fetchall()

print("\nTables containing 'despesa':")
for table in tables:
    print(f"  {table[0]}")