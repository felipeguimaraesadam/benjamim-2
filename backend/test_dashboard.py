import os
import django
from django.conf import settings
from decimal import Decimal

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

from core.models import Obra, Funcionario, Despesa_Extra, Compra
from django.utils import timezone
from django.db.models import Sum

def test_dashboard_logic():
    print("=== TESTANDO LÓGICA DO DASHBOARD ===")
    
    try:
        # Test obras em andamento
        obras_em_andamento = Obra.objects.filter(status='Em Andamento').count()
        print(f"✅ Obras em andamento: {obras_em_andamento}")
        
        # Test custo total mês corrente
        current_month = timezone.now().month
        current_year = timezone.now().year
        print(f"Mês/Ano atual: {current_month}/{current_year}")
        
        # Test compras do mês
        custo_compras_mes = Compra.objects.filter(
            data_compra__year=current_year, 
            data_compra__month=current_month
        ).aggregate(total=Sum('valor_total'))['total'] or Decimal('0.00')
        print(f"✅ Custo compras mês: {custo_compras_mes}")
        
        # Test despesas extras do mês (usando 'data' em vez de 'data_despesa')
        custo_despesas_extras_mes = Despesa_Extra.objects.filter(
            data__year=current_year, 
            data__month=current_month
        ).aggregate(total=Sum('valor'))['total'] or Decimal('0.00')
        print(f"✅ Custo despesas extras mês: {custo_despesas_extras_mes}")
        
        # Test custo total
        custo_total_mes_corrente = custo_compras_mes + custo_despesas_extras_mes
        print(f"✅ Custo total mês corrente: {custo_total_mes_corrente}")
        
        # Test total funcionários
        total_funcionarios = Funcionario.objects.count()
        print(f"✅ Total funcionários: {total_funcionarios}")
        
        # Resultado final
        stats = {
            "obras_em_andamento": obras_em_andamento,
            "custo_total_mes_corrente": custo_total_mes_corrente,
            "total_funcionarios": total_funcionarios
        }
        
        print("\n=== RESULTADO FINAL ===")
        for key, value in stats.items():
            print(f"{key}: {value}")
            
        print("\n✅ TESTE CONCLUÍDO COM SUCESSO - Todas as queries funcionaram!")
        
    except Exception as e:
        print(f"❌ ERRO: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_dashboard_logic()