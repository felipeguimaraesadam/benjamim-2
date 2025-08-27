import os
import sys
import django
from decimal import Decimal
from django.utils import timezone
from django.db.models import Sum

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from core.models import Obra, Funcionario, Despesa_Extra, Compra

print("Testing Dashboard Logic...")
print("=" * 40)

# Test 1: Count obras em andamento
obras_em_andamento = Obra.objects.filter(status='em_andamento').count()
print(f"Obras em andamento: {obras_em_andamento}")

# Test 2: Calculate custo total mes corrente
current_month = timezone.now().month
current_year = timezone.now().year

print(f"\nCalculating costs for {current_month}/{current_year}:")

# Test Compra with data_compra field
try:
    custo_compras_mes = Compra.objects.filter(
        data_compra__year=current_year, 
        data_compra__month=current_month
    ).aggregate(total=Sum('valor_total'))['total'] or Decimal('0.00')
    print(f"Custo compras mes: {custo_compras_mes}")
except Exception as e:
    print(f"Error with Compra: {e}")

# Test Despesa_Extra with data_despesa field
try:
    custo_despesas_extras_mes = Despesa_Extra.objects.filter(
        data_despesa__year=current_year, 
        data_despesa__month=current_month
    ).aggregate(total=Sum('valor'))['total'] or Decimal('0.00')
    print(f"Custo despesas extras mes: {custo_despesas_extras_mes}")
except Exception as e:
    print(f"Error with Despesa_Extra: {e}")

# Test 3: Count total funcionarios
total_funcionarios = Funcionario.objects.count()
print(f"\nTotal funcionarios: {total_funcionarios}")

print("\nDashboard test completed!")